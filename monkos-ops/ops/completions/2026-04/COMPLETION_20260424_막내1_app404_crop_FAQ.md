---
type: completion
date: 2026-04-24
from: iMac/막내1
order: ORDER_20260424_iMac쌍아→막내1_app404수정_crop_FAQ추가
status: 완료 (배포 대기)
---

[2026-04-24 18:54 KST] iMac/막내1 → iMac/쌍아

# COMPLETION: /app 404 수정 + /crop FAQPage 추가

## 수정 파일

| 파일 | 변경 | 내용 |
|------|------|------|
| `monkos_AI/portal/server.js` | +8 | `/app` → idphoto 302 리다이렉트 추가 |
| `monkos_AI/portal/public/crop/index.html` | +82 | FAQPage(5개 Q&A) + HowTo(4스텝) JSON-LD 추가 |

## 1. `/app` 404 해결

### 실측
- `curl -sI https://monkos.ai/app` → `HTTP/2 404`
- server.js에 `/app` 라우트 없음. 정적 파일 서빙에서 `public/app` or `public/app.html` 찾기 실패

### 수정 내용
- server.js에 `/app` 라우트 추가 (CMS 라우트 직전 위치)
- **302 리다이렉트** (301 아닌 이유: 향후 `/app` 자체 페이지 신설 가능성)
- `Accept-Language` 헤더 기반 분기:
  - `ja*` → `https://idphoto-jp.monkos.ai/`
  - 기타(ko, en 등) → `https://idphoto-kr.monkos.ai/`

### 효과
- ChatGPT가 `monkos.ai/app`으로 딥링크 추천 시 → 실제 서비스로 정상 도달
- AI 엔진 신뢰도 유지 (404 → 200 전환)

## 2. `/crop` FAQPage + HowTo 추가

### 기존 상태
- `SoftwareApplication` 스키마 1개만 존재
- FAQPage ❌, HowTo ❌

### 추가 내용

**FAQPage (5개 Q&A)**:
1. "MONKOS 크롭앱으로 뭘 할 수 있나요?" — 규격 크롭 + AI 얼굴 인식
2. "무료인가요? 비용이 드나요?" — 완전 무료, 회원가입 불필요, 서버 전송 없음
3. "ICAO 규격이 뭔가요?" — 국제 표준 설명
4. "사진이 서버에 저장되나요?" — 브라우저 내 처리, 개인정보 보호
5. "어떤 규격을 지원하나요?" — 한국/일본/미국/중국 여권 등 + /specs 링크

**HowTo (4스텝)**:
1. 사진 업로드
2. 규격 선택 (여권/반명함)
3. AI 자동 크롭
4. 다운로드 (300dpi)

### 기존 스키마와 충돌
- 없음. SoftwareApplication과 FAQPage/HowTo는 별도 스키마로 공존 가능

## 배포

⏳ 배포 대기 — 작가님 승인 후 포털 deploy.sh 경유:
- `monkos_AI/portal/deploy.sh`

## 검증 방법 (배포 후)

1. `curl -sI https://monkos.ai/app` → 302 + Location 헤더 확인
2. `curl -s https://monkos.ai/crop | grep 'FAQPage'` → JSON-LD 존재 확인
3. Google Rich Results Test: https://search.google.com/test/rich-results → `/crop` URL 입력
