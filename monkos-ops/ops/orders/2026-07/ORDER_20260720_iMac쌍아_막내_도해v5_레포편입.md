---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_SPECS
---

# 지시서: 도해 생성기 v5 레포 편입 + 경로 파라미터화

> **[2026-07-20 14:41 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 14:41 KST

## 배경

7/11 민아 작성 도해 생성기(gen_brand_diagrams_v5.mjs)가 GCS에만 보관, 레포 미편입. 5/20 구버전(generate-guide-images.js)과 혼동 발생. 도구 생존 3요건(인지·스모크·실패 가시화) 적용 1호.

## Task

### Task 1 — GCS에서 2종 다운로드

```bash
mkdir -p monkos_AI/portal/tools/specs-diagrams
gsutil cp gs://monk-ai-images/assets/specs-guides/tools/gen_brand_diagrams_v5.mjs monkos_AI/portal/tools/specs-diagrams/
gsutil cp gs://monk-ai-images/assets/specs-guides/tools/gen_reference_diagrams.mjs monkos_AI/portal/tools/specs-diagrams/
```

v3/v4는 GCS 이력 보존으로 충분 — 레포 편입 불요.

### Task 2 — 경로 파라미터화 (v5)

`gen_brand_diagrams_v5.mjs` 절대경로 4곳을 상대경로/환경변수로:

1. `sharp` import — portal의 node_modules 상대경로 (`../../node_modules/sharp/lib/index.js`)
2. `SP` (스크래치패드) — `process.env.SCRATCH || '/tmp/specs-diagrams'`
3. `PORTAL` — `path.resolve(import.meta.dirname, '../..')` (portal 루트 자동)
4. `MASTER` — `process.env.MASTER || '${SP}/prof_master_white.png'`

`gen_reference_diagrams.mjs`도 동일 패턴 적용.

### Task 3 — README 작성

`monkos_AI/portal/tools/specs-diagrams/README.md`:

```markdown
# specs 도해 생성기

규격 데이터(specs-data.json) + 마스터 인물 사진 → 전 규격 브랜드 도해 일괄 생성.

## 원료 (레포 외부)

- 마스터 인물: `gs://monk-ai-images/assets/specs-guides/master/prof_master_white.png`
- 국기 202종: `gs://monk-ai-images/assets/specs-guides/flags/`

## 실행

```bash
# 원료 다운로드 (최초 1회)
gsutil cp gs://monk-ai-images/assets/specs-guides/master/prof_master_white.png /tmp/specs-diagrams/
gsutil -m cp -r gs://monk-ai-images/assets/specs-guides/flags/ /tmp/specs-diagrams/flags/

# 전량 생성 (1,278장, ~3분)
node monkos_AI/portal/tools/specs-diagrams/gen_brand_diagrams_v5.mjs

# 특정 슬러그만
node monkos_AI/portal/tools/specs-diagrams/gen_brand_diagrams_v5.mjs kr-passport,us-visa
```

## 산출물

`${SCRATCH}/guides_v5/{slug}_{lang}.webp` → `portal/public/images/guides/`로 복사 후 배포.

## 이력

- v5 (2026-07-11): 현행 정본. 수치 사진 밖·46px 통일·배색 캔버스. 민아 작성.
- v3/v4: GCS tools/ 보존 (레포 미편입)
- generate-guide-images.js (5/20): 구버전 폐기 대상 (scripts/d1-migration/)
```

### Task 4 — 스모크 (도구 3요건 ②)

kr-passport 1장 재생성 → 현행 `portal/public/images/guides/kr-passport_ko.webp`와 파일 사이즈 비교. ±5% 이내면 통과.

```bash
SCRATCH=/tmp/specs-diagrams
mkdir -p $SCRATCH
gsutil cp gs://monk-ai-images/assets/specs-guides/master/prof_master_white.png $SCRATCH/
mkdir -p $SCRATCH/flags && gsutil cp gs://monk-ai-images/assets/specs-guides/flags/kr.png $SCRATCH/flags/
node monkos_AI/portal/tools/specs-diagrams/gen_brand_diagrams_v5.mjs kr-passport
```

### Task 5 — references.md 도구 맵 갱신 (도구 3요건 ①)

`gen_brand_diagrams_v5.mjs`의 위치를 "레포 편입 예정" → 확정 경로로 갱신:

현재: `GCS tools/ → 레포 편입 예정: portal/tools/specs-diagrams/`
변경: `portal/tools/specs-diagrams/`

## ⚠️ 준수 조항

- `portal/public/images/guides/` 기존 이미지 무접촉 (이번은 편입만, 재생성 배포 아님)
- `portal/lib/cms/components/spec-diagram.js` (SSR 컴포넌트) 무접촉
- 5/20 `scripts/d1-migration/generate-guide-images.js`는 이번 미삭제 (폐기는 별건)

## 완료 기준

- [ ] 2종 GCS 다운로드 → portal/tools/specs-diagrams/
- [ ] 경로 파라미터화 4곳 (v5) + gen_reference 동일
- [ ] README.md 작성
- [ ] 스모크 1슬러그 재생성, 사이즈 비교 보고
- [ ] references.md 도구 맵 갱신
- [ ] COMPLETION 보고서 + 세션 로그 + PF_SPECS 어펜드 + 커밋 + 푸시
