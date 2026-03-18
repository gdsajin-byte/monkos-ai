# MONKOS Studio — 기술명세

> 내부용 AI 증명사진 생성 도구. idphoto-kr 기반 독립 배포.
> Before/After 비교 컷 생산 + 프롬프트 세밀화 R&D 테스트베드.

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | MONKOS Studio |
| 용도 | 내부 전용 (마케팅 콘텐츠 + R&D) |
| 기반 | idphoto-kr 복사본 (독립 Cloud Run) |
| 버전 | v2 (Phase A 완료, 2026-03-18) |
| 코드 경로 | `monkos_AI/studio/` |

## 2. 아키텍처

### v1 (2026-03-18 15:46~16:05)
```
파일 업로드 → app.html → /api/idgen (photo.js I2I) → result.html
- 카메라 촬영 → 파일 업로드로 교체
- 인증/결제 제거
- Before/After 비교 컷 Canvas 합성
- 퍼널: 규격/성별/연령만 (의상/헤어 default 하드코딩)
```

### v2 Phase A (2026-03-18 17:42~18:29)
```
데스크탑 3컬럼 SPA (한 페이지 완결)
├── 좌측 사이드바 (260px)
│   ├── 파일 업로드 (드래그앤드롭)
│   ├── 규격 (passport/id)
│   ├── 성별 (f/m)
│   ├── 연령 (adult/teen/child/baby)
│   ├── 의상 (default/change/casual/suit + 세부)
│   ├── 헤어 (default/tidy/updo)
│   ├── 배경 (white/gray/blue/beige)
│   └── [생성] 버튼
├── 중앙 워크스페이스 (1fr)
│   ├── Before | After 나란히
│   ├── 프로그레스 바
│   └── [다시] [After↓] [비교 컷↓]
└── 우측 아카이브 (280px, Phase C 대비 빈 패널)
```

### v2 Phase B (미착수)
- T2I Before 생성 (Imagen) — Before 원본 무한 생성
- 입력 모드 토글: T2I / 파일 업로드

### v2 Phase C (미착수)
- GCS 아카이브 자동 적립
- Firestore `studio_archive` 컬렉션
- 우측 패널 히스토리 카드

### v2 Phase D (미착수)
- 프롬프트 에디터 (photo.js 빌더 오버라이드)
- A/B 비교 (같은 Before, 다른 옵션)
- 배치 생성

## 3. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Vanilla HTML + JS + CSS (SPA) |
| AI 보정 (I2I) | Imagen 3 via photo.js (idphoto-kr 정본) |
| 프롬프트 빌더 | buildPromptV5 (idphoto-kr 정본) |
| 서버 | Node.js (Cloud Run) |
| 스토리지 | GCS (기존 monkos 버킷 공유) |
| 배포 | Cloud Run `monkos-studio` (asia-northeast3) |

## 4. 파일 구조

```
monkos_AI/studio/
├── server.js              # Express — /api/idgen, / 서빙
├── lib/
│   ├── photo.js           # AI I2I 파이프라인 (정본, 수정 금지)
│   ├── gcs-save.js        # GCS 저장
│   └── ...
├── public/
│   ├── app.html           # SPA 3컬럼 레이아웃
│   ├── app.js             # 퍼널 + 생성 + 결과 + 다운로드 통합
│   └── style.css          # v2 CSS (3컬럼 그리드)
├── Dockerfile
├── deploy.sh
└── robots.txt             # Disallow: / (내부 전용)
```

## 5. idphoto-kr 대비 변경점

| 항목 | idphoto-kr | studio v2 |
|------|-----------|-----------|
| 입력 | 모바일 카메라 촬영 | 파일 업로드 (드래그앤드롭) |
| 인증 | Google 로그인 | 제거 |
| 결제 | Toss/LS 크레딧 | 제거 |
| 퍼널 | 4단계 prep.html | SPA 사이드바 |
| 결과 | result.html (별도 페이지) | SPA 워크스페이스 |
| B/A 비교 | 없음 | Canvas 합성 다운로드 |
| 레이아웃 | 모바일 세로 | 데스크탑 3컬럼 |
| photo.js | 정본 | 정본 (동일, 수정 금지) |

## 6. 퍼널 옵션 전달

```javascript
// app.js → /api/idgen 호출 시 전달 필드
{
  image: base64,           // Before 이미지
  format: 'passport',      // 규격
  gender: 'f',             // 성별
  age: 'adult',            // 연령
  clothing: 'suit',        // 의상
  clothingColor: 'navy',   // 의상 색상
  suitColor: 'navy',       // 정장 색상 (suit 시)
  shirtColor: 'white',     // 셔츠 색상 (suit 시)
  tieColor: 'red',         // 넥타이 색상 (suit 시)
  tiePattern: 'solid',     // 넥타이 패턴 (suit 시)
  hair: 'tidy',            // 헤어스타일
  bgColor: 'white',        // 배경색
  v: 5                     // 프롬프트 빌더 버전
}
```

## 7. 배포 정보

| 환경 | 서비스 | URL |
|------|--------|-----|
| dev | monkos-studio-dev | `monkos-studio-dev-933456016842.us-central1.run.app` |
| prod | (미배포) | — |

## 8. 접근 경로

- 어드민 대시보드 → 내부 도구 → Studio (INTERNAL)
- 직접 URL 접속

## 9. 로드맵

| Phase | 내용 | 상태 |
|-------|------|:---:|
| A | SPA + 퍼널 복원 | ✅ 완료 |
| B | T2I Before 생성 | ⏳ 미착수 |
| C | GCS 아카이브 | ⏳ 미착수 |
| D | 프롬프트 R&D | ⏳ 미착수 |

## 10. 개발 이력

| 일시 | 커밋 | 내용 |
|------|------|------|
| 2026-03-18 16:05 | `8824013` | v1 — idphoto-kr 복사 + 파일 업로드 + B/A 비교 |
| 2026-03-18 18:29 | `3653ddd` | v2 Phase A — SPA 3컬럼 + 퍼널 전체 복원 |

---

> 최종 갱신: 2026-03-18 iMac/쌍아
