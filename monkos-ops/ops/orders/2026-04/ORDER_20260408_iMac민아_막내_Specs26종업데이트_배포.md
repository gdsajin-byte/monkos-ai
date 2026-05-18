---
type: ORDER
date: 2026-04-08
from: iMac/민아 → to: iMac/막내
status: 대기
priority: P1
pf: -
---

# 지시서: Specs 26종 업데이트 — 포탈 배포

> **꾸님이 정리한 증명사진 규격 데이터(27종)를 반영.
> specs-data.json은 이미 갱신 완료(7종→26종). 배포만 남은 상태.**

---

## 배경

- 기존 specs 페이지: 한국3 + 일본3 + USA1 = 7종
- 꾸님 레퍼런스: `~/Downloads/Telegram Desktop/monkos_specs_pages_new/`
- 민아가 `specs-data.json`에 19종 추가 완료 (중복 slug 정리 포함)
- SSR 구조이므로 데이터 추가만으로 인덱스+상세+sitemap 자동 반영

## 현재 상태

| 항목 | 상태 |
|------|------|
| `monkos_AI/portal/lib/cms/specs-data.json` | ✅ 26종 갱신 완료 |
| 인덱스 `/specs` | 배포 시 자동 반영 (SSR) |
| 상세 `/specs/{slug}` | 배포 시 자동 반영 (SSR) |
| sitemap.xml | 배포 시 자동 반영 (동적 생성) |
| prod 배포 | ❌ 미반영 |

---

## 1. prod 배포

```bash
cd monkos_AI/portal
gcloud run deploy monkos-portal \
  --project=monkos \
  --region=asia-northeast1 \
  --source=. \
  --allow-unauthenticated
```

## 2. 배포 검증

CDP 또는 curl로 확인:

### 2-1. 인덱스 페이지
```bash
curl -s https://monkos.ai/specs | grep -c "spec"
# 26종 카드가 렌더링되는지 확인
```

- `/specs` → 한국(5) + 일본(5) + USA(2) + 유럽(5) + 기타(9) = 26종 카드
- `/ja/specs` → 일본어 렌더링 확인
- `/en/specs` → 영어 렌더링 확인

### 2-2. 신규 상세 페이지 (샘플 3건)
- `/specs/korea-resident` → "주민등록증" 상세 렌더
- `/specs/eu-passport` → "EU Passport" 상세 렌더
- `/specs/china-passport` → "护照 · 签证" 상세 렌더

### 2-3. sitemap 확인
```bash
curl -s https://monkos.ai/sitemap.xml | grep "specs/" | wc -l
# 26종 × 3언어(ko/ja/en) = 78개 + 인덱스 3개 = 81개 예상
```

## 3. 완료 보고

- 배포 revision 번호
- 인덱스 카드 수 확인 결과
- 신규 상세 페이지 3건 접근 결과
- sitemap specs 항목 수

---

## ⚠️ 준수 조항

- 헌법 제4조 1항: `.env`, secrets 무단 수정 금지
- 헌법 제4조 2항: `--force` 등 파괴적 명령 금지
- 배포 전 `git diff` 확인 → specs-data.json 변경분만 있어야 함
