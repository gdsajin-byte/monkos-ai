---
type: report
date: 2026-07-19
device: iMac
agent: 막내3
status: 마감
portfolio: PF_SPECS
---

# GSC 404 소스 링크 조사 — 내부 잘못된 크로스 링크 추적·교정

**[2026-07-19 13:57 KST]** iMac/막내3 → 작가님

## 조사 결과

### GSC 보고 3건 분석

| # | 404 URL | GSC 소스 | 현황 | 조치 |
|---|---------|----------|------|------|
| 1 | `monkos.ai/idphoto-kr/` | `idphoto-kr.monkos.ai/app` | 현행 index.html 이미 수정됨. `_legacy_spa/index.html`에 잔존 | _legacy_spa 교정 |
| 2 | `monkos.ai/idphoto-jp/` | `idphoto-jp.monkos.ai/app` | 현행 index.html 이미 수정됨. 잔존 없음 | 연관 파일 교정 |
| 3 | `monkos.ai/portal` | `monk.kr/ai_lab/ai_lab` | **활성 소스** | 교정 완료 |

### 교정 상세

| 파일 | 행 | Before | After |
|------|-----|--------|-------|
| `monkos_AI/idphoto-kr/public/_legacy_spa/index.html` | 14,22,23,24,33 | `monkos.ai/idphoto-kr/`, `monkos.ai/idphoto-jp/` | `idphoto-kr.monkos.ai/`, `idphoto-jp.monkos.ai/` |
| `monkos_AI/studio/public/_legacy_spa/index.html` | 14,22,23,24,33 | 동일 | 동일 교정 |
| `MONK_kr/ai_lab/photolab/index_00079.html` | 14,22,23,24,33 | 동일 | 동일 교정 |
| `MONK_kr/ai_lab/ai_lab.html` | 92 | `https://monkos.ai/portal` | `https://monkos.ai/` |
| `monkos_AI/portal/public/backup/v3/index.html` | 25 | `monkos.ai/idphoto-kr/` | `idphoto-kr.monkos.ai/` |

### Task 4: 추가 발견 (미교정 — apps/ PoC 영역, 비서빙)

| 파일 | 비고 |
|------|------|
| `apps/photolab-monkkr-mpa-0219/index_00079.html` | 프로토타입, 비배포 |
| `apps/idphoto-jp-v079/public/index.html` | 프로토타입, 비배포 |

## 배포 필요 여부

| 서비스 | 변경 유무 | 배포 필요 |
|--------|----------|----------|
| idphoto-kr | `_legacy_spa` (static 서빙) | O — deploy.sh |
| idphoto-jp | 변경 없음 | X |
| monk.kr (CF Pages) | `ai_lab.html` + `photolab/` | O — CF Pages |
| portal | `backup/v3/` (static 서빙) | O — deploy.sh |
| studio | `_legacy_spa` (static 서빙) | O — deploy.sh |

## 비고

- idphoto-kr/jp의 현행 `public/index.html`은 기존에 올바른 서브도메인 URL로 수정 완료 상태
- GSC 크롤 일자(3/13, 5/7)가 오래됨 → 현행 `/app` 서빙 파일은 이미 정상
- `_legacy_spa`는 express.static으로 공개 접근 가능하므로 교정 필요
