---
type: order
date: 2026-05-21
from: iMac/쌍아
to: iMac/막내
subject: "ops 세션·보고서·완료보고 폴더 정합성 정위치 작업"
status: 대기
portfolio: ~
---

# 지시서: ops 문서 폴더 정합성 정위치

> **[2026-05-21 11:12 KST] iMac/쌍아 → iMac/막내**

## 배경

`monkos-ops/ops/` 하위 문서 분류 폴더에 파일이 뒤섞여 있다.
세션로그/지시서/보고서/완료보고가 제 위치에 있지 않은 것을 전수 파악 완료.
아래 **4개 이슈**를 기계적으로 `git mv` 처리한다.

## ⚠️ 준수 조항

- **헌법 4조 2항**: `rm -rf`, `git push --force` 금지. `git mv`만 사용.
- **헌법 3조 2항**: 파일 내용 수정 절대 금지. 이동만 수행.
- **ch4 3조**: 월별 폴더(`2026-MM/`)에 배치. 루트 생성 금지.

---

## 이슈 1: sessions/ 루트에 세션로그 미배치 (2건)

월별 폴더가 아닌 `sessions/` 루트에 세션로그가 방치됨.

```bash
mkdir -p monkos-ops/ops/sessions/2026-05
git mv monkos-ops/ops/sessions/2026-05-11_4060_ssanga.md monkos-ops/ops/sessions/2026-05/
git mv monkos-ops/ops/sessions/2026-05-12_4060_ssanga.md monkos-ops/ops/sessions/2026-05/
```

---

## 이슈 2: sessions/2026-05/ 내 비-세션 파일 혼입 (28건)

세션 폴더에 ORDER(17), REPORT(9), COMPLETION(2)이 혼입됨. 각 정본 폴더로 이동.

### 2-1. ORDER → orders/2026-05/ (17건)

```bash
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260510_iMac쌍아_막내2_챗봇모델리서치.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260510_iMac쌍아_막내_PF전수조사.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260510_iMac쌍아_막내_RQ10_WorkersAI_실측비교.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260510_iMac쌍아_막내_RQ10_오픈소스대체가능성.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260510_iMac쌍아_막내_WorkersAI_전모델실측.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260510_iMac쌍아_막내_monkkr_Gemma3챗봇.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_M4쌍아_PhotoMonk_실기기빌드.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내1_PF_IDPHOTO_개설.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내1_PF_IDPHOTO_정정.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내1_가격조사_컷당단가보정.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내2_Gemini2.0_마이그레이션_실행.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내2_Gemini모델_마이그레이션조사.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내3_PhotoMonk_PoC_보강.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내3_PhotoMonk_촬영시퀀스.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내3_증명앱_iOS전환_난이도파악.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내_AI증명사진_가격전수조사.md monkos-ops/ops/orders/2026-05/
git mv monkos-ops/ops/sessions/2026-05/ORDER_20260518_iMac쌍아_막내_PhotoMonk_Vision코칭_PoC.md monkos-ops/ops/orders/2026-05/
```

### 2-2. REPORT → reports/2026-05/ (9건)

```bash
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내2_챗봇API모델비교.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내3_RQ10_오픈소스대체가능성.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내_PF전수조사_갭분석.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내_RQ10_Gemini_vs_Qwen3_실측.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내_WorkersAI_전모델실측.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260518_막내1_AI증명사진_가격전수조사.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260518_막내2_Gemini2.0_마이그레이션_실행.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260518_막내2_Gemini모델_마이그레이션조사.md monkos-ops/ops/reports/2026-05/
git mv monkos-ops/ops/sessions/2026-05/REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md monkos-ops/ops/reports/2026-05/
```

### 2-3. COMPLETION → completions/2026-05/ (2건)

```bash
git mv monkos-ops/ops/sessions/2026-05/COMPLETION_20260518_M4쌍아_PhotoMonk_실기기빌드테스트.md monkos-ops/ops/completions/2026-05/
git mv monkos-ops/ops/sessions/2026-05/COMPLETION_20260518_막내3_PhotoMonk_Vision코칭_PoC.md monkos-ops/ops/completions/2026-05/
```

---

## 이슈 3: reports/ 폴더 내 COMPLETION 파일 혼입 (97건)

`reports/` 안에 `COMPLETION_` 파일이 97건 섞여 있다. `completions/` 정본 폴더로 이동.

### 실행 스크립트 (일괄)

```bash
# 필요 월별 폴더 생성
mkdir -p monkos-ops/ops/completions/2026-02
mkdir -p monkos-ops/ops/completions/2026-03
mkdir -p monkos-ops/ops/completions/2026-04

# reports/2026-02 → completions/2026-02 (26건)
for f in monkos-ops/ops/reports/2026-02/COMPLETION_*.md; do
  git mv "$f" monkos-ops/ops/completions/2026-02/
done

# reports/2026-03 → completions/2026-03 (34건)
for f in monkos-ops/ops/reports/2026-03/COMPLETION_*.md; do
  git mv "$f" monkos-ops/ops/completions/2026-03/
done

# reports/2026-04 → completions/2026-04 (8건)
for f in monkos-ops/ops/reports/2026-04/COMPLETION_*.md; do
  git mv "$f" monkos-ops/ops/completions/2026-04/
done

# reports/2026-05 → completions/2026-05 (27건)
for f in monkos-ops/ops/reports/2026-05/COMPLETION_*.md; do
  git mv "$f" monkos-ops/ops/completions/2026-05/
done

# reports/ 루트의 1건
git mv monkos-ops/ops/reports/COMPLETION_20260509_막내1_134235.md monkos-ops/ops/completions/2026-05/
```

---

## 이슈 4: completions/ 루트에 미배치 (4건)

2026-04 COMPLETION이 월별 폴더 없이 completions/ 루트에 방치됨.

```bash
mkdir -p monkos-ops/ops/completions/2026-04
git mv monkos-ops/ops/completions/COMPLETION_20260424_막내1_AEO_트랙12_정합성검토.md monkos-ops/ops/completions/2026-04/
git mv monkos-ops/ops/completions/COMPLETION_20260424_막내1_app404_crop_FAQ.md monkos-ops/ops/completions/2026-04/
git mv monkos-ops/ops/completions/COMPLETION_20260424_막내1_퍼널UX진단.md monkos-ops/ops/completions/2026-04/
git mv monkos-ops/ops/completions/COMPLETION_20260424_막내4_콘텐츠파이프라인.md monkos-ops/ops/completions/2026-04/
```

---

## 참고: 비표준 네이밍 파일 (이동 대상 아님)

`reports/2026-02/`에 아래 파일이 표준 네이밍(`REPORT_YYYYMMDD_...`)을 따르지 않음.
내용상 보고서 성격이므로 현 위치 유지하되, 작가님 판단 대기.

- `MONKOS_Cr_Motion_System_Directive.md`
- `MONKOS_경쟁분석보고서_20260227.md`
- `MONKOS_경쟁사전수조사_20260227_시트1~5.csv` (5건)

---

## 완료 기준

1. `sessions/` 내 ORDER/REPORT/COMPLETION 파일 0건 (`find monkos-ops/ops/sessions/ -name "ORDER_*" -o -name "REPORT_*" -o -name "COMPLETION_*" | wc -l` = 0)
2. `reports/` 내 COMPLETION 파일 0건 (`find monkos-ops/ops/reports/ -name "COMPLETION_*" | wc -l` = 0)
3. `completions/` 루트에 파일 0건 (README 제외)
4. `sessions/` 루트에 세션로그 0건 (README 제외)
5. `git status`로 rename만 확인 (신규/삭제 없음)
6. 커밋: `[정리] ops 문서폴더 정합성 정위치 — ORDER/REPORT/COMPLETION 131건 재배치`

## 총 이동 건수

| 유형 | 건수 |
|------|------|
| 세션로그 루트→월별 | 2 |
| ORDER sessions→orders | 17 |
| REPORT sessions→reports | 9 |
| COMPLETION sessions→completions | 2 |
| COMPLETION reports→completions | 97 |
| COMPLETION completions루트→월별 | 4 |
| **합계** | **131** |
