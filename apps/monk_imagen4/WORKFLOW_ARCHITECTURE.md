# 🎨 MONK AI Studio - 통합 워크플로우 아키텍처

## 📊 전체 구조

```
Cloudflare Pages (2개 사용)

1️⃣ 홈페이지 (monk-homepage)
   ├── 소개
   ├── 서비스 카드
   │   ├── 🎨 AI 이미지 생성 → /studio/imagen4
   │   ├── ✨ 이미지 변형 → /studio/imagen3
   │   └── 👗 룩북 제작 → /studio/lumina
   ├── 가격
   └── 문의

2️⃣ AI Studio (monk-ai-studio)
   ├── /imagen4 → 이미지 생성 (Imagen 4)
   ├── /imagen3 → 변형 & 에디팅 (Imagen 3 Pro)
   └── /lumina → 룩북 제작 (Lumina AI)
```

---

## 🔄 워크플로우 연결

### 시나리오 1: 전체 프로세스
```
사용자 → 홈페이지 → AI Studio 선택

1단계: Imagen4 (생성)
   ↓ 이미지 생성 완료
   ↓ [다음 단계] 버튼
   
2단계: Imagen3 (변형/에디팅)
   ↓ 생성된 이미지 불러오기
   ↓ 스타일 변형/편집
   ↓ [룩북 만들기] 버튼
   
3단계: Lumina (룩북)
   ↓ 편집된 이미지들 선택
   ↓ 룩북 레이아웃 구성
   ✅ 최종 PDF/웹 룩북 생성
```

### 시나리오 2: 개별 사용
```
홈페이지 → 원하는 기능만 직접 접근
- Imagen4만 사용
- Imagen3만 사용
- Lumina만 사용
```

---

## 🗂️ R2 저장 구조

```
monk-ai-images/
├── imagen4/
│   ├── raw/
│   │   └── {timestamp}-{id}.png (원본)
│   └── thumb/
│       └── {timestamp}-{id}.png (썸네일)
│
├── imagen3/
│   ├── edited/
│   │   └── {timestamp}-{id}.png (편집본)
│   └── variants/
│       └── {timestamp}-{id}.png (변형본)
│
└── lumina/
    ├── lookbooks/
    │   └── {lookbook-id}/
    │       ├── cover.png
    │       ├── page-1.png
    │       └── ...
    └── exports/
        └── {lookbook-id}.pdf
```

---

## 💾 D1 데이터 연결

### images 테이블
```sql
-- 모든 이미지 저장
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  source_id TEXT,              -- 원본 이미지 ID (워크플로우 연결)
  project_id TEXT,             -- 'IMAGEN4', 'IMAGEN3', 'LUMINA'
  workflow_id TEXT,            -- 워크플로우 세션 ID
  step INTEGER,                -- 워크플로우 단계 (1,2,3)
  ...
);
```

### workflows 테이블
```sql
-- 워크플로우 추적
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  user_session TEXT,
  started_at INTEGER,
  current_step INTEGER,       -- 1: Imagen4, 2: Imagen3, 3: Lumina
  status TEXT,                -- 'in_progress', 'completed'
  imagen4_ids TEXT,           -- JSON array of image IDs
  imagen3_ids TEXT,
  lumina_id TEXT
);
```

---

## 🔗 모듈 간 데이터 전달

### URL 파라미터 방식
```typescript
// Imagen4 → Imagen3
window.location.href = `/imagen3?source=${imageId}&workflow=${workflowId}`;

// Imagen3 → Lumina
window.location.href = `/lumina?images=${imageIds.join(',')}&workflow=${workflowId}`;
```

### LocalStorage 방식 (동일 도메인)
```typescript
// 워크플로우 데이터 저장
localStorage.setItem('workflow', JSON.stringify({
  id: workflowId,
  step: 1,
  images: [imageId1, imageId2],
  settings: { ... }
}));
```

### API 방식 (추천)
```typescript
// 워크플로우 상태 저장
POST /api/workflow
{
  "id": "workflow-123",
  "step": 1,
  "images": ["img-1", "img-2"],
  "nextModule": "imagen3"
}

// 다음 모듈에서 불러오기
GET /api/workflow/workflow-123
```

---

## 🎯 Pages 프로젝트 구조

### monk-ai-studio 폴더 구조
```
monk-ai-studio/
├── public/
│   └── assets/
├── src/
│   ├── App.tsx (라우터)
│   ├── pages/
│   │   ├── Home.tsx (모듈 선택)
│   │   ├── Imagen4.tsx
│   │   ├── Imagen3.tsx
│   │   └── Lumina.tsx
│   ├── components/
│   │   ├── WorkflowNav.tsx (단계 표시)
│   │   ├── ImageGallery.tsx
│   │   └── ...
│   └── stores/
│       └── workflowStore.ts (상태 관리)
├── functions/
│   └── api/
│       ├── generate.ts (공통)
│       ├── upload.ts (공통)
│       ├── workflow.ts (새로 추가)
│       └── transform.ts (Imagen3용)
└── wrangler.toml
```

### App.tsx 라우팅
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModuleSelector />} />
        <Route path="/imagen4" element={<Imagen4UI />} />
        <Route path="/imagen3" element={<Imagen3UI />} />
        <Route path="/lumina" element={<LuminaUI />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🚀 배포 방식

### 1. 빌드
```bash
# 통합 프로젝트 빌드
cd monk-ai-studio
npm run build
```

### 2. 배포
```bash
# Cloudflare Pages 배포
wrangler pages deploy dist --project-name=monk-ai-studio
```

### 3. 커스텀 도메인
```
studio.yourdomain.com
├── /imagen4
├── /imagen3
└── /lumina
```

---

## 🎨 홈페이지 연동

### 서비스 카드 구현
```html
<!-- 홈페이지에서 -->
<div class="service-cards">
  <a href="https://studio.yourdomain.com/imagen4" class="card">
    <h3>🎨 AI 이미지 생성</h3>
    <p>텍스트로 이미지 생성</p>
  </a>
  
  <a href="https://studio.yourdomain.com/imagen3" class="card">
    <h3>✨ 이미지 변형</h3>
    <p>스타일 변경 & 편집</p>
  </a>
  
  <a href="https://studio.yourdomain.com/lumina" class="card">
    <h3>👗 룩북 제작</h3>
    <p>프로페셔널 룩북</p>
  </a>
</div>
```

---

## 📊 Rate Limiting 전략

### 모듈별 제한
```typescript
const MODULE_LIMITS = {
  'imagen4': { 
    hourly: 3,    // 생성은 제한적
    daily: 100,
    cost: 'high'  // API 비용 높음
  },
  'imagen3': { 
    hourly: 5,    // 편집은 좀 더 여유
    daily: 150,
    cost: 'medium'
  },
  'lumina': { 
    hourly: 10,   // 룩북은 상대적으로 여유
    daily: 200,
    cost: 'low'
  }
};
```

### 워크플로우 우선권
```typescript
// 워크플로우로 연결된 사용자는 제한 완화
if (hasActiveWorkflow) {
  limits.hourly *= 2; // 2배 허용
}
```

---

## 💰 비용 최적화

### Imagen4 (생성)
- 비용 높음 → 엄격한 제한
- 이미지 압축 필수
- 캐싱 적극 활용

### Imagen3 (변형)
- 비용 중간 → 적절한 제한
- 원본 이미지 재사용

### Lumina (룩북)
- 비용 낮음 → 여유로운 제한
- 레이아웃만 처리

---

## 🎯 구현 우선순위

### Phase 1: 기본 구조 (현재)
✅ Imagen4 독립 모듈
✅ R2/D1 연동
✅ Rate Limiting

### Phase 2: 통합 (다음)
🔲 React Router 추가
🔲 워크플로우 API
🔲 모듈 간 데이터 전달

### Phase 3: 고도화
🔲 Imagen3 모듈 구현
🔲 Lumina 모듈 구현
🔲 워크플로우 UI

---

## 📝 요약

**현재 상태:**
- ✅ Imagen4 모듈 완성
- ✅ R2/D1 인프라 준비
- ✅ Rate Limiting 구현

**다음 단계:**
1. React Router 추가
2. 워크플로우 API 구현
3. Imagen3, Lumina 모듈 추가
4. 홈페이지 연동

**Pages 사용:**
- 홈페이지: 1개
- AI Studio: 1개
- **총 2개** (무료 플랜 여유)
