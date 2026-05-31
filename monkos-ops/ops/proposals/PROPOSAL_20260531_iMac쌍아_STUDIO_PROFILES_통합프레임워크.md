---
type: proposal
date: 2026-05-31
device: iMac
agent: 쌍아
subject: Studio·Profiles·IDPhoto·VTON 통합 이미지 생성 프레임워크
status: 기안
portfolio: PF_STUDIO, PF_PROFILES, PF_VTON, PF_IDPHOTO
priority: P1
---

# MONKOS 이미지 생성 통합 프레임워크 설계

> 흩어진 4개 PF(STUDIO·PROFILES·VTON·IDPHOTO)와 studio 코드·세션 기록을 종합해
> **단일 생성 엔진 위에 4개 제품이 올라가는** 프레임워크로 재정의한다.

---

## 1. 현황 진단 (3축 종합)

### 1-1. 제품 지형 (기획 문서)
- **4/28 방향 전환**: PF_PROFILES를 PF_STUDIO에 흡수 → "프로필은 독립 서비스가 아닌 **동일 엔진의 모드**"
- **수익 구조**: 증명사진(무료 미끼) → 프로필스(고단가). LS 소액수수료 적자 회피
- **티어**: Basic(3축) / Creator(+3축) / Lookbook(+4축) 점진적 공개
- **모델 스왑 아키텍처**: 엔진 추상화 레이어 *설계만 존재, 미구현*

### 1-2. 코드 현실 (studio 코드)
- 증명사진 모드(`app`, 모놀리식 `buildPromptV5`) + 프로필 모드(`profiles/` 모듈, `buildProfilePrompt`) — **두 SPA가 분리**
- **모델 스왑 미구현**: 증명사진은 `gemini-3-pro` **하드코딩**(server.js:454), 프로필만 `PROFILE_MODEL_MAP`으로 2종 선택
- ⭐ **9축 스타일링 키워드맵이 server.js:61-156에 정의돼 있으나 `buildProfilePrompt`가 미사용** — 즉 스키마는 코드에 있는데 안 쓰고 있음
- 갤러리 샘플 = 빈 배열(GCS 에셋 부재) → 직접 업로드만 가능
- 중복: Canvas 비교컷·다운로드·로딩이 app/profiles 양쪽 별개 구현

### 1-3. 의사결정 히스토리 (세션)
- 3월 내부도구 → 3/18 v2 SPA → 4/28 paused→active(상품화) → 5월 iOS 독립(PhotoMonk) → 5/31 VTON
- "버텍스가 메인, Gemini API는 nano-banana만 우회"(3/1) — 단 nano-banana-pro가 Vertex 미제공이라 generativelanguage 키 사용 중
- 5/31 확정: 이너웨어/노출 = 클라우드 불가 → 4060 로컬(CatVTON)

---

## 2. 통합 프레임워크

### 2-1. 제품 지형도 — 1엔진 4제품

```
            ┌─────────────────────────────────────────┐
            │   MONKOS Image Engine (생성 엔진 레이어)    │
            │   - 모델 라우터 (용도×엔진×안전 매트릭스)     │
            │   - 프롬프트 빌더 (공통 + 제품별)            │
            │   - 정체성 보존 (헌법 1조 3항)              │
            └───────────────┬─────────────────────────┘
                            │ 공유
   ┌──────────┬────────────┼────────────┬──────────────┐
   ▼          ▼            ▼            ▼              ▼
IDPHOTO    PROFILES      VTON        STUDIO         (코칭)
증명사진    프로필사진     패션착장    엔진실험실+      Vision/
(무료미끼) (고단가수익)  (이너웨어)   샘플생산소      Gemini Live
클라우드    클라우드      4060로컬     전엔진          온디바이스
```

- **STUDIO = 엔진 백본 + 실험실**: 외부 상품이 아니라, 나머지 3제품이 쓰는 엔진을 개발/튜닝하고 **샘플 자산을 대량 생산**하는 내부 거점. (현재 INTERNAL 무인증인 이유)
- **IDPHOTO / PROFILES / VTON = 외부 제품**: 같은 엔진 레이어를 호출하되, 입력 UX·프롬프트·과금만 다름.

### 2-2. 엔진 레이어 — 용도×엔진×안전 라우팅 매트릭스

5/31 실측으로 경계가 확정됨. 이것이 모델 라우터의 핵심 규칙:

| 용도 | 1순위 엔진 | 비고 | 안전 |
|------|-----------|------|------|
| 증명사진 I2I | gemini-3-pro (→ Imagen4 검토) | 규격 보존 | 표준 |
| 일반 프로필 I2I | nano-banana-2/pro | 실측 우위 | 표준 |
| 비노출 패션 VTON | nano-banana (레퍼런스 합성) | 정장·캐주얼 OK | 표준 |
| **이너웨어/노출 패션** | **4060 CatVTON (로컬)** | 클라우드 출력거부 → 로컬 유일 | 로컬 무검열 |
| T2I Before(모델 생성) | Imagen 4 | I2I 불가, T2I 전용 | — |

→ **모델 라우터 = `engines/` 어댑터 + 이 매트릭스**. 증명사진 하드코딩도 어댑터로 흡수.
→ 어댑터 인터페이스: `generate({image, prompt, aspectRatio, safety}) → {imageBase64, meta}` (기안서 PROPOSAL_20260428 계승)

### 2-3. 입력·스타일링 체계 — 레퍼런스 + 스키마 하이브리드

현재 두 방식이 따로 논다 → **합친다**:
- **A. 스키마 입력** (키워드 선택): 9축(트리밍·배경·용도·의상·헤어·메이크업·포즈·표정 + 조명·무드 자동) — ⭐ **server.js:61-156 키워드맵 이미 존재, 활성화만 하면 됨**
- **B. 레퍼런스 입력** (이미지): master + fashion/hair/makeup/background override (현 프로필 모드)
- **하이브리드**: 레퍼런스로 베이스 + 스키마 키워드로 보강 → `buildProfilePrompt`에 키워드맵 주입

**티어 매핑**:
| 티어 | 입력 | 노출 축 |
|------|------|--------|
| Basic | 스키마 3축(용도·트리밍·배경) | 조명·무드 자동 |
| Creator | +스키마(인테리어·표정) | — |
| Lookbook | +레퍼런스(의상·헤어·메이크업·포즈) | VTON 연동 |

### 2-4. 프롬프트 아키텍처 (기안서 계승)
```
prompts/
├── common.js   ← IDENTITY_PRESERVATION, 연령분기, 안전가드 (전 제품 공유)
├── idphoto.js  ← buildPromptV5 (증명사진 정본, 수정금지)
├── profile.js  ← 9축 스키마 + 레퍼런스 하이브리드
└── vton.js     ← CatVTON 마스크/착장 프롬프트 (신규)
```

### 2-5. 데이터·자산 파이프라인 — Studio 실험실의 본 역할
- **샘플 생산**: Studio가 9축 조합으로 갤러리 샘플(의상/헤어/배경/포즈 썸네일)을 **대량 생성 → GCS `monk-ai-images/profiles/`** → templates.js 빈 배열 해소 (현 P0 갤러리 문제의 근본 해결)
- **아카이브**: 생성물 GCS + Firestore `studio_archive`. 우수 컷은 샘플로 승격
- **VTON 입력**: 4060 `monk_assets`(이미 전송됨) + Imagen4 모델컷 → CatVTON

### 2-6. 코드 리팩토링 (중복 제거)
- `shared/image-utils.js` 신설: Canvas 비교컷·dataURL↔Blob·이미지로드 (app/profiles 공유)
- 미사용 9축 키워드맵 → profile.js로 이관·활성화
- 증명사진 모델 하드코딩 → 엔진 어댑터로

---

## 3. 통합 로드맵 (Phase 정렬)

| Phase | 내용 | 의존 | 우선 |
|-------|------|------|------|
| **F0 빠른 승리** | 9축 키워드맵 활성화(이미 코드 존재) + 프로필 전용 프롬프트(정면컷 탈피) + studio 프론트 P1(진행중) | 없음 | **P0** |
| **F1 갤러리 자산** | Studio로 샘플 대량생산 → GCS 적립 → templates 연결 | F0 | P0 |
| **F2 엔진 라우터** | engines/ 어댑터 + 용도×엔진 매트릭스 (증명사진 하드코딩 흡수) | — | P1 |
| **F3 VTON 통합** | 4060 CatVTON PoC → Lookbook 티어 의상 입력 연동 | PF_VTON | P1 |
| **F4 프로덕션 분리** | Profiles 외부 서비스화(서브도메인·과금·결제) + 무료미끼 퍼널 | F1~F2 | P1 |
| **F5 코칭** | Vision 온디바이스(PhotoMonk) + Gemini Live 백업 | — | P2 |

---

## 4. 빠른 승리 (즉시 착수 가능)

1. **9축 스타일링 활성화** — `PROFILE_FRAMING/BG/LIGHTING/MOOD/OUTFIT/HAIR/POSE/MAKEUP_MAP`이 server.js에 이미 정의됨. `buildProfilePrompt`에 주입만 하면 Basic 티어 스타일링 즉시 구현. **신규 개발 거의 없음.**
2. **프로필 전용 프롬프트** — "증명사진 정면컷 나옴" 문제(작가님 4/28 지적)는 프로필 모드가 증명사진 톤을 안 타게 profile.js 분리로 해결.
3. **갤러리 샘플** — Studio 실험실로 대표 조합 생산 → GCS → 빈 갤러리(P0) 해소.

---

## 5. 결정 필요 (작가님)

1. **Profiles 분리 수준**: 별도 서브도메인(profiles.monkos.ai)인가, studio 내 모드인가?
2. **프로필 크레딧 단가**: 증명사진 대비 배수 + 번들 구조
3. **엔진 라우터 범위**: 증명사진 하드코딩까지 어댑터로 흡수할지(리스크: 안정 운영 중인 증명사진 건드림)
4. **VTON ↔ Lookbook 연결 시점**: VTON PoC 성공 후 바로 프로필 Lookbook에 붙일지

---
*기안: 2026-05-31 iMac/쌍아 · 3축(기획·코드·히스토리) 종합 설계*
