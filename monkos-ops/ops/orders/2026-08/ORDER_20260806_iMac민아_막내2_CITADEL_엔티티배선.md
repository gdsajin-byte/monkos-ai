---
type: order
date: 2026-08-06
from: iMac/민아
to: iMac/막내2
subject: "CITADEL 엔티티 배선 4가닥 — sameAs 그물·역방향·명칭/@id 통일·LocalBusiness 승격"
status: 대기
portfolio: PF_CITADEL
---

# ORDER — CITADEL 엔티티 배선

**[2026-08-06 14:16 KST]** iMac/민아 → iMac/막내2

> **발행 근거**: 작가님 직접 지시(08-06 14시) — 경로 ③ 준용, 쌍아 사후 추인 대상.
> **착수 전 필독**: [PF_CITADEL/README.md](../../portfolios/PF_CITADEL/README.md) Phase 2 재분류 표 "엔티티 SEO 🔶" 행 + 08/06 히스토리 행.

## 1. 배경 — 실측된 공백

08-06 실측: AI 엔진(ChatGPT)이 **몽크사진관 엔티티 자체를 추천**하여 타지역 전화·방문 고객이 복수 발생(계측 밖 전환). 엔티티 골조는 기존재 — monkos.ai Organization(`alternateName: ["Monk Studio","몽크사진관","몽코스"]`, `sameAs:[monk.kr]`, knowsAbout), monk.kr Organization(하남 실주소·전화), Person "Shin-jakka" 양 도메인. **잔여는 배선 4가닥**이며, 이 연결이 사진관 신뢰(플레이스·리뷰)와 웹 자산(specs 429p 권위)을 잇는다.

## 2. 산출물

| 파일 | 작업 |
|------|------|
| `monkos_AI/portal/lib/cms/home.js` (JSON-LD @graph) | ① sameAs 확장 ③ @id·명칭 통일 |
| `MONK_kr/index.html` (JSON-LD) | ② 역방향 sameAs ③ 명칭 통일 ④ LocalBusiness 승격 |
| `monkos_AI/portal/lib/cms/render-blog.js` (publisher·author) | ③ publisher를 @id 참조로 통일, author Person 정합 |

## 3. 상세 설계

### 3-1. ① sameAs 그물 (핵심)

- monkos.ai Organization `sameAs`를 확장: 현행 `["https://monk.kr"]` → + **네이버 플레이스 URL, 구글 지도(비즈니스 프로필) URL**, `https://github.com/monkos-studio`, 실존 SNS 채널.
- ⚠️ **플레이스·GBP·SNS URL은 작가님에게 확인 요청 후 기입** — 검색으로 찾은 URL 임의 기입 금지(동명 타업체 오연결 = 엔티티 오염). 표준 문구: "엔티티 배선에 필요합니다. ①네이버 플레이스 링크 ②구글 지도 프로필 링크 ③공식 SNS 링크(실존분만)를 주세요."
- URL 미수령 항목은 **보류하고 나머지 배선 선진행** (공란 추측 금지).

### 3-2. ② 역방향 연결

- monk.kr Organization에 `sameAs: ["https://monkos.ai", (플레이스·GBP·SNS 동일 세트)]` 신설 — 현행 sameAs 부재.

### 3-3. ③ 명칭·@id 통일

- primary `name`은 **"MONKOS"** 통일(헌법 1조 1항 브랜드 통일 준용), 기존 상이 명칭("Monk Studio"·"MONK")은 `alternateName`으로 강등 보존.
- `@id`는 `https://monkos.ai/#organization` 단일 — monk.kr Organization과 render-blog publisher가 **동일 @id를 참조**하도록. author Person도 `@id`(예: `https://monkos.ai/#founder`) 부여 후 monk.kr Person과 상호 참조, jobTitle 상이 표기("Founder, Professional Photographer" vs "Photographer & AI Architect")는 하나로 통일(전자 권고 + 후자를 description으로).

### 3-4. ④ LocalBusiness 승격

- monk.kr Organization `@type`을 `["Organization","LocalBusiness"]`로 승격, 기존 주소·전화 유지 + `geo`(주소 좌표), `openingHoursSpecification`·`priceRange`는 **작가님 확인 후 기입**(미수령 시 보류).

## 4. 검증·배포

- 정적 검증: 수정 후 각 표면 JSON-LD를 Google Rich Results Test 또는 schema 파서로 파싱 통과 확인.
- 배포: 포털 `monkos_AI/portal/deploy.sh` dev → 검증 → prod (ch5). monk.kr은 CF Pages — `/deploy-cf` 절차 준수.
- 라이브 실측: `curl`로 3표면(monkos.ai 홈·블로그 1페이지·monk.kr) JSON-LD 추출, @id 상호참조·sameAs 반영 확인.

## 5. ⚠️ 준수 조항

- 헌법 4조 1항: 값 추측 금지 — **URL·영업시간·priceRange는 작가님 수령분만** 기입
- 헌법 3조 1항 `date` / 3조 2항 완료 보고 + **PF_CITADEL 히스토리 1행**
- ch5: deploy.sh 경유, gcloud 직접 배포 금지
- ch8: 외부 노출 명칭은 MONKOS 통일 (내부 호칭 금지)
- 범위 밖: 간판(title/desc) 문구 교체는 별건(발행 게이트 대기) — 접촉 금지

## 6. 완료 기준

- [ ] 배선 4가닥 반영 (미수령 필드는 보류 명시)
- [ ] 3표면 라이브 JSON-LD 실측 (@id 상호참조·sameAs 확인)
- [ ] 파서 검증 통과 기록
- [ ] prod rev(포털) + CF Pages 배포 확인
- [ ] COMPLETION + PF_CITADEL 히스토리 1행 + 커밋·푸시

## 7. 커밋 메시지

`[feat] CITADEL 엔티티 배선 — sameAs 그물·@id 통일·LocalBusiness 승격`
