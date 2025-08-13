-- indexy & optimalizace
CREATE INDEX IF NOT EXISTS idx_raw_data_source_external
  ON raw_data (source_id, external_id);

CREATE INDEX IF NOT EXISTS idx_tenders_source_external
  ON tenders (source_id, external_id);

-- cpv je text[]
CREATE INDEX IF NOT EXISTS idx_tenders_cpv_gin
  ON tenders USING GIN (cpv);

-- JSONB detail v raw_data (payload->'detail')
CREATE INDEX IF NOT EXISTS idx_raw_data_payload_detail_gin
  ON raw_data USING GIN ((payload -> 'detail'));

-- pro rychlý filtr ne-NULL budget_value
CREATE INDEX IF NOT EXISTS idx_tenders_budget_value
  ON tenders (budget_value);
