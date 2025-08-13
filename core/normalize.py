# core/normalize.py
from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import Optional, Tuple


_NBSP = "\u00A0"


# --- čísla / měny ------------------------------------------------------------

_CZK_PAT = re.compile(r"\b(CZK|Kč|koruna\s*česká)\b", re.I)
_EUR_PAT = re.compile(r"\b(EUR|€|euro)\b", re.I)

_NUM_PAT = re.compile(r"([\d .\u00A0]+)([,\.]\d{1,2})?")

def parse_decimal(text: str) -> Optional[Decimal]:
    """Vytáhne desetinné číslo z textu typu '400 000,00' / '1 234.5' apod."""
    if not text:
        return None
    t = text.replace(_NBSP, " ").strip()
    m = _NUM_PAT.search(t)
    if not m:
        return None
    intpart = re.sub(r"[ .\u00A0]", "", m.group(1))
    frac = (m.group(2) or "").replace(",", ".")
    num = intpart + frac
    try:
        return Decimal(num)
    except (InvalidOperation, ValueError):
        return None


def detect_currency(text: str) -> Optional[str]:
    if not text:
        return None
    if _CZK_PAT.search(text):
        return "CZK"
    if _EUR_PAT.search(text):
        return "EUR"
    return None


def normalize_money(value_text: Optional[str], currency_text: Optional[str]) -> Tuple[Optional[Decimal], Optional[str]]:
    """Normalizace peněžní hodnoty a měny (ISO). Pokud měna není, vrátí None."""
    val = parse_decimal(value_text or "")
    cur = detect_currency(f"{value_text or ''} {currency_text or ''}")
    return val, cur


# --- status ------------------------------------------------------------

_STATUS_MAP = {
    # NEN slovník → náš řízený slovník
    # (zachovejme české labely, ale můžeme si držet i normalized)
    "Neukončen": "open",
    "Ukončení plnění": "completed",
    "Zadané": "awarded",
    "Zadán": "awarded",
    "Zrušené": "cancelled",
    "Zrušeno": "cancelled",
    "Ukončen": "closed",
    "Neukončeno": "open",
}

def normalize_status(raw: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Vrátí (normalized, original). normalized je např. 'open'/'awarded'/...
    original je původní hodnota (abychom nic neztratili).
    """
    if not raw:
        return None, None
    raw_clean = raw.strip()
    norm = _STATUS_MAP.get(raw_clean)
    return norm, raw_clean
