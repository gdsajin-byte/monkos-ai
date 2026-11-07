-- MONK 발화·말투 정본 DB v1 확장 — schema_v0.sql 위에 덧붙인다(load_v1.py가 v0 적재 직후 실행).
-- 쌍아 11-07 05:50 지시: ① 막내2 이현욱 짝(lhw/pairs_v0.jsonl)을 go_scene에 합류할 칸 ② 소형 증류 데이터 칸(scene_fact → gold/생성 문장).

-- ① go_scene 확장 — 장면 출처 종류 + 이현욱 짝(자막 문장 ↔ 판 국면) 칸. 판독 9편 장면(board_read)은 기존 칸 그대로.
ALTER TABLE go_scene ADD COLUMN kind TEXT NOT NULL DEFAULT 'board_read';  -- board_read(판독 9편 Gemini 장면) | lhw_pair(막내2 이현욱 짝)
ALTER TABLE go_scene ADD COLUMN mv INTEGER;           -- 실전 수 번호(짝 파일 pos.mv — 막내2가 '실전 기준 통일' 작업 중, 기준은 move_basis)
ALTER TABLE go_scene ADD COLUMN last_move TEXT;       -- 직전 착수 표기(예: 백Q14)
ALTER TABLE go_scene ADD COLUMN var_id INTEGER;       -- 참고도 번호(실전이면 NULL)
ALTER TABLE go_scene ADD COLUMN var_n INTEGER;        -- 참고도 안 몇 번째 수
ALTER TABLE go_scene ADD COLUMN var_base_mv INTEGER;  -- 참고도가 갈라진 실전 수
ALTER TABLE go_scene ADD COLUMN events TEXT;          -- JSON 문장 시간 안 판 사건 [{t,kind,s,n,var}]
ALTER TABLE go_scene ADD COLUMN board_end TEXT;       -- 문장 끝 판(361자 b/w/.)
ALTER TABLE go_scene ADD COLUMN region TEXT;          -- 하변·좌상귀 …
ALTER TABLE go_scene ADD COLUMN move_basis TEXT;      -- 수 번호 기준·파일 판(예: lhw/pairs_v0 · 실전 기준 미통일)
CREATE INDEX IF NOT EXISTS ix_scene_kind ON go_scene(kind, source_id);

-- ② 소형 증류 데이터 — 장면 사실(입력) ↔ 목표 문장(감수 예문 또는 생성 문장 + 검토 상태)
CREATE TABLE IF NOT EXISTS distill_pair (
  id           INTEGER PRIMARY KEY,
  scene_id     INTEGER REFERENCES go_scene(id),   -- 영상 장면에서 왔을 때
  ref          TEXT,                              -- 기보 장면 참조(예: G836 37수)
  facts        TEXT NOT NULL,                     -- JSON scene_fact(엔진 손익·정해도·판 꼬리표·국면 단계)
  target_kind  TEXT NOT NULL CHECK (target_kind IN ('gold','generated')),
  gold_id      INTEGER REFERENCES gold(id),       -- target_kind=gold
  target_text  TEXT NOT NULL,
  generator    TEXT,                              -- 생성 모델·대본 판(예: claude/s02_v2) — gold면 NULL
  context_ver  TEXT,                              -- 생성에 쓴 맥락 묶음(COMMENTARY_CONTEXT_v1 …)
  overlap_warn INTEGER,                           -- check_overlap 경고 수(NULL=미검사)
  review       TEXT NOT NULL DEFAULT 'pending' CHECK (review IN ('pending','ok','fix','reject')),
  reviewer     TEXT,
  reviewed_at  TEXT,
  split        TEXT CHECK (split IS NULL OR split IN ('train','dev','test')),
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_distill_review ON distill_pair(review, target_kind);
