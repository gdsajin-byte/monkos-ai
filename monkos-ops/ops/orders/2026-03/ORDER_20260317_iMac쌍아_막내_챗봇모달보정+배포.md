---
type: ORDER
from: iMac/쌍아
to: iMac/막내1
date: 2026-03-17
priority: P1
scope: 코딩 + 배포
---

# 지시서: 챗봇 모달 보정 — 작가님 피드백 반영

## 배경

에디터 5차 Task 5(챗봇 모달 전환) 배포 후 작가님 육안 확인 결과 4건 보정 필요.

## 대상 파일

- `monkos_AI/portal/public/index.html`
- `monkos_AI/portal/public/css/portal.css`

## Task 1: FAB 버튼 위치 보정 (데스크탑)

### 피드백
- 데스크탑에서 FAB 버튼이 사이드바 바깥 우측 끝까지 밀려 있음

### 변경
- 데스크탑: FAB 위치를 메인 콘텐츠 영역 우하단으로 조정
- `right: 24px` → 사이드바 안쪽 또는 콘텐츠 영역 기준 (`max-width: 1280px` 컨테이너 내부)
- 모바일: 현행 유지 (직관적이라 OK)

## Task 2: 모달 헤더 색감 추가

### 피드백
- 모달 팝업 헤더가 흰색이라 구분 안 됨

### 변경
- 챗 모달 `.chat-header` 배경색 추가: `var(--accent)` 보라색 또는 연보라 그라데이션
- 헤더 텍스트: 흰색 (`#fff`)
- 닫기 버튼: 흰색 테두리

## Task 3: 모바일 모달 높이 제한

### 피드백
- 모바일에서 모달이 화면 끝까지 올라가면서 대화가 밀려올라감
- idphoto 정도의 절반 라인이 적당

### 변경
- 모바일: `inset: 0` → `top: 50%` 또는 `max-height: 50vh` (화면 하단 절반만 차지)
- 대화 영역이 넘치면 내부 스크롤
- 데스크탑: 기존 `max-height: 70vh` 유지

## Task 4: 입력 placeholder 간결화

### 피드백
- "MONKOS AI에게 질문하세요 — 증명사진, 규격, 크롭, 가격 등" → 너무 길어서 모바일에서 줄바꿈

### 변경
- placeholder: `"MONKOS AI에게 질문하세요"` (뒤 설명 삭제)

## Task 5: 커밋 + 배포

```bash
git add monkos_AI/portal/public/index.html \
       monkos_AI/portal/public/css/portal.css
git commit -m "[portal] 챗봇 모달 보정 — FAB 위치 + 헤더 색감 + 모바일 높이 + placeholder"
git push origin main
cd monkos_AI/portal && bash deploy.sh prod
```

## 완료 보고

`✅❌💡⏳📁🔀` 형식. 배포 리비전 포함.

## ⚠️ 준수 조항

- 헌법 제1조 1항: 타임스탬프
- 기존 FAB 동작 (클릭→모달, 닫기→FAB 복원) 유지
- 모달 내부 입력+대화 로직 변경 금지 (CSS/HTML만 보정)
