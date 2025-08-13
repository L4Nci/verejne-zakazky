-- Databázové schéma pro MVP datového agregátoru veřejných zakázek

-- Tabulka zdrojů dat
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL
);

-- Tabulka raw dat (audit trail)
CREATE TABLE IF NOT EXISTS raw_data (
    id BIGSERIAL PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    external_id TEXT NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB NOT NULL
);

-- Tabulka normalizovaných zakázek
CREATE TABLE IF NOT EXISTS tenders (
    hash_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    buyer TEXT,
    cpv TEXT[] DEFAULT '{}',
    country TEXT,
    region TEXT,
    procedure_type TEXT,
    budget_value NUMERIC,
    currency TEXT,
    deadline DATE,
    notice_url TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexy pro výkon
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(deadline);
CREATE INDEX IF NOT EXISTS idx_tenders_cpv ON tenders USING GIN(cpv);
CREATE INDEX IF NOT EXISTS idx_tenders_location ON tenders(country, region);
CREATE INDEX IF NOT EXISTS idx_raw_data_source_external ON raw_data(source_id, external_id);

-- Inicializace zdrojů
INSERT INTO sources (id, name, url) VALUES 
    ('nen', 'Národní elektronické nástroj', 'https://nen.nipez.cz/'),
    ('vvz', 'Věstník veřejných zakázek', 'https://vvz.nipez.cz/')
ON CONFLICT (id) DO NOTHING;
