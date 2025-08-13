"""Quick sanity check pro NEN parser bez DB."""

import sys
from pathlib import Path

# Přidej projekt root do Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from adapters.nen import NENAdapter
from loguru import logger

def main():
    """Test parsing bez DB."""
    logger.info("Testing NEN adapter parsing...")
    
    config = {
        'base_url': 'https://nen.nipez.cz',
        'max_pages': 1  # Jen první stránka
    }
    
    adapter = NENAdapter('nen', config)
    
    try:
        # Stáhni jen první stránku
        html = adapter.fetcher.get_text("https://nen.nipez.cz/verejne-zakazky")
        rows, next_url = adapter.parse_tender_list(html)
        
        logger.info(f"Found {len(rows)} tenders")
        logger.info(f"Next URL: {next_url}")
        
        if rows:
            logger.info("First 2 tenders:")
            for i, row in enumerate(rows[:2]):
                logger.info(f"  {i+1}. {row['external_id']}: {row['title'][:50]}...")
                logger.info(f"     Buyer: {row.get('buyer', 'N/A')}")
                logger.info(f"     Deadline: {row.get('deadline', 'N/A')}")
        
        return len(rows) > 0
        
    except Exception as e:
        logger.error(f"Error in parsing test: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
