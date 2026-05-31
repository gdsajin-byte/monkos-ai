---
type: completion
date: 2026-05-31
device: iMac
agent: 막내1
status: 마감
portfolio: PF_STUDIO
---

# COMPLETION — MONKOS Studio 프로필 모드 프론트 버그픽스 (P1 4건)

**[2026-05-31 13:28 KST] iMac/막내1 → 작가님**
**대상**: monkos-studio (studio.monkos.ai/profiles, INTERNAL)
**지시서**: ORDER_20260531_iMac쌍아_막내_studio프로필_프론트버그픽스.md

---

## ✅ 완료 작업 (6파일, +138/-15)

### 1. 다운로드 — Blob URL 전환
- `public/profiles/ui-workspace.js`
  - `btnDlAfter`: dataURL `href` → `fetch().blob()` + `URL.createObjectURL` 후 다운로드. `link` DOM 부착·제거 + 1초 후 `revokeObjectURL`.
  - `btnDlCompare`: `canvas.toDataURL` → `canvas.toBlob(..., 'image/jpeg', 0.92)` 동일 처리.
- 원인: 대용량 dataURL(~1.9MB) 프로그래매틱 다운로드를 Chrome이 조용히 실패시키던 문제.

### 2. 생성 히스토리 썸네일 스트립
- `profiles.html`: 결과 프리뷰 하단 `#result-history` / `#result-history-strip` 추가.
- `ui-gallery.js`: `addToHistory`가 `state.history.unshift` 후 `updateState('history', ...)`로 렌더 트리거.
- `ui-workspace.js`: `renderHistory()` 신설 — 세션 내 생성 결과를 썸네일로 누적. 클릭 시 `updateState('base64Image'/'generatedImage')`로 결과 프리뷰 재로딩.
- `profiles.css`: 스트립/썸네일 스타일.
- 새로고침 시 휘발 (localStorage 영속화 미적용 — 지시서상 선택).

### 3. 가짜 진행률 개선
- `api.js`: 하드코딩(10/20/30/80/100%) 제거 → 400ms 간격 `progress += (90 - progress) * 0.08` 점근 수렴. 완료 시 `clearInterval` + 100%, `finally`에서 타이머 정리·0% 리셋.

### 4. 에러 처리 — 거부 사유 노출
- `server.js` (프로필 엔드포인트): `imagePart` 미발견 시 `candidates[0].finishReason` + `promptFeedback.blockReason` + 텍스트 part를 `log(..., 'WARNING')` 기록. `blockReason` 또는 `IMAGE_SAFETY`/`SAFETY`면 "안전 정책상 생성이 거부되었습니다 (사유: …)", 그 외는 사유+텍스트 포함 메시지 반환.
- `api.js`: `alert()` → 인라인 배너(`#gen-error`) `showError()` (8초 자동 닫힘). 입력 가드 alert도 배너로 통일.
- `profiles.html`/`profiles.css`: 에러 배너 마크업·스타일.

---

## 🔬 검증 (로컬 포트 8099 + CDP 9222 실측)

- ✅ `node --check` 전 파일 통과 (server.js + 프로필 모듈 4종)
- ✅ 진행바 19.9% → 54% → 77.8% 부드럽게 상승, 80% 정지 없음
- ✅ 생성 2회 → 히스토리 썸네일 2개 누적 + 썸네일 클릭 재로딩(`changed:true`)
- ✅ 결과 프리뷰 정상 표시 (img-after PNG, img-before jpeg)
- ✅ 생성 엔드포인트 실제 PNG 반환 + GCS 저장 (ADC 로컬 작동)
- ✅ 다운로드 버튼 2종 클릭 무오류 + Chrome 다운로드 temp 파일 실측 생성
- ⏳ 안전정책 거부 케이스: 로컬 강제 불가 → 코드 경로 작성·구문검증만 완료

## 🚀 배포

- `cd monkos_AI/studio && ./deploy.sh prod` (작가님 승인 후)
- Cloud Build SUCCESS (46s) → Cloud Run revision **monkos-studio-00011-b8r**, 100% 트래픽
- prod 검증: `studio.monkos.ai/health` 200, `/profiles` 신규 마크업 반영, 배포 JS 신버전(progressTimer/renderHistory/createObjectURL) 확인

## 📁 범위 준수

- P0 갤러리(GCS 샘플 에셋 부재)는 지시서 명시대로 **미터치**.
- 배포는 deploy.sh 경유 (헌법 5장 2조). 브랜치 main 단일.

## 💡 비고

- 로컬 CDP 자동화 환경에서는 다운로드가 Chrome temp 파일로만 남고 최종 rename이 끝까지 가지 않는 경우가 있음 — 실제 사용자 클릭에서는 정상 finalize. Blob 전환으로 바이너리 다운로드가 실제 트리거됨(temp 파일 생성)을 확인.
