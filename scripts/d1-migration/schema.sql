-- IDPASS Specs Database Schema for D1 (monk-db)
-- 기존 images/usage_logs 테이블과 공존

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  flag TEXT,
  continent TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  priority INTEGER DEFAULT 100,
  is_published INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);
CREATE INDEX IF NOT EXISTS idx_countries_slug ON countries(slug);
CREATE INDEX IF NOT EXISTS idx_countries_published ON countries(is_published, priority);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  slug TEXT NOT NULL,
  size_w_mm INTEGER,
  size_h_mm INTEGER,
  size_display TEXT,
  px_w INTEGER,
  px_h INTEGER,
  dpi INTEGER,
  background TEXT,
  background_detail_ko TEXT,
  background_detail_en TEXT,
  background_detail_ja TEXT,
  head_height_min_mm REAL,
  head_height_max_mm REAL,
  head_height_min_pct REAL,
  head_height_max_pct REAL,
  eye_position_min_pct REAL,
  eye_position_max_pct REAL,
  eye_position_basis TEXT,
  standard TEXT,
  official_source_url TEXT,
  official_source_name TEXT,
  validity TEXT,
  validity_en TEXT,
  validity_ja TEXT,
  file_spec TEXT,
  file_spec_en TEXT,
  file_spec_ja TEXT,
  ai_restriction INTEGER DEFAULT 0,
  reliability_grade TEXT DEFAULT 'C',
  group_tier TEXT,
  priority INTEGER DEFAULT 100,
  is_published INTEGER DEFAULT 0,
  special_notes_ko TEXT,
  special_notes_en TEXT,
  special_notes_ja TEXT,
  max_kb INTEGER,
  min_kb INTEGER,
  digital_px_range TEXT,
  format TEXT DEFAULT 'JPEG',
  is_onsite INTEGER DEFAULT 0,
  is_digital_only INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id),
  UNIQUE(country_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_docs_country ON documents(country_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_docs_published ON documents(is_published, priority);
CREATE INDEX IF NOT EXISTS idx_docs_grade ON documents(reliability_grade);

CREATE TABLE IF NOT EXISTS seo_content (
  document_id TEXT PRIMARY KEY,
  details_ko TEXT,
  details_en TEXT,
  details_ja TEXT,
  rejection_reasons_ko TEXT,
  rejection_reasons_en TEXT,
  rejection_reasons_ja TEXT,
  faqs_ko TEXT,
  faqs_en TEXT,
  faqs_ja TEXT,
  seo_title_ko TEXT,
  seo_title_en TEXT,
  seo_title_ja TEXT,
  seo_description_ko TEXT,
  seo_description_en TEXT,
  seo_description_ja TEXT,
  cta_service TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS common_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT,
  type TEXT NOT NULL,
  text_ko TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_ja TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE INDEX IF NOT EXISTS idx_req_document ON common_requirements(document_id);

CREATE TABLE IF NOT EXISTS slug_aliases (
  old_slug TEXT PRIMARY KEY,
  country_slug TEXT NOT NULL,
  document_slug TEXT NOT NULL
);
