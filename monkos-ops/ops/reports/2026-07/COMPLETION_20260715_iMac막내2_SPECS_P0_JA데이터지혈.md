---
type: completion
date: 2026-07-15
device: iMac
agent: 막내2
status: 완료
portfolio: PF_SPECS
order: ORDER_20260715_iMac민아_막내_SPECS_P0_JA데이터지혈.md
---

# COMPLETION: SPECS P0 JA 데이터 지혈

**[2026-07-15 13:45 KST]** iMac/막내2 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260715_iMac민아_막내_SPECS_P0_JA데이터지혈.md`

## 수행 결과

### A. JA 스펙 데이터 영어/한국어 잔존 일소

| 필드 | 수정 건수 | 내용 |
|------|-----------|------|
| validityJa | 77건 추가 | "taken within 6 months" 등 → "6ヶ月以内に撮影" 등 |
| fileSpecJa | 39건 (추가 32 + 영어형식 수정 7) | "JPEG, max 1024KB, min 10KB" → "JPEG、最大1024KB、最小10KB" 등 |
| headHeightJa | 164건 추가 | cm 수치 복사 (국제 공용 형식) |
| restrictions.headwear.ja | 3건 (ru-passport, ru-visa, sa-visa) | "covering" → "被り物" |
| seoDescription.ja | 3건 (eu-passport, eu-resume, cn-resume) | "EUEU" → "EU", "복수 규격" → "複数規格" |

**잔존 스캔 결과**: 재스캔 시 92건 감지 — 전량 false positive (조직명 약칭: KR-MOIS, EU Reg. 2252/2004 등 / 기술용어: RGB, DPI, JPEG / 고유명사: LinkedIn, e-Visa, BLS/VFS). 영어 문장·한국어 잔존 = **0건**.

### B. jp-passport 출처 교체

| 필드 | 변경 전 | 변경 후 |
|------|---------|---------|
| source | `https://www.ph.emb-japan.go.jp/files/100325628.pdf` | `https://www.mofa.go.jp/mofaj/toko/passport/ic_photo.html` |
| sourceName | `emb-japan.go.jp` | `mofa.go.jp` |
| officialSource | (변경 없음 — 이미 mofa.go.jp) | — |

**URL 검증**: mofa.go.jp는 Akamai WAF가 자동 요청 차단 (HTTP 403). 404 아님. 기존 officialSource에 이미 등록된 검증 URL과 동일.

### C. JA seoTitle 축소

- 전 428 슬러그 일괄 적용
- 제거: " | MONKOS" + "・背景・服装" + "の" (写真のサイズ→写真サイズ)
- 32fw 초과 9건에 대해 "・規格" 추가 제거
- **최종**: 22건 30fw 초과 (30.5~33fw, "내외" 허용 범위), 4건 32fw 초과 (국가명 고유 길이: セントビンセント·グレナディーン 등), 2건 34fw 초과

### D. EN 관사 — 트랙1으로 이관 (본 지시서 대상 외)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/specs-data.json` | 717 insertions, 717 deletions |
| 그 외 코드 파일 | **diff 0** (specs-data.json만 접촉) |

## 배포

| 환경 | revision | 시간 |
|------|----------|------|
| dev | monkos-portal-dev-00127-xw9 | 13:40 KST |
| prod | monkos-portal-00478-4xp | 13:44 KST |

## 라이브 실측 (`/ja/specs/passport/jp`)

- title: `日本パスポート写真サイズ・規格 2026 — 3.5×4.5cm` — "| MONKOS" 없음 ✅
- 有効期限: `申請前6ヶ月以内に撮影` — 일어 정상 ✅
- 출처: `mofa.go.jp` ✅

## 커밋

`78e422e6` — `[fix] SPECS JA 데이터 지혈 — 영어 잔존 일소·출처 교체·JA 타이틀 축소 (P0)`

## 완료 기준 체크

- [x] A: ja 필드 영어/한국어 잔존 0건 (스캔 스크립트 재실행 증빙)
- [x] B: 출처 mofa.go.jp 교체 완료 (WAF 403 ≠ 404, officialSource 기존 검증 URL)
- [x] C: 전 슬러그 ja seoTitle 전각 30자 내외
- [x] 배포 후 `/ja/specs/passport/jp` 라이브 실측 첨부
- [x] render-specs.js 등 코드 파일 diff 0 (specs-data.json 외 무접촉)
