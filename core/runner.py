# core/runner.py
"""Hlavní runner pro spuštění datového ingestu."""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any

import yaml
from loguru import logger
from dotenv import load_dotenv

from core.storage import DatabaseStorage
from adapters.nen import NENAdapter


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"


class TenderRunner:
    """Orchestrátor pro spuštění tender ingestu."""

    def __init__(self) -> None:
        self._prepare_fs()
        self._load_env()
        self._setup_logging()
        self.config = self._load_config()
        self.storage = self._init_storage()

    # --------------------------------------------------------------------- utils
    def _prepare_fs(self) -> None:
        (PROJECT_ROOT / "logs").mkdir(parents=True, exist_ok=True)

    def _load_env(self) -> None:
        """Načte .env z rootu projektu."""
        load_dotenv(ENV_PATH)

    def _setup_logging(self) -> None:
        """Nastaví logování."""
        log_level = os.getenv("LOG_LEVEL", "INFO")
        logger.remove()
        logger.add(
            sys.stdout,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> "
                   "- <level>{message}</level>",
        )
        logger.add(
            PROJECT_ROOT / "logs" / "vz_aggregator.log",
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            rotation="1 day",
            retention="30 days",
        )
        logger.info(f"[env] file: {ENV_PATH} | SUPABASE_DSN set: {'yes' if os.getenv('SUPABASE_DSN') else 'no'}")

    def _load_config(self) -> Dict[str, Any]:
        """Načte konfiguraci ze sources.yaml."""
        config_path = PROJECT_ROOT / "config" / "sources.yaml"
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f) or {}
            logger.info(f"Configuration loaded from {config_path}")
            return cfg
        except Exception as e:
            logger.exception(f"Failed to load config from {config_path}: {type(e).__name__}: {e}")
            sys.exit(1)

    def _init_storage(self) -> DatabaseStorage:
        """Inicializuje databázové připojení."""
        dsn = os.getenv("SUPABASE_DSN") or os.getenv("SUPABASE_DSN_POOLER")
        if not dsn:
            logger.error("SUPABASE_DSN environment variable not set")
            sys.exit(1)
        try:
            storage = DatabaseStorage(dsn)
            with storage.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT NOW()")
                    result = cur.fetchone()
            logger.info(f"Database connection successful: {result}")
            return storage
        except Exception as e:
            logger.exception(f"Failed to connect to database: {type(e).__name__}: {e}")
            sys.exit(1)

    # -------------------------------------------------------------- single source
    def run_nen_ingest(self) -> bool:
        """Spustí NEN ingest. Při chybě zaloguje stacktrace a vrátí False."""
        logger.info("=== Starting NEN ingest ===")
        start = time.time()

        try:
            nen_cfg = (self.config.get("sources") or {}).get("nen", {})
            if not nen_cfg.get("enabled", False):
                logger.warning("NEN source is disabled in config")
                return True  # není to chyba, jen vypnuto

            adapter = NENAdapter(config=nen_cfg)
            result = adapter.fetch_tenders()

            # RAW: vlož/verzuj
            raw_inserted = self.storage.insert_raw_batch(result.raw_records)

            # TENDERS: upsert všech (kvůli UPDATE existujících)
            tenders_new, tenders_updated = self.storage.upsert_tenders(result.tender_units)

            # Doplň chybějící hodnoty z raw → tenders (jen NULL pole)
            synced = self.storage.sync_tenders_from_raw()

            if result.errors:
                logger.warning(
                    f"NEN scraping reported {len(result.errors)} minor errors (first 3 shown): {result.errors[:3]}"
                )

            duration = time.time() - start
            stats = {
                "duration_seconds": round(duration, 2),
                "pages_scraped": result.stats.get("pages_scraped", 0),
                "details_fetched": result.stats.get("details_fetched", 0),
                "raw_inserted": raw_inserted,
                "tenders_new": tenders_new,
                "tenders_updated": tenders_updated,
                "synced_from_raw": synced,
                "tenders_skipped": max(0, len(result.tender_units) - (tenders_new + tenders_updated)),
                "errors": len(result.errors),
            }
            logger.info("=== NEN ingest completed ===")
            logger.info(f"Stats: {stats}")
            return True

        except Exception as e:
            duration = time.time() - start
            logger.exception(f"NEN ingest failed after {duration:.2f}s: {type(e).__name__}: {e}")
            return False

    # --------------------------------------------------------------------- runner
    def run(self) -> None:
        """Hlavní metoda - spustí všechny enabled zdroje."""
        logger.info("=== Tender Aggregator Runner Started ===")
        ok = True

        ok = self.run_nen_ingest() and ok

        if ok:
            logger.info("=== All ingests completed successfully ===")
            sys.exit(0)
        else:
            logger.error("=== Some ingests failed ===")
            sys.exit(1)


def main() -> None:
    TenderRunner().run()


if __name__ == "__main__":
    main()
