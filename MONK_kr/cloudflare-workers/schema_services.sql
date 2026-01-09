-- MONK 서비스 맵 트리 데이터베이스

-- 1. 서비스 카테고리 (최상위)
CREATE TABLE IF NOT EXISTS service_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    order_num INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 서비스 상세 (하위)
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    path TEXT,
    status TEXT DEFAULT 'active', -- active, coming_soon, beta
    features TEXT, -- JSON 형태
    price_info TEXT,
    icon TEXT,
    order_num INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- 3. FAQ / 자주 묻는 질문
CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT, -- general, pricing, service, etc
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT, -- 검색용 키워드 (쉼표 구분)
    order_num INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 영업 정보
CREATE TABLE IF NOT EXISTS business_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT, -- contact, hours, location, etc
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 데이터 삽입
-- ============================================

-- 서비스 카테고리
INSERT INTO service_categories (name, slug, description, icon, order_num) VALUES
('몽크사진관', 'monk_studio', '증명사진, 프로필사진, 가족사진 전문 스튜디오', '📸', 1),
('AI LAB', 'ai_lab', '4 MUSE 시스템 기반 생성형 AI 서비스', '🧠', 2),
('B2B', 'b2b', '기업 출장 촬영 및 키오스크 솔루션', '🏢', 3),
('아카데미', 'academy', 'AI 활용 교육 및 크리에이티브 전수', '🎓', 4);

-- 몽크사진관 서비스
INSERT INTO services (category_id, name, slug, description, path, status, features) VALUES
(1, '증명사진', 'id_photo', '취업, 여권, 비자용 증명사진 (Standard/Premium/Deluxe)', './monk_studio/id_photo/id_photo.html', 'active', 
'["AI 보정", "즉시 출력", "디지털 파일 제공", "여러 규격 대응"]'),
(1, '프로필사진', 'profile', '링크드인, SNS용 프로페셔널 프로필', './monk_studio/profile/profile.html', 'active',
'["배경 선택", "리터칭", "다양한 스타일", "고해상도"]'),
(1, '가족사진', 'family', '가족, 커플, 반려동물 촬영', './monk_studio/family/family.html', 'active',
'["스튜디오 조명", "자연스러운 연출", "앨범 제작", "대형 프린트"]');

-- AI LAB 서비스 (4 MUSE)
INSERT INTO services (category_id, name, slug, description, path, status, features) VALUES
(2, '쌍아 (AI Chatbot)', 'ssang_a', '소상공인 키오스크 솔루션 - 결제, 주문, 회원관리', './ai_lab/ssang_a/ssang_a.html', 'active',
'["B2B 솔루션", "키오스크", "자동 결제", "주문 관리"]'),
(2, 'AI Photolab', 'so_so', 'AI 이미지 생성 - 증명사진, 프로필, 사진 복원', './ai_lab/so_so/so_so.html', 'active',
'["Imagen 4.0", "텍스트→이미지", "사진 복원", "스타일 변환"]'),
(2, 'LookBook 제작', 'lookbook', '패션, 뷰티 룩북 자동 편집 및 스타일링', '#', 'coming_soon',
'["자동 편집", "룩북 템플릿", "패션 AI", "배치 처리"]'),
(2, 'AI Model Agency', 'min_a', 'K-뷰티 AI 모델 전시 및 대여', './ai_lab/min_a/min_a.html', 'coming_soon',
'["AI 모델", "패션 런웨이", "모델 포트폴리오", "SNS 콘텐츠"]');

-- B2B 서비스
INSERT INTO services (category_id, name, slug, description, path, status) VALUES
(3, '기업 출장 촬영', 'biztrip', '임원 프로필, 단체 촬영, 현장 스케치', './b2b/b2b.html', 'active'),
(3, '키오스크 솔루션', 'kiosk', '무인 키오스크 시스템 구축', './ai_lab/ssang_a/ssang_a.html', 'active');

-- 아카데미
INSERT INTO services (category_id, name, slug, description, path, status) VALUES
(4, 'AI 활용 교육', 'ai_course', '생성형 AI 실무 활용 교육', './Academy/academy.html', 'coming_soon');

-- FAQ
INSERT INTO faqs (category, question, answer, keywords, order_num) VALUES
('general', 'MONK는 어떤 서비스인가요?', 'MONK.KR은 증명사진부터 AI 이미지 생성까지 모든 크리에이티브 서비스를 제공하는 플랫폼입니다. 몽크사진관, AI LAB, B2B, 아카데미 4개 부문으로 구성되어 있습니다.', '소개,서비스,MONK', 1),
('general', '영업시간이 어떻게 되나요?', '평일 11:00 - 19:30 운영합니다. (주말/공휴일 휴무)', '영업시간,운영시간,시간', 2),
('general', '위치가 어디인가요?', '경기도 하남시 미사강변동로 95 B1029에 위치해 있습니다.', '위치,주소,찾아오는길', 3),
('general', '예약이 필요한가요?', '증명사진과 프로필사진은 당일 방문도 가능하지만, 가족사진과 B2B 촬영은 사전 예약을 권장합니다.', '예약,방문,당일', 4),

('service', 'AI LAB의 4 MUSE 시스템은 무엇인가요?', '쌍아(챗봇 솔루션), 소소(이미지 생성), 민아(AI 모델 에이전시), 용아(전략/교육) 4개의 독립적인 AI 브랜드입니다.', 'AI LAB,4 MUSE,쌍아,소소,민아,용아', 5),
('service', '증명사진 등급 차이는 무엇인가요?', 'Standard(기본), Premium(고급 보정), Deluxe(최고급 리터칭)로 구분되며, 등급에 따라 보정 수준과 파일 제공 방식이 달라집니다.', '증명사진,등급,차이', 6),
('service', 'AI 이미지 생성은 어떻게 이용하나요?', 'AI LAB의 AI Photolab 서비스를 이용하시면 됩니다. 텍스트 설명만으로 원하는 이미지를 생성할 수 있습니다.', 'AI,이미지생성,소소', 7),

('pricing', '가격은 어떻게 되나요?', '서비스별로 가격이 다릅니다. 증명사진은 2만원대부터, 프로필사진은 10만원대부터 시작합니다. 자세한 가격은 전화 문의 바랍니다.', '가격,비용,요금', 8),
('pricing', 'B2B 견적은 어떻게 받나요?', '네이버 톡톡 또는 전화(031-791-5030)로 촬영 규모와 일정을 알려주시면 맞춤 견적을 드립니다.', 'B2B,견적,기업', 9),

('contact', '문의는 어떻게 하나요?', '전화(031-791-5030), 이메일(gdsajin@gmail.com), 네이버 톡톡으로 문의 가능합니다.', '문의,연락,상담', 10);

-- 영업 정보
INSERT INTO business_info (key, value, category) VALUES
('company_name', '몽크스튜디오', 'basic'),
('ceo_name', '신정규', 'basic'),
('business_number', '636-15-00574', 'basic'),
('telecom_status', '신고 준비 중', 'basic'),
('address', '경기도 하남시 미사강변동로 95 B1029', 'location'),
('phone', '031-791-5030', 'contact'),
('email', 'gdsajin@gmail.com', 'contact'),
('hours_weekday', '11:00 - 19:30', 'hours'),
('hours_weekend', '휴무', 'hours'),
('naver_talk', 'https://talk.naver.com/W5UJ45', 'contact');
