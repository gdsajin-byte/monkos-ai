---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내4
subject: image_pro 코드 구조 전수 조사 + 정리 방안 보고서
status: 대기
portfolio: PF_IMAGEN
---

# 지시서: image_pro 코드 구조 전수 조사 + 정리 방안 보고서

> **배경**: image_pro 코드가 여러 곳에 분산되어 있어 유지보수 시 혼동 발생.
> MONK_kr/ai_lab/image_pro, apps/monk_imagen4, CF Functions 등 동일 기능의 코드가 중복·산재.
> **목적**: 현재 실제로 무엇이 어디서 서빙되는지 전수 파악하고, 정리 방안을 보고한다. 수정은 하지 않는다.

---

## 1. 조사 항목

### A. 실제 서빙 구조 파악

image.monkos.ai가 **어디서 어떻게 서빙되는지** 정확히 매핑한다.

확인할 것:
1. **Cloud Run 서비스명**: `monk-image-engine` (추정) — 실제 서비스명과 리비전 확인
2. **백엔드 서버**: `apps/monk_imagen4/backend/server.js` — Express 서버
3. **프론트엔드**: `apps/monk_imagen4/backend/public/` — 정적 서빙
4. **프론트 진입점**: `/` → `public/index.html`, `/app/` → `public/app/index.html`
5. **실제 앱 코드**: `public/app/assets/index-v6.js` — 빌드된 단일 번들
6. **Dockerfile**: `apps/monk_imagen4/backend/Dockerfile` — 무엇이 컨테이너에 포함되는지

### B. 코드 위치별 역할·상태 매핑

아래 위치에 image_pro 관련 코드가 존재한다. 각각의 역할과 현재 상태(활성/사용안함/중복)를 판정한다.

| # | 위치 | 의심 역할 | 확인할 것 |
|---|------|----------|----------|
| 1 | `apps/monk_imagen4/backend/server.js` | 백엔드 API 서버 (활성) | 엔드포인트 전수 목록 |
| 2 | `apps/monk_imagen4/backend/public/` | 프론트엔드 정적 파일 (활성) | index.html, app/ 구조 |
| 3 | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` | 프론트 빌드 번들 (활성) | 빌드 원본 소스가 어디인지 |
| 4 | `apps/monk_imagen4/modules/` | React TSX 소스 | v6 번들의 원본인지, 별도 프로젝트인지 |
| 5 | `apps/monk_imagen4/components/` | React TSX 컴포넌트 | 위와 동일 |
| 6 | `apps/monk_imagen4/services/` | 서비스 레이어 | geminiService.ts 등 — 실사용 여부 |
| 7 | `apps/monk_imagen4/functions/` | CF Workers 함수 | 현재 활성인지, 백엔드로 이관 완료인지 |
| 8 | `apps/monk_imagen4/index.html` | Vite 진입점 | 빌드 파이프라인과 관계 |
| 9 | `apps/monk_imagen4/vite.config.ts` | Vite 빌드 설정 | `npm run build`로 v6 생성 가능한지 |
| 10 | `MONK_kr/ai_lab/image_pro/` | 이전 버전 정적 파일 | 현재 사용 여부 (CF Pages?) |

### C. 빌드 파이프라인 확인

v6 번들이 어떻게 생성되었는지 추적:
1. `apps/monk_imagen4/package.json`의 `build` 스크립트 확인
2. `npm run build` 실행 가능 여부 테스트 (빌드만, 배포 안 함)
3. 빌드 결과물이 `dist/`에 나오는지, `public/app/`에 나오는지
4. v6 번들과 현재 TSX 소스의 관계: 같은 코드인지, 분기된 코드인지

### D. 엔드포인트·기능 전수 목록

server.js 기준 + v6 번들 내 프론트 기준으로 전체 기능 매핑:

| 기능 | 백엔드 엔드포인트 | 프론트 호출 여부 | 상태 |
|------|-----------------|----------------|------|
| T2I 생성 | POST /generate | ? | ? |
| 배치 생성 | POST /batch-generate | ? | ? |
| I2I 변주 | POST /refine | ? | ? |
| 이미지 분석 | POST /analyze | ? | ? |
| 번역 | POST /translate | ? | ? |
| 업로드 | POST /upload (CF?) | ? | ? |
| 다운로드 | 프론트 직접 | ? | ? |
| 내보내기 | 프론트 직접 | ? | ? |

---

## 2. 보고서 형식

```markdown
# image_pro 코드 구조 전수 조사 보고서

## 1. 서빙 구조
- Cloud Run: (서비스명, 리비전, 서비스 계정)
- 도메인: image.monkos.ai → (매핑 확인)
- 서버: server.js (Express)
- 프론트: public/app/assets/index-v6.js

## 2. 코드 위치별 판정
| 위치 | 판정 | 근거 |
|------|------|------|
| (위 10개 항목) | 활성/미사용/중복 | (확인 근거) |

## 3. 빌드 파이프라인
- npm run build: (가능/불가/미확인)
- v6 번들과 TSX 소스 관계: (동일/분기/무관)

## 4. 기능·엔드포인트 전수
(위 표 완성)

## 5. 정리 방안 제안
### 안 1: (설명)
### 안 2: (설명)
- 각 안의 장단점, 예상 작업량, 리스크

## 6. 알려진 버그 현황
- 다운로드: 변주 이미지 대신 원본 다운로드 (원인 추정)
- 내보내기 단컷: 동일 문제
- 애널라이저: 별도 진단(막내3) 결과 참조
```

---

## 3. ⚠️ 준수 조항

- **수정 금지**: 이 지시서는 조사+보고만. 코드 수정/리팩터링 금지.
- **빌드 테스트**: `npm run build`는 확인 목적으로 실행 가능하나, 빌드 결과물을 `public/`에 덮어쓰지 않는다.
- **헌법 4조 1항**: API 키, 프로젝트 ID 노출 금지.

---

## 4. 참조

| 용도 | 경로 |
|------|------|
| 백엔드 | `apps/monk_imagen4/backend/server.js` |
| 프론트 빌드물 | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` |
| 프론트 HTML | `apps/monk_imagen4/backend/public/app/index.html` |
| TSX 소스 | `apps/monk_imagen4/modules/`, `components/`, `services/` |
| Vite 설정 | `apps/monk_imagen4/vite.config.ts` |
| CF Functions | `apps/monk_imagen4/functions/api/` |
| 구버전 | `MONK_kr/ai_lab/image_pro/` |
| deploy.sh | `apps/monk_imagen4/backend/deploy.sh` |
| 어제 세션로그 | `monkos-ops/ops/sessions/2026-06-05_iMac_쌍아.md` |
