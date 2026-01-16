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

-- 회원 (OAuth 지원)
CREATE TABLE IF NOT EXISTS shared_users (
    id TEXT PRIMARY KEY,  -- provider_providerId 형식 (예: kakao_123456)
    email TEXT,
    name TEXT,
    phone TEXT,
    provider TEXT,  -- kakao, google, email
    provider_id TEXT,  -- OAuth provider의 사용자 ID
    tier TEXT DEFAULT 'free',  -- free, basic, pro, premium
    visitor_id TEXT,  -- 방문자에서 전환 시 연결
    profile_image TEXT,  -- 프로필 이미지 URL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    FOREIGN KEY (visitor_id) REFERENCES shared_visitors(id)
);

CREATE INDEX IF NOT EXISTS idx_shared_users_email ON shared_users(email);
CREATE INDEX IF NOT EXISTS idx_shared_users_provider ON shared_users(provider);

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
-- 💬 챗봇 시스템 (공유 - 섹터별 특화)
-- ============================================

-- 섹터별 챗봇 설정 (특화 훈련)
CREATE TABLE IF NOT EXISTS shared_chatbot_prompts (
    sector TEXT PRIMARY KEY,  -- soso, mina, yonga, ssanga, general
    display_name TEXT NOT NULL,  -- 표시 이름 (예: "소소 어시스턴트")
    avatar_url TEXT,  -- 챗봇 아바타 이미지
    system_prompt TEXT NOT NULL,  -- 시스템 프롬프트 (성격, 역할, 제약)
    welcome_message TEXT,  -- 첫 인사말
    fallback_message TEXT,  -- 답변 불가 시 메시지
    knowledge_base_json TEXT,  -- RAG용 지식 베이스 (JSON)
    faq_json TEXT,  -- 자주 묻는 질문 [{q, a, keywords}]
    tone TEXT DEFAULT 'friendly',  -- formal, friendly, professional, casual
    ai_model TEXT DEFAULT 'workers-ai',  -- workers-ai, gemini-flash, gemini-pro
    max_tokens INTEGER DEFAULT 1024,
    temperature REAL DEFAULT 0.7,
    is_active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 챗봇 대화 세션
CREATE TABLE IF NOT EXISTS shared_chatbot_sessions (
    id TEXT PRIMARY KEY,
    sector TEXT NOT NULL,  -- soso, mina, yonga, ssanga
    user_id TEXT,  -- 회원이면 연결
    visitor_id TEXT,  -- 비회원이면 방문자 연결
    session_context_json TEXT,  -- 세션 컨텍스트 (이전 대화 요약 등)
    message_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME,
    ended_at DATETIME,
    status TEXT DEFAULT 'active',  -- active, idle, closed, escalated
    escalated_to TEXT,  -- 상담원 에스컬레이션 시 담당자
    satisfaction_rating INTEGER,  -- 1-5 만족도
    FOREIGN KEY (user_id) REFERENCES shared_users(id),
    FOREIGN KEY (visitor_id) REFERENCES shared_visitors(id)
);

-- 챗봇 메시지 (개별 저장 - 분석/학습용)
CREATE TABLE IF NOT EXISTS shared_chatbot_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- user, assistant, system
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',  -- text, image, file, action
    metadata_json TEXT,  -- 추가 정보 (버튼 클릭, 선택 등)
    tokens_used INTEGER DEFAULT 0,
    response_time_ms INTEGER,  -- AI 응답 시간
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES shared_chatbot_sessions(id)
);

-- 챗봇 액션 로그 (버튼 클릭, 링크 이동 등)
CREATE TABLE IF NOT EXISTS shared_chatbot_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    action_type TEXT NOT NULL,  -- button_click, link_click, form_submit, product_view
    action_data_json TEXT,  -- 액션 상세 데이터
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES shared_chatbot_sessions(id)
);

CREATE INDEX idx_chatbot_sessions_sector ON shared_chatbot_sessions(sector);
CREATE INDEX idx_chatbot_sessions_user ON shared_chatbot_sessions(user_id);
CREATE INDEX idx_chatbot_sessions_status ON shared_chatbot_sessions(status);
CREATE INDEX idx_chatbot_messages_session ON shared_chatbot_messages(session_id);
CREATE INDEX idx_chatbot_actions_session ON shared_chatbot_actions(session_id);

-- ============================================
-- 📋 고객 문의 게시판 (공유 - 섹터별)
-- ============================================

-- 문의 카테고리 설정
CREATE TABLE IF NOT EXISTS shared_inquiry_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sector TEXT NOT NULL,  -- soso, mina, yonga, ssanga, general
    name TEXT NOT NULL,  -- 카테고리명
    description TEXT,
    icon TEXT,  -- 아이콘 (이모지 또는 URL)
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- 고객 문의
CREATE TABLE IF NOT EXISTS shared_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sector TEXT NOT NULL,  -- soso, mina, yonga, ssanga
    category_id INTEGER,
    user_id TEXT,  -- 회원
    visitor_id TEXT,  -- 비회원
    -- 작성자 정보 (비회원용)
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    -- 문의 내용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments_json TEXT,  -- 첨부파일 [{url, name, size, type}]
    -- 상태 관리
    status TEXT DEFAULT 'pending',  -- pending, in_progress, answered, resolved, closed
    priority TEXT DEFAULT 'normal',  -- low, normal, high, urgent
    is_public INTEGER DEFAULT 0,  -- 공개/비공개
    is_pinned INTEGER DEFAULT 0,  -- 상단 고정
    -- 담당자
    assigned_to TEXT,  -- 담당 관리자
    -- 통계
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES shared_inquiry_categories(id),
    FOREIGN KEY (user_id) REFERENCES shared_users(id),
    FOREIGN KEY (visitor_id) REFERENCES shared_visitors(id)
);

-- 문의 답변/댓글
CREATE TABLE IF NOT EXISTS shared_inquiry_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER NOT NULL,
    parent_id INTEGER,  -- 대댓글용
    author_type TEXT NOT NULL,  -- admin, ai, user, guest
    author_id TEXT,  -- 작성자 ID (admin이면 관리자ID, user면 user_id)
    author_name TEXT,  -- 표시 이름
    content TEXT NOT NULL,
    attachments_json TEXT,
    is_solution INTEGER DEFAULT 0,  -- 채택된 답변
    is_internal INTEGER DEFAULT 0,  -- 내부 메모 (고객에게 안 보임)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (inquiry_id) REFERENCES shared_inquiries(id),
    FOREIGN KEY (parent_id) REFERENCES shared_inquiry_replies(id)
);

-- 문의 히스토리 (상태 변경 추적)
CREATE TABLE IF NOT EXISTS shared_inquiry_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER NOT NULL,
    action TEXT NOT NULL,  -- created, status_changed, assigned, replied, resolved, reopened
    old_value TEXT,
    new_value TEXT,
    actor_type TEXT,  -- admin, system, user
    actor_id TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inquiry_id) REFERENCES shared_inquiries(id)
);

CREATE INDEX idx_inquiries_sector ON shared_inquiries(sector);
CREATE INDEX idx_inquiries_status ON shared_inquiries(status);
CREATE INDEX idx_inquiries_user ON shared_inquiries(user_id);
CREATE INDEX idx_inquiries_created ON shared_inquiries(created_at DESC);
CREATE INDEX idx_inquiry_replies_inquiry ON shared_inquiry_replies(inquiry_id);

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

-- ============================================
-- 📦 초기 데이터 (섹터별 챗봇 설정)
-- ============================================

-- 챗봇 프롬프트 초기 설정
INSERT OR IGNORE INTO shared_chatbot_prompts (sector, display_name, system_prompt, welcome_message, fallback_message, tone, ai_model) VALUES
('soso', '소소 어시스턴트', 
'당신은 MONK.kr AI Photo 서비스 "소소"의 친근한 어시스턴트입니다.
역할: 증명사진, 프로필 사진, 사진 복원 서비스 안내
성격: 친근하고 전문적, 사진에 대한 열정
제약: 가격은 크레딧 기준으로 안내, 타 서비스 비방 금지
주요 지식: 증명사진 규격, AI 보정 기술, 크레딧 시스템',
'안녕하세요! 소소입니다 📸 AI 사진 서비스에 대해 무엇이든 물어보세요!',
'죄송해요, 제가 답변하기 어려운 질문이에요. 고객센터로 문의해 주시겠어요?',
'friendly', 'workers-ai'),

('mina', '민아 어시스턴트',
'당신은 MONK.kr AI 모델 에이전시 "민아"의 세련된 어시스턴트입니다.
역할: AI 모델 소개, 대여 절차 안내, 포트폴리오 상담
성격: 세련되고 프로페셔널, 패션에 대한 안목
제약: 모델 저작권 안내 필수, 상업적 사용 시 라이선스 설명
주요 지식: 모델 카테고리, 대여 가격, 사용 범위',
'안녕하세요, 민아입니다 ✨ AI 모델 서비스에 대해 안내해 드릴게요.',
'해당 문의는 담당자 연결이 필요해요. 문의 게시판에 남겨주시면 빠르게 답변드릴게요.',
'professional', 'workers-ai'),

('yonga', '용아 어시스턴트',
'당신은 MONK.kr 아카데미 "용아"의 차분한 교육 상담사입니다.
역할: 강의 안내, 커리큘럼 설명, 수강 상담
성격: 차분하고 신뢰감 있는, 교육에 대한 진정성
제약: 수강료는 크레딧 기준, 환불 정책 정확히 안내
주요 지식: 강의 목록, 난이도, 수강 방법',
'안녕하세요, 용아입니다 🎓 AI 교육에 관심 가져주셔서 감사해요.',
'상세한 상담이 필요하시면 문의 게시판에 남겨주세요. 담당자가 답변드릴게요.',
'formal', 'workers-ai'),

('ssanga', '쌍아 어시스턴트',
'당신은 MONK.kr B2B 솔루션 "쌍아"의 비즈니스 컨설턴트입니다.
역할: B2B 패키지 안내, 견적 상담, 기술 지원
성격: 전문적이고 신뢰감 있는, 비즈니스 파트너십 지향
제약: 정확한 견적은 상담 후 제공, 고객사 정보 보안 철저
주요 지식: 패키지 구성, 기능 목록, 도입 절차',
'안녕하세요, MONKOS Business입니다 🏢 비즈니스 솔루션에 대해 안내해 드릴게요.',
'상세 견적이나 기술 상담은 전문 상담원 연결이 필요해요. 연락처를 남겨주시면 연락드릴게요.',
'professional', 'workers-ai'),

('general', 'MONKOS 어시스턴트',
'당신은 MONK.kr의 통합 안내 어시스턴트 "MONKOS"입니다.
역할: 서비스 전반 안내, 적절한 섹터로 안내
성격: 친절하고 명쾌한
제약: 각 섹터 전문 상담은 해당 챗봇으로 안내
주요 지식: 4개 섹터 개요, 서비스 맵',
'안녕하세요! MONKOS입니다 🤖 무엇을 도와드릴까요?',
'죄송해요, 해당 질문은 전문 상담이 필요해요. 어떤 서비스에 관심 있으신가요?',
'friendly', 'workers-ai');

-- 문의 카테고리 초기 설정
INSERT OR IGNORE INTO shared_inquiry_categories (sector, name, description, icon, sort_order) VALUES
-- 공통
('general', '일반 문의', '서비스 전반에 대한 일반 문의', '💬', 1),
('general', '결제/환불', '결제, 크레딧, 환불 관련', '💳', 2),
('general', '계정/회원', '계정, 로그인, 회원 정보', '👤', 3),
('general', '기술 지원', '오류, 버그, 기술적 문제', '🔧', 4),
('general', '제안/피드백', '서비스 개선 제안', '💡', 5),

-- 소소
('soso', '증명사진', '증명사진 서비스 관련', '📸', 1),
('soso', '프로필 사진', '프로필, SNS 사진 관련', '🖼️', 2),
('soso', '사진 복원', '오래된 사진 복원 관련', '🔄', 3),
('soso', '룩북', '룩북 제작 관련', '📚', 4),

-- 민아
('mina', '모델 문의', '모델 정보, 포트폴리오', '👗', 1),
('mina', '대여 문의', '모델 대여 절차, 가격', '📋', 2),
('mina', '저작권/라이선스', '사용 범위, 저작권', '©️', 3),

-- 용아
('yonga', '강의 문의', '강의 내용, 커리큘럼', '📖', 1),
('yonga', '수강 문의', '수강 신청, 진도', '🎯', 2),
('yonga', '자격증/수료', '수료증, 자격 관련', '🏆', 3),

-- 쌍아
('ssanga', '도입 문의', '서비스 도입, 견적', '🏢', 1),
('ssanga', '기술 지원', 'B2B 기술 지원', '⚙️', 2),
('ssanga', '계약/결제', '계약, 월정액 결제', '📝', 3);
