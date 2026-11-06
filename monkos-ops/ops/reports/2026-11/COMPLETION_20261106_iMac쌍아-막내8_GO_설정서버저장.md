---
type: completion
date: 2026-11-06
device: iMac
agent: 쌍아-막내8
status: 마감
portfolio: PF_GO
---

# COMPLETION — 바둑판 설정 서버 저장 + 기본 상대 MONKOS

**[2026-11-06 15:51 KST]** iMac/쌍아-막내8 → iMac/쌍아

- 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내8_GO_설정서버저장.md`(599b6f73)
- 출처: 작가님 15:41·15:45 사람 턴(iMac/쌍아 세션) → 쌍아 15:45 세션 메시지
- 브랜치 **`worktree-makne8-go-prefs`**: 기능 커밋 5605d440(origin/main 599b6f73 기준). 원격 SHA는 이 보고 커밋을 포함해 완료 통지에 적는다.
- 병합·8765 재기동은 쌍아가 한다. 시험은 8766만 썼고 8765·8767·포털은 건드리지 않았다.

## 1. 포털 어드민 경유 경로 실측

- **출처**
  - monkos.ai/admin '바둑 PoC' 카드는 `https://go.monkos.ai`로 연결된다(`portal/public/admin/index.html:141`).
  - go.monkos.ai는 CF 터널 `go-imac`을 거쳐 iMac 8765로 들어간다(launchd `ai.monkos.go-tunnel`, Access 잠금).
- **식별**
  - go.monkos.ai는 `.monkos.ai` 포털 세션 쿠키(`monkos_session`)를 서버 대 서버로 확인한다(`/api/auth/portal/cookie` → 포털 verify-cookie).
  - 확인되면 바둑 세션 쿠키를 발급한다.
  - 터널 요청에는 CF-Connecting-IP가 붙으므로 로컬 '작가님' 무쿠키 호환은 적용되지 않는다.
- **작가님 계정**(rooms owner 실측)

| 접속 경로 | 계정 | 비고 |
|---|---|---|
| go.monkos.ai(포털 구글 연결) | **꿈속연인**(u-31a5…) | 오늘 15:39·15:40·15:44 판 3개(v3 → **최강** → v3) |
| 로컬 127.0.0.1 무쿠키 | 'admin'(작가님 호환) | |
| 아이디 입장 | 신작가(u-e2ea…) | |

- **설정 소실 원인**
  - 설정은 출처(호스트)마다 따로인 브라우저 저장소에만 있었다.
  - 기본 상대는 '지난 판 수준, 없으면 최강'이었다.

## 2. 구현 (5605d440)

- **서버**
  - `/api/prefs` GET: 로그인 필요, `{prefs, has}`를 돌려준다.
  - `/api/prefs` POST: `{"set": {…}}` 또는 `{"init": {…}}`(서버 값이 없을 때만 → 로컬 설정 1회 올리기, 덮어쓰기 아님).
  - 저장: `~/.monkos/go-board/prefs.json`, uid별, 원자적 쓰기.
  - 허용 키 14개는 `server.py PREF_KEYS`가 정본이다. 그 밖의 키는 버리고 값은 300자로 자른다.
  - 파일이 손상돼 있으면 저장을 거부하고 경고 1줄을 남긴다(파일은 보존).
- **화면**
  - 열 때 `PREF.load()`가 동기 1회로 서버 값을 이 출처의 저장소에 내려받는다. 첫 그리기 전에 스킨·소리가 서버 값이 되고, 기존 읽기 코드는 그대로다.
  - 쓰기 13곳은 `PREF.set`으로 바꿨다(저장소 + 서버).
  - 서버 불통·미로그인이면 저장소만 쓴다.
- **기본 상대 MONKOS 최신**
  - 서버 `ROOMS.defaults`: 지난 판이 없으면 `MONK_LATEST`를 쓴다.
  - 새 대국 창 'all' 모드: 지난 판이 KataGo면 그 수준, 아니면 MONKOS 마지막·최신 버전.
  - KataGo 최강은 고를 때만 쓴다(대기실 KataGo 행).

## 3. 검증 (8766, 헤드리스 크롬 390폭)

| 시험 | 결과 |
|---|---|
| 양성 ① A(127.0.0.1) 로그인 전 기존 설정(스킨 builtin·소리 off) → 로그인 | 서버 값 없음 → 1회 업로드 `{"goBoardSkin":"builtin","goBoardSound":"off",…}` ✅ |
| 양성 ② B(localhost) 빈 저장소로 로그인 | 서버 값을 내려받아 `skinName builtin`·`soundOn false` ✅ |
| 양성 ③ B에서 스킨 변경 → A 다시 열기 | 서버 tygem-ref → A `skinName tygem-ref` ✅ |
| 음성 ① `/api/prefs` 차단(CDP Fetch 연결 거부) | 대기실 정상 표시·저장소 값 사용·예외 0 ✅ |
| 음성 ② 미로그인 GET | 401 "로그인이 필요합니다" ✅ |
| 음성 ③ 허용 밖 키 `evil` | 버림(saved 1 = 허용 키만) ✅ |
| 기본 상대 — 방 없는 새 계정(설정시험) | defaults `monkos-v3` · [방 만들기] 창 "설정시험 VS MONKOS Go v3" ✅ |

- 모바일 캡처: `~/.claude/jobs/66441cd2/tmp/go/prefs_mob_newdlg.png`(새 대국 창, MONKOS 기본) · `prefs_mob_lobby.png`
- 첫 실행은 시험 계정에 남아 있던 세션 때문에 오염됐다. 열자마자 1회 업로드가 정상 동작해 이전 시험 설정이 올라간 것이다.
  - 시험 저장소 prefs.json은 `prefs.json.run1-contaminated`로 보존했다(삭제 안 함).
  - 로그아웃 → 저장소 비우기 → 재기동 순서로 다시 돌린 결과가 위 표다.
- 💡 기존 결함(이번 변경과 무관): 대기실(방 없음)에서 스킨 칸 change가 일어나면 판 그리기가 빈 판을 읽어 `TypeError … reading '0'`(index.html render)이 난다.
  - 실제 화면에서는 대국실 설정 탭에서만 닿는 칸이라, 시험 스크립트가 숨은 칸을 직접 바꿀 때만 난다. 수정하지 않았다.

## 4. 결정 필요

1. **작가님 계정이 셋**(꿈속연인·admin·신작가)이라 설정도 셋으로 갈린다. 이번 구현은 uid 단위다. 다음 중 하나를 골라야 한다.
   - (가) 현행: go.monkos.ai = 꿈속연인 설정. 로컬은 따로.
   - (나) 세 계정을 '작가님' 설정 하나로 묶는다(서버 측 별칭 1줄).
   - (다) 아이디 통합(포털 연결을 admin으로 옮기기 등). 방 소유가 갈려 있어 영향이 크다.
2. 8765 재기동 뒤 go.monkos.ai에서 처음 열 때, 그 출처 저장소에 있던 값이 꿈속연인 서버 설정으로 1회 올라간다. 지금 작가님 화면 상태 그대로가 서버 시작값이 된다.

## 5. 하지 않은 것

- 8765 재기동·병합(쌍아)
- 포털 코드·배포 — 변경 필요 없음
- 운영 `~/.monkos/go-board/prefs.json`은 아직 없다(8765 재기동 후 첫 저장 때 생긴다)

## 6. 파일

- `apps/go-board-web/server.py`(PREFS_FILE·PREF_KEYS·Prefs·/api/prefs·defaults)
- `apps/go-board-web/index.html`(PREF 계층·쓰기 13곳·새 대국 기본 상대)
- 시험 스크립트(레포 밖): `~/.claude/jobs/66441cd2/tmp/go/`
  - prefs_ui.mjs·err_probe.mjs·newdlg_probe.mjs·default_level.py
