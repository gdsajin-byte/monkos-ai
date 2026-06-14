---
type: ORDER
date: 2026-04-21
from: iMac/쌍아
to: iMac/막내1
priority: HIGH
deadline: 2026-04-21 18:00 KST
portfolio: PF_CITADEL
---

# 지시서 — PF_CITADEL Phase 2.0: 색인 누수 차단

**[2026-04-21 15:32 KST] iMac/쌍아 → iMac/막내1**

> 민아 제안서 `PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화.md` 기반.
> Phase 2.0(즉시) 항목만 실행. Phase 2.1은 별도 지시.

---

## 1. 임무

idphoto-jp/kr sitemap URL 누수 차단 + 404 33개 원천 제거 + 재색인 요청.

---

## 2. 필수 참조

| 파일 | 경로 |
|------|------|
| 민아 제안서 | `monkos-ops/ops/proposals/PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화.md` |
| PF_CITADEL 정본 | `monkos-ops/ops/portfolios/PF_CITADEL.md` |
| idphoto-jp 소스 | `monkos_AI/idphoto-jp/` |
| idphoto-kr 소스 | `monkos_AI/idphoto-kr/` |

---

## 3. 작업 항목

### 2.0-A: idphoto-jp sitemap 전수 조사 + 확장
1. SPA 라우트 전수 파악 — 실제 존재하는 페이지(규격별·FAQ·가이드 등) 목록 작성
2. 현재 sitemap.xml 내용 확인 (URL 1개만 있는 이유 진단)
3. sitemap 생성 로직 수정 — 모든 유효 페이지 포함
4. 빌드 후 sitemap.xml URL 수 **10개 이상** 확인

### 2.0-B: idphoto-kr sitemap 동일 작업
- 2.0-A와 병렬 수행

### 2.0-C: 404 33개 URL 전수 색출 + 원인 분류
1. GSC에서 404 URL 목록 수집 (CDP로 GSC 접속)
2. 각 URL의 원인 분류:
   - hreflang 잔존 참조
   - 내부 링크 잔존
   - 외부 백링크
   - Firestore 구식 슬러그
   - sitemap 잔존
3. 분류 결과 표로 정리

### 2.0-D: 원인별 조치
- 301 추가 필요한 것 → 301 매핑
- 내부 링크 잔존 → 링크 수정/제거
- sitemap 잔존 → sitemap에서 제거
- 완전 폐기 → 410 Gone 반환

### 2.0-E: 재색인 요청
- sitemap 수정 완료 후 GSC에서 **sitemap 재제출**
- 주요 자산 20~30건 **개별 URL 색인 요청**

---

## 4. ⚠️ 완료 기준 — 검증 없이 완료 보고 금지

| 항목 | 완료 조건 |
|------|----------|
| sitemap | GSC sitemap 재제출 + **발견 페이지 수 증가 확인** (1→10+) |
| 404 | 조치한 URL의 GSC URL 검사에서 **404 아닌 상태 확인** (최소 상위 10건) |
| 전체 | 조치 전/후 수치 비교표 제출 |

**"코드 수정했습니다"는 완료가 아님. GSC에서 실측 확인까지가 완료.**

---

## 5. 금지 사항

- 헌법 4조: deploy.sh 경유 배포 (직접 gcloud 금지)
- 프로덕션 서비스 중단 유발 금지
- sitemap에 존재하지 않는 URL 추가 금지 (실제 접근 가능한 페이지만)

## ⚠️ 준수 조항
- 헌법 3조 1항: 매 턴 `date` 타임스탬프
- 헌법 3조 2항: 완료 보고 필수
- PF_CITADEL 히스토리에 Phase 2.0 기록 append

---

## 6. 산출물

| # | 산출물 | 경로 |
|---|--------|------|
| 1 | 404 원인 분류표 + 조치 결과 | 보고서 내 포함 |
| 2 | sitemap 전/후 URL 수 비교 | 보고서 내 포함 |
| 3 | 완료 보고 | `monkos-ops/ops/sessions/2026-04-21_iMac_막내1.md` 어펜드 |
| 4 | PF_CITADEL 히스토리 어펜드 | `monkos-ops/ops/portfolios/PF_CITADEL.md` |

---

**지시서 종료.**
