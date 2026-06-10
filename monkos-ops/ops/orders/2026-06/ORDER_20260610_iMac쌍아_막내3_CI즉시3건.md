---
type: order
date: 2026-06-10
from: iMac/쌍아
to: iMac/막내3
portfolio: PF_MONK_OS, PF_CITADEL
status: 완료
---

# 지시서 — CI 집행 워크플로우 즉시 3건

**[2026-06-10 16:17 KST] iMac/쌍아 → iMac/막내3**

> 작가님 승인 완료 (2026-06-10 16:17 KST). 삼권분석(사법) 보고서 §5-1 즉시 실행 가능 3건.

---

## Task 1: 내부 호칭 유출 grep (C7)

기존 `.github/workflows/secret-scan.yml`에 스텝 추가. 또는 별도 워크플로우 신설.

**트리거**: push to main + PR to main (secret-scan과 동일)

**검사 로직**:
```bash
grep -rn '쌍아\|막내\|소소\|용아\|민아' \
  --include="*.html" --include="*.js" --include="*.json" \
  MONK_kr/ monkos_AI/portal/public/ monkos_AI/idphoto-*/public/ monkos_AI/studio/public/ \
  | grep -v 'node_modules\|admin/\|_legacy/\|_backup/\|_functions_backup\|\.min\.js'
```

**결과**: 발견 시 **warning** (exit 0 + 경고 출력). push 차단은 하지 않음 — "용아쌤" 등 의도적 노출 가능성.

**집행하는 법**: 헌법 4조 3항(내부 기밀 보호), ch8 1조(MONKOS 브랜딩 통일)

---

## Task 2: PF 500줄 초과 검사 (C2)

기존 `.github/workflows/weekly-dashboard.yml`에 스텝 추가.

**트리거**: 기존 주간 cron (월요일 06:00 KST) 유지

**검사 로직**:
```bash
find monkos-ops/ops/portfolios -name "README.md" -exec sh -c \
  'lines=$(wc -l < "$1"); if [ "$lines" -gt 500 ]; then echo "⚠️ $1: ${lines}줄 (500줄 초과)"; fi' _ {} \;
```

**결과**: 초과 PF 목록을 weekly-dashboard Issue에 포함. 별도 차단 없음 (가이드라인 성격).

**집행하는 법**: ch4 9조 3항(비대화 관리)

---

## Task 3: 세션로그 월별 폴더 위반 검사 (C3)

기존 `.github/workflows/secret-scan.yml`에 스텝 추가. 또는 별도 워크플로우 신설.

**트리거**: push to main + PR to main

**검사 로직**:
```bash
violations=$(find monkos-ops/ops/sessions monkos-ops/ops/reports monkos-ops/ops/orders \
  -maxdepth 1 -name "*.md" -not -name "README.md" 2>/dev/null)
if [ -n "$violations" ]; then
  echo "❌ 월별 폴더 밖 파일 발견:"
  echo "$violations"
  exit 1
fi
```

**결과**: 발견 시 **error** (exit 1) — push 차단. 루트 배치는 명확한 위반.

**집행하는 법**: ch4 3조(월별 폴더 필수), ch4 4조(루트 배치 금지)

---

## 구현 참고

- `.github/workflows/` 내 기존 파일 구조를 먼저 Read하여 기존 패턴(notify 재사용, 텔레그램 알림 등)을 준용
- 새 워크플로우 신설 시 파일명: `governance-check.yml` 권고
- secret-scan에 합치는 게 더 적절하면 합쳐도 됨 — 판단 위임

---

## 엔드라인

| 항목 | 내용 |
|------|------|
| 포트폴리오 | PF_MONK_OS, PF_CITADEL |
| 마무리 | 커밋+push |
| 산출물 | `.github/workflows/` 수정 또는 신설 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | [log] 태그 커밋 |

## ⚠️ 준수 조항

- C7(내부호칭)은 warning만. push 차단 금지 (의도적 노출 가능성)
- C2(PF 줄수)는 알림만. push 차단 금지 (가이드라인)
- C3(폴더 위반)은 error. push 차단 (명확한 위반)
- 기존 워크플로우 동작에 영향 주지 않도록 주의
