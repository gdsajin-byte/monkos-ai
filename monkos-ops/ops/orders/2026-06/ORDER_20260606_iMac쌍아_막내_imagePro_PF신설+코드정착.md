---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내
subject: PF_IMAGE_PRO 신설 — 개발 히스토리 + 코드 분포 정리 + 아키텍처 정본 수립
status: 대기
portfolio: (신설)
---

# 지시서: PF_IMAGE_PRO 신설 — 코드 정착

> **배경**: image_pro(image.monkos.ai)는 초창기 개발 후 PF 없이 운영됨.
> 코드가 여러 곳에 분산(MONK_kr, apps/monk_imagen4, CF Functions, Cloud Run)되어 유지보수 시마다 혼동 발생.
> 2026-06-06 세션에서 다운로드/애널라이저/프롬프트 오염 등 연쇄 이슈 — 근본 원인은 코드 분포와 아키텍처가 정리 안 된 것.
> **목적**: PF 신설하여 정본 수립. 이후 유지보수 시 이 PF를 먼저 참조하면 동일 혼동 재발 방지.

---

## 1. PF_IMAGE_PRO 신설

`monkos-ops/ops/portfolios/PF_IMAGE_PRO/README.md` 생성.

### YAML frontmatter

```yaml
type: portfolio
id: PF_IMAGE_PRO
name: IMAGE_PRO
subject: MONKOS Image Pro — AI 이미지 생성/변주/분석 플랫폼 (image.monkos.ai)
created: 2026-01-16
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
```

### 포함할 섹션

#### 1) 비전
- image.monkos.ai — 내부 스태프용 AI 이미지 생성 도구
- T2I(텍스트→이미지), I2I(이미지→이미지 변주), Analyze(리버스 프롬프트), Translate(번역)
- Vertex AI Imagen 4 (T2I) + Gemini 3 Pro Image Preview (I2I) + Gemini 2.5 Flash (분석/번역)

#### 2) 아키텍처 정본 — 가장 중요한 섹션

아래 내용을 **정본**으로 수립. 막내3 보고서(`COMPLETION_20260606_막내3_imagePro_코드구조_전수조사.md`)의 §1, §2, §4, §7을 기반으로 작성하되, 현재 상태 기준으로 보정.

```
[프로덕션 — image.monkos.ai]
Cloud Run: monk-image-engine (us-central1)
├── server.js (Express, Node 20)
│   ├── POST /generate → Vertex AI Imagen 4 Fast/Ultra (T2I)
│   ├── POST /refine → Gemini 3 Pro Image Preview (I2I/Edit/Upscale)
│   ├── POST /analyze → Gemini 2.5 Flash (리버스 프롬프트)
│   ├── POST /translate → Gemini 2.5 Flash (번역)
│   ├── POST /api/upload → 크래시 방지 스텁 (실제 GCS 저장 미구현)
│   └── GET * → public/ 정적 서빙 (SPA fallback)
├── public/index.html — Staff 로그인
└── public/app/
    ├── index.html → index-v6.js 로드
    └── assets/index-v6.js — 프론트 빌드 번들 (원본 TSX 소스 부재)

[레거시 — monk.kr/ai_lab/image_pro/]
CF Pages: v5 번들 + CF Functions
(이중 서빙 상태, 정리 대상)

[개발 소스 — 미사용/분기]
apps/monk_imagen4/ 내 modules/, components/, services/ — v6과 분기됨
```

#### 3) 코드 위치별 판정 테이블

막내3 보고서 §2 테이블 그대로 편입 (10개 위치).

#### 4) 히스토리

git log에서 image_pro 관련 커밋을 역추적하여 주요 마일스톤을 기록:

```bash
git log --oneline --all -- apps/monk_imagen4/ MONK_kr/ai_lab/image_pro/ | head -30
```

최소 포함 항목:
- 초기 개발 (MONK_kr 시절)
- image.monkos.ai 이관 (Cloud Run)
- v5 → v6 빌드
- 2026-06-05 INCIDENT (타임아웃/일러스트편향/키삭제)
- 2026-06-06 유지보수 (애널라이저/다운로드/EXPORT/localStorage)

#### 5) 알려진 이슈

현재 잔존 이슈 목록:
- v6 번들 원본 소스 부재 → 프론트 수정 시 minified JS 직접 패치 필요
- localStorage 오염 → 서버 단 CRITICAL INSTRUCTION 클리너로 우회 중, 프론트 근본 수정 필요
- /api/upload 스텁 → 실제 GCS 저장 미구현
- EXPORT 단컷 내보내기 → 검증 필요
- 이중 서빙 (image.monkos.ai + monk.kr) → 정리 대상
- auth.json 평문 인증 → 보안 이슈

#### 6) 복기

2026-06-06 세션 교훈:
- PF 없이 유지보수 진입 → 코드 위치 파악에 시간 소모, 엉뚱한 소스 수정
- v6 번들 ≠ TSX 소스 → 프론트 수정 시 혼동
- localStorage 잔존이 T2I 품질에 영향 → 서버 단 방어 필요
- enhancePrompt:false 섣부른 적용 → 되던 기능 깨뜨림

#### 7) 관련 문서 인덱스

| 문서 | 위치 |
|------|------|
| 코드 구조 전수조사 | `monkos-ops/ops/completions/2026-06/COMPLETION_20260606_막내3_imagePro_코드구조_전수조사.md` |
| deploy.sh | `apps/monk_imagen4/backend/deploy.sh` |

---

## 2. portfolios/README.md 인덱스 등록

`monkos-ops/ops/portfolios/README.md`에 1행 추가:
```
| PF_IMAGE_PRO | IMAGE_PRO | MONKOS Image Pro — image.monkos.ai | active |
```

---

## 3. ⚠️ 준수 조항

- **ch4 9조**: PF YAML 필수 필드 준수
- **히스토리 append-only**: 수정·삭제 금지
- **코드 수정 금지**: 이 지시서는 PF 문서 작성만. 코드 건드리지 않는다.

---

## 4. 완료 기준

- [ ] `PF_IMAGE_PRO/README.md` 생성 — YAML + 7개 섹션
- [ ] 아키텍처 정본 수립 (현재 상태 기준)
- [ ] git log 역추적 → 히스토리 마일스톤 기록
- [ ] 알려진 이슈 목록 정리
- [ ] portfolios/README.md 인덱스 등록
- [ ] 커밋: `[docs] PF_IMAGE_PRO 신설 — image_pro 아키텍처 정본 + 개발 히스토리 정착`
