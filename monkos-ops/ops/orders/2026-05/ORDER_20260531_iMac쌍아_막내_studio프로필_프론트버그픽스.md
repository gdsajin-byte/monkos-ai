---
type: order
date: 2026-05-31
device: iMac
agent: 쌍아
to: 막내
status: 발행
portfolio: PF_STUDIO
---

# ORDER — MONKOS Studio 프로필 모드 프론트 버그픽스 (P1 묶음)

**발신**: iMac/쌍아 → **수신**: 막내
**대상 서비스**: monkos-studio (studio.monkos.ai/profiles, INTERNAL 무인증)
**PF**: PF_STUDIO (착수 전 Read 필수)

---

## 배경

작가님이 studio 프로필 모드(이너웨어/패션 VTON 실험)를 실사용 중 4건의 프론트 결함을 포착.
일반 의상 VTON(nano-banana)은 정상 작동 확인됨. 아래 4건은 앱 완성도(P1) 버그로, 한 번의 재배포로 묶어 처리한다.

> ⚠️ **P0 갤러리(GCS 샘플 에셋 부재)는 이번 범위 제외** — 별도 에셋 생성 작업이라 본 지시서에 포함하지 않는다. 손대지 말 것.

---

## 작업 범위 (4건)

### 1. [P1] 다운로드 — Blob URL 전환 (핵심)
**증상**: "다운로드" 클릭 시 파일이 저장 안 됨 (브라우저 표시만, 실제 미저장).
**원인**: 대용량 dataURL(PNG ~1.9MB)을 `<a download href="data:...">`로 프로그래매틱 다운로드 → Chrome이 조용히 실패. (작은 비교컷 jpg는 성공했던 게 증거)
**위치**: `monkos_AI/studio/public/profiles/ui-workspace.js`
- `btnDlAfter` (L148-154): dataURL href → **Blob 변환 후 ObjectURL**
- `btnDlCompare` (L156-188): `canvas.toDataURL` → **`canvas.toBlob`** 로 동일 처리
**참고 패턴**:
```js
const blob = await (await fetch(state.generatedImage)).blob();
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url; link.download = `monkos_profile_${Date.now()}.png`;
document.body.appendChild(link); link.click(); link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

### 2. [P1] 생성 히스토리 렌더링
**증상**: 생성 결과가 누적 표시되지 않음. `addToHistory()`가 `state.history`에 `unshift`만 하고 UI 렌더 없음.
**위치**: `ui-gallery.js:164` (addToHistory) + `ui-workspace.js`
**요구**: 세션 내 생성 결과를 썸네일 스트립으로 누적 표시 → 클릭 시 결과 프리뷰(`showResult`)에 재로딩. (새로고침 시 휘발 허용. localStorage 영속화는 선택)

### 3. [P1] 가짜 진행률 개선
**증상**: 진행바가 10→30→80%로 하드코딩돼, 실제 생성(수~수십초)이 길면 80%에서 멈춘 듯 보임.
**위치**: `api.js` (progressFill 수동 설정 구간)
**요구**: 시간 기반 점진 증가(예: 예상치까지 자동 90% 수렴) 또는 인디터미닛 스피너로 전환. 완료 시 100% 후 종료.

### 4. [P1] 에러 처리 — 거부 사유 노출
**증상**: 생성 거부 시 `alert("...응답에 이미지가 없습니다")`로 뭉개짐. 실제 사유(안전정책 거부 등) 불명.
**위치**:
- 프론트 `api.js`: `alert()` → 인라인 배너/토스트
- 서버 `monkos_AI/studio/server.js:567-569`: `imagePart` 미발견 시 **`candidates[0].finishReason` + `promptFeedback.blockReason` + 텍스트 part 를 `log()`로 기록**하고, 사용자에게 구체 메시지 반환 (예: "안전 정책상 생성이 거부되었습니다 (사유: IMAGE_SAFETY)").

---

## ⚠️ 준수 조항

- **배포는 `cd monkos_AI/studio && ./deploy.sh prod` 경유 필수** (헌법 5장 2조). `gcloud run deploy`/`gcloud builds submit` 직접 실행 **금지**.
- 브랜치 **main 단일** (ch6). 작업 전 `git pull`.
- studio는 INTERNAL 무인증 — 크레딧/고객데이터 무관 (ch4 10조 대상 아님).
- **범위 밖 작업 금지** (특히 P0 갤러리 GCS 에셋). 추가 필요 시 보고 후 대기.
- 완료 시: COMPLETION 보고서 → `monkos-ops/ops/reports/2026-05/` + 세션로그 어펜드 + **PF_STUDIO 히스토리 1행 어펜드** + 커밋·푸시.

## 검증 (완료 기준)

1. 생성 → 다운로드 → **파일이 정상 열림** (PNG/비교컷 jpg 모두)
2. 연속 생성 시 **히스토리 썸네일 누적** + 클릭 재로딩
3. 생성 중 진행바가 80%에서 멈춰보이지 않음
4. 거부 케이스(예: 노출 인물 입력)에서 **구체 사유 메시지** 표시 + 서버 로그에 finishReason 기록

---
*발행: 2026-05-31 iMac/쌍아*
