---
type: completion
date: 2026-07-20
device: iMac
agent: 막내3
portfolio: PF_SPECS
status: 완료
---

# COMPLETION: 도해 생성기 v5 레포 편입 + 경로 파라미터화

> **[2026-07-20 14:50 KST]** iMac/막내3 → 작가님

## 결과

✅ **Task 1** — GCS에서 2종 다운로드 → `portal/tools/specs-diagrams/`
- `gen_brand_diagrams_v5.mjs` (12.0 KiB)
- `gen_reference_diagrams.mjs` (9.6 KiB)

✅ **Task 2** — 경로 파라미터화 4곳 (양 파일 동일 패턴)
- `sharp` import → 상대경로 `../../node_modules/sharp/lib/index.js`
- `SP` → `process.env.SCRATCH || '/tmp/specs-diagrams'`
- `PORTAL` → `path.resolve(import.meta.dirname, '../..')`
- `MASTER` → `process.env.MASTER || '${SP}/prof_master_white.png'`

✅ **Task 3** — README.md 작성 (실행법, 원료 위치, 산출물, 이력)

✅ **Task 4** — 스모크 통과: kr-passport 3장 재생성, 기존 파일과 **바이트 단위 동일**
- ko: 55,098 bytes (0% 차이)
- en: 58,130 bytes (0% 차이)
- ja: 57,146 bytes (0% 차이)

✅ **Task 5** — references.md 도구 맵 갱신
- v5: "GCS tools/ → 레포 편입 예정" → `portal/tools/specs-diagrams/`
- gen_reference_diagrams.mjs 신규 등재

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/tools/specs-diagrams/gen_brand_diagrams_v5.mjs` | 신규 (GCS → 레포 편입 + 경로 파라미터화) |
| `monkos_AI/portal/tools/specs-diagrams/gen_reference_diagrams.mjs` | 신규 (GCS → 레포 편입 + 경로 파라미터화) |
| `monkos_AI/portal/tools/specs-diagrams/README.md` | 신규 |
| `.claude/rules/references.md` | 도구 맵 갱신 (v5 확정 + ref 등재) |

## 준수 조항 이행

- ✅ `portal/public/images/guides/` 기존 이미지 무접촉
- ✅ `portal/lib/cms/components/spec-diagram.js` 무접촉
- ✅ `scripts/d1-migration/generate-guide-images.js` 미삭제
