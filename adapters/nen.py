# adapters/nen.py
from __future__ import annotations

import hashlib
import re
from itertools import zip_longest
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin
from datetime import datetime, date

from loguru import logger
from bs4 import BeautifulSoup
from bs4.element import Tag, NavigableString

from adapters.base import BaseAdapter
from core.models import RawRecord, TenderUnit, ScrapingResult
from core.fetcher import HttpFetcher
from core.normalize import normalize_money, normalize_status, detect_currency, parse_decimal

BASE = "https://nen.nipez.cz"


# ------------------------- helpers -----------------------------------

def _norm(txt: Optional[str]) -> Optional[str]:
    if not txt:
        return None
    return re.sub(r"\s+", " ", txt).strip()

def parse_deadline_to_date(text: Optional[str]) -> Optional[date]:
    if not text:
        return None
    t = re.sub(r"\s+", " ", text.strip())
    for fmt in ("%d. %m. %Y %H:%M", "%d.%m.%Y %H:%M", "%d. %m. %Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(t, fmt).date()
        except ValueError:
            continue
    return None

def _first_match(kv: Dict[str, str], patterns: List[str]) -> Optional[str]:
    for pat in patterns:
        r = re.compile(pat, re.I)
        for k, v in kv.items():
            if r.search(k):
                return v
    return None

def _val_after_label(soup: BeautifulSoup, label_patterns: List[str]) -> Optional[str]:
    for pat in label_patterns:
        el = soup.find(string=re.compile(pat, re.I))
        if not el:
            continue
        parent = el.parent if isinstance(el.parent, Tag) else None
        if not parent:
            continue
        # th -> td
        if parent.name in ("th", "label"):
            td = parent.find_next("td")
            if td:
                t = _norm(td.get_text(" ", strip=True))
                if t:
                    return t
        # dt -> dd
        if parent.name == "dt":
            dd = parent.find_next("dd")
            if dd:
                t = _norm(dd.get_text(" ", strip=True))
                if t:
                    return t
        # sourozenec
        for sib in parent.next_siblings:
            if isinstance(sib, Tag):
                t = _norm(sib.get_text(" ", strip=True))
                if t:
                    return t
        # nouze
        nxt = el.find_next(string=True)
        if isinstance(nxt, str):
            t = _norm(nxt)
            if t:
                return t
    return None

def extract_label_values(soup: BeautifulSoup) -> Dict[str, str]:
    kv: Dict[str, str] = {}
    # tabulky
    for tr in soup.find_all("tr"):
        th = tr.find("th")
        td = tr.find("td")
        if isinstance(th, Tag) and isinstance(td, Tag):
            k = _norm(th.get_text(" ", strip=True))
            v = _norm(td.get_text(" ", strip=True))
            if k and v:
                kv[k] = v
    # dl
    for dl in soup.find_all("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        for dt, dd in zip_longest(dts, dds):
            if isinstance(dt, Tag) and isinstance(dd, Tag):
                k = _norm(dt.get_text(" ", strip=True))
                v = _norm(dd.get_text(" ", strip=True))
                if k and v:
                    kv[k] = v
    # heuristika label → sousední div/span
    label_like = soup.find_all(True, string=re.compile(r".+"))
    for ns in label_like:
        if not isinstance(ns, NavigableString):
            continue
        label_text = _norm(str(ns))
        if not label_text:
            continue
        parent = ns.parent if isinstance(ns.parent, Tag) else None
        if not parent:
            continue
        for sib in parent.next_siblings:
            if isinstance(sib, Tag):
                val = _norm(sib.get_text(" ", strip=True))
                if val and val != label_text and len(val) >= 2:
                    if label_text not in kv:
                        kv[label_text] = val
                    break
    return kv


# =============================== Adapter =====================================

class NENAdapter(BaseAdapter):
    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__("NEN", config)
        self.start_url: str = self.config.get("start_url") or f"{BASE}/verejne-zakazky"
        self.max_pages: int = int(self.config.get("max_pages", 5))
        self.delay_min: float = float(self.config.get("delay_min", 0.5))
        self.delay_max: float = float(self.config.get("delay_max", 1.0))
        self.user_agent: str = self.config.get("user_agent", "vz-aggregator/0.1 (+contact@example.com)")
        self.max_detail_per_run: int = int(self.config.get("max_detail_per_run", 150))
        self.detail_log_every: int = int(self.config.get("detail_log_every", 10))
        self.fetcher = HttpFetcher(
            delay_min=self.delay_min,
            delay_max=self.delay_max,
            user_agent=self.user_agent,
            max_retries=int(self.config.get("max_retries", 3)),
            backoff_base=float(self.config.get("backoff_base", 0.6)),
        )

    # --- list helpers ---------------------------------------------------------

    def _page_url(self, n: int) -> str:
        return f"{BASE}/verejne-zakazky" if n == 1 else f"{BASE}/verejne-zakazky/p:vz:page={n}"

    def _extract_notice_url_from_row(self, tr: Tag) -> Optional[str]:
        a = (
            tr.select_one('a[href*="/verejne-zakazky/detail-zakazky/"]')
            or tr.select_one("a.gov-table__link")
            or tr.select_one('a[href*="detail-zakazky"]')
        )
        if a and a.get("href"):
            return urljoin(BASE, a["href"])
        data_href = tr.get("data-href") or tr.get("data-url")
        if data_href:
            return urljoin(BASE, data_href)
        onclick = (tr.get("onclick") or "").strip()
        m = re.search(r"['\"](/verejne-zakazky/detail-zakazky/[^'\"]+)['\"]", onclick)
        if m:
            return urljoin(BASE, m.group(1))
        a_any = tr.select_one("a[href]")
        if a_any and "href" in a_any.attrs:
            href = a_any["href"]
            if "detail-zakazky" in href:
                return urljoin(BASE, href)
        return None

    # --- list parsing ---------------------------------------------------------

    def parse_tender_list(self, html: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "lxml")
        table = soup.select_one("table.gov-table")
        if not table:
            return []
        rows: List[Dict[str, Any]] = []
        for tr in table.select("tr.gov-table__row"):
            notice_url = self._extract_notice_url_from_row(tr)
            tds = tr.select("td.gov-table__cell")
            if len(tds) < 5:
                continue
            external_id = (tds[1].get_text(strip=True) or "").replace("\xa0", " ")
            title = (tds[2].get_text(strip=True) or "")
            buyer = (tds[4].get_text(strip=True) or "") or None
            deadline_tx = (tds[-2].get_text(strip=True) or "") or None
            if not notice_url and external_id and re.match(r"^N\d{3}/\d{2}/V\d{8}$", external_id):
                notice_url = f"{BASE}/verejne-zakazky/detail-zakazky/{external_id.replace('/', '-')}"
            if not notice_url:
                logger.warning(f"[NEN] missing notice_url (ext_id={external_id}, title={title[:80]!r})")
            rows.append({
                "external_id": external_id or notice_url or "",
                "title": title or "(bez názvu)",
                "buyer": buyer,
                "deadline": deadline_tx,
                "notice_url": notice_url,
                "country": "CZ",
            })
        return rows

    # --- detail parsing -------------------------------------------------------

    def _extract_budget_block(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[str]]:
        """
        Primárně hledej přes 'gov-grid-tile' s div[title~="Předpokládaná hodnota (bez DPH)"].
        Vrací (text_hodnoty, text_meny_hint).
        """
        tile = soup.select_one('div.gov-grid-tile[title*="Předpokládaná hodnota"]')
        if tile:
            p = tile.select_one("p.text.gov-note")
            if p:
                value_text = p.get("title") or p.get_text(" ", strip=True)
                # měna může být v sousedním 'Měna' tilu
                currency_tile = soup.select_one('div.gov-grid-tile[title*="Měna"]')
                currency_hint = None
                if currency_tile:
                    currency_hint = currency_tile.get_text(" ", strip=True)
                return value_text, currency_hint
        return None, None

    def fetch_tender_detail(self, url: str) -> Dict[str, Any]:
        if not url:
            return {}
        html = self.fetcher.get_text(url)
        soup = BeautifulSoup(html, "lxml")

        out: Dict[str, Any] = {
            "cpv": [],
            "procedure_type": None,
            "budget_value": None,
            "currency": None,
            "attachments": [],
            "region": None,
            "status": None,
            "description": None,
        }

        kv = extract_label_values(soup)

        # region
        region = _first_match(kv, ["Hlavní místo plnění", "Místo plnění", r"\bRegion\b", "Místo realizace"])
        if not region:
            region = _val_after_label(soup, ["Hlavní místo plnění", "Místo plnění", r"\bRegion\b", "Místo realizace"])
        out["region"] = region

        # status (normalized + raw)
        status_raw = _first_match(kv, ["Aktuální stav ZP", r"\bStav zakázky\b", r"^\s*Stav\s*$"]) \
                     or _val_after_label(soup, ["Aktuální stav ZP", r"\bStav zakázky\b", r"^\s*Stav\s*$"])
        norm_status, orig_status = normalize_status(status_raw)
        out["status"] = orig_status or status_raw  # ukládáme původní label; norm můžeme doplnit později do schématu

        # description
        descr = _first_match(kv, ["Popis předmětu", "Předmět zakázky", "Stručný popis", r"^\s*Popis\s*$"]) \
                or _val_after_label(soup, ["Popis předmětu", "Předmět zakázky", "Stručný popis", r"^\s*Popis\s*$"])
        if not descr:
            meta = soup.find("meta", attrs={"name": "description"})
            if meta and meta.get("content"):
                descr = _norm(meta["content"])
        if descr:
            descr = re.sub(r"^\s*(Popis předmětu|Předmět zakázky|Stručný popis|Popis)\s*[:\-]\s*", "", descr, flags=re.I)
            cut_at = re.search(r"\b(Základní informace|Základní\s+informace)\b", descr, flags=re.I)
            if cut_at:
                descr = descr[:cut_at.start()].strip()
        out["description"] = descr

        # cpv
        cpv_v = _first_match(kv, [r"Kód.*CPV", r"\bCPV\b"])
        if cpv_v:
            found = re.findall(r"\d{8}", cpv_v)
            if found:
                out["cpv"] = sorted(set(found))
        if not out["cpv"]:
            text_all = " ".join(el.get_text(" ", strip=True) for el in soup.find_all(True))
            cpv_codes = sorted(set(re.findall(r"\b\d{8}\b", text_all)))
            if cpv_codes:
                out["cpv"] = cpv_codes

        # procedure type
        out["procedure_type"] = _first_match(kv, ["Druh řízení", "Typ řízení", "Způsob zadání", "Druh zadávacího řízení"])

        # budget + currency (NOVÝ přes dlaždici + fallbacky)
        val_text, currency_hint = self._extract_budget_block(soup)
        if not val_text:
            # fallback: hledání podle labelů
            val_text = _first_match(kv, [r"Předpokládaná hodnota", r"Odhadovaná hodnota", r"^\s*Cena\s*$", r"Rozpočet"])
        val, cur = normalize_money(val_text, currency_hint or _first_match(kv, [r"^\s*Měna\s*$", r"\bMěna\b"]))
        if val is not None:
            out["budget_value"] = float(val)  # do DB posíláme float (schéma má numeric/float)
        if cur:
            out["currency"] = cur
        if not out["currency"]:
            # NEN je převážně CZK – ale ponecháme to jen jako fallback
            out["currency"] = "CZK"

        # attachments
        atts = []
        for a in soup.select(
            'a[href*="stahnout"], a[href*="download"], '
            'a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], '
            'a[href$=".xls"], a[href$=".xlsx"]'
        ):
            href = a.get("href")
            if not href:
                continue
            atts.append({"name": a.get_text(strip=True)[:200], "url": urljoin(BASE, href)})
        if atts:
            out["attachments"] = atts

        out["_detail_html_len"] = len(html)
        return out

    # --- normalize to TenderUnit ---------------------------------------------

    def normalize_tender(self, raw: Dict[str, Any]) -> TenderUnit:
        notice = raw.get("notice_url")
        ext = str(raw.get("external_id") or "")
        if not notice and re.match(r"^N\d{3}/\d{2}/V\d{8}$", ext):
            notice = f"{BASE}/verejne-zakazky/detail-zakazky/{ext.replace('/', '-')}"
        s = f"{raw.get('title','')}|{raw.get('buyer','') or ''}|{raw.get('deadline','') or ''}|{ext}"
        hash_id = hashlib.sha256(s.encode("utf-8")).hexdigest()
        return TenderUnit(
            source_id=self.source_id,
            external_id=ext or notice or "",
            title=raw.get("title") or "(bez názvu)",
            buyer=raw.get("buyer"),
            country=raw.get("country") or "CZ",
            region=None,
            cpv=[],
            budget_value=None,
            currency=None,
            deadline=parse_deadline_to_date(raw.get("deadline")),
            notice_url=notice,
            attachments=[],
            procedure_type=None,
            status=None,
            description=None,
            hash_id=hash_id,
        )

    # --- main fetch -----------------------------------------------------------

    def fetch_tenders(self) -> ScrapingResult:
        page = 1
        url = self._page_url(page)
        pages_scraped = 0
        errors: List[str] = []

        raw_records: List[RawRecord] = []
        tender_units: List[TenderUnit] = []
        details_fetched = 0

        logger.info(f"[NEN] Start scraping: pages up to {self.max_pages}, detail cap {self.max_detail_per_run}")

        while url and page <= self.max_pages:
            try:
                logger.info(f"[NEN] Page {page} → {url}")
                html = self.fetcher.get_text(url)
                rows = self.parse_tender_list(html)
                logger.info(f"[NEN] Page {page}: parsed {len(rows)} rows")

                for r in rows:
                    detail: Dict[str, Any] = {}
                    if r.get("notice_url") and details_fetched < self.max_detail_per_run:
                        try:
                            detail = self.fetch_tender_detail(r["notice_url"])
                            details_fetched += 1
                            if details_fetched % self.detail_log_every == 0 or details_fetched == 1:
                                have = [k for k in ("cpv","procedure_type","budget_value","attachments","region","status","description") if detail.get(k)]
                                logger.info(f"[NEN] Detail {details_fetched}/{self.max_detail_per_run} ({r.get('external_id')}): {', '.join(have) or 'empty'}")
                        except Exception as e:
                            logger.warning(f"[NEN] Detail error for {r.get('external_id')}: {type(e).__name__}: {e}")
                            errors.append(f"detail error: {e}")

                    raw_payload = dict(r)
                    if detail and any([
                        detail.get("cpv"),
                        detail.get("procedure_type"),
                        detail.get("budget_value") is not None,
                        detail.get("currency"),
                        detail.get("attachments"),
                        detail.get("region"),
                        detail.get("status"),
                        detail.get("description"),
                    ]):
                        raw_payload["detail"] = detail

                    raw_records.append(
                        RawRecord(
                            source_id=self.source_id,
                            external_id=str(r.get("external_id") or r.get("notice_url") or ""),
                            payload=raw_payload,
                        )
                    )

                    unit = self.normalize_tender(r)
                    if detail:
                        if detail.get("cpv"):              unit.cpv = detail["cpv"]
                        if detail.get("procedure_type"):   unit.procedure_type = detail["procedure_type"]
                        if detail.get("budget_value") is not None: unit.budget_value = detail["budget_value"]
                        if detail.get("currency"):         unit.currency = detail["currency"]
                        if detail.get("attachments"):      unit.attachments = detail["attachments"]
                        if detail.get("region"):           unit.region = detail["region"]
                        if detail.get("status"):           unit.status = detail["status"]
                        if detail.get("description"):      unit.description = detail["description"]
                    tender_units.append(unit)

                pages_scraped += 1
                page += 1
                url = self._page_url(page) if page <= self.max_pages else None
                logger.info(f"[NEN] Page {page-1} done. Next: {url or 'END'}")

            except Exception as e:
                logger.error(f"[NEN] Page {page} failed: {type(e).__name__}: {e}")
                break

        logger.info(f"[NEN] Finished: pages_scraped={pages_scraped}, details_fetched={details_fetched}")

        return ScrapingResult(
            source_id=self.source_id,
            raw_records=raw_records,
            tender_units=tender_units,
            stats={"pages_scraped": pages_scraped, "details_fetched": details_fetched},
            errors=errors,
        )
