# 📊 Cloudflare Pages 리소스 상세 운용 가이드

## 🆓 무료 플랜 제한사항

### Pages 프로젝트
- **프로젝트 수**: 100개
- **빌드 시간**: 500분/월
- **요청**: 무제한
- **대역폭**: 무제한
- **동시 빌드**: 1개

### Workers (Pages Functions)
- **요청**: 100,000회/일
- **CPU 시간**: 10ms/요청
- **메모리**: 128MB
- **실행 시간**: 최대 30초

### R2 Storage
- **저장 용량**: 10GB (무료)
- **Class A 작업**: 1백만/월 (PUT, LIST)
- **Class B 작업**: 1천만/월 (GET, HEAD)
- **데이터 전송**: 무제한 (Cloudflare 네트워크 내)

### D1 Database
- **행 읽기**: 5백만/일
- **행 쓰기**: 100,000/일
- **저장 용량**: 5GB
- **데이터베이스**: 10개

---

## 🎯 현재 프로젝트 리소스 사용 분석

### Imagen4 Generator 예상 사용량

#### 1. Workers (API 호출)
**하루 100회 생성 기준:**
```
- /api/generate: 100회 (각 4장 = 100회)
- /api/upload: 400회 (4장 × 100회)
- 기타 조회: 200회

총: 700회/일 (무료 한도의 0.7%)
```

#### 2. R2 Storage
**하루 100회 × 4장 = 400장 생성:**
```
- 저장 용량: 400장 × 2MB = 800MB/일 ≈ 24GB/월
  ⚠️ 무료 10GB 초과 → 추가 비용 발생

- Class A (업로드): 400회/일 = 12,000회/월
  ✅ 무료 한도 내 (1백만)

- Class B (다운로드): 예상 4,000회/월
  ✅ 무료 한도 내 (1천만)
```

#### 3. D1 Database
**하루 100회 생성:**
```
- 쓰기 (images): 400회/일
- 쓰기 (usage_logs): 100회/일
- 읽기 (rate limit): 200회/일
- 읽기 (조회): 500회/일

총 쓰기: 500회/일 ✅ (한도 100K)
총 읽기: 700회/일 ✅ (한도 5M)
```

---

## ⚠️ 병목 지점 및 대책

### 1. R2 저장 용량 초과 문제

**문제:**
- 하루 100회 = 월 24GB
- 무료 10GB 초과 → 월 $0.015/GB = $0.21

**해결책:**

#### Option A: 이미지 압축
```typescript
// 업로드 전 압축 (품질 80%)
const compressed = await compressImage(imageData, { quality: 0.8 });
// 용량 50% 절감 → 12GB/월
```

#### Option B: 자동 정리
```typescript
// 30일 이상 오래된 이미지 자동 삭제
wrangler r2 object delete --bucket=monk-ai-images --prefix=imagen4/old/
```

#### Option C: 썸네일 별도 저장
```typescript
// 원본 + 썸네일 분리
R2: full/{id}.png (2MB)
    thumb/{id}.png (100KB) // 목록용
```

### 2. Workers 일일 요청 한도

**현재 사용률:**
- 700회/일 = 0.7% (안전)

**스케일업 시나리오:**
- 1,000회/일 → 7,000 요청 = 7%
- 5,000회/일 → 35,000 요청 = 35%
- 10,000회/일 → 70,000 요청 = 70% ⚠️

**대책:**
```typescript
// 캐싱 활용
const cache = caches.default;
const cachedResponse = await cache.match(request);
if (cachedResponse) return cachedResponse;
```

### 3. Gemini API 비용

**Google AI Studio (무료):**
- 15 RPM (분당 요청)
- 1,500 RPD (일당 요청)
- 1.5M TPM (분당 토큰)

**하루 100회 생성:**
- 100회 × 4장 = 400 이미지 ✅

**하루 500회 생성:**
- 500회 × 4장 = 2,000 이미지 ⚠️
- RPD 초과 → Vertex AI 전환 필요

---

## 📈 확장 시나리오별 비용

### 시나리오 1: 하루 100회 (현재)
```
Workers: 무료 (700회 < 100K)
R2: $0.21/월 (14GB)
D1: 무료
Gemini: 무료

총: $0.21/월
```

### 시나리오 2: 하루 500회
```
Workers: 무료 (3,500회 < 100K)
R2: $1.20/월 (90GB)
D1: 무료
Gemini: Vertex AI 필요 → $20/월

총: $21.20/월
```

### 시나리오 3: 하루 2,000회
```
Workers: $5/월 (유료 플랜)
R2: $5/월 (360GB)
D1: 무료
Gemini: Vertex AI → $80/월

총: $90/월
```

---

## 🛠️ 최적화 전략

### 1. 이미지 최적화
```typescript
// WebP 포맷 사용 (PNG 대비 30% 절감)
const webpImage = await convertToWebP(pngImage);

// Progressive loading
- thumbnail: 50KB
- preview: 200KB
- full: 1.5MB (원본)
```

### 2. 스마트 캐싱
```typescript
// Cloudflare CDN 캐싱
headers: {
  'Cache-Control': 'public, max-age=31536000',
  'CDN-Cache-Control': 'max-age=86400'
}
```

### 3. Rate Limiting 동적 조정
```typescript
// 시간대별 차등 적용
const limits = {
  peak: { hourly: 3, daily: 50 },    // 오전 9-12시
  normal: { hourly: 5, daily: 100 },  // 기타 시간
  night: { hourly: 10, daily: 200 }   // 자정-6시
};
```

### 4. 배치 처리
```typescript
// 한 번에 여러 이미지 생성 (API 효율)
await generateBatch([prompt1, prompt2, prompt3, prompt4]);
// 4회 요청 → 1회 요청으로 절감
```

---

## 🎯 권장 운용 방식

### Phase 1: 초기 (0-1000명/일)
```
✅ 무료 플랜 사용
✅ Rate Limit: 3회/시간
✅ 이미지 압축 활성화
✅ 30일 자동 삭제

예상 비용: $1-5/월
```

### Phase 2: 성장 (1000-5000명/일)
```
⚠️ Workers 유료 전환
✅ Vertex AI 바우처 활용
✅ CDN 캐싱 적극 활용
✅ 7일 자동 삭제

예상 비용: $20-50/월
```

### Phase 3: 확장 (5000명 이상/일)
```
💎 Pages Pro ($20/월)
💎 Workers Paid ($5/월)
💎 R2 최적화
💎 유료 Vertex AI

예상 비용: $100-200/월
```

---

## 📊 모니터링 대시보드

### 필수 지표
```sql
-- 일일 사용량
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  COUNT(DISTINCT ip_address) as unique_users
FROM usage_logs
WHERE timestamp > strftime('%s', 'now', '-7 day') * 1000
GROUP BY date;

-- 시간대별 부하
SELECT 
  strftime('%H', datetime(timestamp/1000, 'unixepoch')) as hour,
  COUNT(*) as requests
FROM usage_logs
WHERE timestamp > strftime('%s', 'now', '-1 day') * 1000
GROUP BY hour;

-- R2 용량 추정
SELECT 
  project_id,
  COUNT(*) as images,
  COUNT(*) * 2 as estimated_mb
FROM images
GROUP BY project_id;
```

---

## 🚨 알림 설정

### Cloudflare Workers Analytics
```javascript
// 일일 요청 80% 도달 시 알림
if (dailyRequests > 80000) {
  await sendAlert('Workers 일일 한도 80% 도달');
}

// R2 용량 80% 도달 시 알림
if (r2Usage > 8000000000) { // 8GB
  await sendAlert('R2 저장 용량 80% 도달');
}
```

---

## 💡 결론 및 권장사항

### 현재 설정 (하루 100회)
✅ **완전 무료 운영 가능**
- Workers: 여유 충분
- D1: 여유 충분
- R2: 약간 초과 ($0.21/월)

### 권장 조치
1. **이미지 압축 활성화** → R2 비용 제로
2. **30일 자동 삭제** → 용량 관리
3. **모니터링 설정** → 실시간 추적
4. **Vertex AI 준비** → 바우처 기간 대비

### 확장 준비
- 1,000회/일 넘어가면 유료 전환 검토
- 바우처 소진 전 비용 계획 수립
- 사용자 피드백 받아 기능 조정
