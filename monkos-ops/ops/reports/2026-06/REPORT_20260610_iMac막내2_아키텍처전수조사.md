---
type: report
date: 2026-06-10
device: iMac
agent: 막내2
portfolio: PF_MONK_OS
status: 완료
---

# 아키텍처·코드 품질 전수 조사 보고서

**[2026-06-10 15:10 KST] iMac/막내2 → 작가님**

> Fable 5(Cloud/막내) PR #45 보고를 출발점으로, 데드 코드·라이브 서비스 품질·CI/CD를 직접 검증한 결과.

---

## 1. 데드 코드 전수 검증 (Task 1)

### 검증 결과표

| # | 경로 | 크기 | 최종 커밋 | 라이브 참조 | Fable 판정 | 막내2 검증 결과 |
|---|------|------|-----------|------------|-----------|---------------|
| 1 | `apps/MonkosCrop/` | 141M | 2026-06-10 | 없음 | 데드 (131M) | ✅ **확인** — DEAD. .build/ 116MB 여전히 Git 추적 중 |
| 2 | `apps/MonkosChat/` | 1.6M | 2026-02-27 | 없음 | 데드 (1.7M) | ✅ **확인** — DEAD. portal chat과 코드 공유 없음 |
| 3 | `apps/idphoto-jp-v079/` | 320K | 2026-04-24 | 없음 | 데드 (320K) | ✅ **확인** — DEAD. 정본은 monkos_AI/idphoto-jp/ |
| 4 | `apps/photolab-monkkr-legacy/` | 148K | 2026-02-27 | 없음 | 데드 | ✅ **확인** — DEAD. 3.5개월+ 방치 |
| 5 | `apps/photolab-monkkr-mpa-0219/` | 728K | 2026-02-27 | 없음 | 데드 | ✅ **확인** — DEAD. 3.5개월+ 방치 |
| 6 | `apps/crop-app/` | 17M | 2026-05-26 | PF_CROP 벤치마크 | 중복 (17M) | ❌ **오탐** — ALIVE. R&D 워크스페이스 (정본≠중복) |
| 7 | `apps/idpass-android/` | 3.9M | 2026-05-24 | 없음 | 미활용 | ⚠️ **보충** — 판단대기 상태. 17일 전 리서치 활동 있음 |

### 신규 발견

| 발견 | 심각도 | 상세 |
|------|--------|------|
| MonkosCrop `.build/` 미해제 | **높음** | f0a1ab10 커밋에서 `.gitignore`만 추가, `git rm --cached` 미실행. 2,704파일(116MB) 여전히 추적 중. 클론마다 116MB 낭비 |
| idphoto-jp-v079 deploy.sh 키 노출 위험 | 중간 | `.env`에서 GEMINI_API_KEY를 읽어 `--set-env-vars`로 전달. Secret Manager 미사용 |

### 정본 판정 (헌법 3조 4항)

| 기능 | 정본 | 참조본/데드 |
|------|------|------------|
| crop-app (개발) | `apps/crop-app/` | — |
| crop-app (프로덕션) | `monkos_AI/crop-app/` | — |
| idphoto-jp | `monkos_AI/idphoto-jp/` | `apps/idphoto-jp-v079/` (DEAD) |

### 삭제 우선순위 권고안

| 우선순위 | 대상 | 절감량 | 비고 |
|---------|------|--------|------|
| **P0** | `apps/MonkosCrop/.build/` git rm --cached | ~116MB | Git 이력에서 즉시 절감 |
| **P1** | `apps/MonkosCrop/` 전체 삭제 | ~141MB | Swift 소스 포함, 라이브 참조 제로 |
| **P2** | `apps/MonkosChat/` | ~1.6MB | portal chat과 무관한 독립 PoC |
| **P2** | `apps/idphoto-jp-v079/` | ~320KB | 정본 이관 완료 |
| **P2** | `apps/photolab-monkkr-legacy/` | ~148KB | 방치 3.5개월 |
| **P2** | `apps/photolab-monkkr-mpa-0219/` | ~728KB | 방치 3.5개월 |
| **보류** | `apps/idpass-android/` | ~3.9MB | 판단대기 — PF_CROP Phase 2 결론 후 재판단 |

> 총 절감 가능량: ~147MB (P0+P1+P2 합계)

---

## 2. 라이브 서비스 코드 품질 (Task 2)

### 2-1. 의존성 버전 현황표

| 패키지 | portal | idphoto-kr | idphoto-jp | studio | crop-engine | crop-app |
|--------|--------|------------|------------|--------|-------------|----------|
| `@google/genai` | ^1.40.0 | 1.41.0 | 1.41.0 | 1.41.0 | — | — |
| `express` | — | ^4.21.0 | ^4.21.0 | ^4.21.0 | — | — |
| `cors` | — | ^2.8.5 | ^2.8.5 | ^2.8.5 | ^2.8.5 | — |
| `sharp` | ^0.34.5 | ^0.33.0 | ^0.33.0 | ^0.33.0 | ^0.33.0 | — |
| `@google-cloud/firestore` | ^7.11.6 | 7.11.6 | 7.11.6 | — | — | — |
| `@google-cloud/storage` | ^7.19.0 | ^7.19.0 | ^7.15.0 | ^7.19.0 | — | — |
| `ws` | — | 8.19.0 | 8.19.0 | — | — | — |
| `@tensorflow/tfjs` | — | — | — | — | ^4.22.0 | — |

**주요 이슈:**
- `sharp` 버전 불일치: portal 0.34 vs 나머지 0.33
- `@google-cloud/storage` 불일치: idphoto-jp만 ^7.15.0
- `@google/genai` 핀닝 비일관: portal은 caret(^), 나머지는 정확 버전
- `@google-cloud/firestore` 핀닝 비일관: portal caret, idphoto-kr/jp 정확 버전

### 2-2. idphoto-kr ↔ idphoto-jp 코드 중복도

| 지표 | 수치 |
|------|------|
| KR 총 라인 | ~11,631 |
| JP 총 라인 | ~11,365 |
| 변경 라인 | ~3,650 |
| **유사도** | **~84%** |

차이점: 로케일 문자열(ko↔ja), 법적 페이지, 국가별 기능(tokusho.html, mission.js 등).
→ 공유 코어 + 설정 분리 리팩터링 강력 권고.

### 2-3. Dockerfile 위생

| 항목 | portal | idphoto-kr | idphoto-jp | studio | crop-engine |
|------|--------|------------|------------|--------|-------------|
| 멀티스테이지 | ✅ 2단계 | ❌ (주석) | ❌ (주석) | ❌ | ❌ |
| 베이스 이미지 | node:20-slim | node:20-slim | node:20-slim | node:20-slim | node:20-slim |
| .dockerignore | ❌ | ✅ | ✅ | ✅ | ❌ |
| HEALTHCHECK | ✅ | ✅ | ✅ | ✅ | ✅ |
| 레이어 캐싱 | ✅ | ✅ | ✅ | ✅ | ✅ |

**이슈:**
- portal, crop-engine: `.dockerignore` 미존재 → 불필요 파일 빌드 컨텍스트 포함
- idphoto-kr/jp: 난독화 빌드 비활성(주석) → 소스 JS 평문 배포 중
- crop-engine: build-essential+python3 최종 이미지에 잔존 (~200MB 비대)

### 2-4. 테스트 현황

| 서비스 | 테스트 파일 | 프레임워크 | 커버리지 |
|--------|-----------|-----------|---------|
| portal | 2개 (credits, search) | jest ^29.7.0 | **극소** |
| idphoto-kr | 없음 | 없음 | **제로** |
| idphoto-jp | 없음 | 없음 | **제로** |
| studio | 없음 | 없음 | **제로** |
| crop-engine | 없음 | 없음 | **제로** |
| crop-app | 없음 | 없음 | **제로** |

→ 6개 서비스 중 5개가 테스트 제로. CI에서 테스트 실행하는 워크플로우도 부재.

---

## 3. CI/CD 현황 (Task 3)

### 3-1. GitHub Actions 워크플로우

| 파일명 | 트리거 | 역할 | 배포 여부 |
|--------|--------|------|----------|
| `daily-briefing.yml` | cron (매일 05:00 KST) + manual | GA4/GSC 브리핑 생성 → Issue + Telegram | ❌ |
| `notify.yml` | workflow_call (재사용) | Telegram 메시지 전송 유틸 | ❌ |
| `secret-scan.yml` | push to main + PR to main | 시크릿 패턴 스캔 (보안 게이트) | ❌ |
| `sync-works.yml` | cron (6시간마다) + manual | works submodule 갱신 | ❌ |
| `weekly-dashboard.yml` | cron (월요일 06:00 KST) + manual | R&D 데드라인 + PF 대시보드 → Issue | ❌ |

### 3-2. deploy.sh 정본

| 서비스 | 경로 | 리전 | 안전장치 |
|--------|------|------|---------|
| monkos-portal | `monkos_AI/portal/deploy.sh` | us-central1 | 브랜치·prod확인·Toss키검증·preview |
| monkos-idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh` | us-central1 | 브랜치·prod확인 |
| monkos-idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh` | us-central1 | 브랜치·prod확인 |
| monkos-studio | `monkos_AI/studio/deploy.sh` | us-central1 | prod확인 (브랜치 체크 없음) |
| monkos-crop-engine | `monkos_AI/crop-engine/deploy.sh` | asia-northeast3 | **없음** (최소 기능) |
| monk-image-engine | `apps/monk_imagen4/backend/deploy.sh` | us-central1 | staging/production·Secret Manager |

### 3-3. 자동 배포 경로

**결론: 자동 배포 없음. 100% 수동 (deploy.sh 경유).**

- push to main 시 발동: `secret-scan.yml`(보안 게이트)만
- CI 테스트 자동실행: 없음 (jest 존재하나 워크플로우 미연결)
- pre-commit hook: 없음

### 3-4. 부재 항목 요약

| 부재 항목 | 영향 |
|-----------|------|
| CI 테스트 워크플로우 | 회귀 방어 없음 |
| 린트/타입체크 CI | 코드 품질 게이트 없음 |
| 배포 후 자동 헬스체크 | 장애 감지 수동 의존 |
| pre-commit hooks | 시크릿 유출 로컬 방어 없음 |
| crop-engine/studio deploy.sh 안전장치 | 오배포 리스크 |

> 참고: 수동 배포 정책은 헌법 4조 2항(파괴적 자동화 제한)의 반영으로 판단. 의도적 설계.

---

## 4. Fable 5 보고 대비 종합 평가

| 구분 | 건수 | 상세 |
|------|------|------|
| ✅ 확인 (Fable 판정 정확) | 5건 | MonkosCrop, MonkosChat, idphoto-jp-v079, photolab-legacy, photolab-mpa |
| ❌ 오탐 (Fable 판정 오류) | 1건 | crop-app = R&D 워크스페이스이지 중복이 아님 |
| ⚠️ 보충 (Fable 미파악) | 1건 | idpass-android = 17일 전 활동. 판단대기 상태 |
| 🆕 신규 발견 | 2건 | .build/ 미해제(116MB), idphoto-jp-v079 키 노출 위험 |

---

## 5. 종합 권고

### 즉시 조치 (P0)
1. `git rm -r --cached apps/MonkosCrop/.build/` → 116MB Git 추적 해제 완료

### 단기 조치 (P1-P2)
2. 데드 코드 5건 일괄 삭제 → ~144MB 절감
3. portal·crop-engine `.dockerignore` 추가
4. `apps/idphoto-jp-v079/deploy.sh` 내 API KEY 직접 전달 방식 제거

### 중기 개선 (아키텍처)
5. idphoto-kr/jp 84% 중복 → 공유 코어 추출 리팩터링
6. crop-engine 멀티스테이지 빌드 도입 (~200MB 이미지 절감)
7. 의존성 버전 통일 (sharp, @google-cloud/storage)
8. CI 테스트 워크플로우 신설 (최소 portal jest → PR 게이트)

### 장기 과제
9. 전 서비스 테스트 커버리지 확보
10. 배포 후 자동 헬스체크 파이프라인

---

*코드 수정 없음. 조사·보고 전용. (헌법 4조 2항 준수)*
