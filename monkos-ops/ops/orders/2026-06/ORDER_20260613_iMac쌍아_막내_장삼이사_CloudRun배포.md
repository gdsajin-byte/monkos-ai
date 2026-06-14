---
type: order
date: 2026-06-13
from: iMac/쌍아
to: iMac/막내
subject: 장삼이사(張三李四) POC — Cloud Run 배포 (Gemini API 서버 프록시)
status: 대기
---

# 장삼이사 Cloud Run 배포 지시서

**[2026-06-13 19:10 KST]** iMac/쌍아 → 막내

## 배경

`apps/jangsam/index.html` — 삼국지 텍스트 어드벤처 POC. 현재 브라우저에서 직접 Ollama/Gemini API를 호출하는 구조. 모바일 테스트 + API 키 보호를 위해 Cloud Run에 서버 프록시를 붙여 배포한다.

## 작업 범위

### 1. 서버 구성 (`apps/jangsam/server.js`)

- Express 서버 (순수 JS, 헌법 ch2)
- `GET /` → `index.html` 서빙 (static)
- `POST /api/llm` → Gemini API 프록시
  - 환경변수 `GEMINI_API_KEY`에서 키 읽기
  - 프론트에서 `{payload, context}` 받아서 Gemini `generateContent` 호출
  - 시스템 프롬프트(SYS)는 서버에 둘 것 (프론트 노출 최소화)
  - 모델: `gemini-2.5-flash` (환경변수 `LLM_MODEL`로 오버라이드 가능)
  - `responseMimeType: "application/json"` 으로 JSON 강제
  - 에러 시 `{reply:"(역사가가 말을 잇지 못했다)", note:"서버 오류", favor_delta:0, accept:false}` 폴백
- `package.json` 생성 (dependencies: express)
- 포트: `process.env.PORT || 8080`

### 2. 프론트 수정 (`apps/jangsam/index.html`)

- llm() 함수: Ollama/Gemini 직접 호출 제거 → `/api/llm`으로 fetch
- 모델 설정 UI 제거 (서버가 관리하므로 불필요)
- SYS 프롬프트 상수: 서버로 이동 (프론트에서 삭제)
- few-shot 예시도 서버 쪽 SYS에 포함

### 3. Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

### 4. 배포

- deploy.sh 경유 (법률 ch5 2조). deploy.sh에 jangsam 서비스 항목 추가.
- 환경변수: `GEMINI_API_KEY` — GCP Secret Manager에서 주입 (`--set-secrets`)
- 리전: deploy.sh REGION 변수 준수
- 서비스명: `jangsam`
- 인증: `--allow-unauthenticated` (POC 공개 테스트)
- 도메인: 기본 URL(`jangsam-*.run.app`) 사용. 커스텀 도메인은 정식 전환 시 별도 지시.

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키 하드코딩/생성/추측 절대 금지. 환경변수에서만 읽을 것.
- **법률 ch5 2조**: `gcloud run deploy` 직접 실행 금지. deploy.sh 경유 필수.
- **법률 ch2**: 순수 JS, async/await. 새 프레임워크 도입 금지 (Express만 허용).

## 참고 파일

- 현재 코드: `apps/jangsam/index.html`
- 설계서: `apps/jangsam/JangsamYisa_Round1_Spec.md`
- 핸드오프: `apps/jangsam/HANDOFF_to_ssang-a.md`
- 시크릿 인벤토리: `monkos-ops/ops/SECRET_INVENTORY.md` (GEMINI_API_KEY 위치 확인)

## 완료 기준

- Cloud Run URL에서 브라우저 접속 → 게임 화면 렌더링
- 들판 행동 1회 → Gemini 응답 → 야사 기록 확인
- 모바일 브라우저에서도 동일 동작
- 응답 시간 10초 이내
