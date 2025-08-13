"""Pydantic modely pro datové struktury."""

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import hashlib

class RawRecord(BaseModel):
    """Raw záznam z externího zdroje."""
    source_id: str
    external_id: str
    payload: Dict[str, Any]
    fetched_at: Optional[datetime] = None


class TenderUnit(BaseModel):
    """Sjednocený formát zakázky."""
    source_id: str
    external_id: str
    title: str
    country: str
    hash_id: Optional[str] = None

    # Volitelná pole
    buyer: Optional[str] = None
    region: Optional[str] = None
    cpv: List[str] = Field(default_factory=list)
    budget_value: Optional[float] = None
    currency: Optional[str] = None
    deadline: Optional[date] = None
    notice_url: Optional[str] = None
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    procedure_type: Optional[str] = None

    # NOVÉ
    status: Optional[str] = None
    description: Optional[str] = None
    

    def generate_hash_id(self) -> str:
        """Generuje hash_id pro deduplikaci."""
        s = f"{self.title}|{self.buyer or ''}|{self.deadline or ''}|{self.external_id}"
        return hashlib.sha256(s.encode("utf-8")).hexdigest()

    def model_post_init(self, __context: Any) -> None:
        """Post-init hook pro automatické generování hash_id."""
        if not self.hash_id:
            self.hash_id = self.generate_hash_id()


class ScrapingResult(BaseModel):
    """Výsledek scrapingu."""
    source_id: str
    raw_records: List[RawRecord]
    tender_units: List[TenderUnit]
    errors: List[str] = Field(default_factory=list)
    stats: Dict[str, int] = Field(default_factory=dict)
