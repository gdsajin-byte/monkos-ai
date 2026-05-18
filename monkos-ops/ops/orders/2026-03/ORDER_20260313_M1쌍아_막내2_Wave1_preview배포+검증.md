---
type: task
from: M1/쌍아
to: 막내2
date: 2026-03-13 22:07 KST
status: open
priority: high
tags: [포털v4, Wave1, 배포, preview, 블루그린, 검증]
depends: [ORDER_20260313_M1쌍아_막내1_Wave1_indexhtml_v4전면교체]
---

# Wave 1-B: preview 배포 + 라우트 검증

## 선행 조건

**막내1의 Wave 1-A (index.html v4 교체) 커밋 + push 완료 후 실행.**
push 전에는 이 작업을 시작하지 않는다.

## 배경

v4 전면 교체된 index.html을 Cloud Run preview 모드로 배포하여 검증한다.
Wave 0-B에서 준비한 `deploy.sh preview` 명령을 사용한다.
트래픽 0%로 배포되므로 실서비스 무영향.

## 대상 파일

- `monkos_AI/portal/deploy.sh` (실행만, 수정 없음)

## 작업 순서

### 1단계: 코드 동기화

```bash
cd /Users/developer/monk_project
git pull origin main
```

### 2단계: preview 배포

```bash
cd monkos_AI/portal
./deploy.sh preview
```

- `y` 입력하여 배포 진행
- 배포 완료 시 출력되는 **Preview 태그 URL** 기록

### 3단계: 라우트 검증

Preview 태그 URL (`https://v4-preview---monkos-portal-xxxxx.run.app`)로 아래 라우트를 모두 확인:

#### A) 메인 페이지

| 항목 | 확인 내용 | 결과 |
|------|----------|------|
| `/` 로드 | 3컬럼 레이아웃 + 라이트 테마 정상 렌더 | |
| 히어로 | 컴팩트 다크 배너 표시 | |
| 유저바 | 로그인 버튼 또는 유저 정보 표시 | |
| 갤러리 슬라이더 | before/after 자동 스크롤 | |
| 네비게이션 | 스티키 동작 + 링크 정상 | |
| 좌 사이드바 | 매거진 카드 + 태그 표시 | |
| 우 사이드바 | 가이드 카드 + 크레딧 안내 표시 | |
| 서비스 카드 | 2열 (LIVE + FREE) 표시 | |
| 챗봇 바 | 하단 고정 입력창 표시 | |
| 푸터 | 사업자 정보 + 링크 표시 | |

#### B) SSR 페이지 (render.js, 무영향 확인)

| 라우트 | 확인 내용 | 결과 |
|--------|----------|------|
| `/blog` | 블로그 목록 정상 렌더 | |
| `/blog/:slug` | 블로그 상세 정상 렌더 (아무 글이나) | |
| `/ja/blog` | 다국어 블로그 목록 | |
| `/faq` | FAQ 아코디언 | |
| `/gallery` | 갤러리 그리드 + 라이트박스 | |
| `/board` | 게시판 목록 | |
| `/board/write` | 글쓰기 폼 | |
| `/sitemap.xml` | XML 정상 | |

#### C) 기능 검증

| 기능 | 확인 내용 | 결과 |
|------|----------|------|
| 언어 전환 | KO/JA/EN 버튼 클릭 시 텍스트 변경 | |
| 챗봇 | 입력 → 모달 열림 → 메시지 전송 | |
| 반응형 | 브라우저 창 축소 시 단일 컬럼 전환 | |
| JS 로드 | 콘솔 에러 없음 (DevTools 확인) | |
| 외부 링크 | crop.monkos.ai 새 탭 열림 | |

#### D) 인증/결제 (선택 — 테스트 계정 있을 경우)

| 기능 | 확인 내용 | 결과 |
|------|----------|------|
| 로그인 | Google/Kakao 로그인 팝업 | |
| 크레딧 | 잔고 표시 + 크레딧샵 모달 | |
| CTA | "촬영 시작하기" → 앱 URL 이동 | |

### 4단계: 결과 보고

검증 결과를 테이블 형태로 보고:
- 정상: ✅
- 이상: ❌ + 증상 상세
- 미확인: ⏳ + 사유

## 규칙

- deploy.sh 수정 금지
- 코드 수정 금지 (검증만 수행)
- 검증에서 이상 발견 시 수정하지 말고 보고만
- 트래픽 전환(`--to-latest`) 실행 금지 — 검증 후 작가님 승인 필요

## 트래픽 전환 (이 지시서 범위 밖)

검증 통과 후 작가님 승인 시:
```bash
gcloud run services update-traffic monkos-portal \
  --region us-central1 \
  --to-latest
```

## 완료 기준

**실행+보고** — preview 배포 완료 + 검증 결과 테이블 보고 → 대기 (트래픽 전환은 작가님 승인 후).
