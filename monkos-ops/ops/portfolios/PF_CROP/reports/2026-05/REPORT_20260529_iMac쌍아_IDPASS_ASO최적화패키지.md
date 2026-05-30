---
type: report
date: 2026-05-29
device: iMac
agent: 쌍아
portfolio: PF_CROP
status: 진행
subject: IDPASS App Store ASO 진단 + 키워드 최적화안 + 6.9" 스크린샷 카피 구성안
---

# IDPASS ASO 최적화 패키지

> App ID: 6768868041 / 버전 1.0 (READY_FOR_SALE, 2026-05-29 출시) / 15개 로케일
> iris API(appstoreconnect.apple.com 내부 API)로 전수 진단. CDP 세션 경유.

---

## 1. 진단 요약 (15개 언어 전수)

| 항목 | 결과 |
|------|------|
| 부제(Subtitle) | ✅ 15개 언어 전부 정상 (appInfoLocalizations에 존재) |
| 프로모션 텍스트 | ✅ 전부 정상화 (de-DE 버그 + ko 오타 수정 완료) |
| 키워드 | 🔒 라이브 잠김 — 1.0.1 새 버전 필요. 최적화안 §3 |
| 설명 | 정상 |

### 처리 완료 (2026-05-29)
- **de-DE 프로모션 버그**: 독일어 promo 자리에 영어 키워드(`passport photo,visa photo,...`)가 복붙돼 있던 것 → 독일어 마케팅 문구로 교체 (작가님 수정)
- **ko 프로모션 오타**: "전송 없슴" → "전송 없음" + 더블스페이스 정리 (iris PATCH 200)

---

## 2. 기술 노트 (ASC 작업 재사용)

> 향후 App Store Connect 메타데이터 작업 시 반드시 참조.

- **subtitle은 `appStoreVersionLocalizations`에 없다.** `appInfoLocalizations`(appInfos→appInfoLocalizations)에 `name`/`subtitle`로 존재. 버전 리소스만 보면 공란으로 오판하게 됨. (2026-05-29 쌍아 1차 오진 교훈)
- **라이브(READY_FOR_SALE) 버전 편집 제약**:
  - 라이브 편집 가능: `promotionalText`, `subtitle`/`name`(appInfo)
  - 라이브 잠김(새 버전 필요): `keywords`, `description`, 스크린샷
  - 잠긴 필드 PATCH 시 → `409 STATE_ERROR "cannot be edited at this time"`
- **iris API 경로** (CDP 로그인 세션 same-origin fetch, 별도 .p8 키 불필요):
  - 버전: `GET /iris/v1/apps/{appId}/appStoreVersions`
  - 버전 로컬: `GET/PATCH /iris/v1/appStoreVersionLocalizations/{locId}` (keywords/promotionalText/description)
  - 앱정보 로컬: `GET /iris/v1/appInfos/{infoId}/appInfoLocalizations` (name/subtitle)
  - PATCH body: `{"data":{"type":"appStoreVersionLocalizations","id":"{locId}","attributes":{...}}}`
- **버전 ID(1.0)**: `db70f739-afae-4cac-8cb7-c8dea4e96b52`
- **로케일별 localization ID**: ko=`cd153176-...` en-US=`2a796a9a-...` ja=`d21af2f3-...` zh-Hans=`89d26ce5-...` (전체 15종은 세션 로그/스크립트 참조)

---

## 3. 키워드 4개 언어 최적화안 (1.0.1 반영 대상)

> 원칙: 앱이름·부제 단어와 중복 제거(Apple이 자동 조합) → 무관어 삭제 → 실검색어로 빈 슬롯(100자) 채움.

### 🇰🇷 ko
- **현재(88)**: `증명사진,여권사진,비자사진,크롭,증명사진크롭,여권규격,ICAO,배경제거,면허사진,이력서사진,대한민국,여권,비자,항공권,대사관,국제기관,해외여행,여행사,AI사진`
- **개선안**: `여권,비자,면허,신분증,반명함,이력서,주민등록증,크롭,규격,배경제거,셀프,사진관,즉석,여권사진규격,프로필사진,증명사진앱,ICAO,AI사진`
- 근거: "증명사진/여권사진/비자사진/증명사진크롭"(이름·부제 중복) 제거 · "항공권/대사관/여행사/해외여행"(무관) 삭제 · "반명함/셀프/사진관/즉석" 실검색어 추가

### 🇺🇸 en-US (영문 100자 빡빡 — 미세조정 가능)
- **현재(91)**: `passport photo,visa photo,id photo crop,ICAO,background removal,id photo,passport size,free`
- **개선안**: `passport photo,headshot,visa,biometric,2x2,baby,license,resume,white background,crop,ICAO`
- 근거: "id photo" 2회 중복(이름에 ID Photo) 제거 · "headshot/biometric/2x2/baby/white background" 영어권 핵심 실검색어 추가

### 🇯🇵 ja (현재 48자 — 슬롯 절반 비어있음)
- **현재**: `証明写真,パスポート写真,ビザ写真,クロップ,ICAO,背景除去,免許写真,履歴書写真,写真加工`
- **개선안**: `履歴書,マイナンバー,運転免許,パスポート,ビザ,背景白,スピード写真,就活,プロフィール,証明写真アプリ,背景除去,クロップ,ICAO,写真加工`
- 근거: "証明写真"(앱이름 중복) 제거 · "履歴書/マイナンバー/運転免許/就活/スピード写真" 실검색어 추가

### 🇨🇳 zh-Hans (현재 41자 — 슬롯 절반 비어있음)
- **현재**: `证件照,护照照片,签证照片,裁剪,ICAO,背景去除,驾照照片,简历照片,照片编辑`
- **개선안**: `驾照,简历,签证,护照,白底,一寸,二寸,身份证,换底色,免冠照,学生证,工作证,护照尺寸,背景去除,裁剪,照片编辑`
- 근거: "证件照"(앱이름 중복) 제거 · "一寸/二寸/白底/换底色/免冠照"(중국 증명사진 실검색어) 추가

---

## 4. 6.9" 스크린샷 카피 구성안 (작가님 디자인용)

> **노출 복구 핵심.** 현재 6.5" 8장만 등록 → 최신 iPhone(6.9") 노출 우선순위 슬롯이 비어 제품 페이지 스크린샷 미노출.
> **규격**: 1320 × 2868 px (세로). 최대 10장. **첫 3장이 검색결과·설치시트 노출** → 메시지 집중.

| # | 화면 | 🇰🇷 대문 카피 | 🇺🇸 |
|--|------|-------------|-----|
| **1** | 랜딩 | **200개국 증명사진, 한 앱에** | **200+ countries, one app** |
| **2** | 국가선택 | **여권·비자·면허 규격 자동** | **Passport · Visa · License presets** |
| **3** | 크롭 | **AI가 정수리·눈·턱 자동 인식** | **AI detects head, eyes & chin** |
| 4 | 배경제거 | 배경 제거·교체 한 번에 | Remove & replace background |
| 5 | 검수 | ICAO 규격 실시간 합격 판정 | Real-time ICAO check |
| 6 | 완료 | 300DPI 무료 다운로드 | 300 DPI · Free download |
| 7 | Before/After | 완전 무료 · 광고 없음 | 100% free · No ads |
| 8 | privacy | 사진은 기기에서만 처리 | On-device · No upload |

---

## 5. 1.0.1 업데이트 반영 체크리스트

> 키워드·스크린샷은 라이브 잠김 → 새 버전 1.0.1 + 새 빌드 업로드 시 일괄 반영.

- [ ] 6.9" 스크린샷 디자인 (작가님 직접) → §4 카피 반영, 한/영
- [ ] 새 빌드 1.0.1 Archive + 업로드 (막내/M4 빌드 파이프라인)
- [ ] 새 버전에서 키워드 4개 언어(ko/en/ja/zh) §3 개선안 입력 (iris PATCH 또는 UI)
- [ ] 6.9" 스크린샷 슬롯 업로드 (한/영, 가능하면 다국어)
- [ ] 부제·프로모션은 현행 유지 (이미 정상)
- [ ] 제출 → 심사

> 키워드 외 11개 언어 키워드는 현행 유지(적절). 추후 언어별 추가 최적화는 별건.
