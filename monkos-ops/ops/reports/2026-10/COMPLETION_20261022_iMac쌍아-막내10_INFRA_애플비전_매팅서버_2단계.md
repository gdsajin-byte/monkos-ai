---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내10
status: 부분 완료 — 터널(2)·포털 dev(3·4 E·F) 대기
portfolio: PF_INFRA
order: monkos-ops/ops/orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_2단계_iMac.md
---

# COMPLETION — 애플 비전 매팅 2단계 (iMac, dev 전용)

**[2026-10-22 21:55 KST]** iMac/쌍아-막내10 → iMac/쌍아

> 출처: 작가님 2026-10-22 21:45 iMac 쌍아 세션 사람 턴 "네가지 권고안 모두 처리해" → 지시서(7389f690). RunPod 직접 runsync 10콜은 쌍아 21:53 결정(dev 미접촉).

## 요약

| # | 항목 | 상태 |
|---|------|------|
| 1 | iMac 상주 + MATTE_SECRET(SM 경유) | ✅ `run_local.sh` 기동 · `secret=on` |
| 2 | 터널 `matte-imac.monkos.ai` | ⏳ **보류** — cloudflared 미설치(전역 설치) + SM `CF_API_TOKEN` 터널 권한 없음(cfd_tunnel 조회 code 10000). 쌍아가 작가님께 올려 결정받는 중 |
| 3 | 포털 dev `MATTE_API_URLS` 앞에 iMac URL 추가 | ⏳ 미착수 (§0 쌍아 신호 + 터널 선행) |
| 4 | S · E · F | S ✅ iMac 실측 / E·F ⏳ 3번 후 |
| 5 | 마스크 해상도 | ✅ 고정 2016×1512 · 비등방 스케일 확인 |
| 6 | 품질 시트 5장 vs RunPod BiRefNet | ✅ (직접 runsync — dev 미경유) |
| 7 | dev env 원복 절차 | ✅ 아래 §7 (실행은 쌍아 지시로) |

## 1. 상주

- `monkos_AI/vision-matte/run_local.sh start|stop|status|restart` — 바이너리는 `~/.monkos/vision-matte/vision-matte`로 복사해 실행(worktree가 지워져도 계속 돈다), 로그는 `~/.monkos/vision-matte/server.log`.
- `MATTE_SECRET`은 `scripts/secret.sh get MATTE_SECRET`(4060과 같은 SM 시크릿)으로 env에만 넣는다. 값은 출력하지 않고 파일에도 쓰지 않는다. SM 조회가 실패하면 기동을 멈춘다(인증 없이 뜨는 무음 강등 금지).
- 바인드 127.0.0.1:8000 · `max_concurrent=2`. 재부팅 내성 없음(지시서 허용 범위).

## 4-S. 속도 (iMac18,3 i7-7700K · macOS 13.7.8 · x86_64)

| 입력 | n | 왕복 p50 | 왕복 p90 | 추론 p50 | 동시 3건 |
|------|---|---------|---------|---------|---------|
| 3MP (1732²) | 10 | 0.23s | 0.23s | 0.17s | 200 · 200 · 503(Retry-After) |
| 12MP (3464²) | 5 | 0.38s | 0.39s | 0.18s | 200 · 200 · 503 |

→ 통과 기준(3MP p90 ≤ 3s, 동시 3건 무오류·초과분 503) **충족**. 참고로 RunPod BiRefNet은 같은 5장에서 `elapsedSec` 0.73–2.2s, 왕복 3.6–15.8s(콜드 포함)였다.

## 5. 마스크 해상도 — 흰 테두리 원인 가설

- Vision `.accurate` 마스크는 **입력 크기와 상관없이 2016×1512(가로)/1512×2016(세로)로 고정**된다. 입력 896×1200, 2348², 1732², 3464² 모두에서 같은 값이 나왔다. 응답 `meta.maskSize`와 서버 로그 `mask=WxH`로 확인했다.
- 지금 서버는 마스크를 입력 크기로 `scaleX/scaleY`를 따로 잡아 늘린다. 그래서:
  - **정사각형 입력**: 4:3 가로 마스크가 1:1로 늘어난다. 3MP는 가로 ×0.86, 세로 ×1.15이고 12MP는 가로 ×1.72, 세로 ×2.29다. 비율이 다르게 늘어나면서 경계가 흐려지고 위치도 어긋난다.
  - **고해상도 입력**: 3MP 마스크를 쌍선형 업스케일하면 경계가 부드러운 띠로 번진다. 그 띠에 원본 배경색이 섞이면 밝은 배경에서는 흰 테두리, 어두운 배경에서는 헤일로가 된다.
- **가설(미검증)**: 흰 테두리 = ① 4:3이 아닌 입력(증명사진 크롭은 대부분 세로 3:4가 아니다)에서 생기는 비등방 스케일 + ② 저해상 마스크 업스케일로 생기는 소프트 띠. 포털 경로는 크롭(규격 크기, 보통 1MP 미만)을 보내므로 ①이 주원인 후보다.
- 처방 후보(이 지시서 범위 밖 — 쌍아 판단): 입력을 마스크와 같은 4:3으로 패딩한 뒤 추론하고 다시 잘라내기 / 마스크 경계 가이드 필터(원본을 가이드로 하는 업스케일) / 알파 침식 1–2px.

## 6. 품질 시트 (iMac Vision vs RunPod BiRefNet, 같은 원본 5장)

- 샘플은 레포 브랜드 자산이고 고객 사진은 0장이다: `portal/public/images/guides/sample-before-kr.png`(실내) · `assets/headshot-creative.png`(벽돌·창) · `headshot-dating.jpg`(역광 잔머리) · `headshot-corporate.jpg`(어두운 옷·회색 배경) · `headshot-professional.jpg`(밝은 옷·흰 배경). **안경·아이 샘플은 레포에 없어서 빠졌다** — 작가님 육안 게이트 전에 보충이 필요하다.
- 방법: 엔진마다 흰·검정 배경으로 두 번 합성해 알파를 복원한다(`a = 1 − (C_w − C_b)/255`). 경계 띠는 **RunPod 알파의 0.5 경계 ±8px**(BiRefNet = 현행 기준, 정답 아님)이고, 그 안에서 |Δa|를 잰다. RunPod 호출은 직접 `/runsync` 10콜(키는 SM `RUNPOD_API_KEY`, 값 미출력).

| 샘플 | 입력 | 띠 SAD(/1000) | 띠 MAE | 전체 MAE | 소프트 픽셀 비율 Vision / BiRefNet |
|------|------|---------------|--------|----------|------------------|
| s1_home | 2348² | 10.69 | 0.081 | 0.005 | 0.021 / 0.015 |
| s2_brick_window | 896×1200 | 4.87 | 0.083 | 0.008 | 0.022 / 0.025 |
| s3_backlit_hair | 896×1200 | 6.80 | 0.096 | 0.008 | 0.035 / 0.041 |
| s4_dark_on_gray | 896×1200 | 3.89 | 0.061 | 0.005 | 0.017 / 0.025 |
| s5_light_on_white | 896×1200 | 4.74 | 0.071 | 0.006 | 0.019 / 0.026 |

- 사실 관찰(판정 아님): 차이는 **잔머리에 몰려 있다**. BiRefNet은 낱가닥을 남기고 Vision은 머리 윤곽을 매끈하게 잘라낸다(s1·s3 차이 맵). 어깨·몸통 윤곽에는 두 엔진 모두 가는 1px급 띠 차이만 있다. 정사각 입력(s1)은 Vision 쪽 소프트 비율이 BiRefNet보다 높아 §5 비등방 스케일 가설과 맞는다.
- 품질 판정(Q 게이트 "BiRefNet 이상" 4/5)은 **작가님 육안** 몫이다. 위 수치는 보조 자료다.
- 시트 경로(커밋 안 함): `~/.monkos/vision-matte/q/compare/{s1..s5}_sheet.jpg` (원본 | Vision | BiRefNet | 차이×4) · 알파 `*_alpha.png` · 수치 `quality.json`. Vision 단독 시트는 `~/.monkos/vision-matte/q/imac_only/`.

## 7. 포털 dev env 원복 절차 (실행은 쌍아 지시로)

3번은 아직 실행하지 않았다. 실행하게 되면 원복 절차는 다음과 같다.
1. 원복 기준 값 = `monkos_AI/portal/deploy.sh:90` `MATTE_API_URLS`(현재 RunPod 단일). 사본은 만들지 않는다.
2. 원복 = 쌍아 지시로 `monkos_AI/portal/deploy.sh` dev 재배포 — deploy.sh가 env를 정본 값으로 되돌린다(§0에 적힌 대로 dev 배포는 env를 deploy.sh 값으로 되돌린다). 그동안 다른 지시서가 dev를 배포했다면 이미 원복된 상태일 수 있으니 **실측을 먼저 한다**: `gcloud run services describe monkos-portal-dev --region us-central1 --format=json | jq '.spec.template.spec.containers[0].env[]|select(.name=="MATTE_API_URLS")'` 후 2회 측정.
3. 서버 정지: `monkos_AI/vision-matte/run_local.sh stop`. 터널을 만들었다면 커넥터를 정지하고, DNS 레코드 제거는 작가님 결정이다.

## 변경 파일

- `monkos_AI/vision-matte/Sources/VisionMatte/main.swift` — 응답 `meta.maskSize`·`meta.inputSize`, 로그 `mask=WxH` (필드 추가만, 포털은 `elapsedSec`만 읽는다)
- `monkos_AI/vision-matte/run_local.sh` (신설) · `qa_compare.py` (신설) · `README.md` (2단계 절)
- 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-22_iMac_쌍아-막내10.md`

## 미결 · 대기

1. **터널**: 작가님이 cloudflared 설치(전역 brew)와 CF 인증 방식(대시보드에서 터널 생성 → 토큰 SM 등록 / `cloudflared tunnel login`)을 결정해야 한다 — 쌍아가 올림.
2. **포털 dev 3·4(E·F)**: 쌍아의 §0 신호와 터널이 먼저 필요하다.
3. 안경·아이 샘플 보충(공개 라이선스 원본) — 작가님 육안 게이트 전.

✅ 1·5·6·7, S (iMac) ❌ 없음 💡 흰 테두리 = 비등방 마스크 스케일 가설 ⏳ 2·3·E·F 📁 `~/.monkos/vision-matte/q/compare/` 🔀 브랜치 `worktree-makne10-vision-matte-s2`
