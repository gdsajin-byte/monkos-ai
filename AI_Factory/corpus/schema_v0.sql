-- MONK 발화·말투 정본 DB v0 (ORDER_20261107 막내1 INFRA 발화DB — 작가님 05:18·05:21)
-- 정본 파일: ~/.monkos/corpus/monk_corpus.db (레포 밖). 이 스키마·적재·질의 도구만 레포.
-- 범용 뼈대(source·speaker·segment·utterance·qa_pair·term·utterance_term·embedding·gold·style_feature) + 바둑 확장(go_scene).
-- 벡터: 같은 DB의 BLOB(Float32, little-endian) — scripts/retrieval(build_index.js chunk_embeddings·embed_cache)와 같은 방식.
--       sqlite-vec 미설치(11-07 실측)라 검색은 적재 도구가 numpy로 전수 코사인(3만 행 규모에서 충분). 확장 설치는 별건 보고.

PRAGMA foreign_keys = ON;

-- 출처 — 권리 등급은 **출처 추적용**(금지 필터 아님). 정정 05:24(작가님): 원문도 말투·감각 학습 재료.
--   선은 출력에서만 — ① 생성 해설이 원문과 연속 어절 n개↑ 일치하면 경고(check_overlap.py) ② 실존 해설자 이름·목소리 흉내 금지(목소리는 작가님·유니·다인만).
CREATE TABLE IF NOT EXISTS source (
  id        TEXT PRIMARY KEY,            -- 예: yt:rDXb5uPMJMg, kba:dict, gold:20261107
  kind      TEXT NOT NULL CHECK (kind IN ('youtube','recording','document','generated','review','self')),
  title     TEXT,
  channel   TEXT,
  url       TEXT,
  date      TEXT,
  rights    TEXT NOT NULL CHECK (rights IN ('ref_only','own_generated','author_reviewed','author_self')),
             -- ref_only = 방송·유튜버 원문(말투·감각 학습 재료 — 출력에 긴 원문 일치·실존인 흉내 금지)
             -- own_generated = 우리 생성 / author_reviewed = 작가님 감수 / author_self = 작가님 본인 발화
  domain    TEXT NOT NULL DEFAULT 'go',  -- go | character | lecture | studio …
  note      TEXT
);

-- 화자 — 실명·캐릭터·역할을 한 표에
CREATE TABLE IF NOT EXISTS speaker (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,                   -- 목진석 · 류승희 · 작가님 · 유니 · 다인 · (불명)
  kind  TEXT NOT NULL CHECK (kind IN ('real','character','role')),
  role  TEXT NOT NULL,                   -- 해설 · 캐스터 · 선수 · 작가님 · 캐릭터 · 불명
  note  TEXT,
  UNIQUE (name, role)
);

-- 원 자막 구간(자동 자막 단위) — 임베딩은 이 단위로 이미 있음(재사용)
CREATE TABLE IF NOT EXISTS segment (
  id        INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES source(id),
  seg       INTEGER NOT NULL,            -- 영상 안 구간 번호(시각 정렬)
  t_start   REAL, t_end REAL,
  text      TEXT NOT NULL,
  voice_guess TEXT,                      -- 목소리 높이 추정 화자(자주 틀림)
  UNIQUE (source_id, seg)
);

-- 발화 — 한 사람의 한 차례 말(`>>` 쪼개기) + 정제·분류 라벨
CREATE TABLE IF NOT EXISTS utterance (
  id         INTEGER PRIMARY KEY,
  source_id  TEXT NOT NULL REFERENCES source(id),
  seq        INTEGER NOT NULL,           -- 영상 안 발화 번호
  segment_id INTEGER REFERENCES segment(id),
  t_start    REAL,
  speaker_id INTEGER REFERENCES speaker(id),
  text       TEXT NOT NULL,
  sfx        TEXT,                       -- 뺀 효과음 표기 JSON
  keep       INTEGER,                    -- 1 남김 / 0 버림 / NULL 미분류
  drop_code  TEXT CHECK (drop_code IS NULL OR drop_code IN ('MUSIC','AD','GREET','SCREEN','CHAT','NOISE')),
  label      TEXT CHECK (label IS NULL OR label IN ('Q','A','국면','형세','수순','선수대회','추임새','기타')),
  board_dep  INTEGER,                    -- 판 지시어 의존(1) — 판독 없는 영상에선 장면 예문 아님
  note       TEXT,
  labeler    TEXT,                       -- 예: claude-writer/context_v1
  UNIQUE (source_id, seq)
);
CREATE INDEX IF NOT EXISTS ix_utt_label ON utterance(label, keep);
CREATE INDEX IF NOT EXISTS ix_utt_speaker ON utterance(speaker_id);

CREATE TABLE IF NOT EXISTS qa_pair (
  id     INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES source(id),
  qa_key TEXT NOT NULL,                  -- 일꾼 번호(e3-7 등)
  q_utt  INTEGER NOT NULL REFERENCES utterance(id),
  a_utt  INTEGER NOT NULL REFERENCES utterance(id)
);

-- 용어 사전(한국기원 1차 출처 + 감수 용어)
CREATE TABLE IF NOT EXISTS term (
  id      INTEGER PRIMARY KEY,
  term    TEXT NOT NULL UNIQUE,
  title   TEXT, cat INTEGER, def TEXT, src TEXT, kba_no TEXT,
  detect  TEXT,                          -- 판 검출 상태
  det_tag TEXT,                          -- go_terms.py 꼬리표
  domain  TEXT NOT NULL DEFAULT 'go'
);

CREATE TABLE IF NOT EXISTS utterance_term (
  utt_id  INTEGER NOT NULL REFERENCES utterance(id),
  term_id INTEGER NOT NULL REFERENCES term(id),
  kind    TEXT NOT NULL CHECK (kind IN ('term','concept')),
  PRIMARY KEY (utt_id, term_id, kind)
);

-- 벡터(같은 DB) — owner = segment | utterance | gold
CREATE TABLE IF NOT EXISTS embedding (
  id         INTEGER PRIMARY KEY,
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('segment','utterance','gold','scene')),
  owner_id   INTEGER NOT NULL,
  model      TEXT NOT NULL,              -- text-multilingual-embedding-002
  dim        INTEGER NOT NULL,
  vec        BLOB NOT NULL,              -- Float32 LE
  UNIQUE (owner_kind, owner_id, model)
);

-- 바둑 확장 — 장면(영상 시각·판 국면·검출 용어·엔진 사실)
CREATE TABLE IF NOT EXISTS go_scene (
  id         INTEGER PRIMARY KEY,
  source_id  TEXT NOT NULL REFERENCES source(id),
  t_start    REAL, t_end REAL,
  move_no    INTEGER,
  mode       TEXT,                       -- 실전 | 참고도
  stones     INTEGER,
  board_moves TEXT,                      -- JSON [{t,color,move,tags,mode}]
  board_tags TEXT,                       -- JSON 검출기 꼬리표
  text_terms TEXT,                       -- JSON 문장 용어
  concepts   TEXT,                       -- JSON 문장 개념
  utt_id     INTEGER REFERENCES utterance(id),
  sgf        TEXT,                       -- 국면 SGF/해시(있을 때)
  engine     TEXT                        -- JSON b18 사실(있을 때)
);

-- 감수 예문 — 장면 사실 ↔ 작가님 문장
CREATE TABLE IF NOT EXISTS gold (
  id        INTEGER PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES source(id),
  ref       TEXT,                        -- 예: G836 37수 / 정해도 5수 F6
  facts     TEXT,                        -- JSON 장면 사실
  text      TEXT NOT NULL,               -- 작가님 원문
  units     TEXT,                        -- JSON 뽑아낸 해설 단위
  reviewer  TEXT NOT NULL,
  reviewed_at TEXT
);

-- 말투 확장 자리 — 어미·추임새·말 빠르기·목소리 파일
CREATE TABLE IF NOT EXISTS style_feature (
  id         INTEGER PRIMARY KEY,
  speaker_id INTEGER NOT NULL REFERENCES speaker(id),
  utt_id     INTEGER REFERENCES utterance(id),
  feature    TEXT NOT NULL,              -- ending | filler | rate_cps | voice_file | persona_note …
  value      TEXT NOT NULL,
  source_id  TEXT REFERENCES source(id),
  note       TEXT
);

CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
