# go-explainer-e2e — 1분 바둑 해설 영상 관통 시험(E2E v0)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내8_PRESENTATION_1분해설영상_관통시험.md` · PF_PRESENTATION
> 내부 시험 도구. 결과물·음성·대본 데이터는 레포 밖 `~/.monkos/uni/e2e_v0/` (외부 게시 금지, 상대 정보 비표시).

| 단계 | 파일 | 하는 일 |
|---|---|---|
| 1 장면 분석 | `scene_g10.py` | 기보 국면을 iMac KataGo(b18, 1500v)로 분석 — 후보·실전 수·대안 수의 형세·예상 진행(PV) → `scene_g10.json`. **iMac 엔진 사용 — 8765 진행 판 확인 후 실행** |
| 2 음성 | `tts.py` | 대본 JSON(`<move:n>`·`<ref:k>`·`<real>` 마커) → 화자별 ElevenLabs TTS(with-timestamps) + 마커 발화 시각 → `audio/tracks.json`. 키는 `scripts/secret.sh get ELEVENLABS_API_KEY`로 실행 중에만 읽음(출력·저장 금지). `--dry`로 글자 수만 |
| 3 합성 | `render.py` | 판(PIL, go-board 좌표계 — `server.replay`·`to_xy` 재사용) 90% + 우하단 얼굴 창(Kling 기존 클립) + 자막 → 1920×1080 30fps, 대사 J-cut 0.12초, 마커 시각에 돌 놓기 → `e2e_v0.mp4`·`sync.json`(싱크 오차) |

```bash
D=~/.monkos/uni/e2e_v0
python3 -I scene_g10.py ../go-board-web $D/scene_g10.json
python3 -I tts.py $D/script_v0.json $D/audio
python3 -I render.py ../go-board-web $D
```

- python.org 파이썬은 인증서 묶음이 없어 HTTPS에 `/etc/ssl/cert.pem`을 쓴다(검증 유지).
- ffmpeg는 `imageio_ffmpeg` 번들 바이너리.
- v0 한정: 장면(G10 17수)·참고도 수순·얼굴 클립 경로가 코드에 박혀 있다. 일반화(장면 JSON 입력)는 다음 단계.
