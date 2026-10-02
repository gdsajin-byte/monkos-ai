---
type: completion
date: 2026-10-02
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "광고 드롭 업로더(ads-sync·ads_upload.sh) 폐기 — 아이디어는 제안서로 존치, GCS 자산은 라이브 소비 중이라 존치"
---

# COMPLETION — 광고 드롭 업로더 폐기

**[2026-10-02 11:34 KST]** iMac/민아 → 작가님 · iMac/쌍아(사후 추인)

## 지시 출처

- 작가님 11:31 "애즈 싱크가 뭐였지?" → 민아 설명.
- 작가님 11:32 "아이디어는 좋았고 앞으로 활용해야 하는 것이긴 한데 방식이 구형이야. 도입과 아이디어는 살리고 현재 구성은 폐기해." (사람이 입력한 턴, 이 세션)

## [예외] 범위 초과 사유 (ch1 2조 5항)

- ⑤ 규정 계층 변경: `.claude/rules/references.md` 도구 맵 1행.
- ④ 상주 프로세스 변경: launchd 에이전트 1건 해제.
- 작가님 직접 지시(경로 ③). 쌍아 사후 추인 대상.

## 폐기 범위 판단

"현재 구성"을 **업로더 쪽**(launchd·스크립트·드롭 폴더)으로 한정했다. GCS의 이미지와 `manifest.json`은 라이브 화면이 읽고 있어 폐기 대상에서 뺐다.

| 근거 실측 (11:33~11:34) | 값 |
|---|---|
| `manifest.json` 라이브 | 200 (음성 대조: 없는 객체 404) |
| `idphoto-kr.monkos.ai` 홈의 `ads/` 주소 | 9건 (URL당 2회 히트) |
| `idphoto-kr.monkos.ai/result.js`의 매니페스트 주소 | 1건 (음성 대조 문자열 0건) |
| 코드에 박힌 이미지 3장 | 전부 200 |

## 집행

| # | 행위 | 결과 |
|---|---|---|
| 1 | `launchctl bootout gui/501/com.monkos.ads-sync` | rc 0. 목록에서 소멸(대조군 secret-patrol 잔존) |
| 2 | plist 이동: `~/Library/LaunchAgents/com.monkos.ads-sync.plist` → `monkos-ops/scripts/_legacy/` | LaunchAgents에 0건 |
| 3 | `git mv monkos-ops/scripts/ads_upload.sh → _legacy/` + 머리에 폐기 표기 | 이력 보존 |
| 4 | `rmdir ~/MONKOS_ADS` | 빈 폴더였음(내용 0). 넣어도 아무 일도 일어나지 않는 폴더를 남기지 않기 위함 |
| 5 | 문서 3건 | `.claude/rules/references.md` 도구 맵 행 · `scripts/_legacy/README.md` · `scripts/README.md` |
| 6 | 아이디어 존치 | `ops/proposals/PROPOSAL_20261002_iMac민아_광고슬롯_재설계.md` |

삭제한 파일 없음(빈 폴더 1개 제거 외 전부 이동). GCS 쓰기·삭제 0. 코드 수정 0. 배포 0. 커밋·푸시 없음.

## 발견 (조치 안 함)

- 💡 폐기한 업로더의 자동 삭제(최신 6장 유지)는 **다음 업로드 1장에 라이브 이미지 1장을 지우게 돼 있었다** — 가장 오래된 3장이 studio·idphoto-jp·photolab 화면에 주소가 박힌 이미지다. 폐기로 이 위험은 사라졌다.
- 💡 `MONK_kr/ai_lab/photolab/index.html:427`의 `20260220_184127_auto_test.jpg`는 GCS에서 404. 그 경로는 현재 `idphoto-kr.monkos.ai`로 301이라 라이브 영향 없음(레포 파일의 죽은 참조).
- 💡 매니페스트에 "스크린샷 …" 파일명 2장이 결과 대기 화면 광고로 돌고 있다. 이미지 내용은 민아가 열어 보지 않았다.

## 잔여

- ⏳ `~/.monkos-ads.log`(홈, 6KB) 존치.
- ⏳ `monkos-ops/ops/audit/TOOL_CENSUS_20261001.csv`는 10-01 스냅샷이라 수정하지 않음.
- ⏳ 재설계 방식·착수 시점은 제안서 §6 결정 대기.
