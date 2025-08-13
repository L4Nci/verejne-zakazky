"""HTTP fetcher s retry logikou a rate limitingem."""

import random
import time
from typing import Optional, Dict, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger


class HttpFetcher:
    """HTTP klient s rate limitingem, persistentním připojením a retry logikou."""

    def __init__(
        self,
        delay_min: float = 0.5,
        delay_max: float = 1.0,
        max_retries: int = 3,
        timeout: int = 30,
    ):
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.max_retries = max_retries
        self.timeout = timeout
        self.last_request_time = 0.0

        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "cs,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

        # persistentní klient (keep-alive), sdílený pro všechny requesty
        self._client = httpx.Client(timeout=self.timeout, headers=self.headers)

    def _rate_limit(self) -> None:
        """Jedna rozumná pauza mezi požadavky (žádné dvojí uspávání)."""
        now = time.time()
        since_last = now - self.last_request_time
        target_delay = max(self.delay_min, random.uniform(self.delay_min, self.delay_max))
        sleep_time = max(0.0, target_delay - since_last)
        if sleep_time > 0:
            time.sleep(sleep_time)
        self.last_request_time = time.time()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    def get(self, url: str, params: Optional[Dict[str, Any]] = None) -> httpx.Response:
        """Vykoná HTTP GET požadavek s retry."""
        self._rate_limit()
        logger.debug(f"Fetching: {url}")
        r = self._client.get(url, params=params)
        r.raise_for_status()
        logger.debug(f"Response: {r.status_code}, Length: {len(r.content)}")
        return r

    def get_text(self, url: str, params: Optional[Dict[str, Any]] = None) -> str:
        """GET → text."""
        return self.get(url, params).text

    def get_json(self, url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """GET → JSON."""
        return self.get(url, params).json()
