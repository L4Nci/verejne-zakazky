# core/storage.py
"""Databázová vrstva pro ukládání dat (raw_data + tenders)."""
from __future__ import annotations

import hashlib
import json
from typing import List, Tuple, Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json
from loguru import logger

from core.models import RawRecord, TenderUnit


# ---------- helpers pro raw_data (verzování payloadu) ----------
def _stable_hash(obj: dict) -> str:
    """Deterministický hash JSON payloadu (nezávislý na pořadí klíčů)."""
    data = json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def _detect_kind(payload: dict) -> str:
    """Heuristika: 'detail' pokud payload obsahuje klíč 'detail', jinak 'list'."""
    return "detail" if isinstance(payload, dict) and "detail" in payload else "list"


def _get_cell(row: Any, key_or_idx: Any) -> Any:
    """Bezpečně vytáhni hodnotu z dict-row i tuple-row."""
    if row is None:
        return None
    if isinstance(row, dict):
        return row.get(key_or_idx)
    # tuple / list
    try:
        return row[key_or_idx]
    except Exception:
        return None


class DatabaseStorage:
    """Databázová vrstva pro raw data a tenders."""

    def __init__(self, dsn: str):
        self.dsn = dsn

    def get_connection(self) -> psycopg.Connection:
        """Vytvoří databázové připojení."""
        return psycopg.connect(self.dsn, row_factory=dict_row)

    # ------------------------ RAW DATA ------------------------
    def insert_raw_batch(self, records: List[RawRecord]) -> int:
        """
        Vloží/aktualizuje raw záznamy:
          - stejný payload (source_id, external_id, payload_hash) => jen zvedne last_seen
          - jiný payload => vloží novou verzi (nový řádek)
        Vrací počet nově vložených řádků (nepočítá pouhé 'touch' update).
        """
        if not records:
            return 0

        sql = """
            INSERT INTO raw_data (
                source_id, external_id, payload, payload_kind, payload_hash,
                fetched_at, first_seen, last_seen
            )
            VALUES (
                %(source_id)s, %(external_id)s, %(payload)s, %(payload_kind)s, %(payload_hash)s,
                %(fetched_at)s, now(), now()
            )
            ON CONFLICT (source_id, external_id, payload_hash)
            DO UPDATE SET last_seen = now()
            RETURNING (xmax = 0) AS inserted;
        """

        inserted = 0
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                for r in records:
                    payload = r.payload
                    params = {
                        "source_id": r.source_id,
                        "external_id": r.external_id,
                        "payload": Json(payload),
                        "payload_kind": _detect_kind(payload),
                        "payload_hash": _stable_hash(payload),
                        "fetched_at": r.fetched_at,  # může být None -> DB má default
                    }
                    cur.execute(sql, params)
                    row = cur.fetchone()
                    flag = bool(_get_cell(row, "inserted") if isinstance(row, dict) else _get_cell(row, 0))
                    if flag:
                        inserted += 1
            conn.commit()

        logger.info(f"Raw upsert: {inserted} inserted (others were touched last_seen)")
        return inserted

    # ------------------------ TENDERS ------------------------
    def upsert_tenders(self, tenders: List[TenderUnit]) -> Tuple[int, int]:
        """
        INSERT ... ON CONFLICT (hash_id) DO UPDATE
        Aktualizujeme jen pokud se některé pole opravdu změnilo (IS DISTINCT FROM).
        Vrací (new_count, updated_count).
        """
        if not tenders:
            return 0, 0

        sql = """
            INSERT INTO tenders (
                hash_id, source_id, external_id, title, buyer, cpv,
                country, region, procedure_type, budget_value, currency,
                deadline, notice_url, attachments, status, description
            )
            VALUES (
                %(hash_id)s, %(source_id)s, %(external_id)s, %(title)s, %(buyer)s, %(cpv)s,
                %(country)s, %(region)s, %(procedure_type)s, %(budget_value)s, %(currency)s,
                %(deadline)s, %(notice_url)s, %(attachments)s, %(status)s, %(description)s
            )
            ON CONFLICT (hash_id) DO UPDATE
            SET
                title          = EXCLUDED.title,
                buyer          = EXCLUDED.buyer,
                cpv            = EXCLUDED.cpv,
                country        = EXCLUDED.country,
                region         = EXCLUDED.region,
                procedure_type = EXCLUDED.procedure_type,
                budget_value   = EXCLUDED.budget_value,
                currency       = EXCLUDED.currency,
                deadline       = EXCLUDED.deadline,
                notice_url     = EXCLUDED.notice_url,
                attachments    = EXCLUDED.attachments,
                status         = EXCLUDED.status,
                description    = EXCLUDED.description,
                updated_at     = NOW()
            WHERE (
                tenders.title, tenders.buyer, tenders.cpv, tenders.country, tenders.region,
                tenders.procedure_type, tenders.budget_value, tenders.currency, tenders.deadline,
                tenders.notice_url, tenders.attachments, tenders.status, tenders.description
            ) IS DISTINCT FROM (
                EXCLUDED.title, EXCLUDED.buyer, EXCLUDED.cpv, EXCLUDED.country, EXCLUDED.region,
                EXCLUDED.procedure_type, EXCLUDED.budget_value, EXCLUDED.currency, EXCLUDED.deadline,
                EXCLUDED.notice_url, EXCLUDED.attachments, EXCLUDED.status, EXCLUDED.description
            )
            RETURNING (xmax = 0) AS inserted, (xmax <> 0) AS updated;
        """

        new_count = 0
        updated_count = 0
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                for t in tenders:
                    params = {
                        "hash_id": t.hash_id,
                        "source_id": t.source_id,
                        "external_id": t.external_id,
                        "title": t.title,
                        "buyer": t.buyer,
                        "cpv": t.cpv,                     # text[]
                        "country": t.country,
                        "region": t.region,
                        "procedure_type": t.procedure_type,
                        "budget_value": t.budget_value,
                        "currency": t.currency,
                        "deadline": t.deadline,
                        "notice_url": t.notice_url,
                        "attachments": Json(t.attachments),  # jsonb
                        "status": t.status,
                        "description": t.description,
                    }
                    cur.execute(sql, params)
                    row = cur.fetchone()
                    if not row:
                        continue
                    ins = bool(_get_cell(row, "inserted") if isinstance(row, dict) else _get_cell(row, 0))
                    upd = bool(_get_cell(row, "updated")  if isinstance(row, dict) else _get_cell(row, 1))
                    if ins:
                        new_count += 1
                    elif upd:
                        updated_count += 1
            conn.commit()

        logger.info(f"Upserted tenders: {new_count} new, {updated_count} updated")
        return new_count, updated_count

    # ------------------------ Post-ingest sync z RAW ------------------------
    def sync_tenders_from_raw(self) -> int:
        """
        Doplní do tenders (pro source_id='NEN') latest hodnoty z raw_data.detail.
        Nepřepisuje nenull hodnoty v tenders – jen doplňuje.
        Vrací počet řádků, kterých se update dotkl.
        """
        sql = """
        WITH latest_raw AS (
          SELECT DISTINCT ON (r.external_id)
                 r.external_id,
                 (r.payload->'detail'->>'budget_value')::numeric AS budget_value,
                 NULLIF(r.payload->'detail'->>'currency','')     AS currency,
                 NULLIF(r.payload->'detail'->>'region','')       AS region,
                 NULLIF(r.payload->'detail'->>'status','')       AS status,
                 NULLIF(r.payload->'detail'->>'description','')  AS description,
                 COALESCE(jsonb_path_query_array(r.payload, '$.detail.cpv'), '[]'::jsonb) AS cpv_json,
                 COALESCE(r.payload->'detail'->'attachments', '[]'::jsonb)               AS attachments_json
          FROM raw_data r
          WHERE r.source_id = 'NEN'
            AND (r.payload->'detail') IS NOT NULL
          ORDER BY r.external_id, r.last_seen DESC
        )
        UPDATE tenders t
        SET
          budget_value = COALESCE(t.budget_value, lr.budget_value),
          currency     = COALESCE(t.currency, lr.currency, 'CZK'),
          region       = COALESCE(t.region, lr.region),
          status       = COALESCE(t.status, lr.status),
          description  = COALESCE(t.description, lr.description),
          cpv          = CASE WHEN t.cpv IS NULL OR array_length(t.cpv,1)=0
                              THEN ARRAY(SELECT jsonb_array_elements_text(lr.cpv_json))
                              ELSE t.cpv END,
          attachments  = CASE WHEN (t.attachments IS NULL OR t.attachments = '[]'::jsonb)
                              THEN lr.attachments_json
                              ELSE t.attachments END,
          updated_at   = NOW()
        FROM latest_raw lr
        WHERE t.source_id = 'NEN'
          AND t.external_id = lr.external_id
          AND (
               (t.budget_value IS NULL AND lr.budget_value IS NOT NULL)
            OR (t.currency     IS NULL AND lr.currency     IS NOT NULL)
            OR (t.region       IS NULL AND lr.region       IS NOT NULL)
            OR (t.status       IS NULL AND lr.status       IS NOT NULL)
            OR (t.description  IS NULL AND lr.description  IS NOT NULL)
            OR ( (t.cpv IS NULL OR array_length(t.cpv,1)=0) AND jsonb_array_length(lr.cpv_json) > 0 )
            OR ( (t.attachments IS NULL OR t.attachments = '[]'::jsonb) AND lr.attachments_json <> '[]'::jsonb )
          )
        RETURNING 1;
        """
        updated = 0
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
                updated = len(rows)
            conn.commit()
        logger.info(f"Post-ingest sync from raw → tenders updated rows: {updated}")
        return updated
