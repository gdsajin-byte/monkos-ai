---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내 (복수 배당)
portfolio: PF_IDPHOTO, PF_STUDIO, PF_PROFILES
status: 대기
---

# 지시서 — 증명사진 서비스 전수조사 (코드·프롬프트·퍼널·어드민)

> **[2026-06-17 13:07 KST] iMac/쌍아 → iMac/막내 (복수)**
> 인크루트 B2B 납품 준비 + 여성 정장 출력 버그 계기. 증명사진 관련 전 서비스 코드를 전수 점검.

## 배경

1. **인크루트 B2B 납품** — 증명사진 서비스를 외부 파트너에 제공하는 첫 사례. 납품 전에 서비스 내부를 전수 점검해야 함
2. **여성 정장 버그** — 여성 사용자가 정장(suit) 선택 시 남성 정장과 동일한 패턴으로 출력됨. `buildPromptV5()`에서 gender를 SUBJECT에만 쓰고 OUTFIT에는 미반영
3. **서비스 관계도** — idphoto-kr(프로덕션) / idphoto-jp(일본) / 어드민 스튜디오(내부 웹 검증용, 같은 코드 웹 업로드 버전) / MONK_kr 스튜디오(CF Pages, 레거시) / IDPASS(iOS 앱)이 얽혀 있음
4. **PF 연결** — PF_STUDIO(장기 멈춤), PF_PROFILES(draft) 가 인크루트 납품을 계기로 활성화될 시점

## 조사 범위 — 4축

### 축 1: 프롬프트 전수조사

**대상 파일:**
- `monkos_AI/idphoto-kr/server.js` — STYLE_PROMPTS, CLOTHING_PROMPTS, buildPromptV5()
- `monkos_AI/idphoto-jp/server.js` — 동일 구조 (JP판)
- `MONK_kr/_functions_backup_20260220/api/idgen.js` — 레거시 (현행과 차이 확인)

**조사 항목:**
1. **여성 정장 버그 정밀 분석** — `buildPromptV5()`에서 gender가 SUBJECT(§6-2)에만 사용되고 OUTFIT(§6-3)에서 `"this person"` 범용 표현. 여성이 suit 선택 시:
   - `[SUBJECT] This person is an adult woman.`
   - `[OUTFIT] Dress this person in a navy formal business suit with a white collared dress shirt.`
   - → 모델이 "adult woman + formal business suit"를 남성 정장으로 해석하는지 여성 정장으로 해석하는지 비결정적
   - **해결 방향 제안** 필요 (gender 기반 outfit 분기? 여성 전용 프롬프트?)
2. **8조합(gender × age) 전수 검증** — SUBJECT_MAP 8개 키 × clothing 5종 × expression 4종 조합에서 부자연스러운 조합이 있는지 (예: baby + suit)
3. **프롬프트 품질** — 각 프롬프트가 의도한 결과를 명확히 유도하는지 (모호한 표현, 누락된 지시)
4. **KR vs JP 동기화** — idphoto-kr과 idphoto-jp의 프롬프트가 일치하는지, 의도적 차이가 있는지

### 축 2: 퍼널·UX 전수조사

**대상:**
- idphoto-kr 클라이언트 (프론트엔드 HTML/JS)
- idphoto-jp 클라이언트
- IDPASS 앱 (`apps/idpass-android/`) — Kotlin/Compose

**조사 항목:**
1. **사용자 퍼널** — 사진 업로드 → 옵션 선택(포맷/의상/배경/표정/헤어) → 사전 분석 → 생성 → 미리보기 → 다운로드/결제. 각 단계에서 gender 선택이 어떻게 전달되는지
2. **옵션 UI** — 여성 사용자에게 넥타이 옵션이 보이는지, clothing 선택지가 gender에 따라 분기하는지
3. **에러 핸들링** — 사전 분석(pre-check) 실패 시 UX, 생성 실패 시 재시도 흐름
4. **KR vs JP 차이** — UI/UX 차이점 (의도적 vs 누락)

### 축 3: 어드민 스튜디오 전수조사

**대상:**
- `monkos_AI/portal/public/admin/` — 어드민 페이지 (내부 검증용 웹 버전)
- `MONK_kr/monk_studio/` — 레거시 스튜디오 (CF Pages)
  - `id_photo/` (standard/premium/deluxe)
  - `profile/`

**조사 항목:**
1. **어드민 스튜디오 현황** — 어떤 기능이 있고, 프로덕션(idphoto-kr)과 코드가 같은지 다른지. 업로드 방식·API 엔드포인트·인증 방식
2. **MONK_kr 스튜디오** — 현재 작동 상태. idphoto-kr로 이관 완료인지, 레거시 잔존인지
3. **프로필 사진 기능** — `profile/profile.html`이 어떤 기능인지, PF_PROFILES와의 관계
4. **어드민 VTON 스튜디오** — `admin/vton-studio.html`이 현재 작동하는지

### 축 4: 서비스 아키텍처 맵

**조사 항목:**
1. **전체 서비스 관계도** — idphoto-kr / idphoto-jp / portal(어드민) / MONK_kr(레거시) / IDPASS(앱) 간 코드 공유·API 의존·데이터 흐름
2. **코드 중복** — 같은 로직이 여러 서비스에 복제된 곳 (프롬프트, 검증 로직, 결제 등)
3. **인크루트 납품 시 어떤 코드가 관여하는지** — iframe 경유 시 idphoto-kr이 그대로 쓰이는지, 별도 엔드포인트가 필요한지

## 배당 (제안)

| 막내 | 축 | 이유 |
|------|-----|------|
| 막내1 | 축 1 (프롬프트) + 축 2 (퍼널) | 코드 심층 분석, 여성 정장 버그 해결 방향 |
| 막내2 | 축 3 (어드민 스튜디오) + 축 4 (아키텍처) | 서비스 간 관계·레거시 판별 |

## ⚠️ 준수 조항

- **read-only 조사** — 코드 수정하지 말 것. 보고서만 작성
- 버그 발견 시 해결 **방향 제안**만 (실행은 별도 지시서)
- 시크릿 생성/추측 금지 (헌법 4조 1항)
- 프롬프트 내용은 내부 기밀 (헌법 4조 3항) — 보고서에 포함 가능하나 외부 유출 금지

## 완료 기준

- [ ] 축 1: 프롬프트 전수 보고서 — 여성 정장 버그 원인·해결 방향, 8조합 검증, KR/JP 동기화 상태
- [ ] 축 2: 퍼널 전수 보고서 — gender 전달 경로, UI 분기 현황, 에러 핸들링
- [ ] 축 3: 어드민 스튜디오 보고서 — 현황·코드 공유 여부·레거시 판별
- [ ] 축 4: 아키텍처 맵 — 서비스 관계도, 코드 중복, 인크루트 납품 경로
