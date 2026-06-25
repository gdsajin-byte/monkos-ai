---
type: order
date: 2026-06-25
from: iMac/쌍아
to: iMac/막내
portfolio: PF_PORTAL
status: 완료
---

# 지시서: Specs v2 P2 — 크롭 Phase 제거 + 검수 프롬프트 강화

**[2026-06-25 17:42 KST]** iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → 작가님` 형식

## 배경
Specs v2에 크롭앱(FaceMesh)을 인라인 임베드했으나, 상반신·링크드인 화각 등 얼굴 비중이 작은 사진에서 FaceMesh가 랜드마크를 못 잡는 문제 확인. 크롭을 무료 단계에서 직접 처리하는 건 복잡도·클레임 대비 가치가 낮다고 판단. **크롭 Phase를 걷어내고, 기존 AI 검수(precheck)에 입력 품질 판정을 추가**하는 방향으로 전환.

## 목표
1. V2 페이지에서 크롭 Phase(P1에서 추가한 전체)를 제거
2. Gemini precheck 프롬프트에 "사진 적합성" 항목 추가
3. 동선을 `업로드 → AI 검수(무료) → 결제 → AI 리터칭 → 완성`으로 단순화

## 대상 파일
- `monkos_AI/portal/lib/cms/render-specs.js` — V2 Fragment
- `monkos_AI/portal/server.js` — precheck 프롬프트 (L289~353)

## 작업 내용

### 1. 크롭 Phase 제거 (render-specs.js)

P1(커밋 `94cfa044`)과 P1.5(커밋 `06f93195`)에서 추가한 크롭 관련 코드를 **전부 제거**:

- `v2-phase-crop` HTML 블록 삭제
- 크롭 CSS (`v2-crop-*` 클래스) 삭제
- 크롭 JS: FaceMesh 초기화, `initCropFaceMesh`, `detectCropLandmarks`, `extractLandmarks`, `autoPlace`, `renderCrop`, `performCrop`, `splinePath`, 드래그 핸들러, `tryGeminiAlign` — 전부 삭제
- `SAMPLE_POINTS`, `FM_IDX`, `COLORS` (크롭 전용) 삭제
- MediaPipe FaceMesh CDN `<script>` 태그 삭제
- `cropPts`, `cropImgPos`, `cropImgScale`, `cropLoadedImg`, `cropFaceMesh*`, `cropLast*`, `cropSvgBuilt` 등 크롭 상태 변수 삭제

**유지하는 것:**
- Phase 1 (업로드 드롭존) — 그대로
- Phase 3 (AI 검수 결과) — 그대로, 단 업로드 직후 바로 연결
- Phase 4~5 (결제, 생성, 결과) — 그대로

### 2. 동선 재연결

```
업로드 완료 → 바로 Phase 3(AI 검수) 진입
```

현재: 업로드 → Phase 2(크롭) → "AI 규정검수" 클릭 → Phase 3
변경: 업로드 → **바로** `/api/idphoto/precheck` 호출 → Phase 3(검수 결과) 표시

- 업로드 완료 시 "AI 검수 중..." 스피너 표시 → precheck 응답 → 결과 표시
- "크롭 다운로드" 버튼 제거 (무료 크롭은 `/crop` 페이지로 안내)
- Phase 3 하단에 "무료 크롭이 필요하시면 [크롭앱 →](/crop)" 링크 추가

### 3. precheck 프롬프트 강화 (server.js L289~353)

기존 7개 항목에 **ITEM 8 추가**:

```
ITEM 8 — "사진 적합성" (Photo suitability):
- FAIL if: multiple faces detected, face occupies less than ~20% of image area, face is not clearly identifiable (too blurry, too dark, or too distant), image resolution is extremely low (under 200px on shorter side), or it's a full-body/group photo where the face is small.
- WARN if: face is somewhat small but still identifiable (~20-30% of image), slight blur but features are distinguishable. Warn message should note: "얼굴 비중이 작아 AI 보정 시 본인과 다르게 나올 수 있습니다. 가슴 위까지 나온 사진을 권장합니다."
- PASS if: single face, clearly visible, face occupies roughly 30%+ of image, adequate resolution.
```

JSON 응답 구조에 추가:
```json
{"id":"suitability","label":"사진 적합성","pass":bool,"warn":bool,"warnMsg":"string or null"}
```

`warnMsg` 필드 신설 — 기존 7개 항목은 null, ITEM 8만 warn일 때 구체적 안내 메시지 반환.

### 4. 검수 결과 UI에 warnMsg 표시

Phase 3의 체크리스트 렌더링에서 `warn=true`이고 `warnMsg`가 있으면 해당 항목 아래에 안내 메시지 표시:
```html
<div class="v2-check-warn-msg">얼굴 비중이 작아 AI 보정 시 본인과 다르게 나올 수 있습니다. 가슴 위까지 나온 사진을 권장합니다.</div>
```

### 5. /api/idphoto/align 엔드포인트

P1.5에서 추가한 `/api/idphoto/align` 엔드포인트(server.js L356~404)도 **삭제**. 더 이상 사용하지 않음.

## ⚠️ 준수 조항
- 헌법 4조 3항: 외부 표기는 "MONKOS". Gemini 엔진명 노출 금지.
- ch2: HTML `kebab-case`, JS `camelCase`
- 배포 시 `deploy.sh prod` 경유 필수 (ch5 2조).
- V2 URL: `https://monkos.ai/specs/kr-passport` (1-segment, `/kr/` 접두어 없음).
- **⚠️ COMPLETION 보고서 필수 (ch7 1조)**: 완료 시 `monkos-ops/ops/reports/2026-06/COMPLETION_20260625_iMac막내N_SPECSv2_P2_크롭제거_검수강화.md` 생성.

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | `PF_PORTAL` |
| 마무리 | `배포` |
| 산출물 | render-specs.js + server.js 수정 + **COMPLETION 보고서** |
| 문서 유형 | `COMPLETION` |
| 세션 로그 | `[log] 태그 커밋` |
