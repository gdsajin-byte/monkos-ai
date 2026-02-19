# photolab MPA 전환 기술명세

**작성**: [2026-02-18 22:43 KST] M1/막내1
**베이스라인**: SPA (index.html + app.js + monk.js) → 00079 코드
**현재 상태**: MPA 5페이지 구조 — 1차 전환 완료, 실기기 플로우 검증 통과

---

## 1. 아키텍처 변경 요약

| 항목 | SPA (before) | MPA (after) |
|------|-------------|-------------|
| 화면 전환 | `Screen.go()` (JS 상태 머신) | `location.href` (페이지 이동) |
| 엔트리 | `app.js` 1파일 (829줄) | `shared.js` + 5개 페이지 JS |
| HTML | `index.html` 1파일 (293줄) | 5개 HTML (공통 요소 복사) |
| 데이터 전달 | JS 변수 (메모리) | `sessionStorage` (`monkos_` prefix) |
| 코칭 | WebSocket (Gemini Live) | 스텁 (REST 코칭 별도 태스크) |
| monk.js | Screen + Store + Pipe(WS+REST) + Media | Store + Pipe(REST) + Media (Screen/WS 미사용, 코드 잔류) |

## 2. 파일 구조

```
MONK_kr/ai_lab/photolab/
├── index.html          ← 준비실 (스타일/성별/연령 선택)
├── camera.html         ← 촬영실 (카메라 + 코칭 스텁)
├── result.html         ← 분석실 (생성 + QC + 다운로드)
├── thankyou.html       ← 수령처 (크롭 사진 표시 + 저장)
├── options.html        ← 옵션N (네비게이션 카드)
│
├── shared.js           ← 공통 로직 (Store, Pipe REST, 인증, 크레딧, 결제)
├── prep.js             ← 준비실 JS
├── camera.js           ← 촬영실 JS
├── result.js           ← 분석실 JS
├── thankyou.js         ← 수령처 JS
├── options.js          ← 옵션N JS
│
├── monk.js             ← 프레임워크 (변경 없음)
├── config.js           ← 설정 + 상수 (변경 없음)
├── app.css             ← 스타일 (변경 없음, 전 페이지 공유)
│
├── app.js              ← SPA 원본 (잔류 — 삭제 보류)
├── index_spa_backup.html  ← SPA 백업
├── app_spa_backup.js      ← SPA 백업
└── monk_spa_backup.js     ← SPA 백업
```

## 3. 페이지별 책임

### index.html + prep.js (준비실)
- 스타일 선택 (id_photo / resume)
- 성별/연령 선택
- 프로필 완성도 체크 → 촬영 시작 버튼 활성화
- sessionStorage에 선택 데이터 저장 → `camera.html` 이동

### camera.html + camera.js (촬영실)
- `Monk.media()` 카메라 시작 (전면 카메라, 미러링)
- 얼굴 가이드 오버레이 + 코칭 오버레이
- **코칭: 스텁** (`startCoachingLoop()` → 초기 인사만 표시)
- 음성 TTS (Web Speech API — `speechSynthesis`)
- 촬영 → sessionStorage에 `captured` 저장 → `result.html` 이동

### result.html + result.js (분석실)
- 원본 이미지 표시 (sessionStorage에서 로드)
- **파이프라인**: 사전분석(precheck) → AI 생성(generate) → QC 검증
- 생성 실패/크레딧 부족 시 에러 처리 + 크레딧 모달
- QC PASS → 다운로드 버튼 활성화
- 다운로드: 크레딧 차감 → 규격 크롭 → sessionStorage에 `cropped` 저장 → `thankyou.html` 이동

### thankyou.html + thankyou.js (수령처)
- 크롭된 증명사진 표시
- 갤러리 저장 (`navigator.share` 또는 `<a download>` 폴백)
- 텔레그램 이벤트 링크
- 추가 촬영 → `camera.html` / 새로 촬영 → `index.html`

### options.html + options.js (옵션N)
- 네비게이션 카드: 새로 촬영, 추가 촬영, 이벤트, 포털
- `clearSessionImages()` 후 이동

## 4. 데이터 흐름

```
[sessionStorage]

prep.js                 camera.js               result.js               thankyou.js
─────────              ──────────              ──────────              ────────────
style ────save──→       ←──load── style         ←──load── style
gender ───save──→       ←──load── gender        ←──load── gender
age ──────save──→       ←──load── age           ←──load── age
                        captured ──save──→       ←──load── captured
                                                 cropped ──save──→      ←──load── cropped
```

**키 명명**: `monkos_style`, `monkos_gender`, `monkos_age`, `monkos_captured`, `monkos_cropped`
**용량**: captured ~100KB (JPEG 0.8), cropped ~50KB → 합계 ~200KB (sessionStorage 5MB 한도 내)

## 5. API 경로 (변경 없음)

| 엔드포인트 | CF Function | 백엔드 |
|-----------|-------------|--------|
| `/api/idphoto-precheck` | `functions/api/idphoto-precheck.js` | `idphoto-kr.monkos.ai/api/precheck` |
| `/api/idphoto-generate` | `functions/api/idphoto-generate.js` | `idphoto-kr.monkos.ai/api/generate` |
| `/api/idphoto-qc` | `functions/api/idphoto-qc.js` | `idphoto-kr.monkos.ai/api/qc` |
| `/credit/use` | **미구현** | `monkos.ai/api/credits/use` |

## 6. 알려진 이슈 (TODO)

| # | 이슈 | 심각도 | 설명 |
|---|------|--------|------|
| 1 | 코칭 미구현 | 중 | REST ~3fps 코칭 별도 태스크. 현재 스텁(초기 인사만) |
| 2 | `/credit/use` CF Function 없음 | 중 | 다운로드 크레딧 차감 프록시 미구현 |
| 3 | 생성 지연 체감 | 저 | Cloud Run 콜드스타트 + Imagen 처리 (~30초). 프로그레스 UI 개선 필요 |
| 4 | Store 초기 DOM 동기화 | 완료 | `sharedInit()`에서 전체 키 재할당으로 해결 |
| 5 | `#camera-area` .active 누락 | 완료 | camera.js init에서 직접 추가로 해결 |
| 6 | app.js/SPA 잔류 파일 | 저 | 검증 완료 후 삭제 판단 |
| 7 | 코칭 CF Function 미구현 | 중 | `/api/idphoto-coaching` → Gemini API 직접 호출 구조 |
| 8 | app.css 미분할 | 저 | 전 페이지 공유 중. 페이지별 분할은 후순위 |

## 7. 실기기 검증 결과 (2026-02-18)

| 단계 | 결과 | 비고 |
|------|------|------|
| 준비실 → 촬영실 | OK | sessionStorage 전달 정상 |
| 카메라 작동 | OK | 전면 카메라 + 미러링 |
| 코칭 표시 | 스텁 | 초기 인사만 (REST 코칭 미구현) |
| 촬영 → 분석실 | OK | captured 이미지 전달 정상 |
| AI 생성 | OK | 지연 있음 (콜드스타트) |
| QC 표시 | OK | 배지 + 점수 표출 |
| 다운로드 버튼 | OK | QC PASS 시 활성화 |
| 수령처 이동 | OK | 크롭 이미지 표시 |

## 8. 배포 정보

- **배포 경로**: `wrangler pages deploy . --project-name=monk-kr --branch=main`
- **테스트 URL**: `https://monk.kr/ai_lab/photolab/`
- **데스크탑 우회**: URL에 `?dev` 파라미터 추가
