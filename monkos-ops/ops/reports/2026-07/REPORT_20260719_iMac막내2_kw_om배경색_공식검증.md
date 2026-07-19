---
type: report
date: 2026-07-19
device: iMac
agent: 막내2
status: 마감
portfolio: PF_SPECS
---

# 보고서: kw·om 배경색 공식 원문 검증

**[2026-07-19 12:08 KST]** iMac/막내2 → 작가님

## 요약

| 국가 | 문서 | 현 데이터 | 공식 확인 결과 | 결론 |
|------|------|----------|--------------|------|
| kw | 여권 | 파란색 | **파란색** (e.gov.kw) | 확정(파랑) ✅ |
| kw | 비자 | 파란색 | 미확보 (eVisa 포털 JS렌더) | 미확정 |
| om | 여권 | 파란색 | **흰색** (fm.gov.om) | 확정(흰색) ⚠️ 교정 |
| om | 비자 | 파란색 | "clear background" (색상 미특정) | 미확정 |

---

## Task 1. 쿠웨이트(kw) 공식 원문

### 여권 — 확정(파랑)

**공식 URL**: https://e.gov.kw/sites/kgoenglish/Pages/Services/MOI/ApplyforPassport.aspx

**원문 발췌**:
> "The photo should have a blue background to be in contrast to your face"

- 출처: 쿠웨이트 정부 포털 e.gov.kw (내무부 여권 발급 서비스)
- 기존 데이터(`background: 파란색`)와 일치
- `officialSource` 필드에 이미 해당 URL 등록됨 → 데이터 정확

### 비자 — 미확정

**조사 시도**:
1. `evisa.moi.gov.kw` — JS 렌더링 구조, WebFetch 실패 (Redirect missing Location header)
2. `washington.mofa.gov.kw` (MOFA 워싱턴) — HTTP 403
3. `canberra.mofa.gov.kw` (MOFA 캔버라) — HTTP 403
4. `kuwaitvisa.moi.gov.kw` — 빈 페이지 (JS 앱)

**비공식 참고** (교정 근거로 사용 불가):
- kuwaitembassy.org (비공식 .org 사이트, US Arab Chamber of Commerce 운영): "White background"
- 제3자 블로그: blue/white 혼재

**결론**: eVisa 포털이 JS SPA 구조여 원문 확보 불가. 기존 `officialSource`(kuwaitvisa.moi.gov.kw/faq)도 동일 구조로 접근 불가. 브라우저 기반(CDP) 재시도 필요.

---

## Task 2. 오만(om) 공식 원문

### 여권 — 확정(흰색) ⚠️ 데이터 불일치

**공식 URL**: https://www.fm.gov.om/abu-dhabi

**원문 발췌** (오만 외무부 아부다비 대사관):
> - Lost/Damaged/Stolen Passport: "Two recent personal photos in official dress with a **white background**"
> - Passport for Newborns: "Two personal photos of the newborn with a **white background**"
> - Passport Renewal: "Two recent personal photos in official dress with a **white background**"
> - Identity Card Renewal: "Two recent personal photos with a **white background**"

- 출처: 오만 외무부(fm.gov.om) 공식 대사관 페이지
- 여권 갱신·신규·분실 재발급·신분증 갱신 전부 "white background"로 통일
- 기존 데이터(`background: 파란색`)와 **불일치** → 교정 대상
- 기존 `officialSource`(rop.gov.om/english/e_passport.aspx)는 색상 명시 없음 (사이즈·수수료만)

### 비자 — 미확정

**공식 URL**: https://evisa.rop.gov.om/eVisaSponsoredUnsponsored/help/en/Attach_Document_Guide/attachment_guide_en.htm

**원문 발췌** (오만 왕립경찰 eVisa 첨부 가이드):
> "Clear background"

- "clear background"만 명시, 특정 색상(white/blue) 미지정
- 파일 요건: PDF/JPEG/PNG, 96 DPI, 512KB 이하
- 기존 데이터(`background: 파란색`)의 근거 불명확

**비공식 참고** (교정 근거로 사용 불가):
- 제3자 사이트: white/blue 혼재 (출처 인용 없음)
- 검색 결과 일부: "resident identity card = blue background" (omanportal.gov.om, 503 오류로 직접 미검증)

**결론**: 비자 사진은 "clear background"만 공식 명시. 색상 특정 불가. 여권이 white이므로 비자도 white일 가능성 높으나, 공식 확인 없이 교정 불가.

---

## Task 3. 종합 결론

### 쿠웨이트(kw)
- **여권**: `확정(파랑)` — 데이터 정확, 교정 불요
- **비자**: `미확정(원문 미확보)` — eVisa 포털 JS 렌더링 장벽

### 오만(om)
- **여권**: `확정(흰색)` — fm.gov.om 공식 원문 확보. **현 데이터 "파란색" → "흰색" 교정 필요**
- **비자**: `미확정` — "clear background"만 명시, 색상 미확정

### 추가 조사 방안
1. **kw 비자**: CDP 브라우저로 `evisa.moi.gov.kw` 접속 → 사진 업로드 단계에서 요건 확인
2. **om 비자**: CDP 브라우저로 `evisa.rop.gov.om` 신청 플로우 진입 → 사진 업로드 안내 확인
3. **om 거주증(resident card)**: `omanportal.gov.om` 503 해소 후 재확인 (여권≠거주증 분리 가능성)

---

## Task 4. 데이터 교정 (확정 항목)

### 교정 대상: om-passport
- `background`: 파란색 → 흰색
- `backgroundEn`: Blue → White
- `backgroundJa`: 青 → 白
- `backgroundEs`: Azul → Blanco
- `officialSource`: rop.gov.om → fm.gov.om/abu-dhabi
- `grade`: B → A (공식 원문 확보)

### 미교정: kw-passport, kw-visa, om-visa
- kw-passport: 이미 정확 (grade A, officialSource 정합)
- kw-visa: 미확정 — 교정 금지
- om-visa: 미확정 — 교정 금지

---

## [14:03 KST] CDP 브라우저 재시도 (후속 지시서)

### kw-visa — 확정(흰색) ⚠️ 교정

**공식 URL**: https://kuwaitvisa.moi.gov.kw/faq (CDP 브라우저 접근 성공)

**원문 발췌** (쿠웨이트 내무부 비자 포털 FAQ, Angular SPA):
> Q: "Do I need to submit passport photos with my visa application?"
> A: "Yes, you are required to submit a recent passport-sized photo that meets passport photo standards. **The photo must have a white background** and be clearly recognizable"

- 출처: kuwaitvisa.moi.gov.kw (.gov.kw, 쿠웨이트 내무부 공식)
- 기존 데이터(`background: 파란색`)와 **불일치** → 교정 실행
- 참고: evisa.moi.gov.kw는 서버 502 (Sucuri Firewall 타임아웃) — 동일 MOI 관할의 별도 포털인 kuwaitvisa.moi.gov.kw에서 확보

### om-visa — 미확정 유지

**CDP 재확인 결과** (evisa.rop.gov.om + rop.gov.om):

1. `evisa.rop.gov.om` 첨부 가이드 (CDP 렌더링 완료):
   - Photo requirement: "Color / Taken in the last six months / Full face looking at the camera / **Clear background** / Well illuminated / Neutral facial expression / No hat / Remove glasses"
   - 색상 미특정. "clear background" = 평이한 배경(무늬·그림자 없음)만 요구.

2. `rop.gov.om/english/Visas.aspx` (Work Visa Documents 탭):
   - "Two photographs (6X4) cm." — 사이즈만 명시, 색상 언급 없음.

3. `evisa.rop.gov.om/en/frequently-asked-questions`:
   - "File size for passport and picture: Not more than 512 KB." — 용량만 명시.

**결론**: 오만 정부 3개 공식 페이지에서 비자 사진 배경 **색상을 특정하는 원문 미발견**. 교정 금지.

### 교정 실행: kw-visa

- `background`: 파란색 → 흰색
- `backgroundEn`: Blue → White
- `backgroundJa`: 青 → 白
- `backgroundEs`: Azul → Blanco
- `seoDescription` 4언어 교정
- countries.jsonl: bg blue → white

### 최종 요약

| 국가 | 문서 | 최종 결론 | 데이터 교정 |
|------|------|----------|-----------|
| kw | 여권 | 확정(파랑) | 불요 (정합) |
| kw | 비자 | **확정(흰색)** | ✅ 파랑→흰색 |
| om | 여권 | 확정(흰색) | ✅ (1차에서 완료) |
| om | 비자 | 미확정 | ❌ 교정 금지 |

### om-visa 잔여 조사 제안
- omanportal.gov.om 503 해소 시 재확인 (거주증 vs 비자 배경색 분리 가능성)
- 주한 오만대사관 직접 문의 (가장 확실하나 비자동화)
