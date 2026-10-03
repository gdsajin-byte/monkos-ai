---
type: design
date: 2026-10-02
device: iMac
agent: 소소
status: 조사 완료 — 권고 없음 (첫 과제 확정은 작가님 결정 대기)
portfolio: PF_DESIGNLAB
subject: "트렌드 조사 1회 실증 — 증명·여권 사진 온라인 서비스는 무료·유료·인화 선택지를 어떤 화면 구조로 보여 주는가"
---

# 티어 제시 화면 — 트렌드 조사

**[2026-10-02 14:52 KST]** iMac/소소 → 작가님 · iMac/민아

> 출처: ORDER_20261002_iMac민아_iMac소소 §B2. 수집 = 팀원 `scout-b2-trend`(dsn-scout, Sonnet 5.5, Playwright 375×812, 14:49~14:50). 판정과 대조 = 소소(14:51~14:52, curl 실측).
> 이 문서는 **사실 기록**이다. "이 패턴을 써야 한다"는 권고는 쓰지 않는다. 권고는 첫 과제가 확정되고 브리프가 나온 뒤 근거표에 올린다.
> 타사 이미지는 저장하지 않았다(URL·구조·문구만).

## 1. 과업과 표본

- 과업: 사용자가 증명·여권 사진을 온라인으로 만들 때, **무료 / 유료(보정·디지털 파일) / 인화 배송** 중 무엇을 받을지 어디서 어떻게 고르는가.
- 표본: 외부 4곳(국내 1·해외 3) + 현행 대조군 monkos.ai 2화면. 확인 날짜 전부 2026-10-02.
- 한계: **업로드 전 화면만** 열었다(업로드·로그인·결제 없음). 업로드 뒤 결과·결제 화면의 선택지는 화면 문구(안내·FAQ)로만 확인했다. 요소 순서는 접근성 스냅샷의 DOM 순서이며, 375px 첫 뷰포트 안에 실제로 들어오는 범위는 눈으로 확인하지 않았다.

## 2. 화면별 기록

| # | 서비스 · URL | 첫 화면 요소 순서 (위→아래) | 선택지 노출 방식 | 선택지·가격·버튼 원문 | 인화·배송 | 무료 |
|---|---|---|---|---|---|---|
| 1 | 증명한컷 (국내) · https://idcut.kr/ | h1 "단 1장으로 완벽한 증명사진을 만드세요." → 부제 → 수치 3개("1장 필요한 사진"·"100% 환불 보장"·"2분 평균 완성시간") → "지금 바로 무료로 체험해보세요" → 업로드 영역 → 신뢰 문구 3개 → 용도 탭·전후 비교 | **나란히 카드 2개(비교형)** — 단, 우리 쪽 티어가 아니라 "기존 스튜디오 3-8만원" vs "증명한컷 4,900원" 비교 | 증명한컷 카드에 배지 "BEST CHOICE", 버튼 "지금 무료 체험하기" · "🔥만들고 1만 네이버포인트 받기". 가격 1종 | 없음("다운로드"만) | "무료 체험 가능 \| 2분 생성 \| 100% 환불 보장" — 범위·워터마크 문구 없음. 환불: "공식 기관에서 사용 불가 판정 시 (증빙 필수)", "결제일로부터 30일 이내 신청" |
| 2 | PhotoAiD · https://photoaid.com/ | 헤더 → 앱 스토어 배지 → h1 "Online Passport Size Photo Maker" → 설명문 → 버튼 "Choose a document" → 평점 "Excellent / 13359 reviews" → 언론 로고 → 특징 3개("3-Minute Passport Photo"·"Professional Service"·"100% Compliance") | **결제 단계에서만** — "All you need to do is simply select this option in the final step." | 가격 표시 없음(첫 화면). `/en/pricing` 404 | 있음 — "Download a digital copy or order prints with complimentary 3-day shipping anywhere in the US." 가격 미확인 | 문구 없음 |
| 3 | Passport Photo Online · https://passport-photo.online/ | 헤더 → h1 "Take Passport Photos" → 설명문("…checked by AI and verified by human experts.") → 버튼 "Choose document" → 평점 "Excellent / 20714 reviews" → "As seen in" → 3단계 안내 | **단계별** — 검증 뒤 수령 방식 선택: "Via email (digital passport photo) or by mail (printed copies)." | FAQ 원문 **"$16.95 for digital and $19.95 for printed photos, with delivery in[cluded]"**(소소 curl 재확인 ✅). 가격 카드 아님. `/pricing` 404 | 있음 — $19.95 배송 포함, "wait 2–3 business days (on average)" | 문구 없음(무료는 앱 다운로드·배송뿐) |
| 4 | Visafoto · https://visafoto.com/ (+ /visafoto-prices) | 내비 → h1 "Passport or Visa Photo in 2 Seconds" → "No registration required…" → 드롭다운 "Select Country" → 업로드 폼(이후 미확인) | **단일 가격 — 선택지 비교 없음** | "The one-time photo editing fee on Visafoto is 원8500 Korean Republic Won per photo."(소소 curl 재확인 ✅ — 접속 지역 현지화로 보이나 미확인) | 배송 없음. 인쇄용 템플릿 포함, 인화는 외부 매장 안내 | 결제 전 미리보기만: "Until the payment is made, you have access to a preview of the final result." |

### 2-1. 현행 대조군 — monkos.ai

| # | URL | 첫 화면 요소 순서 | 선택지 노출 방식 | 원문 | 인화·배송 | 무료 |
|---|---|---|---|---|---|---|
| 0a | https://monkos.ai/specs/passport/kr (2회 히트, 2차 판정) | 헤더(MONKOS·ID Photo·Headshot·Pricing·Blog·Guide) → 브레드크럼 → h1 "대한민국 여권 2026" → 영문 부제 → 태그 → 요약 "3.5 × 4.5cm, 흰색 배경, 머리 높이 3.2~3.6cm" → 규격 이미지·탭(규격/상세 규정/반려사유 TOP 5) → 규격 표 → 업로드 "대한민국 여권 사진 만들기"(버튼 "사진 선택") → 접힘 "같은 사진으로 제출 가능한 서류 7" | **단계별(무료 후 업셀) — 업로드 전엔 숨김.** 아래 ⚠️ 참조 | 업로드 뒤 마크업 원문: 맞춤 단계 `"무료로 만들기"`, 캡션 `"배경 제거 + 여권 규격 크롭 · 오늘 3회 무료 · 로그인 불필요"` / 결과 단계 `"완성! 여권 규격에 맞춰 만들었어요"` → `"다운로드"` · `"다른 사진"` · `"오늘 무료 -회 남음"` · `"AI 보정 ₩2,000"` `"AI 리터칭 — 내 얼굴 그대로, 더 단정하게"` / 결제 카드 `"여권 사진 만들기 ₩2,000"`, `"10c (₩1,500)"` `"간편로그인 시 10c 무료 지급"`, `"추가 충전: 40c ₩6,000 ₩4,900"` | 없음 | 하루 3회 무료(마크업 `freeCap:3`), 로그인 불필요 |
| 0b | https://monkos.ai/pricing (2회 히트) | 표 "서비스별 크레딧 소모량" → 크레딧 팩 카드 4개 → "크레딧 충전하기" | **나란히 카드 4개 — 단, 사진 단위 티어가 아니라 크레딧 팩** | 표: "AI 리터칭 (생성)" 10c / "고화질 다운로드" 70c(비고 "인화/제출용 원본") / "AI 증명사진 1장 완성" 80c. 팩: ₩9,900(배지 "추천")·₩12,900·₩34,900(배지 "BEST")·₩49,900(소소 curl 재확인 ✅). "첫 회원가입 시 10c 보너스 증정 (AI 리터칭 1회 체험)"(✅) | 없음 | 가입 10c |

> ⚠️ **팀원 반환 정정 (리드 대조)**: 팀원은 0a에서 "₩·무료·인화·워터마크 검색 0건 → 선택지가 보이지 않는다"고 반환했다. 소소가 같은 URL을 curl로 2회 히트해 원문 HTML을 검색하니 위 원문이 **마크업에 존재**했다. 맞춤 버튼 묶음은 `id="v2-fit-actions" style="display:none;"` — 업로드 전엔 숨겨져 있어 접근성 스냅샷에 안 잡힌 것이다. 따라서 정확한 기술은 "업로드 전 화면엔 선택지가 없고, 업로드 뒤 단계에서 무료 → AI 보정 ₩2,000 업셀 순으로 나온다(마크업 근거, 실제 표시는 미확인)". 0건이 부재의 증거가 아닌 사례(live-verify 3조)로 남긴다.

## 3. 공통 패턴 (개수만 — 표본 밖 일반화 없음)

| 패턴 | 외부 4곳 중 | 해당 | 대조군 monkos.ai |
|---|---|---|---|
| 첫 화면에 가격이 없고 입구(문서·국가 선택 또는 업로드)만 있다 | **3** | PhotoAiD·Passport Photo Online·Visafoto | 해당(0a) |
| 디지털 vs 인화 배송 선택이 업로드·검증 **뒤 마지막 단계**에 있다(안내 문구 근거) | **2** | PhotoAiD·Passport Photo Online | 인화 선택 자체 없음 |
| 무료·유료·인화 **3티어를 한 화면에 나란히** 놓은 카드 | **0** | — | 0 |
| 인화 배송 옵션이 있다 | **2** | PhotoAiD(미국 3일 무료 배송)·Passport Photo Online($19.95 배송 포함) | 없음 |
| 인화 배송을 "무료/포함" 문구와 함께 낸다 | **2** | 위 두 곳 | — |
| 환불·보장 문구를 첫 화면이나 가격 영역에 둔다 | **4** | idcut("100% 환불 보장")·Passport Photo Online("guaranteed acceptance")·Visafoto(환불 보장)·PhotoAiD("100% Compliance") | 0a·0b에서 미발견(미검색 — 아래 미확인) |
| 단일 가격 1종 | **2** | idcut 4,900원·Visafoto 8,500원 | 아님(₩2,000 / 크레딧) |
| 무료 범위가 화면에 명시돼 있다(횟수·워터마크 등) | **0** | idcut은 "무료 체험"만, 범위 없음 | 명시("오늘 3회 무료 · 로그인 불필요") |

## 4. 우리 제약과의 충돌 표시 (권고 아님 — 채택 시 점검할 줄)

| 패턴 | 우리 제약 | 충돌 여부 |
|---|---|---|
| 인화 배송을 선택지로 노출 | 헌법 4조 4항 "되는 것만" — 포털에 인화 배송 주문·주소 수집 파이프라인 없음(헌장 §2 "인화 배송 티어는 승인 게이트 대상") | **충돌** — 노출 전에 파이프라인 신설 결정 필요 |
| 환불·보장 문구 | 유료 실패 정책(작가님 명시 승인 필수, MEMORY 07-17) · "되는 것만" | 문구는 현행 환불 정책 원문이 있어야 함 — 미확인 |
| "AI + 사람 검수" 류 문구(Passport Photo Online) | 사람 검수 공정 없음 | 충돌(그대로는 불가) |
| 첫 화면 무가격·입구 우선 | specs 페이지는 정보(규격) 우선 구조 — 정보 페이지와 도구 입구의 순서 문제 | 충돌 없음, 구조 판단 사안 |

## 5. 미확인

1. 업로드 뒤 결과·결제 화면(타사 전부). PhotoAiD 가격, Passport Photo Online 실제 버튼 문구.
2. 타사 무료 옵션의 워터마크 유무(4곳 모두 화면 문구 없음).
3. monkos.ai 0a의 업로드 뒤 단계가 **실제로 어떤 순서·배치로 보이는지**(마크업만 확인 — 업로드 1회 실측 필요, 무료 3회 쿼터 1 소모).
4. monkos.ai 페이지의 환불·보장 문구 존재 여부(이번엔 검색하지 않음).
5. 표본 밖: 123PassportPhoto·Persofoto·idphoto4you·인핸즈(enhanz.io)는 열지 않음.
6. 수요·유입 데이터(GA4·GSC)는 이번 지시 범위 밖이라 조회하지 않음. 기준선 "무료 수령자 중 유료 클릭 비율"은 헌장 §2대로 재측정 필요.

## 6. 근거·방법

- 팀원 Playwright 스냅샷: `.playwright-mcp/page-2026-10-02T05-49-28-176Z.yml` 외(gitignore 대상, 레포 미반영).
- 소소 재확인(14:51): `curl` — monkos.ai 두 URL은 URL당 2회 히트 후 2차 판정 / passport-photo.online FAQ 가격 / visafoto 가격 페이지 원문 일치. idcut 4,900원은 단순 curl 미검출(클라이언트 렌더 추정) — 팀원 스냅샷 값 그대로, **미재확인**.
