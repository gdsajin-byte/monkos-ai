-- shared_credit_transactions v2: 테이블 생성 + 확장 컬럼
-- monkos_AI(Cloud Run) 거래내역을 D1에 기록하기 위한 원장 테이블
-- 실행: wrangler d1 execute monk-services-db --remote --file=scripts/migration_tx_v2.sql

-- 기본 테이블 생성 (schema.sql 기반 + 확장 컬럼 포함)
CREATE TABLE IF NOT EXISTS shared_credit_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    sector TEXT,
    description TEXT,
    reference_id TEXT,
    service TEXT,
    balance_after INTEGER,
    provider TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_shared_credit_tx_user ON shared_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_credit_tx_sector ON shared_credit_transactions(sector);
CREATE INDEX IF NOT EXISTS idx_shared_credit_tx_provider ON shared_credit_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_shared_credit_tx_service ON shared_credit_transactions(service);
