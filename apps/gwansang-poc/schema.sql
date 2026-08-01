-- 관상 DB — D1 이관용 DDL (서비스 전환 시 사용, 현재 정본은 data/gwansang_db.json)
-- 네이밍 규칙: shared_ 접두사 (헌법 4조 3항)
-- 인스턴스 생성은 서비스 전환 결정 후 — POC 단계에서 클라우드 리소스 미생성

CREATE TABLE IF NOT EXISTS shared_gwansang_metrics (
  id TEXT PRIMARY KEY,            -- 'eye_tail_angle'
  name TEXT NOT NULL,             -- '눈꼬리 각도'
  landmarks TEXT NOT NULL,        -- JSON 배열 '[133,33,362,263]'
  formula TEXT NOT NULL,          -- 사람이 읽는 공식 설명 (계산은 코드 정본)
  role TEXT                       -- '간문(처첩궁)'
);

CREATE TABLE IF NOT EXISTS shared_gwansang_features (
  id TEXT PRIMARY KEY,            -- 'eye_tail'
  part TEXT NOT NULL,             -- '눈꼬리'
  palace TEXT NOT NULL,           -- '간문(奸門·처첩궁)'
  metric_id TEXT NOT NULL REFERENCES shared_gwansang_metrics(id)
);

CREATE TABLE IF NOT EXISTS shared_gwansang_bins (
  feature_id TEXT NOT NULL REFERENCES shared_gwansang_features(id),
  bin_id TEXT NOT NULL,           -- 'up' | 'flat' | 'down'
  min_value REAL NOT NULL,        -- 내림차순 첫 매칭 판정
  label TEXT NOT NULL,
  calibration TEXT NOT NULL DEFAULT 'heuristic_v0',
  PRIMARY KEY (feature_id, bin_id)
);

-- 해석 텍스트: 층(layer) × 언어 분리 — ZH/JA 확장 대비
CREATE TABLE IF NOT EXISTS shared_gwansang_readings (
  feature_id TEXT NOT NULL,
  bin_id TEXT NOT NULL,
  layer TEXT NOT NULL CHECK (layer IN ('traditional','modern','career')),
  lang TEXT NOT NULL DEFAULT 'ko',
  body TEXT NOT NULL,
  source_ref TEXT,                -- 차기: 원전 장별 인용 키 (마의상법 등)
  PRIMARY KEY (feature_id, bin_id, layer, lang),
  FOREIGN KEY (feature_id, bin_id) REFERENCES shared_gwansang_bins(feature_id, bin_id)
);

-- 원전 인용 정본 (차기 단계 — 퍼블릭 도메인 수집)
CREATE TABLE IF NOT EXISTS shared_gwansang_sources (
  ref TEXT PRIMARY KEY,           -- 'maui.samjeong.1'
  book TEXT NOT NULL,             -- '마의상법'
  chapter TEXT,
  original TEXT NOT NULL,         -- 한문 원문
  translation TEXT                -- 현대어 번역
);
