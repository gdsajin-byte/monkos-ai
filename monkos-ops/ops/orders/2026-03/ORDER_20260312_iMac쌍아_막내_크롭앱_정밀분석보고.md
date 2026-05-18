---
type: ORDER
date: 2026-03-12
from: iMac/쌍아
to: 막내
subject: crop-engine + 크롭앱 설계 현황 정밀분석 보고
priority: normal
category: 리서치/분석
---

# 지시서: crop-engine + 크롭앱 현황 정밀분석

> **[2026-03-12 11:09 KST] iMac/쌍아 → 막내**

---

## 배경

3/11~3/12 M1 세션에서 크롭앱 설계 + crop-engine v2 작업이 진행되었다. iMac 세션 전환 후 현황을 정밀 파악해야 한다.

## 임무

`monkos_AI/crop-engine/` 전체 코드 + 관련 세션 로그 + 보고서를 읽고, 아래 항목을 **정밀 분석**하여 보고서를 제출하라.

### 분석 항목

#### 1. crop-engine 코드 현황
- `server.js` — 엔드포인트 목록, 각 엔드포인트의 역할, 요청/응답 스펙
- `lib/crop.js` — 크롭 알고리즘 분석 (눈 앵커 기반 배치 로직, 조건부 보정, 300dpi 처리)
- `lib/face-detect.js` — FaceMesh 호출 방식, 반환 랜드마크, 정수리 추산 로직
- `specs/formats.js` — 규격 데이터 구조
- `Dockerfile`, `deploy.sh` — 배포 준비 상태
- `package.json` — 의존성 목록

#### 2. 테스트 코드 분석
- `test-crop.js`, `test-cropapp-ui.js`, `test-crown-compare.js`, `test-landmarks-visual.js`
- 각 테스트의 목적, 실행 방법, 현재 상태 (통과/미통과/수동확인)

#### 3. 크롭앱 설계 현황 (세션 로그 기반)
- 확정된 설계 결정 목록 (레이어 구조, 타원 피팅, 수치 피드백, 기술 스택 등)
- 미확정/미해결 사항 목록
- 정수리 추산 방법론 현재 상태 (v2 1:1 / 타원 / #10중간점 / 기타)

#### 4. 배포·연동 상태
- Docker 빌드 가능 여부 (Dockerfile 분석)
- Cloud Run 배포 준비도
- idphoto-kr/jp와의 연동 포인트 (있다면)

#### 5. 갭 분석
- 세션 로그의 "미해결/후속" 항목 vs 현재 코드 상태 → **무엇이 구현되었고 무엇이 안 되었는지**
- 크롭앱 프론트(crop.html + crop.js) 존재 여부
- FaceMesh 브라우저 실행 관련 코드 존재 여부

### 참조 자료 (반드시 Read)
- `monkos_AI/crop-engine/` 전체 파일
- `monkos-ops/ops/sessions/2026-03-11_M1_쌍아.md` (야간)
- `monkos-ops/ops/sessions/2026-03-12_M1_쌍아.md` (새벽)
- `monkos-ops/ops/reports/2026-03/REPORT_20260311_막내1_정수리추산리서치.md`
- `monkos-ops/ops/orders/2026-03/ORDER_20260311_iMac쌍아_막내_crop-engine_독립서비스_신규구축.md` (최초 구축 지시서)

### 산출물

- 파일: `monkos-ops/ops/reports/2026-03/REPORT_20260312_막내_크롭앱_정밀분석.md`
- 형식: 항목별 분석 + 갭 분석 표 + 우선순위 제안

## ⚠️ 준수 조항

- 헌법 제1조: 타임스탬프 `date` 명령으로 취득
- 헌법 제2조: 완료 보고 형식 준수
- **법률 6장 1조: 기본 브랜치 `main`** (금일 개정 발효)
- **코드 변경 없음** — 분석 및 보고서 작성만

---

**— iMac/쌍아 지시 완료 —**
