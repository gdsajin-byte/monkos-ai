-- ============================================
-- MONK PROJECT - 5버킷 데이터베이스 스키마
-- D1 (SQLite) 기반
-- 최종 업데이트: 2026-01-13
-- ============================================

-- ============================================
-- 🔗 SHARED (공유 버킷)
-- 모든 뮤즈에서 공유하는 핵심 데이터
-- ============================================

-- 방문자 (AI LAB 챗봇 수집)
CREATE TABLE IF NOT EXISTS shared_visitors (
    id TEXT PRIMARY KEY,
    country TEXT,
    name TEXT,
    birth_year INTEGER,
    occupation TEXT,
    purpose TEXT,
    phone TEXT,
    email TEXT,
    privacy_consent INTEGER DEFAULT 0,
    marketing_consent INTEGER DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 회원
CREATE TABLE IF NOT EXISTS shared_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    tier TEXT DEFAULT 'free',  -- free, basic, pro, premium
    visitor_id TEXT,  -- 방문자에서 전환 시 연결
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES shared_visitors(id)
);

-- 크레딧 잔액
CREATE TABLE IF NOT EXISTS shared_credits (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES shared_users(id)
);

-- 크레딧 거래 내역
CREATE TABLE IF NOT EXISTS shared_credit_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- 양수: 충전, 음수: 사용
    type TEXT NOT NULL,  -- charge, use, refund, bonus
    sector TEXT,  -- ssanga, soso, mina, yonga
    description TEXT,
    reference_id TEXT,  -- 관련 주문/대여 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES shared_users(id)
);

CREATE INDEX idx_shared_credit_tx_user ON shared_credit_transactions(user_id);
CREATE INDEX idx_shared_credit_tx_sector ON shared_credit_transactions(sector);

-- ============================================
-- 🤖 SSANGA (쌍아 버킷)
-- B2B 솔루션, 챗봇, 예약 시스템
-- ============================================

-- B2B 고객사
CREATE TABLE IF NOT EXISTS ssanga_clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    business_number TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    package_type TEXT,  -- starter, pro, premium
    monthly_fee INTEGER DEFAULT 0,
    domain TEXT,  -- 고객사 도메인
    status TEXT DEFAULT 'active',  -- active, suspended, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- B2B 예약/주문
CREATE TABLE IF NOT EXISTS ssanga_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    booking_type TEXT,  -- reservation, order, inquiry
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    datetime TEXT,
    memo TEXT,
    status TEXT DEFAULT 'pending',  -- pending, confirmed, completed, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES ssanga_clients(id)
);

-- 챗봇 설정 (고객사별)
CREATE TABLE IF NOT EXISTS ssanga_chatbot_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT UNIQUE NOT NULL,
    welcome_message TEXT,
    faq_json TEXT,  -- JSON 형태 FAQ
    style_json TEXT,  -- 색상, 폰트 등 스타일
    ai_model TEXT DEFAULT 'workers-ai',  -- workers-ai, gemini, claude
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES ssanga_clients(id)
);

CREATE INDEX idx_ssanga_bookings_client ON ssanga_bookings(client_id);

-- ============================================
-- 🎨 SOSO (소소 버킷)
-- AI 이미지 생성, 룩북
-- ============================================

-- 이미지 생성 주문
CREATE TABLE IF NOT EXISTS soso_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_type TEXT NOT NULL,  -- resume, color_id, profile, id_card, longevity, restore, print
    options_json TEXT,  -- 선택 옵션 (스타일, 배경 등)
    credits_used INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES shared_users(id)
);

-- 생성 결과 이미지
CREATE TABLE IF NOT EXISTS soso_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    image_url TEXT NOT NULL,  -- R2 또는 Images URL
    image_type TEXT,  -- original, processed, variant
    metadata_json TEXT,  -- 해상도, 포맷 등
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES soso_orders(id)
);

-- 룩북 템플릿
CREATE TABLE IF NOT EXISTS soso_templates (
    id TEXT PRIMARY KEY,
    category TEXT,  -- fashion, product, food, beauty, interior
    name TEXT,
    thumbnail_url TEXT,
    template_json TEXT,  -- 레이아웃, 스타일 정보
    tags TEXT,  -- 검색용 태그 (쉼표 구분)
    usage_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 룩북 배경 에셋
CREATE TABLE IF NOT EXISTS soso_backgrounds (
    id TEXT PRIMARY KEY,
    category TEXT,
    image_url TEXT NOT NULL,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soso_orders_user ON soso_orders(user_id);
CREATE INDEX idx_soso_orders_status ON soso_orders(status);
CREATE INDEX idx_soso_templates_category ON soso_templates(category);

-- ============================================
-- 👗 MINA (민아 버킷)
-- AI 모델 에이전시
-- ============================================

-- AI 모델 프로필
CREATE TABLE IF NOT EXISTS mina_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT,  -- fashion, beauty, underwear, casual
    description TEXT,
    main_image_url TEXT,
    portfolio_urls_json TEXT,  -- JSON 배열
    height INTEGER,
    measurements TEXT,  -- 신체 사이즈
    style_tags TEXT,
    rental_price_per_day INTEGER,
    status TEXT DEFAULT 'active',  -- active, inactive, exclusive
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 모델 대여 내역
CREATE TABLE IF NOT EXISTS mina_rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    purpose TEXT,  -- commercial, editorial, sns, personal
    start_date DATE,
    end_date DATE,
    credits_used INTEGER DEFAULT 0,
    output_urls_json TEXT,  -- 결과물 URL
    status TEXT DEFAULT 'pending',  -- pending, approved, in_use, completed, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES mina_models(id),
    FOREIGN KEY (user_id) REFERENCES shared_users(id)
);

-- 모델 포트폴리오 이미지
CREATE TABLE IF NOT EXISTS mina_portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT,
    shoot_date DATE,
    tags TEXT,
    is_featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES mina_models(id)
);

CREATE INDEX idx_mina_models_category ON mina_models(category);
CREATE INDEX idx_mina_rentals_user ON mina_rentals(user_id);
CREATE INDEX idx_mina_rentals_model ON mina_rentals(model_id);

-- ============================================
-- 🎓 YONGA (용아 버킷)
-- 교육, 아카데미
-- ============================================

-- 강의/코스
CREATE TABLE IF NOT EXISTS yonga_courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor TEXT,
    category TEXT,  -- ai_basics, imagen, prompt, business
    level TEXT,  -- beginner, intermediate, advanced
    price_credits INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'draft',  -- draft, published, archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 강의 콘텐츠 (챕터)
CREATE TABLE IF NOT EXISTS yonga_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    chapter_num INTEGER,
    title TEXT,
    content_type TEXT,  -- video, text, quiz
    content_url TEXT,
    duration_minutes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES yonga_courses(id)
);

-- 수강생
CREATE TABLE IF NOT EXISTS yonga_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    credits_used INTEGER DEFAULT 0,
    status TEXT DEFAULT 'enrolled',  -- enrolled, completed, dropped
    FOREIGN KEY (user_id) REFERENCES shared_users(id),
    FOREIGN KEY (course_id) REFERENCES yonga_courses(id)
);

-- 학습 진도
CREATE TABLE IF NOT EXISTS yonga_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    last_accessed DATETIME,
    FOREIGN KEY (student_id) REFERENCES yonga_students(id),
    FOREIGN KEY (content_id) REFERENCES yonga_contents(id)
);

CREATE INDEX idx_yonga_students_user ON yonga_students(user_id);
CREATE INDEX idx_yonga_students_course ON yonga_students(course_id);
CREATE INDEX idx_yonga_progress_student ON yonga_progress(student_id);

-- ============================================
-- 📊 통계/로그 (공유)
-- ============================================

-- API 사용량 로그
CREATE TABLE IF NOT EXISTS shared_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    ip_address TEXT,
    endpoint TEXT NOT NULL,
    sector TEXT,  -- ssanga, soso, mina, yonga
    request_count INTEGER DEFAULT 1,
    tokens_used INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_usage_user ON shared_usage_logs(user_id);
CREATE INDEX idx_shared_usage_timestamp ON shared_usage_logs(timestamp DESC);
