---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내3
status: 진행
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내3_GO_앱복귀_소리묵음_원인분석.md
---

# COMPLETION — 바둑앱 복귀 후 소리 묵음: 원인 분석 + 진단 장치

**[2026-11-05 06:06 KST]** iMac/쌍아-막내3 → iMac/쌍아

출처: 작가님 05:59 "앱에서 대국하다가 다른 사운드 전화포함, 이탈했다가 앱복귀하면 소리가 묵음되는 버그가 있어 이건 타이젬 앱에도 있는 버그인데 원인 분석시켜"(쌍아 세션 사람 턴) → 지시서. 범위는 §1 분석·§2 진단 장치까지이고, 고침은 제안만 한다.

## 1. 결론 (가설 순위)

복귀 처리(`reviveAudio`)가 있어도 묵음이 남는 이유는 두 가지가 겹친 것으로 본다.

- **(b) 탭 밖에서 부른 `resume()`이 거부되지 않고 끝없이 대기한다.**
  - 그래서 현행의 "실패하면 컨텍스트를 새로 만든다"(`catch → actx = null`) 경로는 실제로 한 번도 실행되지 않는다.
- **(c) iOS WebKit의 "state는 running인데 출력 없음" 버그.**
  - 이 경우 state가 `running`이라 우리 코드는 아무것도 하지 않는다.
  - 타이젬도 같은 증상이 있다는 점은 OS 오디오 세션 층의 공통 원인을 가리킨다.

| # | 가설 | 근거 (1차 출처) | 현행 코드와의 대응 | 가능성 | 확인 방법 (이번 진단 기록) |
|---|---|---|---|---|---|
| a | `interrupted` 미처리 | MDN `BaseAudioContext.state`: iOS Safari는 이탈 시 "interrupted"가 되고 "needs to be resumed". W3C Web Audio 1.1 — PR #2611(2025-03 병합)로 `interrupted` 추가 | `reviveAudio`는 `!== 'running'`이라 처리한다. 하지만 `unlockAudio`·`playNow`는 `=== 'suspended'`일 때만 resume한다 → 엔진 수·초읽기(탭 없는 재생)는 interrupted 동안 다시 열지 않는다 | 중 | `statechange` 기록에 `→interrupted`가 찍히는지, `play` 기록의 state가 interrupted인지 |
| b | 탭 밖 `resume()` 거부 → 사실은 **무한 대기** | W3C Web Audio 1.1 `resume()`: "If the context is not allowed to start, append promise to … pending resume promises and abort these steps" — **reject가 아니라 대기**. 시작 허용 조건: "only when … has sticky activation". WebAudio 이슈 #2585 "AudioContext stuck on interrupted in Safari"(2024-04), WebKit bug 273511 | `visibilitychange`·`pageshow`·`focus`에서 부른 `resume()`이 대기에 걸리면 `.catch`가 영영 불리지 않는다 → 컨텍스트 재생성 없음. 다음 탭의 resume도 같은 컨텍스트에 다시 대기할 수 있다 | **상** | `resume` 기록 `result=timeout2s`(2초 무응답) · `where`가 visibilitychange/pageshow/focus인지 pointerdown인지 · 그 뒤 `ctxNew`가 없는지 |
| c | `running`인데 출력 경로가 죽음 | WebKit bug 291892(2025, **홈 화면 웹앱**, 복귀 후 state running·무음, resume 무효·멈춤) · 243727(2022, WKWebView, **수신 전화 거절 후** 영구 무음, state running) · 217606(iOS 14, 복귀 후 running·무음, 수정됨) · 239996(새 AudioContext 생성 권고) | state가 `running`이면 `reviveAudio`가 아무것도 하지 않는다 → 새로 고침 전까지 무음 | **상** | 복귀 뒤 `play` 기록이 state=running인데 작가님이 "소리 안 남"이라고 하면 확정이다(기록만으로는 출력 유무를 못 잰다 — 작가님 확인 필요) |
| d | `actx = null` 뒤 `decoded` 버퍼가 옛 컨텍스트에 묶임 | W3C Web Audio 1.1 AudioBuffer: "An AudioBuffer may be used by one or more AudioContexts" | 버퍼는 컨텍스트에 묶이지 않는다 → **기각**. 새 컨텍스트에서 그대로 재사용할 수 있다(재디코딩 불필요) | 하 | 해당 없음 |
| e | 홈 화면 앱(PWA)에서만 생기는 차이 | WebKit bug 291892가 홈 화면 웹앱 한정으로 보고됨. 탭과의 차이를 명시한 1차 문서는 미확인 | 작가님이 PWA로 쓰면 (c)의 주된 경로 | 중 | `boot` 기록의 `standalone`(true면 홈 화면 앱) · `ua`(iOS 판본) |

- 보조 사실: W3C Audio Session(Working Draft 2024-11)·Safari 16.4의 `navigator.audioSession.type` — WebAudio 이슈 #2392 스레드는 type이 `auto`/`playback`이면 복귀 때 자동 resume, `transient`면 suspended라고 한다. `boot` 기록의 `session`으로 현재 값을 남긴다.
- 블루투스 경로 변경·Siri 사례의 1차 출처는 이번에 찾지 못했다.

### 타이젬과 공통인 이유 (네이티브 대응)

- Apple "Handling audio interruptions": 중단이 시작·끝날 때 오디오 세션이 관찰자에게 알리고 앱이 "take appropriate action" 해야 한다. 끝 알림의 `InterruptionOptions.shouldResume`으로 재개 여부를 정한다.
- 이 처리를 빠뜨리면 생기는 일:
  - 전화 뒤 세션이 비활성인 채로 남는다(재활성화 `setActive(true)`·엔진 재시작이 없음).
  - 끝 알림 자체가 오지 않는 경우도 있다. Apple이 iOS 27부터 `resumptionRecommendationNotification`을 따로 둔 이유가 "your app doesn't stay stuck in an interrupted state if that signal never arrives"다.
- 이는 웹의 (b)·(c)와 같은 모양이다. **OS가 중단을 걸고, 앱이 끝을 감지해 출력 경로를 직접 다시 열지 않으면 무음이다.**
- 네이티브(PF_GO ⑥) 체크리스트:
  - ① interruption began/ended·routeChange·mediaServicesWereReset 세 알림을 모두 처리한다.
  - ② 끝 알림을 믿지 말고 앱 활성화(didBecomeActive) 때도 세션 재활성화 + 엔진 재시작을 한다.
  - ③ 재개 실패 시 엔진을 다시 만든다.

## 2. 진단 장치 (8766 검증 완료, 8765 반영 대기)

- **index.html**(오디오 생명주기 부분만):
  - 기록 대상: `statechange`(직전→현재) · `visible`/`hidden` · `pageshow`/`pagehide`(persisted) · `resume`(where·from·결과 ok/rejected/timeout2s·ms) · `play`(실행 중이 아니거나 복귀 1분 안) · `ctxNew`/`ctxDrop`.
  - 공통 필드: 시각·컨텍스트 번호·마지막 누름 뒤 ms·복귀 뒤 ms.
  - 첫 기록에 `boot`(standalone·ua 160자·audioSession.type)를 1회 남긴다.
  - 1초 안에 같은 기록이 반복되면 한 줄로 접는다(n). 이탈 때는 sendBeacon으로 보낸다.
  - **기존 동작 무변경**: resume 호출 위치·조건은 그대로이고 결과만 기록한다. 화면 무변경. selftest 진단 줄에 `audio_last`·`audio_ctx` 1줄을 더했다.
- **server.py**: `POST /api/rooms/{id}/audio`
  - 방 주인만 쓸 수 있다. 50건·키 20개·값 200자로 자른다.
  - `rooms/events/{id}.jsonl`에 `action=audio`로 남긴다. 방 상태·파일·잠금은 건드리지 않는다.
  - 개인정보 없음: 닉네임도 남기지 않고, 방 id만 쓴다.
- **8766 실측** (Chrome, 테스트 방):
  - ① 강제 `suspend()`→`reviveAudio` → `statechange running→suspended`, `resume ok 27ms`, `suspended→running`
  - ② 복귀(visible) → `resume where=visibilitychange ok 29ms`
  - ③ 가짜 interrupted(대기만 하는 resume) → 2초 뒤 `timeout2s`
  - ④ pagehide → beacon 기록
  - ⑤ 연속 7회 → n=7 한 줄
  - ⑥ selftest 소리 20/20, 기존 진단 값 정상
- 커밋 45c4dc9 — 쌍아가 main에 병합했고 본진 체크아웃에도 반영된 것을 실측했다(origin/main 포함 확인). 8765 반영은 대국이 없을 때 `launchctl kickstart -k gui/$(id -u)/ai.monkos.go-board`로 한다(06:05 작가님 대국 중이라 보류).

### 작가님께 부탁할 재현 절차 (8765 반영 후)

1. 평소처럼 대국을 시작해 몇 수 둔다(소리 나는 것 확인).
2. 대국 중에 전화를 받거나(또는 다른 앱에서 음악·영상을 10초 이상 튼다) 끝낸 뒤 바둑앱으로 돌아온다.
3. 돌아와서 **판을 누르기 전에** 엔진 수가 소리 나는지 본다. 그다음 한 수를 두고 착수음이 나는지 본다.
4. 쌍아 세션에 알려 주세요:
   - 홈 화면 앱인지 Safari인지
   - 3에서 소리가 났는지(엔진 수 / 내 수 각각)
   - 대략 몇 시 몇 분에 했는지

## 3. 고침안 (제안만, 구현 금지)

| # | 고침 | 대상 가설 | 부작용 | 검증 |
|---|---|---|---|---|
| F1 | `unlockAudio`·`playNow`의 조건을 `state !== 'running'`으로 바꾼다(interrupted 포함 resume) | a | 없음(호출 증가뿐) | 진단 기록에서 `from=interrupted` resume ok |
| F2 | **resume 무응답 감시**: resume이 1~1.5초 안에 끝나지 않으면 다음 탭에서 옛 컨텍스트를 `close()`하고 새로 만든다. `decoded` 버퍼는 그대로 재사용한다(명세상 공유 가능, 재디코딩 없음) | b | 재생성 직후 첫 소리 수십 ms 지연 가능. 옛 컨텍스트의 예약 소리 소실 | `timeout2s` 뒤 `ctxNew`·다음 `play` 정상 + 작가님 귀 확인 |
| F3 | **복귀 후 첫 탭에서 무조건 재개통**: 숨김 동안 `interrupted`/`suspended` 전이가 있었거나 숨김이 N초 이상이면, 복귀 후 첫 `pointerdown` 안에서 컨텍스트를 새로 만든다(state가 running이어도) | c, e | 첫 착수음이 새 컨텍스트 준비만큼 늦을 수 있음(수십 ms). 매 복귀마다 재생성 → 메모리 소폭 | 전화 후 복귀 재현에서 첫 착수음 유무. 기록 `ctxNew` where=복귀 |
| F4 | 복귀 후 첫 탭에서 길이 1샘플 무음 버퍼를 1회 재생해 출력 경로를 깨운다(F3보다 가벼운 1차 시도) | c | 없음에 가까움 | F3과 같다. F4만으로 안 되면 F3 |
| F5 | `navigator.audioSession.type = 'playback'`(Safari 16.4+) | b, c | **무음 스위치를 무시하고 소리가 날 수 있다(1차 확인 안 됨)** · 다른 앱 음악을 끊을 수 있다 → 작가님 판단 필요 | 무음 스위치 켠 상태 재생 여부 실측 |
| F6 | 엔진 수·초읽기 같은 탭 없는 재생이 state ≠ running이면 "소리 꺼짐 — 판을 한 번 눌러 주세요" 작은 알림(1회) | b, c 사용자 우회 | 화면 변경(지시서 범위 밖 — 판단 필요) | 표시 조건 기록 |

- 권장 순서: F1+F2+F4를 먼저 반영하고, 진단 기록과 작가님 확인으로 (c)가 남으면 F3, F5는 무음 스위치 실측 뒤에 판단한다.

## ✅❌⏳ 상태

- ✅ 1차 출처 가설 표 · 진단 장치 8766 검증 · main 병합(쌍아) · 고침안 표
- ⏳ 8765 재기동(작가님 대국 종료 대기) → 반영 후 이 문서에 1줄 덧붙임
- ❓ 작가님 확인 질문: 홈 화면 앱(PWA)인지 Safari 탭인지 — 진단 `boot.standalone`으로도 확인된다

## 📁 산출

- `apps/go-board-web/index.html`, `apps/go-board-web/server.py`(커밋 45c4dc9)
- 출처:
  - https://www.w3.org/TR/webaudio-1.1/
  - https://github.com/WebAudio/web-audio-api/pull/2611
  - https://github.com/WebAudio/web-audio-api/issues/2585
  - https://github.com/WebAudio/web-audio-api/issues/2392
  - https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
  - https://www.w3.org/TR/audio-session/
  - https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
  - https://bugs.webkit.org/show_bug.cgi?id=291892
  - https://bugs.webkit.org/show_bug.cgi?id=243727
  - https://bugs.webkit.org/show_bug.cgi?id=217606
  - https://bugs.webkit.org/show_bug.cgi?id=239996
  - https://bugs.webkit.org/show_bug.cgi?id=273511
  - https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions
  - bugs.webkit.org 페이지는 직접 열람 시 500 오류가 나서 검색 요약으로 확인했다(서브에이전트 reader 수집, 판정은 막내3).
