---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내
portfolio: PF_OPUS
status: 대기
---

# 지시서 — 블로그 CMS 즉시 수정 3건 (Critical/High)

**[2026-06-11 12:06 KST] iMac/쌍아 → iMac/막내**

---

## 배경

코드 정밀 감사(REPORT_20260611_iMac막내1)에서 Critical 1건 + High 2건 확인. maxOutputTokens는 4/27 이후 3번째 보고이며 아직 미수정. 즉시 수정 후 prod 배포한다.

---

## ⚠️ 준수 조항

- 헌법 4조 1항: 비밀정보 보호 (API 키 하드코딩 금지)
- ch5 2조: Cloud Run 배포는 deploy.sh 경유 필수
- 수정 전 해당 파일 전문 Read 필수

---

## Task 1: maxOutputTokens 복원 [High — 3번째 보고]

- 파일: `monkos_AI/portal/lib/cms/translate.js:116`
- 현재: `maxOutputTokens: 8192`
- 수정: `maxOutputTokens: 32768`
- 근거: 커밋 `efdbdc64`에서 32768 설정 → `92b4d416`(5/18 모델 마이그)에서 8192로 회귀. EN 장문 번역 구조적 실패 원인.

## Task 2: llms.txt 영속성 수정 [Critical]

- 파일: `monkos_AI/portal/lib/cms/seo.js` (`appendToLlmsTxt` 함수)
- 문제: `writeFileSync`로 Cloud Run 임시 파일시스템에 기록 → 배포/스케일다운 시 소멸
- 수정 방안: llms.txt를 동적 생성(Firestore blog_posts에서 published 목록 조회 → 실시간 렌더)으로 전환
  - `GET /llms.txt` 라우트에서 Firestore 조회 → 텍스트 생성 → 응답
  - `appendToLlmsTxt` 함수는 제거 (blog.js, translate.js 호출부도 제거)
  - 기존 `public/llms.txt` 정적 파일은 기본 템플릿(서비스 소개부)만 유지하되, 블로그 목록은 동적 추가
- 주의: llms.txt 기존 구조(서비스 소개 + Citation 섹션)를 유지할 것. 블로그 URL만 동적화.

## Task 3: Naver Search API 환경변수 주입 [High]

- 파일: `monkos_AI/portal/deploy.sh`
- 문제: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`이 Cloud Run env에 미전달
- 수정: deploy.sh의 `gcloud run deploy` 명령에 환경변수 2개 추가
- 값 출처: GCP Secret Manager에 등록 완료 상태. `--set-secrets` 또는 `--set-env-vars`로 주입
- 주의: deploy.sh 내 기존 패턴(다른 시크릿 주입 방식)을 따를 것. 새 방식 도입 금지.

---

## 배포

3건 수정 완료 후:
1. 로컬 테스트 (서버 기동 후 번역 트리거, llms.txt 라우트, 네이버 API 응답 확인)
2. `./deploy.sh prod` 배포
3. prod에서 llms.txt 접근 확인 (`curl https://monkos.ai/llms.txt`)

---

## 산출물

1. 코드 수정 3건
2. prod 배포 완료
3. **보고서**: `monkos-ops/ops/reports/2026-06/COMPLETION_20260611_iMac막내_블로그CMS_즉시수정3건.md`
4. 세션 로그 어펜드
5. 완료 보고: ✅❌💡⏳📁🔀 형식
