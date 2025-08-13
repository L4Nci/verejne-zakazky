from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from core.models import ScrapingResult, TenderUnit

class BaseAdapter(ABC):
    def __init__(self, source_id: str, config: Optional[Dict[str, Any]] = None) -> None:
        self.source_id = source_id
        self.config = config or {}

    @abstractmethod
    def fetch_tenders(self) -> ScrapingResult:
        raise NotImplementedError

    @abstractmethod
    def parse_tender_list(self, html: str) -> List[Dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def normalize_tender(self, raw_data: Dict[str, Any]) -> TenderUnit:
        raise NotImplementedError

    def should_fetch_detail(self) -> bool:
        return False

    def fetch_tender_detail(self, tender_url: str) -> Dict[str, Any]:
        return {}
