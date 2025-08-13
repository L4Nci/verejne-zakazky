"""Smoke test pro NEN - stáhne HTML a uloží pro analýzu."""

import sys
import time
import random
import requests
from pathlib import Path

URL = "https://nen.nipez.cz/verejne-zakazky"
HEADERS = {"User-Agent": "vz-aggregator/0.1 (+contact@example.com)"}

def main():
    print(f"Fetching {URL} ...")
    r = requests.get(URL, headers=HEADERS, timeout=30)
    r.raise_for_status()
    html = r.text
    out = Path("nen_list.html")
    out.write_text(html, encoding="utf-8")
    print(f"Saved to {out.resolve()}")
    # pro rychlý sanity print:
    print(html[:1500])

if __name__ == "__main__":
    sys.exit(main() or 0)
