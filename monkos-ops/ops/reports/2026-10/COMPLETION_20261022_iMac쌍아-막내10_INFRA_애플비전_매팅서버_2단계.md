---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내10
status: 완료 — 1~7 전 항목 (dev env 원복만 쌍아 지시 대기)
portfolio: PF_INFRA
order: monkos-ops/ops/orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_2단계_iMac.md
---

# COMPLETION — 애플 비전 매팅 2단계 (iMac, dev 전용)

**[2026-10-22 21:55 KST]** iMac/쌍아-막내10 → iMac/쌍아 (1차 — 1·5·6·S)
**[2026-10-22 22:33 KST]** iMac/쌍아-막내10 → iMac/쌍아 (갱신 — 2·3·E·F 완료)

> 출처: 작가님 2026-10-22 21:45 iMac 쌍아 세션 사람 턴 "네가지 권고안 모두 처리해" → 지시서(7389f690). RunPod 직접 runsync 10콜은 쌍아 21:53 결정(dev 미접촉).

## 요약

| # | 항목 | 상태 |
|---|------|------|
| 1 | iMac 상주 + MATTE_SECRET(SM 경유) | ✅ `run_local.sh` 기동 · `secret=on` |
| 2 | 터널 `matte-imac.monkos.ai` | ✅ 22:27 생성(원격 관리형, id d269f13d…) + CNAME(proxied) · 커넥터 4연결(icn) · `/health` 2회 히트 200 |
| 3 | 포털 dev `MATTE_API_URLS` 앞에 iMac URL 추가 | ✅ 22:29 env만 갱신 → rev `monkos-portal-dev-00195-spx` (prod 00567-bhd RunPod 단일 불변 실측) |
| 4 | S · E · F | S ✅ · E ✅ `via=https://matte-imac.monkos.ai` · F ✅ 프리플라이트 불통 → `via=runpod` |
| 5 | 마스크 해상도 | ✅ 고정 2016×1512 · 비등방 스케일 확인 |
| 6 | 품질 시트 5장 vs RunPod BiRefNet | ✅ (직접 runsync — dev 미경유) |
| 7 | dev env 원복 절차 | ✅ 아래 §7 (실행은 쌍아 지시로) |

## 1. 상주

- `monkos_AI/vision-matte/run_local.sh start|stop|status|restart` — 바이너리는 `~/.monkos/vision-matte/vision-matte`로 복사해 실행(worktree가 지워져도 계속 돈다), 로그는 `~/.monkos/vision-matte/server.log`.
- `MATTE_SECRET`은 `scripts/secret.sh get MATTE_SECRET`(4060과 같은 SM 시크릿)으로 env에만 넣는다. 값은 출력하지 않고 파일에도 쓰지 않는다. SM 조회가 실패하면 기동을 멈춘다(인증 없이 뜨는 무음 강등 금지).
- 바인드 127.0.0.1:8000 · `max_concurrent=2`. 재부팅 내성 없음(지시서 허용 범위).

## 2. 터널 (작가님 21:59 "C진행 승인" · 22:26 권한 추가 "완료")

- `brew install cloudflared` → 2026.10.3. `monkos_AI/vision-matte/tunnel.sh setup|start|stop|status`로 운영한다. 원격 관리형 터널 `matte-imac`, 인그레스 `matte-imac.monkos.ai → http://127.0.0.1:8000`(그 외 404), DNS CNAME `→ <id>.cfargotunnel.com` proxied.
- 토큰은 실행할 때마다 API로 받아 `TUNNEL_TOKEN` env로만 넘긴다. SM·파일·인자·로그 어디에도 남지 않는다(`ps` 인자와 `tunnel.log` 대조에서 토큰 0건). 기존 DNS가 다르면 덮어쓰지 않고 중단한다. 4060 터널(`4060-matte`, 현재 down)·기존 DNS 무변경.
- 권한 경위: SM `CF_API_TOKEN` = **monkos-settings** 토큰이다(읽기 탐침: DNS 403 · SSL 200 · bot 200). 작가님이 이 토큰에 Account·Cloudflare One Connector: cloudflared:Edit + Zone·DNS:Edit(monkos.ai)를 추가했다. 처음에는 다른 토큰("Edit zone DNS")에 붙였다(22:16–22:19 GET /accounts 0건으로 판별). SM `CF_ZONE_ID`는 없다 — 존은 이름으로 조회한다.
- 22:27 setup 첫 POST는 스크립트 결함으로 실패했다(zsh `${3:+--data "$3"}` 한 단어 전달 → 본문 미전송). 생성물이 0건인지 확인한 뒤 배열로 고쳐 재실행했다.
- 라이브 판정(2회 히트·대조군): `/health` 1차 200 → 2차 200 `engine=apple-vision`. 대조군 `matte-imac-x.monkos.ai`는 연결 불가(000). 서버를 정지하면 2회 모두 502, 재기동하면 2회 모두 200.
- 계약 테스트(시크릿 모드, 터널 경유 3MP): **7/8** — /health·/api/matte·/matte·403×2·인증 제외·400 통과. **❌ 동시 3건 → 503 0건(200×3)**: 터널 업로드(3MP base64 ≈4MB)가 도착 시각을 흩어서 서버 처리(0.17s)가 겹치지 않았다. 서버 결함이 아니라 측정 조건 문제다 — 로컬에서는 200·200·503으로 통과(§4-S). 왕복 p50 4.8s는 iMac→CF→iMac으로 회선을 두 번 지나는 값이고, Cloud Run 경유 실측은 E 참조.

## 3. 포털 dev env

- 22:29 `gcloud run services update monkos-portal-dev --update-env-vars "^@^MATTE_API_URLS=https://matte-imac.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34"` → `00195-spx`. 쌍아 22:27 §0 해제 신호("포털 dev 비어 있음, 3·E·F 진행") 뒤에 실행했다. `deploy.sh`는 `MATTE_API_URLS`를 하드코딩해서 dev만 바꿀 방법이 없다 → env만 갱신(이미지 불변).
- dev `MATTE_SECRET`은 원래 SM 참조였다 → iMac 서버와 같은 값.
- ⚠️ 다음 dev 배포(막내9 ② 등)가 나가면 deploy.sh 값(RunPod 단일)으로 **자동 원복**된다. 시험을 이어가려면 배포 후 재적용이 필요하다.

## 4-E·F. E2E · 폴백 (dev 무료 트랙 1회씩, 원본 = 브랜드 자산 s1_home, 슬러그 kr-passport)

| | 시각(KST) | dev 로그 | 결과 |
|--|-----------|----------|------|
| E | 22:30:38 | `[Matte] kr-passport: fit 확정 매팅 완료 via=https://matte-imac.monkos.ai … 0.289s face=33mm` · iMac 서버 로그 `Matte 413x531 mask=1512x2016 … 289ms` | 200 · 생성 8.6s · 육안 정상 |
| F | 22:31:14–16 | `https://matte-imac.monkos.ai 프리플라이트 불통 → 다음 엔드포인트` → `via=runpod … 0.547s` | 200 · 생성 8.3s |

- 결과 이미지(커밋 안 함): `~/.monkos/vision-matte/q/e2e_E.jpg`(Vision) · `e2e_F.jpg`(BiRefNet). 같은 크롭이라 두 엔진의 실출고 비교에 그대로 쓸 수 있다.
- 부수 영향: 공유 Firestore `free_quota` 당일 GLOBAL 카운터 +2(상한 300 중) · dev가 GCS `idphoto/specs-visitor/`에 원본+생성 2쌍 저장(브랜드 자산, 고객 아님) · 응답 `track`은 엔진과 무관하게 `birefnet`으로 표기된다(포털 라벨 — 엔진 식별은 로그 `via=`로만 가능).
- 실출고 크롭(413×531)도 마스크는 1512×2016 고정이다 → 입력 비 0.778 vs 마스크 0.75로 약한 비등방 스케일(§5와 정합).

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

현재 상태(22:31 실측): dev `00195-spx` = `https://matte-imac.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34` · prod `00567-bhd` = RunPod 단일(불변).
1. 원복 기준 값 = `monkos_AI/portal/deploy.sh:90` `MATTE_API_URLS`(RunPod 단일). 사본을 만들지 않는다.
2. 원복 = ⓐ 다음 dev 배포(`deploy.sh dev`)가 자동으로 되돌린다(막내9 ② 재개 시 자연 원복) 또는 ⓑ env만 되돌리기: `gcloud run services update monkos-portal-dev --region us-central1 --update-env-vars MATTE_API_URLS=https://api.runpod.ai/v2/di9upymdumei34` — 값은 deploy.sh:90에서 읽어서 쓴다.
3. 확인: `gcloud run services describe monkos-portal-dev --region us-central1 --format=json`의 `MATTE_API_URLS`를 2회 측정 + dev 생성 1회로 로그 `via=runpod`.
4. 시험 종료 시: `monkos_AI/vision-matte/tunnel.sh stop` · `run_local.sh stop`. 터널·DNS 레코드 삭제는 작가님 결정(지금은 존치). 커넥터를 멈춰도 DNS가 남아 있으면 `matte-imac.monkos.ai`는 502를 낸다 — 노출면은 `/health`뿐이고 매팅은 시크릿 인증.

## 변경 파일

- `monkos_AI/vision-matte/Sources/VisionMatte/main.swift` — 응답 `meta.maskSize`·`meta.inputSize`, 로그 `mask=WxH` (필드 추가만, 포털은 `elapsedSec`만 읽는다)
- `monkos_AI/vision-matte/run_local.sh` (신설) · `tunnel.sh` (신설) · `qa_compare.py` (신설) · `README.md` (2단계 절)
- 인프라(레포 밖): CF 터널 `matte-imac` + DNS CNAME `matte-imac.monkos.ai` · 포털 dev env `MATTE_API_URLS`(rev 00195-spx) · iMac brew `cloudflared`
- 상주 프로세스(재부팅 내성 없음): vision-matte pid 55900 · cloudflared pid 53926
- 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-22_iMac_쌍아-막내10.md`

## 미결 · 대기

0. **도구 맵 등재(references.md 3요건)**: `vision-matte`(run_local·tunnel·qa_compare)는 아직 표에 없다 — `.claude/rules`는 쌍아 소관이라 등재를 청구한다. 스모크·실패 가시화 근거는 이 문서 §1·§2.

1. **dev env 원복**은 쌍아 지시 대기(§7). 다음 dev 배포가 나가면 자동으로 원복된다.
2. 안경·아이 샘플 보충(공개 라이선스 원본) — 작가님 육안 게이트(Q) 전에 필요.
3. 흰 테두리 처방(4:3 패딩 추론 등)은 이 지시서 범위 밖 — 쌍아 판단.
4. 운영 호스트 결정은 작가님 몫이다. iMac은 dev 시험 전용이다.

✅ 1·2·3·5·6·7 · S·E·F ❌ 터널 경유 동시성 503 검사(측정 조건 — 로컬 통과) 💡 흰 테두리 = 고정 3MP 마스크의 비등방 스케일 가설 ⏳ dev env 원복(쌍아) · Q 육안(작가님) 📁 `~/.monkos/vision-matte/q/` (compare/·e2e_E.jpg·e2e_F.jpg) 🔀 브랜치 `worktree-makne10-vision-matte-s2`
