---
type: report
date: 2026-07-14
device: M1
agent: 민아
portfolio: PF_SPECS, PF_CITADEL, PF_BRIEF
subject: GSC·GA4 최근 동향 분석 + 헤드텀 v2(7/13 prod 00462) 라이브 정합 검증 + 4주 게이트 베이스라인
status: 완료
---

# GSC·GA4 동향 + 헤드텀 v2 정합 검증

**[2026-07-14 11:39 KST]** M1/민아 → 작가님

> 조회 경로: GSC MCP가 M1에서 인증 불가(iMac 경로 하드코딩, PF_BRIEF 4/11 기록 사고) → **yong-a-orchestrator SA 임퍼소네이션 REST 직조회로 우회** (webmasters.readonly + analytics.readonly, gdsajin 로컬 ADC 기반). GA4 property 실측 확인: properties/521406894 (monkos-3c6e4).

---

## 1. GSC 동향 (sc-domain:monkos.ai, 데이터 ~7/12)

### 주간 비교 (7/5~11 vs 6/28~7/4, 톱25 쿼리 기준)
- 클릭 **15 → 23 (+53%)**, 노출 124 → 204 (+65%). 일별 최고 7/8 23클릭.
- 노출 미세 하락 관찰: 7/10 459 → 7/11 397 (일간 변동 범위 내, 관찰만).

### 클릭 엔진 (7/5~11 톱)
| 쿼리 | 클릭 | 노출 | pos |
|---|---|---|---|
| 취업사진 안경 | 6 | 13 | 1.2 |
| ai 증명사진 | 4 | 5 | 16.6 |
| 이력서 사진 안경 | 3 | 10 | 2.8 |
| 남자 취업사진 안경 | 2 | 4 | 1.0 |
| st lucia passport photo size | 1 | 4 | 7.5 |

- **안경 클러스터(vol36)가 클릭 엔진** — pos 1~3 석권, CTR 20~50%.
- 소국 롱테일 실클릭 지속: 세인트루시아·말레이시아 비자(+1c, pos 15) — 428 그물 작동.
- "ai 증명사진" pos 16.6에서도 4클릭 — 구매의도 쿼리, 순위 개선 여지 큼.

## 2. GA4 동향 (property 521406894, ~7/13)

### 세션 추이 — 브리핑 -72% 공포 해소 확정
- 7/10 저점 25 → 7/11 37 → 7/12 37 → **7/13 43 회복**.
- 주간 총합 6/30~7/6 **277** vs 7/7~13 **285** — 보합. 7/03=89는 이례 스파이크(base-effect) 확정. 구조적 붕괴 아님.

### 채널 (7/7~13)
Organic Search 168(59%) / Direct 72(25%) / Organic Social 30(11%) / Referral 10 / Paid 2 / **AI Assistant 1 — GEO 유입 채널 첫 관측** 🎉

## 3. 🔴 핵심 발견 — 결제 관통 계측 갭 (조치 필요)

- **작가님 7/13 실결제 1건(19:02, T1 승격 6단계 검증)이 GA4에 무흔적.**
- 7/13 전체 이벤트 스윕: page_view 53, spec_select 5, generate_click 1, preview_view 1, t1_upsell_click 1, free_generate_* 계측 정상 — **begin_checkout 0, purchase 0. 커머스 이벤트 자체가 결제 경로에서 미발화.**
- begin_checkout은 이벤트명으로 실존(7/07 4건) → 계측 코드는 어딘가 있으나 **T1 토스 결제창 경로(rev 00464)에서 발화 안 됨**. purchase는 전 기간 0.
- 영향: T1 개방 후 전환 퍼널(spec_select→checkout→purchase)이 맹인 상태 — 유입 늘어도 전환율·ROAS 측정 불능.
- 제안: **쌍아 지시서** — server.js 결제 성공 핸들러/success 페이지의 purchase(+begin_checkout) 이벤트 배선 점검·보강. 트래픽 스케일 전 지금이 적기.
- 참고 가설(부차): 내부 트래픽 필터 가능성은 낮음 — 동일 세션대 t1_upsell_click 등 타 이벤트는 잡힘.

## 4. 헤드텀 v2 라이브 정합 검증 (7/13 prod 00462) — ✅ 사실상 전항 통과

| 검증 항목 | 설계(REPORT_20260713 §4) | 라이브 실측 | 판정 |
|---|---|---|---|
| ko title | 규격·규정 2026 + 치수·배경·복장 | "미국 비자 사진 규격·규정 2026 — 5.1 × 5.1cm·배경·복장 \| MONKOS" | ✅ |
| en title | Size & Requirements 2026, US=inch 우선, "US" 표기 | "US Visa Photo Size & Requirements 2026 — 2 × 2 inch (51 × 51mm) \| MONKOS" | ✅ |
| ja title | サイズ 선두·통용 카타카나 | "アメリカビザ写真のサイズ・規格 2026 — …" | ✅ |
| publisher | Monk Studio → MONKOS (ch8) | MONKOS | ✅ |
| dateModified | 동적화 | 2026-07-13 (배포일 반영) | ✅ |
| about.PropertyValue | 수치 기계가독 3종 | photo size/background/head height | ✅ |
| GEO 본문 요약문 | 표 상단 1문장 | "미국 비자 사진 규격은 2 × 2 inch (51 × 51mm), 흰색 배경, 머리 높이 2.2~3.5cm입니다." | ✅ |
| FAQPage + P3 서브텀 | DS-160 등 증보 | us-visa 5문항, DS-160 ko/en 각 4회 | ✅ |
| hreflang/canonical | 유지 | 4태그/2-seg 정본 | ✅ |
| 1-seg 301 | 유지 | korea-passport·by-visa 301 확인 | ✅ |
| CSS 이스케이프 잔재 | \25BE·\1F50D 제거 | 라이브 CSS 0건 | ✅ |

**미세 잔여 2건 (P3급)**: ① en meta description에 "United States" 잔존(title만 US 변환 — desc도 통일 권장) ② ko 페이지 내 단위 목소리 혼재(title cm-우선 vs 본문·구조화 inch-우선 — 설계 §4-4 예문 자체가 inch라 설계 일치이나, 단위 정책 명문화 여지).

## 5. 4주 게이트 베이스라인 (판정일 ~8/10, 민아)

| 게이트 | 7/14 베이스라인 |
|---|---|
| ① en 쿼리→en 페이지 교체 | 침해 잔존 1건: "american passport size"→/specs/passport/us(ko) pos 94, 1imp/28d. 그 외 en 쿼리 대부분 이미 en 페이지 정착 |
| ② ja サイズ 노출 증가 | "韓国ビザ 写真サイズ" 클릭 2 (6/13~7/10 GSC) 외 미미 — 증가분 관측 대상 |
| ③ ko "규정 2026" specs 유입 | "일본 비자 사진 규정 2026" 1c pos 3.9 (blog), specs title 반영은 7/13부터 — 신규 유입 관측 대상 |
| ④ 소국 롱테일 pos 유지 | st lucia 7.5 / malaysia 15 / belarus visa 8.8~12.4 |
| (G5) 1-seg/2-seg 분산 | belarus visa: 1-seg 12imp vs 2-seg 9imp 병존. /specs/korea-passport(1-seg) 222imp 최대 노출 — 301 정상, 재크롤 교체 대기 |

원본 데이터: M1 scratchpad `analysis_20260714.json` (세션 휘발) — 본 문서의 표가 게이트 판정 정본.

## 6. 인프라 부수 발견 (쌍아 지시서 제안 2건)

1. **GSC MCP M1 인증 사고 (PF_BRIEF 4/11 기록건, 3개월 방치)**: `.mcp.json`의 `GOOGLE_APPLICATION_CREDENTIALS`가 iMac 경로(`/Users/jeong-kyushin/...`) 하드코딩 → M1·웹 세션 전부 ENOENT. 임시 우회 = 본 보고서의 SA 임퍼소네이션 직조회. 항구 픽스안: ①`${HOME}` 경로화(환경변수 확장 지원 버전 확인 필요, iMac 영향 검토) ②M1에 `~/.config/gcloud/adc_impersonated.json` 생성(yong-a 임퍼소네이션 래핑 — iMac과 동일 방식).
2. **실측 확인**: gdsajin 계정은 monk-image-engine TokenCreator 부재(PERMISSION_DENIED), **yong-a-orchestrator만 임퍼소네이션 가능**. GSC MCP의 실제 인증 SA = yong-a (SECRET_INVENTORY H섹션 비고 갱신감).
