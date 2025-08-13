"""Rychlý test databázového připojení (Supabase Postgres)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from loguru import logger
from dotenv import load_dotenv
import psycopg


# --- bootstrap paths / env ----------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env")


# --- helpers -----------------------------------------------------------------
def masked_dsn(dsn: str) -> str:
    """Maskne heslo v DSN pro logy."""
    if not dsn:
        return ""
    try:
        # postgresql://user:pass@host:port/db?opts
        head, tail = dsn.split("@", 1)
        if ":" in head:
            prefix, creds = head.rsplit("://", 1)
            if ":" in creds:
                user, _pwd = creds.split(":", 1)
                return f"{prefix}://{user}:***@{tail}"
        return f"***@{tail}"
    except Exception:
        return "***masked***"


def test_once(dsn: str) -> None:
    logger.info(f"Connecting with DSN: {masked_dsn(dsn)}")
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            # 1) základní dotaz
            cur.execute("select now() as current_time, version() as pg_version;")
            now, ver = cur.fetchone()
            logger.info(f"✅ Connection OK | time={now} | pg={ver.splitlines()[0]}")

            # 2) existence tabulek
            cur.execute(
                """
                select table_name
                from information_schema.tables
                where table_schema = 'public'
                  and table_name in ('sources','raw_data','tenders')
                order by table_name;
                """
            )
            tables = [r[0] for r in cur.fetchall()]
            if len(tables) == 3:
                logger.info(f"✅ Tables OK: {tables}")
            else:
                logger.warning(f"⚠️  Missing tables, found: {tables}")
                logger.info('Run: psql "$SUPABASE_DSN" < sql/schema.sql')

            # 3) test INSERT + rollback (audit práva)
            cur.execute(
                """
                insert into raw_data (source_id, external_id, payload)
                values ('nen', 'ping-test', '{"test": true}')
                returning id;
                """
            )
            test_id = cur.fetchone()[0]
            logger.info(f"✅ Insert test OK, id={test_id} (rolling back)")
            conn.rollback()


def main() -> int:
    dsn = os.getenv("SUPABASE_DSN", "").strip()
    if not dsn:
        logger.error("SUPABASE_DSN není nastavený v .env")
        return 1

    logger.info("Testing database connection...")

    # Pokus 1: primární DSN
    try:
        test_once(dsn)
        logger.info("🎉 Database connection test PASSED (primary DSN).")
        return 0
    except Exception as e:
        logger.error(f"❌ Primary DSN failed: {e}")

    # Pokus 2: volitelný pooler DSN (pgBouncer, port 6543)
    pooler_dsn = os.getenv("SUPABASE_DSN_POOLER", "").strip()
    if pooler_dsn:
        try:
            logger.info("Trying pooler DSN...")
            test_once(pooler_dsn)
            logger.info("🎉 Database connection test PASSED (pooler DSN).")
            logger.info("💡 Zvaž použití SUPABASE_DSN_POOLER v .env jako primárního.")
            return 0
        except Exception as e:
            logger.error(f"❌ Pooler DSN failed: {e}")

    return 1


if __name__ == "__main__":
    sys.exit(main())
