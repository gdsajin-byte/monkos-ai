---
type: portfolio
id: PF_IDPHOTO
name: "IDPHOTO"
subject: "MONKOS AI 증명사진 — 독립 iOS/Web 앱으로 AI 생성 증명사진 서비스"
created: 2026-01-11
owner: 작가님
leads: "쌍아(설계), 막내(실행)"
status: active
---

# PF_IDPHOTO — MONKOS AI 증명사진 서비스

> **PF_PHOTOPRO**(AI 증명사진 웹 서비스)를 승격. AI 기반 증명사진 생성 서비스의 정본 PF.
> Image Pro MVP(01/11) → idphoto-kr/jp(01/16) → 결제 퍼널 v5(03/05) → 운영+진단(04/11) → 결제 구조 개편+독립 iOS 앱(05/18~).
>
> ⚠️ **IDPASS(크롭앱)는 별도 PF** → [PF_CROP](../PF_CROP/README.md). 본 PF는 AI 증명사진 **생성** 서비스 전용.

---

## 앱 구조 (독립 앱 3개)

| 앱 | 성격 | PF |
|---|------|-----|
| **IDPASS** | 크롭 전용 무료앱 | **PF_CROP** (별도) |
| **AI 증명사진 앱** | AI 증명사진 생성 유료앱 | **PF_IDPHOTO** (본 PF) |
| **프로필 앱** | AI 프로필 사진 생성 | 추후 |

---

## 1. 비전

**"AI로 누구나 전문가 수준의 증명사진을 30초 안에 완성 — $1.99/컷"**

### 포지셔닝

| 구분 | 경쟁사 | MONKOS |
|------|--------|--------|
| AI 생성 | $2.33~$13.95/컷 | **$1.99/컷** (시장 중앙값 $2.33 이하) |
| 서버 의존 | 사진 업로드 필수 | 웹: Vertex AI / iOS: 온디바이스 Vision 활용 |
| 규격 커버 | 5~200국 | 26국+ 검증 완료 |

### 수익 구조

```
AI 증명사진 앱 (독립 iOS 앱)        웹 서비스 (idphoto-kr/jp)
 ├─ StoreKit 2 IAP $1.99/컷         ├─ 웹 크레딧 충전 (20% 보너스, 수수료 3~5%)
 ├─ 첫 체험 $1 단건 (계정 불필요)     ├─ 토스 결제
 └─ Sign in with Apple/Google       └─ LemonSqueezy (글로벌)
```

### 성공 지표

| 지표 | 시작점 | 목표 |
|------|--------|------|
| 결제 전환율 | 0% (5/18 현재) | 3%+ (12주) |
| 일일 AI 생성 수 | 0건 | 50건+ |
| 컷당 매출 | ₩0 | $1.99 (₩2,750) |

### 서비스 목표 (미구현 — 10-28 헌법 4조 5항 삭제로 이관)

본인인증 · 실시간 촬영 · 윤리적 보정. 구현 시 해당 서비스 규칙·약관으로 정한다(PETITION_20261028 K2). 데이터보호는 법률 ch4 8조, 정체성은 헌법 1조 3항·ch2 8조.

---

## 2. 히스토리

> **append only. 수정·삭제 금지.** PF_PHOTOPRO 히스토리를 계승.

### Phase 0 — Image Pro MVP (01/11~01/16)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 01/11 | 작가님+쌍아 | Image Pro MVP 착수 | `a08f5ff` | ✅ |
| 01/16 | 막내 | idphoto-kr 증명사진 MVP 완성 (7커밋) | `b2e7b26` | ✅ |
| 10/23 | iMac/쌍아 | **PROPOSAL** 보정 적정성 판정기 — 원본 대비 이탈 5축 + 작가님 눈 선호 모델 + 판단·번역·입담 3층(부록: 바둑 해설 봇 연구 시드) | [PROPOSAL_20261023_iMac쌍아_IDPHOTO_보정적정성판정기](../../proposals/PROPOSAL_20261023_iMac쌍아_IDPHOTO_보정적정성판정기.md) | ⏳ |
| 10/28 | ?/? | **ORDER** 인헨즈·증명한컷·해외 증명사진 서비스 탐색 → MONKOS 증명사진관 허브 페이지 기획안 | [ORDER_20261028_iMac쌍아_막내3_IDPHOTO_경쟁탐색_증명사진관허브_기획안](../../orders/2026-10/ORDER_20261028_iMac쌍아_막내3_IDPHOTO_경쟁탐색_증명사진관허브_기획안.md) | ⏳ |
| 10/28 | iMac/막내3 | **REPORT** 증명사진 경쟁 탐색 — 국내 AI 3 · 실물 1 · 해외 4 · 우리 현행 3 | [REPORT_20261028_iMac막내3_증명사진_경쟁탐색](../../reports/2026-10/REPORT_20261028_iMac막내3_증명사진_경쟁탐색.md) | 📁 |
| 10/28 | iMac/막내3 | **PROPOSAL** MONKOS 증명사진관 허브 페이지 기획안 — 소소(디자인 TF) 시험 가동 브리프 | [PROPOSAL_20261028_iMac막내3_증명사진관허브_기획안](../../proposals/PROPOSAL_20261028_iMac막내3_증명사진관허브_기획안.md) | ⏳ |
| 10/28 | iMac/막내3 | **COMPLETION** 증명사진 경쟁 탐색 + 증명사진관 허브 기획안 (소소 브리프) | [COMPLETION_20261028_iMac쌍아-막내3_IDPHOTO_경쟁탐색_허브기획안](../../reports/2026-10/COMPLETION_20261028_iMac쌍아-막내3_IDPHOTO_경쟁탐색_허브기획안.md) | ✅ |
| 11/02 | iMac/민아 | 미국 비자 입력 사진 포맷 부족 판정·메시지 체계 제안 (민아) — 규격 숫자화·2단 판정·제출용 JPEG. 현행: 저해상도 무경고 확대 + us-visa 산출물 PNG. 결정 4건 대기 | [PROPOSAL_20261102_iMac민아_IDPHOTO_미국비자_입력포맷_판정메시지](../../proposals/PROPOSAL_20261102_iMac민아_IDPHOTO_미국비자_입력포맷_판정메시지.md) | ✅ |
| 11/02 | ?/? | **ORDER** 미국 비자(us-visa) 입력 해상도 판정 1단계 — fileRules 숫자화 + 서버 precheck 크롭 해상도 추정 + low_res 메시지 4언어, dev 검증까지 | [ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_입력해상도판정_1단계](../../orders/2026-11/ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_입력해상도판정_1단계.md) | ⏳ |
| 11/02 | ?/? | **ORDER** 한국 여권 두상 잘림 — 매팅 결과에서 머리끝 실측 후 프레임 재배치(헤어 가드 실경로 복원), dev 비교 검증까지 | [ORDER_20261102_iMac쌍아_막내_IDPHOTO_한국여권_머리끝실측_프레임재배치](../../orders/2026-11/ORDER_20261102_iMac쌍아_막내_IDPHOTO_한국여권_머리끝실측_프레임재배치.md) | ⏳ |
| 11/02 | ?/? | **ORDER** 미국 비자 여백 — fit 프레임의 원본 이탈량(상하좌우) 판정 + "더 멀리서·어깨까지" 안내, dev 검증까지 | [ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_화각부족판정](../../orders/2026-11/ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_화각부족판정.md) | ⏳ |
| 11/02 | iMac/쌍아-막내3 | **COMPLETION** COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_미국비자_화각부족판정 | [COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_미국비자_화각부족판정](../../reports/2026-11/COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_미국비자_화각부족판정.md) | ✅ |
| 11/02 | ?/? | **ORDER** precheck 정수리 잘림 게이트 — 추정(눈~박스 미러) 판정 폐지, 매팅 알파 실측으로 전환. 실제로 잘린 사진에만 "정수리가 잘렸어요" 표시, dev 검증까지 | [ORDER_20261102_iMac쌍아_막내3_IDPHOTO_정수리게이트_실측전환](../../orders/2026-11/ORDER_20261102_iMac쌍아_막내3_IDPHOTO_정수리게이트_실측전환.md) | ⏳ |
| 11/02 | iMac/쌍아 | **DESIGN** DESIGN_20261102_IDPHOTO_추천화각_레퍼런스_경고 | [DESIGN_20261102_IDPHOTO_추천화각_레퍼런스_경고](../../../tech/designs/2026-11/DESIGN_20261102_IDPHOTO_추천화각_레퍼런스_경고.md) | ⏳ |
| 11/02 | ?/? | **ORDER** 업로드 화면 추천 화각 레퍼런스 — specs 대표 여성 마스터 + 추천 범위(초록 점선)·규격 잘림 범위(흰 실선) 오버레이, dev까지 | [ORDER_20261102_iMac쌍아_막내4_IDPHOTO_추천화각_레퍼런스안내](../../orders/2026-11/ORDER_20261102_iMac쌍아_막내4_IDPHOTO_추천화각_레퍼런스안내.md) | ⏳ |
| 11/02 | iMac/쌍아-막내3 | **COMPLETION** COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_정수리게이트_실측전환 | [COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_정수리게이트_실측전환](../../reports/2026-11/COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_정수리게이트_실측전환.md) | ✅ |
| 11/02 | iMac/쌍아-막내4 | 업로드 전 추천 화각 레퍼런스(설계 §5-4) 구현·dev 00217-bwt 검증, prod·엣지 미배포 | `monkos-ops/ops/reports/2026-11/COMPLETION_20261102_iMac쌍아-막내4_IDPHOTO_추천화각_레퍼런스안내.md` | ✅ |
| 11/02 | iMac/민아 | 미국 비자 AI 유도·dev 결제 진입 실패 파악 보고 — 카드사 미선택 사전 유도(A-1)·AI 문구 일치 확인·[dev] 접두(C-1)·dev grant(D-1) 제안, 코드 수정 0 | [REPORT_20261102_iMac민아_IDPHOTO_미국비자_AI유도_결제진입_파악](../../reports/2026-11/REPORT_20261102_iMac민아_IDPHOTO_미국비자_AI유도_결제진입_파악.md) | ✅ |
| 11/02 | iMac/쌍아-막내3 | **COMPLETION** COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_화각판정_일반화 | [COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_화각판정_일반화](../../reports/2026-11/COMPLETION_20261102_iMac쌍아-막내3_IDPHOTO_화각판정_일반화.md) | ✅ |
| 11/02 | iMac/쌍아 | **PROPOSAL** PROPOSAL_20261102_iMac쌍아_IDPHOTO_결제표면_후속_최종안 | [PROPOSAL_20261102_iMac쌍아_IDPHOTO_결제표면_후속_최종안](../../proposals/PROPOSAL_20261102_iMac쌍아_IDPHOTO_결제표면_후속_최종안.md) | ⏳ |
| 11/03 | iMac/쌍아 | 용아(Antigravity agy, 구독) 결제 표면 최종안 검토 — 보정 4건(②버튼 실제 비활성·위젯 보관 ③아기 기본 의상 정장 폴백 버그 ④status 폴링 가드·dev-grant requireAdmin) 최종안 §5 반영 | [REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안](../../reports/2026-11/REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안.md) | ✅ |
| 11/03 | iMac/쌍아 | 결제 표면 ①+④ 지시 — 막내3 (dev 알림 태그·dev-grant·prod 거부 가드 3곳) | [ORDER_20261103_iMac쌍아_막내3_IDPHOTO_dev알림태그_에이전트결제검증](../../orders/2026-11/ORDER_20261103_iMac쌍아_막내3_IDPHOTO_dev알림태그_에이전트결제검증.md) | ✅ |
| 11/03 | iMac/쌍아 | 결제 표면 ② 지시 — 막내5 재배정 (카드사 미선택 버튼 비활성, specs·헤드샷 공용) | [ORDER_20261103_iMac쌍아_막내4_IDPHOTO_카드사선택_사전안내_헤드샷포함](../../orders/2026-11/ORDER_20261103_iMac쌍아_막내4_IDPHOTO_카드사선택_사전안내_헤드샷포함.md) | ✅ |
| 11/03 | iMac/쌍아 | 결제 표면 ③ 지시 — 막내6 재배정 (업셀 문구·의상 기본값 성인/아기·아기 정장 폴백 버그) | [ORDER_20261103_iMac쌍아_막내2_IDPHOTO_업셀문구_의상기본값_아기분기](../../orders/2026-11/ORDER_20261103_iMac쌍아_막내2_IDPHOTO_업셀문구_의상기본값_아기분기.md) | ✅ |
| 11/03 | iMac/쌍아-막내6 | **COMPLETION** COMPLETION_20261103_iMac쌍아-막내6_IDPHOTO_업셀문구_의상기본값 | [COMPLETION_20261103_iMac쌍아-막내6_IDPHOTO_업셀문구_의상기본값](../../reports/2026-11/COMPLETION_20261103_iMac쌍아-막내6_IDPHOTO_업셀문구_의상기본값.md) | ✅ |
| 11/03 | iMac/쌍아-막내3 | **COMPLETION** COMPLETION_20261103_iMac쌍아-막내3_IDPHOTO_dev알림_에이전트결제검증 | [COMPLETION_20261103_iMac쌍아-막내3_IDPHOTO_dev알림_에이전트결제검증](../../reports/2026-11/COMPLETION_20261103_iMac쌍아-막내3_IDPHOTO_dev알림_에이전트결제검증.md) | ✅ |
| 11/03 | iMac/쌍아-막내5 | **COMPLETION** COMPLETION_20261103_iMac쌍아-막내5_IDPHOTO_카드사선택_사전안내 | [COMPLETION_20261103_iMac쌍아-막내5_IDPHOTO_카드사선택_사전안내](../../reports/2026-11/COMPLETION_20261103_iMac쌍아-막내5_IDPHOTO_카드사선택_사전안내.md) | ✅ |
| 11/03 | iMac/쌍아 | 결제 표면 후속 ①~④ prod 00575-n66 + 엣지 배포(쌍아, 작가님 04:53 승인) — 카드사 미선택 버튼 가드·업셀 문구·아기 의상 기본값·dev 알림 태그·dev-grant(prod 404) | — | ✅ |
| 11/03 | iMac/쌍아 | 여권 머리끝 보완 지시 — 막내7 (눈 48% 상한·여백 0.5mm·업로드 직후 판정·초과 시 AI 유도, 작가님 05:15 승인) | [ORDER_20261103_iMac쌍아_막내7_IDPHOTO_여권머리끝_눈48상한_업로드직후판정](../../orders/2026-11/ORDER_20261103_iMac쌍아_막내7_IDPHOTO_여권머리끝_눈48상한_업로드직후판정.md) | ✅ |
| 11/03 | iMac/쌍아-막내7 | **COMPLETION** COMPLETION_20261103_iMac쌍아-막내7_IDPHOTO_여권머리끝_눈48상한 | [COMPLETION_20261103_iMac쌍아-막내7_IDPHOTO_여권머리끝_눈48상한](../../reports/2026-11/COMPLETION_20261103_iMac쌍아-막내7_IDPHOTO_여권머리끝_눈48상한.md) | ✅ |
| 11/03 | iMac/쌍아 | 여권 머리끝 눈 48% 상한·업로드 직후 판정 prod 배포 — portal 00576-7zf + edge bf22ea10 (작가님 배포 승인) | — | ✅ |
| 11/03 | iMac/쌍아 | **DESIGN** 사진 판별 시스템 학습 로드맵 — 사진관 원본·출고본 아카이브를 정답지로, 규격·동일인·과보정·컷 선택을 판정하는 소형 모델(0.005~0.1B) + 코드 게이트 | [DESIGN_20261103_IDPHOTO_사진판별시스템_학습로드맵](../../../tech/designs/2026-11/DESIGN_20261103_IDPHOTO_사진판별시스템_학습로드맵.md) | ⏳ |
| 11/04 | iMac/민아 | **REPORT** 여권 화각 "머리 여백 부족" 오판 — 레퍼런스 산식과 제품 산식의 두상 정의 분기 추적 | [REPORT_20261104_iMac민아_IDPHOTO_여권화각_두상정의_분기](../../reports/2026-11/REPORT_20261104_iMac민아_IDPHOTO_여권화각_두상정의_분기.md) | 📁 |
| 11/04 | ?/? | **ORDER** kr·jp 여권 두상을 실측 머리끝(머리 덩어리 기준) 기준 33mm로 재배율 — 업로드 직후 판정, 레퍼런스 도안 33mm 통일, head_margin 문구 교정, dev까지 | [ORDER_20261104_iMac쌍아_막내1_IDPHOTO_여권두상_실측머리끝_33mm재배율](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내1_IDPHOTO_여권두상_실측머리끝_33mm재배율.md) | ⏳ |
| 11/04 | iMac/쌍아-막내1 | **COMPLETION** COMPLETION_20261104_iMac쌍아-막내1_IDPHOTO_여권두상_33mm재배율 | [COMPLETION_20261104_iMac쌍아-막내1_IDPHOTO_여권두상_33mm재배율](../../reports/2026-11/COMPLETION_20261104_iMac쌍아-막내1_IDPHOTO_여권두상_33mm재배율.md) | ✅ |
| 11/04 | iMac/민아 | 여권 두상 실측 머리끝 33mm 재배율 prod 배포 — portal 00578-lzc + 엣지 5a3ad8f1, 라이브 2회 히트 kr·jp 신문구 1/구문구 0, prod precheck jemison moved (작가님 15:30 배포 승인, 민아 실행) | — | 배포 |
| 11/04 | ?/? | **ORDER** 꾸 맥북 셀렉 기록기 1단계 — 캡처원 잔존 촬영본(10-14 이후 ≈890컷) 512px 축소본 + 셀렉 정답(시놀로지 파일명 대조) + 별점·색태그 기록을 시놀로지 _select_dataset에 회수, 반복 실행 가능한 스크립트까지 | [ORDER_20261104_iMac쌍아_막내4_IDPHOTO_맥북셀렉기록기_1차회수](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내4_IDPHOTO_맥북셀렉기록기_1차회수.md) | ⏳ |
| 11/04 | iMac/쌍아-막내4 | 맥북 셀렉 기록기 1차 회수 — 913컷(10-14~11-04) 512px 축소본+셀렉 정답 매니페스트(시놀로지 _select_dataset), 셀렉 86·폴더 매칭 66/66, 증명 묶음 중앙값 10, 꾸 red 76 중 74 셀렉 | [COMPLETION_20261104_iMac쌍아-막내4_IDPHOTO_맥북셀렉기록기](../../reports/2026-11/COMPLETION_20261104_iMac쌍아-막내4_IDPHOTO_맥북셀렉기록기.md) | ✅ |
| 11/04 | ?/? | **ORDER** 사진 판별 P0 마무리 — 시놀로지 아카이브 매니페스트 생성기(가명화) + .xmp 크롭 필드 확인 10건 + 규격 완성본 50쌍 정합 시험 + 건대(2023) 분류 규칙 → P0 게이트 판정 자료 | [ORDER_20261104_iMac쌍아_막내5_IDPHOTO_사진판별P0마무리](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내5_IDPHOTO_사진판별P0마무리.md) | ⏳ |
| 11/04 | iMac/쌍아-막내5 | 사진 판별 P0 마무리 — 매니페스트 v0(7,160고객·짝 6,303), 하남 정합 47/50(94%, p50 2.8px), 건대 정합 10/10, xmp 크롭=마스터 프레임(하남 짝 79%) → 게이트 판정 쌍아 | [COMPLETION_20261104_iMac쌍아-막내5_IDPHOTO_사진판별P0](../../reports/2026-11/COMPLETION_20261104_iMac쌍아-막내5_IDPHOTO_사진판별P0.md) | ✅ |
| 11/04 | ?/? | **ORDER** 여권 화각 실측 대조 1차 — 오늘 prod 반영한 두상 재배율 산식(00578)을 사진관 여권 출고본 200건과 로컬에서 비교(두상 mm·눈 %·머리 위 여백·턱 아래), 고객 픽셀 외부 반출 0 | [ORDER_20261104_iMac쌍아_막내7_IDPHOTO_여권화각_출고본대조](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내7_IDPHOTO_여권화각_출고본대조.md) | ⏳ |
| 11/04 | iMac/쌍아-막내7 | 여권 화각 산식 vs 출고본 200건 대조 — no_room 5건(전부 face_min), 산식 틀이 출고보다 1.17mm 아래(눈 43 vs 45.7%), 출고 거울상<32mm 26% | [COMPLETION_20261104_iMac쌍아-막내7_IDPHOTO_여권화각_출고본대조](../../reports/2026-11/COMPLETION_20261104_iMac쌍아-막내7_IDPHOTO_여권화각_출고본대조.md) | ✅ |
| 11/04 | ?/? | **ORDER** 여권 화각 실무 정합 — 눈 앵커 43→45%, 규정 두상 32~36을 실측 두상(덩어리 머리끝)에 적용, 거울상 얼굴 하한은 별도 상수 30mm로 분리 — 출고본 200건 재대조·dev까지 | [ORDER_20261104_iMac쌍아_막내8_IDPHOTO_여권화각_실무정합](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내8_IDPHOTO_여권화각_실무정합.md) | ⏳ |
| 11/04 | iMac/쌍아-막내8 | 여권 화각 실무 정합 — 눈 45%·규정 두상=실측 32~36·거울상 하한 30 분리, 200건 재대조 세로 위치 차 1.17→0.34mm·no_room 5→2(충돌), dev 00238-mjc | [COMPLETION_20261104_iMac쌍아-막내8_IDPHOTO_여권화각_실무정합](../../reports/2026-11/COMPLETION_20261104_iMac쌍아-막내8_IDPHOTO_여권화각_실무정합.md) | ✅ |
| 11/04 | ?/? | **ORDER** 유료 T1 출고 크롭 눈 위치를 무료(45%)와 정합 — 포털이 crop-spec 요청 spec에 eyeAnchor를 싣고, crop-engine은 선택 파라미터로 수용(기본 0.43/0.42 불변). kr·jp 여권만. dev까지 | [ORDER_20261104_iMac쌍아_막내8_IDPHOTO_유료크롭_눈45정합](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내8_IDPHOTO_유료크롭_눈45정합.md) | ⏳ |
| 11/04 | iMac/쌍아-막내8 | 유료 크롭 눈 45% 정합(A′) — 포털 eyeAnchor 합성·crop-engine 선택 파라미터, 200건 시뮬 유료−무료 세로 차 0.82→0.07mm, dev 부재로 로컬 종단 대체 | [COMPLETION_20261104_iMac쌍아-막내8_IDPHOTO_유료크롭_눈45정합](../../reports/2026-11/COMPLETION_20261104_iMac쌍아-막내8_IDPHOTO_유료크롭_눈45정합.md) | ✅ |
| 11/05 | ?/? | **ORDER** 생성 기록(generations)에 테스트 딱지 — 저장 시 originService·isTest 필드를 남기고, 어드민 생성 검토 화면에 '테스트' 배지와 기본 숨김 필터를 둔다. dev까지 | [ORDER_20261105_iMac쌍아_막내8_IDPHOTO_생성기록_테스트딱지](../../orders/2026-11/ORDER_20261105_iMac쌍아_막내8_IDPHOTO_생성기록_테스트딱지.md) | ⏳ |

### Phase 1 — idphoto-kr/jp 웹 서비스 (01/16~02/14)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 02/01~14 | 막내 | idphoto-jp 일본 서비스 배포 + LINE LIFF 통합 | `637916f`, `b348194` | ✅ |
| 02/12~15 | 막내 | QC 강화 — 성별/연령 일치 검증 KR/JP | `0cd2268` | ✅ |

### Phase 2 — 이관 + 결제 퍼널 v5 (02/26~03/05)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 02/26~28 | 막내 | image.monkos.ai 이관 Phase 1~3 | `3f18774`~`9712bc5` | ✅ |
| 03/01~05 | 막내 | 결제 퍼널 v5 전환 (Wave 1~3) | `94b334b`~`385f556` | ✅ |
| 03/06~07 | 막내 | 촬영실 UI 리디자인 + 코칭 모드 | — | ✅ |

### Phase 3 — 운영 + 진단 (03~04)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/06~10 | 막내 | 일본 전면 현지화 (결제/법적/UX) | — | ⏳ |
| 04/11 | 쌍아+민아+막내 | **P0 전팀 진단 — "500 클릭 0 결제"** 3축 교차 (Firestore 전수+CDP 17장+경쟁사 18장) | 보고서 4건 | ✅ |
| 04/11 | 쌍아 | **결정적 발견**: 286 sitemap URL → Google 색인 1개 (0.35%). CSR + 표준 메타 부재 = SEO 사각지대 | REPORT | 🚨 |
| 04/11 | 작가님 | **광고는 오가닉 부스터** — 광고비가 오가닉 시그널로 축적되어야 의미 | — | ✅ |

### Phase 4 — 가격조사 + 전환 전략 수립 (05/18)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 05/18 | 막내1 | AI 증명사진 서비스 글로벌 전수조사 (47개 서비스, 컷당 단가) | [REPORT](../../sessions/2026-05/REPORT_20260518_막내1_AI증명사진_가격전수조사.md) | ✅ |
| 05/18 | 막내3 | 증명앱 iOS 전환 난이도 분석 | [REPORT](../../sessions/2026-05/REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md) | ✅ |
| 05/18 | 막내2 | Gemini 모델 마이그레이션 조사 + 2.0→2.5 실행 | REPORT×2 | ✅ |
| **05/18** | **쌍아** | **PF_PHOTOPRO → PF_IDPHOTO 승격** | 본 문서 | ✅ |
| 05/18 | 쌍아 | **idphoto-kr PRECHECK 2.0-flash 롤백** — 2.5-flash 엄격 이슈로 사전분석 모델을 2.0으로 환원 (`ce34b4ec`) | server.js | ⚠️ |
| 06/02 | 막내1 | **[검증] PF 현행성 검증** — Track A "✅ 완료" 표기가 KR 롤백 미반영 발견. 코드 실측: KR precheck=2.0(롤백), JP precheck=2.5(정상), KR/JP Live=2.0(미전환). Phase 현황·리스크 현행화 | 광역오더 #1 | ✅ |
| 06/02 | 막내1 | **Gemini 2.0→2.5 긴급 전환** — KR precheck `gemini-2.5-flash`(fallback `2.5-flash-lite`) + 프롬프트 완화(엄격 이슈 방지: 체크 4항목 축소, "AI 입력 원본" 문맥). KR/JP Live `gemini-2.5-flash`. KR prod 배포 rev 00190-8sk. 헬스체크 확인 | `8e5b890e`, deploy.sh prod | ✅ |
| 06/02 | 막내1 | **🔴 INCIDENT: idphoto-jp 오배포** — rev 00116에서 kr 코드가 jp로 서빙됨(deploy.sh가 CWD 미고정 + 잘못된 디렉토리에서 실행). 일본 손님에게 한국어+한국규격 제공. 13:19~13:54 약 35분 장애 | rev 00116-4jc | 🔴 |
| 06/02 | 막내1 | **INCIDENT 복구** — `cd idphoto-jp` 후 `./deploy.sh prod` 재실행. rev 00117-j7s, 100% 트래픽. `service: "monkos-idphoto-jp"` + 일본 규격(`証明写真`/`コーチング`) 확인. 원인: deploy.sh CWD 미고정 | deploy.sh prod | ✅ |
| 06/05 | 막내3 | **[INCIDENT] OAuth 게시 진단** — image_pro 정적앱은 OAuth 미사용(Gemini API키+CloudRun `image.monkos.ai`) 확정. 동의화면 "MONKOS IMAGE pro" 출처=AI Studio/PWA 빌드앱(proj monkos). 게시상태 gcloud 미노출→Console 확인 필요. 처방=Testing→Production 게시(승인 게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내3_OAuth게시.md) | ⏳ 승인대기 |
| 06/05 | 막내2 | **[INCIDENT P0] Gemini 라이브 장애 진단** — 근본원인=**AI Studio 선결제 크레딧 소진(429 RESOURCE_EXHAUSTED)**, 키 삭제 무관. GEMINI_API_KEY=살아있는 MONKOS NEW(fp 대조 일치), gemini-3·2.5 둘다 429. 복구=작가님 콘솔 빌링 충전(undelete/키교체/재배포 무의미). 4기능(KR/JP생성·image_pro·translate) 단일키 SPOF | [REPORT](../../reports/2026-06/REPORT_20260605_막내2_GeminiKEY진단복구.md) | ⏳ 승인대기 |
| 06/05 | 막내2 | **[INCIDENT P0] AI Studio 결제 복구 — 지갑 경계 실측 확정** — ⭐Vertex AI(ADC)=200 정상 vs AI Studio(API키)=429. 두 지갑 분리: GCP크레딧(ANNUAL24%)은 Vertex로 살아있고 AI Studio prepay만 0. 429에 QuotaFailure 부재→rate cap 아님(spending limit 가설 소거). 생성코어 gemini-3-pro-image=Vertex 404→AI Studio 결제 불가피. Path B(번역·분석 Vertex 부분복구) 가능 | [REPORT](../../reports/2026-06/REPORT_20260605_막내2_AIStudio결제복구.md) | ⏳ 결제대기 |
| 06/05 | 막내1 | **[SECURITY] monkosimagepro 유출키 공격 포렌식** — raw 실측(Monitoring request_count + DeleteKey audit). 유출키=5759b56b(6/2 13:19 삭제), 5/31~6/2 ListModels 프로빙(98/97/76·403·대만리전)→삭제후 UNKNOWN 400 지속(6/3~5 일94). **공격 전건 차단·도용성공 0·비용기여 0**. ⭐429장애=유출과 무관(6/5 정상키 MONKOS NEW 8건=크레딧소진, 막내2진단 일치). 방어=키노출점검+6/19 application restriction(승인게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내1_유출공격분석.md) | ⏳ 승인대기 |
| 06/05 | 막내2 | **[INCIDENT P0] 코칭 Gemini Live 복구** — 원인=6/2 `8e5b890e`가 `ai.live.connect` 모델을 일반모델 gemini-2.5-flash로 오변경(Live 미작동). 실측(round-trip RESP_OK)으로 `gemini-2.0-flash-live-preview-04-09` 생존 확인→롤백(2.5 라이브 회피, precheck/generateContent 보존). 코칭=Vertex ADC(결제 무관). KR rev00191/JP rev00118 prod 배포, 배포 모델 RESP_OK 검증 | [REPORT](../../reports/2026-06/REPORT_20260605_막내2_코칭Live복구.md) | ✅ |
| 06/05 | 막내3 | **[INCIDENT P0] image_pro git 포렌식** — ⭐**코드변경 무관** 확정: 백엔드 `apps/monk_imagen4/backend/server.js` 마지막 수정 3/01·운영 리비전 00022 **3/30 배포**, 6/2 EOL마이그(8e5b890e)·키삭제 미접촉. 실제 장애=`/generate`의 **Vertex `imagen-4.0-ultra`만 RESOURCE_EXHAUSTED "out of capacity"**(6/05오전 onset, HTTP500). `fast`·`/refine`·`/health` 정상. 막내2 AI Studio크레딧건과 경로 분리. 권고=ultra→fast폴백+backoff+Vertex쿼터(승인게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내3_imagePro_변경추적.md) | ⏳ 승인대기 |
| 06/05 | 막내3 | **[INCIDENT P0] image_pro 일러스트 편향 3대가설 검증** — ⭐원인=**enhancePrompt:false 미적용**. 3/31 P0권고가 `git -S` 상 server.js 역사상 0건(미반영, "리그레션" 아닌 처음부터 미적용)→Vertex 기본값(Google인정 리그레션) 작동. 가설B(Google저하)=미확인(deprecation 6/24 미래), 가설C(키삭제/세이프티)=반박(세이프티는 완전거부·/generate는 Vertex ADC). 라이브 A/B는 코드 enhancePrompt 미수신이라 불가. 권고=enhancePrompt:false 머지+photoreal프리픽스(승인게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내3_imagePro_일러스트편향.md) | ⏳ 승인대기 |
| 06/12 | 민아 | **퍼널 정밀진단 + GA4 센서 설계서** — GA4(521406894) 실측: 생성/프리뷰/결제 센서 전무(sign_up만 17), 방문→가입 1.1%(1,535→17). 7종 이벤트(spec_select/photo_upload/sign_up/generate_click/preview_view/begin_checkout/purchase)+파라미터 4종 설계. CDP 9223 프리뷰 실측: 누수①=로그인 장벽(체험 전 OAuth 강제→처방 IDPASS 구조), 누수②=정체성 90/10 의도설계 학습 후 "정체성 미달" 판정 철회→가격/구조로 재고(begin_checkout→purchase 측정). 쌍아 막내 지시서 전환 대기 | [DESIGN](monkos-ops/tech/designs/2026-06/DESIGN_20260612_GA4퍼널센서_스키마.md) | ⏳ 지시서대기 |
| 06/14 | 민아 | **GA4 센서 작동검증 + 측정ID 교차오염 감사** — playwright prod 실측: ✅ page_view·spec_select collect 204 발화 정상(파라미터 spec_type=passport·lang·service 정확). 🔴 **측정ID 교차오염** 발견: KR/JP 25개 HTML 전부 G-FKG0CPTC14+G-JPZWSJ3323 이중 config → 전 이벤트 양 속성 혼입. 원인 3개월전(`3a69f239` 3/13 KR에 JP ID 복붙 + `def0074a` KR ID 추가 시 미제거), 어제 센서작업 무관. 🟡 purchase value:0 하드코딩. 즉시수정 보류·쌍아 재검토→막내 실행 경로 | [REPORT](../../reports/2026-06/REPORT_20260614_iMac민아_IDPHOTO_GA4측정ID교차오염_감사.md) | ⏳ 쌍아재검토 |
| 06/14 | 막내2 | **GA4 측정ID 교차오염 수정** — KR 12개 HTML `G-FKG0CPTC14` 단일화 + JP 18개 HTML `G-JPZWSJ3323` 단일화. 양쪽 prod 배포(rev 00196-f6p / 00121-xh4). playwright 실측: KR tid=KR only, JP tid=JP only 확인. 3개월간 이중전송 해소 | [COMPLETION](../../reports/2026-06/COMPLETION_20260614_iMac막내2_IDPHOTO_GA4측정ID분리.md) | ✅ |

### Phase 5 — 독립 iOS 네이티브 증명사진 앱 + 결제 개편 (05/18~) **← 현재**

> 신규 시작점. IDPASS와 별도의 독립 앱으로 AI 증명사진 생성 서비스 출시.
> IDPASS 코드 자산(Vision, 규격 데이터 등)은 참조/공유 가능하나, IDPASS 앱 자체를 확장하는 것이 아님.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 05/18 | 쌍아→막내 | **PhotoMonk PoC 착수** — 웹 Gemini Live 코칭을 Apple Vision 온디바이스로 대체하는 실험. 비용0·레이턴시0·오프라인가능. IDPASS와 별도 프로젝트 | [ORDER](../../orders/2026-05/ORDER_20260518_iMac쌍아_막내_PhotoMonk_Vision코칭_PoC.md) | ✅ |
| 05/18 | 막내 | **PhotoMonk PoC 완성** — Vision 실시간 코칭 + 촬영 시퀀스 iPhone 실기기 구동 확인 | `apps/PhotoMonk/` | ✅ |
| 05/18 | 작가님 | **TestFlight 실기기 테스트** — 촬영 코칭 플로우 동작 확인 | — | ✅ |
| 06/15 | 작가님 | **TestFlight 재검증** — 촬영실 새 버전 iPhone 실기기 확인 진행 중 | — | ⏳ |
| 09/29 | 4060/민아 | **[웹 idphoto-kr/jp] 촬영 불능 인시던트 → 판정 코드화** — 결제 고객 환불 요청(₩9,900)으로 발견. 원인: 코칭 Live 모델 `gemini-2.0-flash-live-preview-04-09` 퇴역(Vertex 404) → 1008 즉시 종료 485회 → READY 부재 → 촬영 전면 불능(09-08 이후). 환불(토스 취소→웹훅 −80c)·회신(Resend info@) 완료. 작가님 결정 "뻔한 패턴을 모델에 위탁한 것이 원인, 코드화" → Gemini Live·WS 전부 제거, MediaPipe 얼굴 박스+키포인트 순수 판정(capture-gate.js, portal precheck 임계값 재사용) + 수동 셔터 상시. prod KR 00209-xg4 · JP 00130-njn. 실기기 검증·고객 복구 메일 보류 중 | [INCIDENT](../../incidents/2026-09/INCIDENT_20260929_monkos-idphoto-kr_촬영불가_Live모델.md) · [DESIGN](../../../tech/designs/2026-09/DESIGN_20260929_idphoto_촬영게이트_코드화.md) · [COMPLETION](../../reports/2026-09/COMPLETION_20260929_4060민아_idphoto_촬영게이트_코드화.md) | ✅ 배포 / ⏳ 실기기 |

> 📄 PhotoMonk PoC 상세: [PHOTOMONK_POC.md](PHOTOMONK_POC.md)

---
| 08/13 | iMac/민아 | 🔴 **idphoto-kr 크레딧 소모 실패 사고 발견 (2주 감사 중)** — 당일 신규 가입자 kakao_5037216246: 17:09 KST 촬영 코칭→precheck 합격(85점)→idgen **선차감(잔액 0c)** 후 Vertex 429(Resource exhausted) 79s 재시도 끝 500. **환급 로그 0건** — 직후 재시도 402(잔액 부족)로 튕겨 charge.html 결제 유도. "실패했는데 생성권 소모+결제 유도" = 유료 실패 무음 강등 금지 원칙 위반 형태. 14일 내 429는 이 1건(만성 아님). 권고: ① 해당 유저 크레딧 환급(작가님 승인 필요, ch4 10조) ② idgen 실패 경로 자동 환급 로직(포털 generate의 refundGate 대응물 부재 의심) 지시서 | 세션 보고 (sessions/2026-08/2026-08-13_iMac_민아.md) | 🔴 환급 승인 + 지시서 대기 |
| 08/13 | iMac/민아 | **429 사고 원인 코드 확정 (직전 행 정정·보강)** — 환급 로직은 "부재"가 아니라 **커버리지 구멍**: idgen(server.js)은 API 응답에 이미지가 없는 경로(605-608행)만 환급하고, **SDK가 throw하는 경로(429·타임아웃·5xx)는 catch(627-630행)가 환급 없이 500만 반환**. 사고 시각 포털 `/api/credits/refund` 호출 0건 HTTP 실증(이중 확인). 피해 확정: 카카오 웰컴 보너스 10c(auth.js:115, idgen 1회분) 전액 소진. **결제 시도 없음** — charge.html 열람 4회+잔액 조회(GET /api/credits)만, toss/결제 POST 0건, 17:19 KST 이탈. 429는 17:09~17:11 순간 장애로 종료 — 17:26 작가님 실생성 200(150→140c) 로그 확인. 수정 범위: catch 블록 1곳(차감 성공 후 throw 시 환급) | 세션 보고 (sessions/2026-08/2026-08-13_iMac_민아.md) | 🔴 환급 승인 대기 |
| 08/13 | iMac/민아 | **429 사고 사후 조치 집행 (작가님 승인)** — ① uid 역조회 위해 credits.sh query/charge/deduct/user 식별자에 **uid 폴백 최소 확장**(이메일 키 한계 — 카카오 uid만 아는 케이스, 경로③ 작가님 직접 지시 하 민아 실행·쌍아 사후 보정 대상) ② 피해 유저 확정: kakao_5037216246 = d***3@naver.com, 가입 17:07:51 KST(실패 2분 전 첫날 유저) ③ **환급 집행 0c→10c** (credits.sh charge, 사유 기록, CREDIT_AUDIT_LOG 자동 어펜드) ④ **info@monkos.ai 발신 안내 메일 발송 성공** (Resend id=b78cab12…, mailer.js 로컬 실행·키는 SM→프로세스 env 주입만·값 미노출) — **PF_INFRA 메일 인프라의 첫 고객 대면 실발송**. 내부 기술명 미노출, 호칭 "작가님", 브랜드 MONKOS(ch8 준수) | CREDIT_AUDIT_LOG.md · scripts/credits.sh · 세션 로그 | ⏳ idgen catch 환급 수정 지시서(쌍아 라인) 잔여 |
| 08/13 | iMac/민아 | 🔴 **KR 충전 결제 차단 결함 진단 — charge.html 스크롤 잠금 (오프라인 고객 실피해 신고)** — 증상: 토스 결제창 하단 결제하기 버튼 안 보임+스크롤 불가로 결제 포기. 원인 확정: charge.html이 카메라 SPA용 app.css `body{height:100dvh;overflow:hidden}`(7-12행)을 상속하는데, 타 페이지는 자체 스크롤 컨테이너(#result-overlay 등 overflow-y:auto) 보유 반면 **#charge-content만 일반 흐름 → 뷰포트 초과분 잘림+스크롤 불가**. 360×640 모바일 에뮬레이션 라이브 재현: 콘텐츠 1160px vs 뷰포트 640px, 스와이프 후 scrollY=0, 결제 뷰(토스 위젯 450px 기준) 결제하기 버튼 top=861px=화면 밖 221px(약관 위젯도 화면 밖 — 동의 자체 불가). "폰마다 차이"=버튼 하단 ~914px이라 915px+ 뷰포트만 온전, 갤럭시 표준(~780)·SE급(640~740) 전멸, 위젯 컴팩트 시 852px+(아이폰 프로급)는 겨우 통과. result(안전)·camera(의도)·index(미사용) 대조로 charge 단독 결함 확정. **수정안 1줄**: charge.html `#charge-content{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}` (body 잠금 유지, SPA 동일 패턴) + idphoto-kr deploy.sh 배포 — 매출 직결 P0, 작가님 승인 대기 | 세션 보고 (sessions/2026-08/2026-08-13_iMac_민아.md) | 🔴 수정 승인 대기 |
| 08/13 | iMac/민아 | ✅ **KR 충전 결제 차단 결함 수정·배포 완결 (작가님 승인)** — charge.html에 `#charge-content{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain}` 오버라이드(app.css body 잠금 유지, SPA 동일 패턴) + 파생 수정 `resetScroll()`(뷰 전환 시 컨테이너 scrollTop 리셋 — window.scrollTo 단독은 무효) + 당겨서새로고침 오발동 차단. **배포 전 라이브 주입 시뮬 → prod 배포(deploy.sh, rev 00204-9j6) → 출하 코드 재검증** 전 항목 합격: 360×640에서 결제 뷰 스크롤 상한 678px·결제하기 버튼 완전 가시(top 183/bottom 237), 선택 뷰 푸터 도달(521px), 실코드 goBack() 뷰 전환+스크롤 리셋 작동, 데스크톱 1280 중앙정렬·스크롤 정상, 콘솔 신규 에러 0(401은 기존 비로그인 동작). 뷰포트 흔들림(URL bar dvh)은 camera/result와 동일한 기검증 내부 스크롤 패턴이라 버튼 상시 도달 가능 | `charge.html` · prod rev `monkos-idphoto-kr-00204-9j6` · 세션 로그 | ✅ 완결 |
| 08/13 | iMac/민아 | ✅ **JP 레몬 체크아웃 404 수정·배포 완결 (작가님 신고→완결 지시)** — 원인: 포털 `/api/checkout`(payments.js:42)이 전 variant에 글로벌 스토어(415328) 하드코딩, JP 레거시 variant(1382367 등 5종)는 JP 스토어(290457) 소속 → **교차 스토어 서명 링크가 실브라우저에서 404** (curl은 302→200이라 미탐지 — 브라우저 렌더로만 재현됨. 1차 가설 기각→실브라우저 A/B로 확정한 케이스). 수정: config.js `LEMON_JP_VARIANTS` 세트 신설(VARIANT_CREDITS 주석의 스토어 소속을 실행 정본으로 승격) + 핸들러가 variant 소속 따라 스토어 선택. 검증: dev→prod 각각 JP variant=monkos-ai-jp 링크·브라우저 정상 렌더(¥990 카드/PayPal/Alipay), 글로벌 variant=monkos-ai 유지(무회귀). prod rev `monkos-portal-00545-nk8`. Direct-Init(specs 단건)은 글로벌+글로벌이라 원래 정상 | `payments.js` · `config.js` · prod `00545-nk8` · 세션 로그 | ✅ 완결 |

## 3. Phase 현황

> Phase별 상태. 에이전트 투입 시 이 섹션이 "지금 뭘 해야 하는지"의 정본.

### Phase 0~2 — MVP → KR/JP → 이관 → 퍼널 v5 ✅ 완료

Image Pro MVP(01/11) → idphoto-kr(01/16) → idphoto-jp(02/01) → image.monkos.ai 이관(02/28) → 결제 퍼널 v5(03/05).

### Phase 3 — 운영 + 진단 ✅ 완료 (04/11)

P0 전팀 진단(500 클릭 0 결제), SEO 사각지대 발견, 광고=오가닉 부스터 전략 확립.

### Phase 4 — 가격조사 + 전환 전략 수립 ✅ 완료 (05/18)

47개 서비스 전수조사 (컷당 중앙값 $2.33), iOS 전환 난이도 분석, Gemini 마이그레이션 완료.

| 05/22 | 쌍아 | **og:image 수정 지시서 발행** — idphoto-kr/jp 빈 파일(size 0)+상대경로 → 절대URL+실제 이미지로 교체. SERP 썸네일 노출 대응 | ORDER 발행, 막내 대기 | ⏳ |
| 06/13 | 작가님+웹/민아 | **퍼널 재설계 제안 — 크레딧 적립식→단건 과금 전환** — KR 토스 1,450원($1) 단건 / 글로벌 LS $6.99 패키지(고정수수료 구간 회피, 작가님 판정). 생성→땡큐 직결, 충전 모달 소멸(06-12 장애 표면 축소), 크레딧 어휘 표면 제거. 마진: 원가 200원/컷 기준 단건 55~83%(리트라이 캡이 핵심 변수). 쌍아 설계 인입 대기 | [PROPOSAL](../../proposals/PROPOSAL_20260613_웹민아_IDPHOTO_퍼널재설계_단건과금.md) | ⏳ |
| 06/14 | 작가님+웹/민아 | **과금 모델 재설계 — 단건→"생성 선결제 번들"** (전략 대화 적립). 근본원인 2겹: 비용역전(입력=생성에 비용인데 벽은 출력=다운로드에) + 심리(스튜디오의 선결제·권위·재촬영 안전망을 셀프가 벗김→외모착시 미해결). 시장: PhotoAiD(벽+검증$13.95)·Snap2Pass(벽제거+검증프리미엄) 대비 우리=벽+가치제로 최악조합. 모델: **₩10,000/$6.99=5컷생성+무제한 규격·배경변환+직결다운**(생성=유료상한·변환=무료가 척추), 프리미엄+₩10,000(인간검수+인화). "✓규격적합"이 권위 대체, 선결제가 약속장치. 마진 KR~86%·글로벌~77%(COGS 200원/컷). US2026 AI보정거부→정체성보존=합법 훅 | [REPORT](../../reports/2026-06/REPORT_20260614_웹민아_IDPHOTO_과금모델재설계.md) | ⏳ 쌍아 설계 |
| 06/17 | iMac/막내2 | **증명서비스 전수조사 축3+축4** — 어드민 스튜디오 현황(VTON=독립, monk_studio=오프라인 활성, studio.monkos.ai=소스 불명), 아키텍처 맵(kr/jp 90%+ 중복, 인증 3중복제, 크레딧 정본 단일=건강), 인크루트 장애물(X-Frame-Options DENY=iframe 블로커), CF 레거시 전멸 확인 | [REPORT](../../reports/2026-06/REPORT_20260617_iMac막내2_증명서비스_전수조사_축3축4.md) | ✅ |
| 06/17 | iMac/막내1+2 | 증명서비스 4축 전수조사 — 여성 정장 regression 확정(3/12 d7038907), baby+suit 미검증, KR/JP 코드 90%+ 동일 복제, X-Frame-Options iframe 블로커 발견. 인크루트 납품 선행 요건 도출 | REPORT_20260617 2건 | ✅ |
| 06/19 | 웹/민아 | **퍼널 진단 — "가격 아님" 확정** (GA4 6/17 preview_view 1→begin_checkout 0→purchase 0, begin_checkout 계측 정상 검증 → 이탈은 preview→checkout 구간=품질/정체성보존 의심, n극소 방향만). + **어드민 idphoto 리뷰 페이지** 구현(원본↔결과물 비교, PR #86 draft) | [COMPLETION](../../reports/2026-06/COMPLETION_20260619_웹민아_IDPHOTO어드민리뷰_퍼널진단.md), `0fb98c47` | ⏳ 배포대기(맥) |
| 07/21 | M1/민아 | **JP 시장 × idphoto-jp 분석 + 방향성 (작가님 지시)** — 시장: JP=유일 성장형 92,100/월(履歴書写真 60,500 십년 +38%). T3 GSC 28d 실측: **idphoto-jp 노출 2·클릭 0·就活 랜딩 노출 0 = 점유 0%** (기술 결함 아님 — sitemap·robots·랜딩 정상, DA 0 서브도메인+콘텐츠 7장의 구조 문제). 권고: **JP SEO 본대=monkos.ai(ja)·idphoto-jp=전환 말단** 역할 재정의(IDPASS 3층 정합), 실행 4단(ja 취업 클러스터·Bing WMT·말단 최적화·9월 적재 데드라인=27년 就活 시즌 역산). 선결: 레지스트리 채널 재배정 작가님 결정 대기 | [REPORT](../../reports/2026-07/REPORT_20260721_M1민아_JP시장_idphotoJP_분석_방향성.md) | ⏳ 채널 재배정 결정 대기 |
| 08/26 | iMac/민아 | **실고객 유료 T1 첫 결제 확인 + 계측 결함 2건 교정** (작가님 스크린샷 발단) — 08-25 09:05 토스 ₩9,900(+80c) → T1 2회 생성(무료 트랙과 교차 사용). 결제자≠작가님 = 42일 만의 실매출. 부수 교정: ①로그인 무료 생성이 익명 기록되던 문제(게이트/귀속 분리, sessionId·gate·authenticated 필드 신설) ②어드민 UTC 직출력→KST(9시간 오판 유발). prod 00551-tmx | 커밋 f8ba3d03·34c38c70 | ✅ prod |
| 08/26 | iMac/민아 | **포토리뷰 화면 후속 보정** — 이미지 81장 동시 요청 완화(decoding=async·fetchpriority=low) + GCS 저장 경로를 귀속 기준으로 통일(무료 트랙 파일이 specs-visitor 한 폴더에 혼재하던 문제, 신규분부터). 08-25 KST 표기·유료(T1) 뱃지는 실화면 정상 확인 | [REVIEW](../../reports/2026-08/REVIEW_20260826_iMac민아_어드민_화면리뷰.md) | ✅ prod |
| 09/03 | iMac/민아 | **T2 재정의 설계 요청 → 쌍아** — 현행 T2(촬영실 ₩9,900 코칭+QC+발급보장 초안 B안, prod 문구 미노출)에 사진관 인화·발송 결합. 실측: 부품(코칭·QC·결제·규정)은 있고 인화 주문 UI·사진관 워크플로·보장 카피 노출·주문 원장이 없음. 작가님 결정 6항 첨부 | `PROPOSAL_20260903_iMac민아_T2인화_발급보장_설계요청.md` | ⏳ 작가님 결정 → 쌍아 설계 |
| 09/03 | 작가님·iMac/민아 | 🔴→✅ **GA4 측정 ID 고아 사고 수정** — G-FKG0CPTC14는 작가님 계정 어디에도 없는 ID(03-14 철창이 추정 삽입, 06-14 KR 단독화 → 81일 idphoto-kr 이벤트 소실). 작가님 승인 → idphoto-kr 12파일 JPZ 교체 + studio·portal·render-shell·payments 이중 config 제거, prod 3 + 엣지 재배포. 라이브 FKG 0, 합성 hit 실시간 수신 확인. references.md 측정 ID 정본 신설. 잔여: FKG 속성 정체(구 계정 가설) | `INCIDENT_20260903_idphoto-kr_GA4측정ID_고아.md` · `COMPLETION_20260903_iMac민아_GA4측정ID통일_FKG제거.md` | ✅ prod / ⏳ 정체 확인 |
| 09/03 | 작가님·iMac/민아 | **FKG 정체 확정 + 81일치 회수** — Ads 온보딩 자동 생성 계정(382573166, monkosailab@)의 속성 monkos.ai 527549580이 FKG 수신처. 작가님 뷰어 부여 → 실측: 06-14~09-02 idphoto-kr generate_click 28u·begin_checkout 7u·purchase 2 → "생성 0" 오독 확정. 정본 521406894 유지, 527549580은 읽기 전용 아카이브 | INCIDENT_20260903 정정 추기 · 메모리 canon 갱신 | ✅ 종결 |
| 09/03 | 작가님·iMac/민아 | **T2 인화 결정 문답 (결정 1·2 병합)** — 플레이스·스마트스토어 실측(CDP) → Phase 1 = 스토어 전용 상품 「MONKOS 앱 인화」(옵션 0·주문코드·1,900+3,000) + 앱 수령 화면 코드·링크·클릭 이벤트. 보장 CS 격리 4항(상한·증빙·채널·스토어 링크만). Phase 2 자체 주문은 G1 후. 상세페이지 스펙 꾸 outbox 배치. 잔여: 상품명 표기·보장 범위·기간 — 작가님 "꾸와 확인 후 진행" | PROPOSAL_20260903 추기 · kku/outbox SPEC_20260903 | ⏳ 꾸 확인 |
| 09/04 | 작가님·iMac/민아 | 🔴 **fit 경로 헤어 잘림 결함 규명** (작가님 포토리뷰 캡처 발단) — 실사 원본은 `hairScan:false`라 헤어탑 미측정 → 프레임·판정·가드 전부 추정 정수리 기준 → `top=4mm pass`인데 헤어 잘림 출고. 07-09 Gemini 비전 퇴출 후 헤어 잘림 판정 담당 부재(구조 공백). 수정안 A(허용치+패딩+차단)·B(매팅 선행→hairScan 실측) 쌍아 설계 요청 | `PROPOSAL_20260904_iMac민아_IDPHOTO_fit헤어잘림_설계요청.md` | ⏳ 쌍아 설계 |

### Phase 5 — 독립 iOS 앱 + 결제 개편 ⏳ 진행 중 (05/18~) **← 현재**

#### 5-A. 독립 iOS 네이티브 증명사진 앱 (신규 개발)

> IDPASS(PF_CROP)와 **별도 독립 앱**. IDPASS 코드 자산(Vision, 규격 데이터) 참조 가능.

| 항목 | 상태 | 비고 |
|------|------|------|
| SwiftUI 기반 독립 앱 | ❌ | 신규 프로젝트 |
| AI 증명사진 생성 기능 | ❌ | Vertex AI / 온디바이스 모델 |
| StoreKit 2 IAP $1.99/컷 | ❌ | 신규 |
| 인증: Sign in with Apple + Google | ❌ | 신규 |

#### 5-B. 결제 구조 개편

| 항목 | 상태 | 비고 |
|------|------|------|
| 크레딧 폐지 → 직접결제 전환 | ❌ | 신규 설계 |
| 첫 체험 $1 단건 (계정 불필요) | ❌ | 신규 |
| 재구매 시 크레딧 전환 유도 (이 시점에 OAuth) | ❌ | 신규 |
| 이중 과금: 앱 IAP($1.99) + 웹 크레딧(보너스) | ❌ | Apple 30% vs 웹 3~5% |
| 웹 크레딧 충전 시 20% 보너스 → 웹 전환 유인 | ❌ | 신규 |

#### 5-C. Gemini 마이그레이션

| 항목 | 상태 | 비고 |
|------|------|------|
| Track A: KR precheck 2.5 전환 | ✅ | `8e5b890e`(6/2) 2.5-flash 전환 + 프롬프트 완화. fallback: 2.5-flash-lite |
| Track A: JP precheck 2.5 | ✅ | `79be913a` 이후 유지 |
| Track B: KR/JP Live 2.5 전환 | ✅ | `8e5b890e`(6/2) gemini-2.5-flash 전환 완료 |

#### 5-D. 환불정책

- 현 단계: 유입 우선, "100% 만족 보장" 마케팅 활용 검토
- 추후: 볼륨 증가 시 환불 방어 설계

---

## 4. 성과

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| KR 서비스 배포 | 운영 중 | 01-16~ | idphoto-kr |
| JP 서비스 배포 | 운영 중 | 02-08~ | idphoto-jp |
| 퍼널 버전 | v5 | 03-05 | v4→v5 전환 완료 |
| **결제** | **외부 결제 0건** | 05-18 | 🚨 Phase 5 존재 이유 |

---

## 5. 복기

### 교훈 1: 제1원칙 — 동일인 유지
AI 생성 이미지에서 원본과 다른 인물이 나올 수 있음. 제1원칙(정체성 보존) 최우선. photo.js 패턴 준수.

### 교훈 2: SEO 사각지대 (04/11 진단)
286 sitemap URL → Google 색인 1개. CSR + 메타 부재 = 광고비 증발. 자산 완성과 노출 동선은 같은 사이클에 묶어야.

### 교훈 3: 시장 가격 구조 (05/18 전수조사)
47개 서비스 컷당 중앙값 $1.66. 카테고리 B(배경제거+크롭) 중앙값 $2.33. B와 C(AI 생성)의 중앙값 거의 동일 — AI 기능이 가격 프리미엄을 만들지 못함. 차별화는 **신뢰(환불보증)** 와 **편의(시트 장수, 인쇄 연동)**.

### 교훈 4: 크레딧 시스템은 시장 비주류 (05/18 전수조사)
시장 47개 서비스 중 크레딧 모델은 6%(3개)에 불과. 건별 결제(47%)가 주류. 크레딧 복잡성이 전환 장벽으로 작용.

---

## 6. 관련 문서 인덱스

### Phase 5 기반

| 문서 | 내용 |
|------|------|
| `AGENDA_20260518_결제전환_크레딧폐지_직접결제.md` | 결제 구조 전환 어젠다 |
| `REPORT_20260518_막내1_AI증명사진_가격전수조사.md` | 47개 서비스 가격·과금·컷당단가 |
| `REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md` | iOS 네이티브 전환 난이도 |
| `REPORT_20260518_막내2_Gemini모델_마이그레이션조사.md` | Gemini D-14 대응 조사 |
| `REPORT_20260518_막내2_Gemini2.0_마이그레이션_실행.md` | 2.0→2.5 마이그레이션 실행 |

### PF_PHOTOPRO 계승

| 문서 | 내용 |
|------|------|
| `REPORT_20260411_iMac쌍아_PHOTOPRO_통합진단.md` | 500 클릭 0 결제 진단 |
| 막내1~3 분기분석 보고서 | AI 사진 서비스 1~3월 분석 |

### 핵심 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| `a08f5ff` | 01-11 | Image Pro 정식 배포 |
| `b2e7b26` | 01-16 | 증명사진 MVP 완성 |
| `637916f` | 02-14 | KR/JP REST v2.0.0 |
| `385f556` | 03-05 | 결제 퍼널 v5 |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| **결제 전환 0건 지속** | 고 | Phase 5-B 결제 구조 개편. $1 첫 체험 + IAP 직결 |
| Vertex AI 비용 급증 | 중 | 모니터링 + 자체 모델 백업 |
| Apple IAP 30% 수수료 | 확정 | 웹 크레딧 20% 보너스로 웹 전환 유인 |
| iOS 앱스토어 심사 리젝 | 중 | 기능 완성 후 즉시 제출. 리젝 사유별 대응 준비 |
| ~~Gemini 2.0 서비스 종료~~ | ~~고~~ | ✅ 해소 (6/2) — KR/JP precheck + Live 모두 2.5-flash 전환 완료 (`8e5b890e`) |
| 정체성 보존 실패 | 저 | 제1원칙 세이프가드 + QC 이중 검증 |

---

## 8. 원본 PF 참조

> 본 PF는 PF_PHOTOPRO를 승격한 것. PF_CROP은 별도 독립 PF로 유지.

| PF | 경로 | 상태 |
|----|------|------|
| PF_PHOTOPRO | `portfolios/PF_PHOTOPRO/README.md` | completed (merged → PF_IDPHOTO) |
| **PF_CROP** | `portfolios/PF_CROP/README.md` | **active (독립 유지)** |
