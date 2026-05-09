---
type: order
date: 2026-04-24
from: iMac/쌍아
to: iMac/막내1
status: 대기
priority: 1
---

[2026-04-24 18:49 KST] iMac/쌍아 → iMac/막내1

# ORDER: /app 404 수정 + /crop FAQPage 추가

## 배경

AEO 정합성 검토에서 발견:
- `/app` URL이 404 — ChatGPT가 이 URL로 3건 딥링크 추천 중. AI 엔진 신뢰도 소실.
- `/crop`에 FAQPage/HowTo 스키마 미탑재 — specs 전 페이지에는 이미 있음.

## 임무

### 1. `/app` 404 해결

- 현재 `/app` 라우트가 server.js에 없거나 다른 경로로 변경된 상태
- **실측 먼저**: `curl -s https://monkos.ai/app` 응답 확인, server.js에서 `/app` 라우트 검색
- idphoto-kr의 `/app` 페이지가 있으므로, portal `/app`이 idphoto-kr로 리다이렉트하는 것이 적절할 수 있음
- 또는 portal에 `/app` 랜딩을 만들어 서비스 선택(KR/JP)으로 분기
- **어떤 방식이든 200 응답이 나오도록** — ChatGPT가 추천한 URL이 작동해야 함

### 2. `/crop` FAQPage + HowTo 추가

- specs 페이지의 기존 패턴(render.js의 JSON-LD 생성 로직) 참조
- `/crop`은 정적 HTML이므로 직접 JSON-LD 삽입
- FAQ 3~5개: "크롭앱으로 뭘 할 수 있나요?", "ICAO 규격이 뭔가요?", "무료인가요?" 등 실제 사용자 질문 기반
- HowTo 3~4스텝: 사진 업로드 → 규격 선택 → AI 크롭 → 다운로드

### 3. dev 배포 후 확인

- `/app` 200 응답 + 적절한 콘텐츠
- `/crop` JSON-LD Rich Results Test 통과

## ⚠️ 준수
- 배포는 deploy.sh 경유
- 기존 SEO 태그(canonical, hreflang 등) 훼손 금지

## 산출물
- `COMPLETION_20260424_막내1_app404_crop_FAQ.md`
