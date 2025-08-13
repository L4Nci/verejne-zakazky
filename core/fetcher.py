# core/fetcher.py
from __future__ import annotations

import random
import time
from typing import Optional
import requests


class HttpFetcher:
    def __init__(self, delay_min: float = 0.5, delay_max: float = 1.0,
                 user_agent: Optional[str] = None,
                 max_retries: int = 3, backoff_base: float = 0.6):
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": user_agent or "vz-aggregator/0.1 (+contact@example.com)"
        })

    def get_text(self, url: str) -> str:
        attempt = 0
        while True:
            try:
                time.sleep(random.uniform(self.delay_min, self.delay_max))
                r = self.session.get(url, timeout=30)
                r.raise_for_status()
                r.encoding = r.apparent_encoding or "utf-8"
                return r.text
            except Exception:
                attempt += 1
                if attempt > self.max_retries:
                    raise
                # exponential backoff with jitter
                time.sleep((self.backoff_base ** attempt) + random.uniform(0, 0.3))
