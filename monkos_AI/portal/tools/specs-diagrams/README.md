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
