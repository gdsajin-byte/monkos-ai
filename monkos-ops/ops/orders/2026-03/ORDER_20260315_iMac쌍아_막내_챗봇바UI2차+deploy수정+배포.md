---
type: ORDER
id: ORDER_20260315_iMac쌍아_막내_챗봇바2차+갤러리+deploy+배포
date: 2026-03-15
from: iMac/쌍아
to: 막내
priority: P2
status: 대기
---

# 챗봇 바 2차 + 갤러리 실사 교체 + deploy.sh 수정 + 포털 배포

## 목표

1. 챗봇 바 모바일 출렁임 해소 (키보드 위 완전 고정)
2. 챗봇 바 데스크톱 메인 영역 폭 + 2줄 입력창
3. 갤러리 스트립 실루엣 → AI 생성 이미지 10장 교체
4. deploy.sh `--to-latest` 근본 수정
5. 포털 프로덕션 배포

## Task

### Task 1: 코드 확인 (쌍아 수정 완료, 3파일)

아래 3파일이 이미 수정되어 있음. `git diff`로 변경 내용 확인만 할 것:

**portal.css** — `.chatbot-bar` 전면 변경
- 데스크톱: `bottom: 8px` + 전면 라운드(`border-radius: 16px`) + `width: calc(100% - 380px)` max 700px
- 모바일(`@media max-width:768px`): `bottom: 0` + 상단 라운드 + `safe-area-inset-bottom` 여유 + 1줄 입력(40px) + hint 숨김
- `.cb-input`: `<textarea>` 대응 — `resize: none; height: 56px; line-height: 1.5`
- `transition` 제거 (출렁임 원인)

**index.html** — 입력창
- `<input class="cb-input">` → `<textarea class="cb-input" rows="2"></textarea>`

**main.js** — 키보드 고정 로직 개선
- `visualViewport.scroll` 이벤트 **제거** (출렁임 근본 원인)
- `resize`만 유지 + 키보드 높이 50px 임계값 적용
- Enter=전송, Shift+Enter=줄바꿈 분기 추가

### Task 2: 갤러리 코드 확인 (쌍아 수정 완료, 2파일)

아래 2파일이 이미 수정되어 있음. `git diff`로 변경 내용 확인만 할 것:

**index.html** — 갤러리 스트립
- 실루엣 placeholder 10개 (before/after 5쌍) → GCS WebP 실사 이미지 10장
- `<div class="gi-sil">` → `<img class="gi-img" src="https://storage.googleapis.com/monk-ai-images/assets/portal/slide/0311_XXX.webp">`
- before/after 라벨, 캡션 제거

**portal.css** — `.gi-img` 스타일
- `<div>` 기반 (background+flex) → `<img>` 기반 (`object-fit: cover; width: 100%; height: 100%`)
- `.gi-sil`, `.gi-cap`, `.gi-label` 관련 스타일 불필요해짐 (CSS에 잔존해도 무해)

> GCS 이미지 10장은 이미 업로드 완료:
> `gs://monk-ai-images/assets/portal/slide/0311_001~010.webp` (270x345, 장당 4~6KB)

### Task 3: deploy.sh 수정

`monkos_AI/portal/deploy.sh`에서 `--to-latest` 플래그 제거:

- **61행** `DEPLOY_FLAGS="--to-latest"` → `DEPLOY_FLAGS=""`
- **67행** `DEPLOY_FLAGS="--to-latest"` → `DEPLOY_FLAGS=""`
- **13행** 주석의 `(실서비스, --to-latest)` → `(실서비스)` 로 변경
- **32행** 사용법 안내의 `--to-latest` 문구 제거

> 근본 원인: `--to-latest`는 `gcloud run services update-traffic`의 옵션이지 `gcloud run deploy`의 옵션이 아님. `gcloud run deploy`는 기본적으로 latest 리비전에 100% 트래픽을 라우팅하므로 이 플래그 자체가 불필요.

### Task 4: 커밋

```
[ui] 챗봇 바 2차 + 갤러리 실사 교체 + deploy.sh --to-latest 제거
```

### Task 5: 포털 프로덕션 배포

```bash
cd monkos_AI/portal && bash deploy.sh prod
```

배포 후 검증:
- [ ] 데스크톱: 챗봇 바 메인 영역 폭(사이드바 제외) + 하단 8px 띄움 + 전면 라운드
- [ ] 데스크톱: 2줄 입력창, Shift+Enter 줄바꿈 동작
- [ ] 모바일: 키보드 열림 → 챗봇 바 키보드 위 고정 (출렁임 없음)
- [ ] 모바일: 키보드 열린 상태에서 스크롤해도 챗봇 바 위치 완전 고정
- [ ] 모바일: 키보드 닫힘 → 챗봇 바 바텀 복귀
- [ ] 갤러리 스트립: 실루엣 대신 AI 생성 이미지 10장 표시 + 자동 스크롤
- [ ] 갤러리 이미지: GCS에서 정상 로드 (깨짐/403 없음)
- [ ] deploy.sh: `--to-latest` 에러 없이 정상 배포 완료

## ⚠️ 준수 조항

- deploy.sh `.env` 경로: `monkos_AI/.env` (스크립트 상대경로 `../`)
- preview 모드의 `--no-traffic --tag v4-preview`는 그대로 유지 (정상 옵션)
- 155~157행의 `update-traffic --to-latest` 안내 메시지도 그대로 유지 (정상 용법)
