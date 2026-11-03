---
type: portfolio
id: PF_INFRA
name: "INFRA"
subject: "서비스 기반 인프라 — GCS 버킷·Drive 워크벤치·배포 파이프라인·SA 권한·에셋 레지스트리·시크릿 관리"
created: 2026-06-21
owner: 작가님
leads: "쌍아(설계)"
status: active
domain: 인프라
---

# PF_INFRA — 서비스 기반 인프라

> 전 서비스가 공유하는 인프라의 **살아있는 정본**.
> 죽은 문서(ASSET_REGISTRY 2월 동결)를 PF 체계로 살려서, 세션마다 갱신되고 에이전트가 참조하는 구조로 전환.

---

## 1. 비전

**"우리 인프라가 지금 어떤 상태인지, 이 PF 하나 읽으면 안다."**

기존에 monkos-ops/tech/에 정적 문서로 있던 인프라 정보들 — GCS 구조, 에셋 분류, SA 권한, 디바이스 맵 — 이 4개월간 갱신되지 않고 현실과 괴리된 채 방치. PF 체계로 편입하여 히스토리가 쌓이고, 변경이 추적되고, 에이전트가 착수 전 읽는 살아있는 문서로 전환한다.

---

## 2. 인프라 맵

### 2-1. GCS 버킷 (2026-06-21 전수 파악)

| 버킷 | 역할 | 상태 | 용량 | 파일 수 |
|------|------|------|------|---------|
| **monk-ai-images** | 메인 — 블로그, 광고, 생성물, 학습데이터, 프로필 에셋 | 활성 | 4.43 GB | 17,437 |
| **monk-customer-photos** | 고객 데이터 전용 (idphoto kr/jp/studio) | 신설 (배포 보류) | ~1 GB | 1,320 |
| **monk-project** | 통합 저장소 — 학습데이터 이관, 코퍼스, 레거시 스냅샷 | 마이그레이션 중 | 3.36 GB | 17,777 |
| **monkos-works-assets** | 팀 작업물 (한송이/꾸 rsync) | 활성 | 606 MB | 947 |
| monkos_cloudbuild | Cloud Build 소스 (자동생성) | 인프라 | 403 MB | 577 |
| run-sources-* (3개) | Cloud Run 소스 (자동생성) | 인프라 | 176 MB | 255 |
| monk-project-soul | 세션 로그 (이관 완료) | 레거시 | — | — |
| monk_session_data | Gemini 대화 (이관 완료) | 레거시 | — | — |

### 2-2. monk-ai-images 내부 구조

```
gs://monk-ai-images/
├── service/idphoto/{kr|jp|studio}/{userId}/  ← 고객 사진 (→ monk-customer-photos 이관 준비)
├── blog/{ts}_{filename}                      ← CMS 업로드 이미지 (공개)
├── blog/ai_{ts}_{slug}.jpg                   ← Imagen4 AI 생성 블로그 이미지
├── blog/og_{ts}_{slug}.jpg                   ← OG 썸네일 자동생성
├── ads/{ts}_{name}.ext + manifest.json       ← 광고 로테이션 FIFO 6장 (공개)
├── generated/{ts}_{index}.jpg                ← Imagen4 범용 생성물
├── assets/portal/slide/                      ← 포털 캐러셀 webp
├── profiles/master/{5종}/                    ← 헤드샷 프리셋 (현재 .keep만)
├── profiles/{background|fashion|hair|makeup}/ ← 4축 에셋 (현재 .keep만)
└── raw_data/kbeauty_sources/                 ← 학습 데이터 (monk-project와 중복)
```

### 2-3. 에셋 흐름 3층 구조 (2026-06-21 설계)

```
로컬 ~/MONKOS_ASSETS/       ←→    Google Drive MONKOS_ASSETS/    →    GCS 버킷
(워크벤치, 작가님/꾸)              (소통 허브, 에이전트 공유)           (프로드 정본)
 · macOS 동기화 앱으로 연동         · 클로드 디자인 읽기/쓰기            · 서비스가 URL 참조
 · 오프라인 작업 가능               · 철창이/코웍이 참조                 · 승격 스크립트로 동기화
                                  · 버전 관리 = 자연 백업
```

### 2-4. 배포 파이프라인

| 서비스 | 배포 방식 | 파일 |
|--------|----------|------|
| idphoto-kr | deploy.sh 경유 | monkos_AI/idphoto-kr/deploy.sh |
| idphoto-jp | deploy.sh 경유 | monkos_AI/idphoto-jp/deploy.sh |
| studio | deploy.sh 경유 | monkos_AI/studio/deploy.sh |
| portal | deploy.sh 경유 | monkos_AI/portal/deploy.sh |
| image-pro | deploy.sh 경유 | monkos_AI/image-pro/backend/deploy.sh |
| monk.kr | CF Pages (자동) | MONK_kr/ |
| pt.monkos.ai | gcloud 직접 (2조 한시적 예외) | — |

### 2-5. 시크릿 관리 체계 (2026-06-23 확정)

**정본**: GCP Secret Manager (project=monkos) — 단일 정본. 현재 35종 등록.
**메타**: `monkos-ops/ops/SECRET_INVENTORY.md` — 이름·용도·날짜만. 값 절대 금지.
**도구**: `scripts/secret.sh` (글로벌 커맨드 `secret`)

#### 등록 플로우

**GUI (일반)**: 키 복사(Cmd+C) → 바탕화면 `MONKOS 시크릿 등록.app` 더블클릭 → 이름 입력 → 등록 클릭
**CLI (터미널)**: 키 복사(Cmd+C) → `secret` → Enter → 이름 입력 → 끝

둘 다 클립보드(pbpaste)에서 값을 자동 읽음. 붙여넣기 불필요.

#### 에이전트 프로토콜 (rules/data-access.md 등재)

```
에이전트: "시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요."
         이름: {NAME}  /  발급처: {어디서 복사}
작가님:   secret 실행 → 등록
에이전트: secret check {NAME} → 존재 확인 → 코드 작업 계속
```

- 에이전트는 **값에 절대 접촉하지 않음** — 존재 여부(`check`)만 확인
- `gcloud secrets` 직접 실행 금지 — `secret` 커맨드 경유 필수

#### 자동화 범위

| 단계 | 자동 | 수동 |
|------|------|------|
| 값 발급 | — | 작가님 (외부 대시보드) |
| SM 등록 | ✅ `secret` | 작가님 Enter |
| 인벤토리 메타 | ✅ 에이전트 | — |
| deploy.sh 반영 | ✅ 에이전트 | — |
| .env 동기화 | ✅ `secret env` | — |
| 타 디바이스 설치 | 1회: `ln -sf .../secret.sh ~/.local/bin/secret` | — |
| GUI 앱 배포 | `Desktop/MONKOS 시크릿 등록.app` (AppleScript) | — |

#### 기타 명령

```bash
secret list              # SM 전체 목록
secret check <NAME>      # 존재 + 버전 확인
secret get <NAME>        # 값 조회 (에이전트 복원용)
secret env               # SM → .env 일괄 동기화
```

### 2-6. SA 권한

정본: PF_SECURITY (completed → AUTOPILOT 이관). monk-image-engine SA 중심.

---

## 3. 기존 정적 문서 → PF 흡수

| 기존 문서 | 위치 | 상태 | PF_INFRA 내 역할 |
|-----------|------|------|-----------------|
| ASSET_REGISTRY.md | monkos-ops/tech/ | **2월 동결** | 에셋 분류 체계 참조 (현행화 필요) |
| GCS_BUCKET_STRUCTURE.md | monkos-ops/tech/ | **미생성** (링크 깨짐) | 본 PF §2-2가 대체 |
| SECRET_INVENTORY.md | monkos-ops/ops/ | 최신 유지 | 참조 링크 |
| credentials_inventory.md | monkos-ops/ops/ | — | 참조 링크 |

---

## 4. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 02/23 | — | ASSET_REGISTRY.md 최초 작성 (에셋 분류 6종, 저장소 인벤토리) | ASSET_REGISTRY.md | ✅ |
| 06/12 | iMac/막내1+2 | GCS 버킷 보안 전수조사 (삼권심사) | 보안 보고서 3건 | ✅ |
| 06/21 | iMac/쌍아 | GCS 전수 파악 — 9개 버킷, 8.97GB, ~37,000 파일 맵핑 완료 | 세션 내 보고 | ✅ |
| 06/21 | iMac/막내1 | monk-customer-photos 버킷 신설 + 데이터 복사 1,320건 + 코드 변경 (배포 보류) | 지시서+코드변경 | ⏳ |
| 06/21 | iMac/막내2 | 로컬 에셋 전수 조사 — 661개/1.19GB, 중복 210개(32%) + 워크벤치 구성안 기안 | 보고서+제안서 | ✅ |
| 06/21 | 작가님+쌍아 | 에셋 3층 구조 설계 (로컬↔Drive↔GCS) + PF_INFRA 신설 | PF_INFRA/README.md | ✅ |
| 06/22 | iMac/막내3 | **GCS 스키마 교정 + 결제 리다이렉트 + 버킷 전환** — `studio-profiles` 하드코딩 → `{서비스}/{userId}/` 유저별 폴더(gcs-save.js 시그니처 변경). 결제 완료 후 returnUrl 복귀(credits.js+payments.js). 증명앱 자체 GCS 구스키마 미교정 확인(후속). 구 버킷(`monk-ai-images`) 시계열 보존 확정. Studio 00020 + Portal 00319 배포 | gcs-save.js, studio/server.js, portal/server.js, credits.js, payments.js | ✅ |
| 06/22 | iMac/쌍아 | **언어·결제 분기 + GCS 스키마 통합 설계서** — 3→1 수렴(Accept-Language+쿠키 단일흐름), 2축 모델(언어=Accept-Language/결제=geoip-lite), GCS prefix 구조 확정(`{서비스}/{userId}/`), SEO 안전장치 | 설계서 | ✅ |
| 06/23 | M1/쌍아 | **시크릿 입력 단순화** — `scripts/secret.sh` CLI + `MONKOS 시크릿 등록.app` GUI 신설(둘 다 클립보드 자동읽기). 글로벌 커맨드 `secret`, rules/data-access.md 에이전트 프로토콜 등재, PF_INFRA §2-5 체계 정리 | secret.sh + .app + 설계서 + rules 갱신 | ✅ |
| 06/23 | iMac/민아 | **🔴 포털 홈 이미지 누락 사고 복구 + 배포 안전망 제안** — 이미지(.jpg/.png)가 .gitignore로 git 미추적 → 빌드 컨텍스트 누락 → specs prod 배포가 이미지 없는 컨테이너로 교체(/assets/*.jpg 404). 복구: .gitignore 예외 + 에셋 11개(8.6MB) git 추적 → 재배포(스모크 18URL 200). 근본=배포 안전망 부재(슬러그·이미지 두 사고 공통). 안전망 3종(스모크검증·preview선검증·git자산점검) 제안, 경계 정본=ch5 배포규칙(개정 초안 예정) | `3390720f`·`4e519257`, [REPORT](../../reports/2026-06/REPORT_20260623_민아_포털이미지누락_배포안전망.md) | ✅ |
| 07/02 | iMac/쌍아 | **레몬 API 키 로테이션** — 키 노출 인시던트 대응. Secret Manager v2 등록 + deploy.sh `--set-secrets`에 API 키 편입(평문 env→시크릿 전환, 광역오더 #8 위반 해소). 포털 재배포(rev 00375-g45) | deploy.sh, SECRET_INVENTORY.md | ✅ |
| 07/12 | iMac/민아 | **specs 정적 자산 캐시 체계 신설 (렌더 퍼널 분리 동반)** — 인라인 CSS/JS를 정적 5파일로 추출하며 캐시 정책 이원화: `/{js,css}/specs-*` → `max-age=31536000, immutable` + `?v=K_REVISION` 배포 단위 버스트(server.js:1167 분기). 기존 css/js no-cache 정책은 불변(범위 최소화). 효과: 428p 페이지당 gzip 34→10.3KB, 15언어 확장 시 크롤 218→66MB/회전. dev 00110 라이브·prod 미승격 | [COMPLETION](../../reports/2026-07/COMPLETION_20260712_iMac민아_렌더퍼널분리.md), server.js | ✅ (쌍아 추인 대기) |
| 07/14 | M1/막내3 | **자동화 인프라 통합 정비 4건** — ① daily_briefing.py 5채널 수집 확장(네이버 검색광고/DataLab/Bing WMT/GSC 디바이스+URL Inspection/GA4 디바이스+이탈률/PageSpeed CWV) + yml env 6건 ② .mcp.json GA4/GSC 크리덴셜 SM 기반 래퍼 전환(iMac 하드코딩 해소) + retrieval DB 빌드(3,623문서) ③ SECRET_INVENTORY.md SM 44건 대사 + 7건 추가 + audit_secrets.sh 신설 ④ rules/mcp-tools.md + skills/seo-query.md + skills/secret-audit.md 신설 | daily_briefing.py, daily-briefing.yml, .mcp.json, ga4_mcp.sh, gsc_mcp.sh, audit_secrets.sh, mk-push.sh, SECRET_INVENTORY.md, mcp-tools.md, seo-query.md, secret-audit.md | ✅ |
| 07/15 | M1/막내1 | **SEO 수집 함수 도구화** — daily_briefing.py에서 6개 함수(naver-searchad/datalab/bing/pagespeed/ga4-device/gsc-inspection)를 `scripts/tools/seo_collectors.py`로 분리 + SM 키 주입 shell 래퍼(`seo_collect.sh`) + `/seo-query` 스킬 스크립트 방식 전환. daily_briefing.py는 import로 재사용(코드 중복 0) | seo_collectors.py, seo_collect.sh, seo-query.md, daily_briefing.py | ✅ |
| 07/21 | M1/쌍아 | **아키텍처 전환 설계서** — PSI 실측(모바일 55/데스크톱 84) → CR 모놀리스 비효율 재인식. 작가님과 CF(서빙)+CR(API only)+4060(빌드·처리) 3분리 설계 확정. 바닐라 SPA(IDPASS 허브), specs SSG(render-specs 출력 전환), BiRefNet 4060 이관, 5Phase 로드맵. 비용 ₩260K→₩150K(42%↓). 민아 교차의견 3건 반영 | [DESIGN](../../tech/designs/2026-07/DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md) | ⏳ 민아 검토 대기 |
| 07/21 | M1/막내2 | **Phase 0 — CF→CR API 검증 완료** — monk.kr/api_test/ 테스트 페이지 배포. T1 CORS 통과(monk.kr 허용 오리진 기등록), T2 preflight 204 정상, T3 IP 소실 없음(직접 호출), T4 쿠키 크로스도메인 불가하나 credentials:include 활용 가능, T5 응답 ~416ms 평균. **Phase 1 직행 판정**. billing SKU는 BQ export 미설정으로 CLI 불가(콘솔 필요) | [COMPLETION](../../reports/2026-07/COMPLETION_20260721_M1막내2_INFRA_CF_CR_API검증.md) | ✅ |
| 07/21 | M1/막내3 | **specs SSG PoC 완료** — `scripts/build-specs-poc.js` 래퍼(25줄) → render-specs.js import → kr-passport 정적 HTML 40.1KB 생성 → monk.kr/specs-test/kr-passport/ 배포. SSR과 HTML 구조·SEO 메타·JSON-LD 100% 일치. 차이는 환경변수(T1 리터칭·K_REVISION)·CF 스크립트뿐. 정적 자산 전 200. PSI API 쿼터 초과로 수동 측정 잔여 | [COMPLETION](../../reports/2026-07/COMPLETION_20260721_M1막내3_INFRA_SSG_PoC_monkkr.md) | ✅ |
| 07/21 | M1/쌍아 | **4060 SSH 연결 확립 + BiRefNet 파일럿 성공** — Tailscale→SSH 키 인증(administrators_authorized_keys). BiRefNet GPU 실측: 로딩 3.6s, 콜드 1,752ms, 웜 982ms, GPU 881MB/8,188MB. 아들 Roblox 게임 중 공존 실증(GPU 합산 21%, RAM 합산 34%). sshd+Tailscale AUTO_START+AC 절전 비활성 확인. 역할 분담 원칙 확정: 4060=무겁고·폴백·비동기 / CR=가볍고·실시간·폴백필수(crop 잔류) | memory/device_4060.md | ✅ |
| 07/21 | 작가님 | **billing 실측** — 7월 19일간 ₩140K. CR ₩62K+Vertex AI ₩58K+기타 ₩20K. 42% 절감 서사 폐기→본명분=PSI·구조 정돈. billing export BQ 설정 완료 | GCP 콘솔 | ✅ |
| 07/22 | iMac/쌍아 | **Gemini 이미지 모델 preview→GA 전환 대응** — gemini-3.1-flash-image-preview·gemini-3-pro-image-preview 404. GA 버전(-preview 제거) 실측 200. portal·idphoto-kr·idphoto-jp·studio 5파일 전수 교체 + 4서비스 prod 배포. Daily Briefing 크론 복구(npm ci→npm install) | 1f54d00a·29e06e36 | ✅ |
| 07/22 | iMac/쌍아 | **4060 Tailscale 오프라인 확인** — last seen 3h ago. Chrome 원격접속 가능(게임 중). Tailscale 프로세스 미실행 → 서비스화(NSSM) 필요 재확인 | — | ⏳ |
| 07/23 | iMac/막내1 | **4060 자체 서빙 Phase 1–3 완료** — CF Tunnel(`matte.monkos.ai`→4060-matte) + BiRefNet FastAPI 서버 + NSSM 서비스 3종(Tailscale/cloudflared-tunnel/birefnet-matte) 전 Running+Automatic. E2E 실측 ~1.3초(600x800, 웜). VRAM 861MB/8,188MB | [COMPLETION](../../reports/2026-07/COMPLETION_20260723_iMac막내1_INFRA_4060_자체서빙세팅_Phase1-3.md) | ✅ |
| 07/23 | iMac/민아 | **Phase 4 검수+prod E2E 카나리 — 게이트 ③ 폐쇄** — 배선 커밋 `5249a220` 검수 통과(X-Matte-Secret·SM 주입·체인 순서), 4060 `/api/matte` 403 게이트 실측, T0 카나리 실행 → `[Matte] via=matte.monkos.ai 0.456s` prod 로그 확정. 매팅 원가 ₩0 체제 가동. 잔여: RunPod 폴백 실발동 미실증·비백색국 케이스 | 세션로그 2026-07-23_iMac_민아 | ✅ |
| 07/25 | iMac/막내3 | **매팅 3종 prod 배포** — `monkos-portal-00539-bmt` 트래픽 100%(이전 00538-lc5). 줄 세우기+타임아웃 25s+미전달 마감선 전량 라이브. prod 실 생성 E2E **200/6.92초**(`track=birefnet`·`matteSec 0.909s`·`via=matte.monkos.ai`), `remainingFree` 정상 소모, prod·4060 ERROR 0. main 단일 브랜치 구조상 막내1 커밋 2건(`0506aab1`·`3cc9b5f7`) 동반 — 작가님 범위 고지 후 「전부 배포」 승인. 롤백: `update-traffic --to-revisions monkos-portal-00538-lc5=100` | [COMPLETION](../../reports/2026-07/COMPLETION_20260725_iMac막내3_INFRA_매팅줄세우기.md) §5-H | ✅ |
| 07/25 | iMac/막내3 | **RunPod 타임아웃 25s + 미전달 환급** (INCIDENT §5) — `MATTE_TIMEOUT_MS` 60→25s(콜드 실측 16.1s 근거). 예산 합산 **90.1s/120s**(구 60s는 160.1s = 오늘 504의 산식). 🔴 **소켓 절단 감지는 Cloud Run에서 무효 — 실측**: abort 걸어도 컨테이너 `res close` 미발화·응답 쓰기 조용히 성공·쿼터 소모. → 경과 시간 마감선 `GEN_DELIVERY_DEADLINE_MS`(115s) 채택, 임계 5s 낮춰 dev 실증(`remainingFree` 불변). §5-2 6언어 안내는 **기존 구현 완비 확인**(`freeBusyMsg`·`genStillWorking1/2` SSR 실노출) — 신설 불요. INCIDENT P1·P2 종결, 잔여는 `cpu-throttling` 1건. prod 승인 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260725_iMac막내3_INFRA_매팅줄세우기.md) | ✅ |
| 07/25 | iMac/막내3 | **매팅 줄 세우기 + server.py git 편입** (작가님 설계 "헬스 살아있으면 줄 세우기") — `matte.js`에 503 한정 재노크 루프(`MATTE_QUEUE_WAIT_MS` 20s, Retry-After 준수, health 불통은 즉시 폴백 보존). **N=16 폴백 0건·전건 4060 자력 처리**(N=4·8도 0). **Cloud Run 지점 확정** — dev `00168-2nt` 실 생성 로그에 노크→줄서기 성공→`via=matte.monkos.ai`, 포화 중 6.7초(유휴 대조군 7.7초보다 빠름). §4 `monkos_AI/matte-server/` 편입 + `deploy.sh`(백업·전송·재기동·헬스) 전 구간 실증. 예산: 매팅 외 최악 16.3s 실측 → 현실 최악 68.8s(57%). ⚠️ 최장 대기 21.6s로 상한 20s 근소 초과(노크 간격 1s > 표 회전 0.78s, 처리율 1.32s/건) → 값 결정 대기. 🔴 예산 위반 실변수는 큐가 아니라 `MATTE_TIMEOUT_MS` 60s(P1 유효). prod 승인 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260725_iMac막내3_INFRA_매팅줄세우기.md) | ✅ |
| 07/25 | iMac/막내3 | **4060 매팅 동시성 가드 — 느린 수락→빠른 거절** (INCIDENT_20260725 P0) — `server.py`에 세마포어(기본 1) + 포화 시 즉시 503(`Retry-After`) + `/health` 포화 신호 6종(`inflight`·`oldest_inflight_sec`·`recent_matte_ms`·`rejected_503_total` 등). **N=16 기준 14분→2.8초(약 300배)**, N=1~16 wall time 평탄=스래싱 소멸. 폴백 실발동 실증 `via: runpod` (07-23 잔여 과제 해소). **잡당 VRAM 2,373MB·입력 크기 무관 상수** → 물리 상한 k=2(k=3 OOM권). 🔴 인시던트 VRAM 전제 정정: 모델 상주 991MiB(4,517MB 아님)·여유 7.2GB. 부하 측정기 `scripts/tools/matte_loadtest.py` 신설. 세마포어 최종값은 작가님 결정 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260725_iMac막내3_INFRA_4060동시성가드.md) | ✅ |
| 07/23 | iMac/쌍아 | **4060 A세팅 + Phase 4 배선 + prod 실전 통과** — Wi-Fi 절전 비활성·고성능·자동 로그인. 4060 서버 프로토콜 호환 업데이트(/api/matte·bgColor·{success,image,meta}). matte.js X-Matte-Secret 헤더·deploy.sh 체인 갱신. 작가님 ar-passport T0 via=4060 0.419s 통과. T0 매팅 원가 ₩0 체제. portal 00531-s5q | 5249a220, prod 00531 | ✅ |
| 07/25 | iMac/쌍아 | **⭐ RunPod 위상 규정 확정 — 「4060 가동 불가 대체 영역」이지 부하 분산이 아니다** (작가님 확정) — 위상 변천: ①RunPod 단독 주 엔진(콜드 감내가 전제 → `MATTE_TIMEOUT_MS` 60초가 합리적이던 시절) ② 07-23 4060 도입·병행(`deploy.sh:77` "4060 우선 + RunPod 폴백") ③ 4060 안정화로 **주·대체 역전** ④ 07-25 파라미터 정합(60→25초). **교훈: 위상이 바뀌면 그에 딸린 파라미터가 함께 낡는다.** 07-23 배선 시 타임아웃을 재검토하지 않아 **큐 20초 + 60×2 = 122.5초**가 되었고 이것이 07-25 504의 산식이었다. 오늘 쌍아·민아가 각각 이 규정을 모른 채 「dev 격리」를 권고했다가 작가님 반박(*"격리하면 폴백과 이후 오류를 dev가 영영 재현 못 한다"*)으로 양측 철회 — **맥락 하나가 두 에이전트의 합의를 동시에 무너뜨렸다. 교차검증이 독립적이려면 각자가 시계열을 들고 있어야 한다.** 파생 원칙: health 실패=즉시 폴백 / 포화=줄 세우기(살아있는 4060 두고 콜드 RunPod 타지 않는다) / **"빈 30초"와 "진행이 보이는 30초"는 다르다**(작가님) | [INCIDENT_20260725](../../incidents/2026-07/INCIDENT_20260725_monkos-portal_무료매팅_504.md) · [세션로그](../../sessions/2026-07/2026-07-25_iMac_쌍아.md) | ✅ |
| 07/25 | iMac/민아 | ⭐⭐ **GPU 자원 공존 계층 신설 — 배분 메커니즘의 측정층** (작가님 지시: *"GPU 리소스는 현대 최대 자원, 국가 데이터센터로 확장하면 배당 메커니즘"* / *"최대한 공유되도록"*) — ① **관측 도구축**: `pynvml` 도입으로 `nvidia-smi` **47.3ms → 0.015ms(3,251배)** = 비용축 소멸, 250ms 상시 샘플링 duty 0.006%. `torch.cuda.mem_get_info`는 **WDDM 프로세스 가상화로 장치 전역값 불가**(1,092 vs 실제 5,040) 실측 판정 → NVML로 대체 ② **자원 광고 인터페이스**: `/health`에 점유·활성·VRAM 15필드. 핵심은 **`sampler_age_sec`(신선도 도장)**과 **판정 불가 시 `false`가 아닌 `null`** — *"살아있다"와 "받을 수 있다"는 다르다*를 규약화. 필드 규격을 전송 방식과 분리해 다중 디바이스 확장 시 인터페이스 불변 ③ **2축 판정**: 점유(`foreign_busy`) vs **활성(`foreign_active`, sd·연속차분)** 분리 — 실측상 정적 점유 sd 1.1 / 활성 sd 15.6~19.1로 한 자릿수 대 두 자릿수, **1초 창으로도 판별** ④ **공존 실행 — 유휴 VRAM 반납**: 모델 851MiB인데 캐시가 **4,376MiB까지 팽창**해 3.5GB를 가정용 GPU에서 붙들고 있었음 → 유휴 60초 시 반납 배선, **실증 3,428MiB 반환(장치 여유 2,696→6,124MiB)**. 하루 6건 트래픽이므로 **하루 대부분을 3.4GB 더 내준다** ⑤ **측정층**: `logs/jobs.jsonl` append-only — 잡 시작 시점 예측변수(util·sd·dmean·active·VRAM) + 결과변수(infer/total ms) + **교란변수(px)**. 임계 3종 전부 env → **재배포 없이 사후 튜닝** 🔴 **가설 3연속 반증**(사용률 임계 20% → 활성=위험 → VRAM 여유) — **20:16의 160배는 현 측정 변수로 미설명**, 관측 5점 중 4점이 1.0~1.5배 → **예측 기반 회피는 근거 없음, 공존이 기본**. 라우팅 소비 미배선이 이 오판들을 서비스로부터 차단한 안전판 | [세션로그](../../sessions/2026-07/2026-07-25_iMac_민아.md) · `matte-server/server.py` · [[project_gpu_resource_allocation_vision]] | ⏳ 데이터 축적 중(라우팅 미배선) |
| 07/26 | iMac/막내1 | **유휴 인스턴스 처분 2건 — 하드코딩·라이브 동시 차단** (작가님 14:54 직접 지시) — ① **v4-preview 태그 회수**: `--no-traffic` 태그 리비전 `portal-00377-feh`가 `minScale=1`을 이행하며 **31일간 요청 0건 처리·1대 상시 점유**(active 0.00 / idle 1.00 상시 계측). `portal/deploy.sh:133` 1→0 + 라이브 태그 제거 → 15:03 KST부로 **시계열 자체 종료 = 소멸 확정**. 원인은 preview 분기가 prod 전제(`MIN_INSTANCES=1`)를 복사한 것 — **`--no-traffic` 리비전에는 성립하지 않는 전제** ② **idphoto-jp minScale 0**: `idphoto-jp/deploy.sh:70` 07-04 "변경 금지" 가드레일 해제(콜드스타트 인시던트 기록 0건, 측정 근거 없음). 🔴 **[예외] 법률 5장 2조** — 이미지 무변경 목적으로 `services update` 사용, `imageDigest sha256:204560c0…30992` **00126↔00127 완전 동일 실증**(재빌드 0, 변경분은 minScale 하나) ③ **🔴 검증4 1차 측정 폐기** — 지시서 §4 "10분 이상 대기 후 3회"를 그대로 이행했으나 **콜드-웜 차이 0.06초**, 지표상 idle이 전 구간 1.0으로 **한 번도 0에 도달 못 함** = 전부 웜 히트. **11분 고정 대기가 유휴 반납(실측 ~15분)보다 짧았고 매 프로브가 타이머를 리셋** — 0으로 내려가길 기다린 게 아니라 11분마다 깨우고 있었음. **교훈: 검증 조건을 시간이 아닌 상태로 표현해야 한다**(`instance_count=0` 확인 후 프로브로 전환, 폴링은 Monitoring만 조회 = 측정기·측정대상 분리) ④ **JP prod 콜드스타트 실측 3.106 / 2.117 / 1.745초(평균 2.32초)**, 웜 0.42초대 일정. ⚠️ **민아 kr-dev(512Mi/1CPU) 2.25초와 거의 동일 → 콜드스타트가 스펙에 눌리지 않는다. "KR prod는 2Gi/2CPU라 짧을 것"은 미지지** ⑤ 범위 엄수: `idphoto-kr:71`·`portal:98`(prod) 무수정. 작가님 15:09 측정 타이밍 경고 반영해 최종 판독은 프로브 종료 후 25분 유휴 확보 후 실행 | [COMPLETION](../../reports/2026-07/COMPLETION_20260726_iMac막내1_INFRA_유휴인스턴스처분.md) · `portal/deploy.sh` · `idphoto-jp/deploy.sh` · `jp-00127-n9z` | ✅ (KR 처분은 별건 판정 대기) |
| 08/13 | iMac/막내2 | **메일 발신 인프라 Phase 2 — 발송 모듈 신설, DNS·배포는 Phase 0 대기** — 배경: `info@monkos.ai`가 **받기만 되고 보내기가 안 되는 주소**(MX=CF Email Routing 수신 전용, SPF에 발신 서버 미등재, DMARC 부재, 발송 코드 전무) → 08-13 탈퇴 회신을 작가님 개인 주소로 발송하는 실피해 발생. ① **착수 게이트 실측** — `secret check RESEND_API_KEY` ❌ 없음 → 지시서 §3에 따라 Phase 1(DNS) 미착수, 비의존 항목만 선행 ② **`lib/mailer.js` 신설** — Resend API(전역 `fetch`, SMTP 아님, **신규 의존성 0**), `sendMail()` → 메시지 id 반환. 발신 주소·표시명은 `config.js` 상수 정본 경유(ch2 7조), 표시명 "MONKOS"(ch8) ③ **실패 가시화** — 전 실패 경로 `MailError` throw(무음 `catch {}` 0건), Resend 원문 status·body 보존해 무료 티어 한도 초과가 가공 없이 호출부 도달. **HTTP 200이어도 메시지 id 부재 시 실패 처리** — "보냈다고 믿는데 안 간" 상태 차단 ④ **로컬 스모크** — 무효 키 실 API 호출로 `HTTP 401 API key is invalid` 원문 전파 실증. 자체 결함 1건(인자 누락을 `retryable=true`로 오분류) 발견·수정 ⑤ 🔴 **지시서 전제 1건 정정** — §4가 지시한 `CF_ZONE_ID`는 **SM 미등록**(문서 폴백만). 단 `CF_API_TOKEN`으로 zone name 조회 시 `monkos.ai` + `#dns_records:edit` 확인 → **시크릿 추가 없이 Phase 1 실행 가능** ⑥ **보류 사유 명시** — `deploy.sh --set-secrets`는 **SM에 없는 시크릿을 참조하면 포털 배포 전체가 실패**하므로 등록 후 반영, `SECRET_INVENTORY` 선등재는 `secret_patrol.sh` 오탐 유발. **DNS 변경 0 · 배포 0 · 시크릿 값 접촉 0** | [REPORT](../../reports/2026-08/REPORT_20260813_iMac막내2_INFRA_메일발신인프라_Phase0대기.md) · `portal/lib/mailer.js` · `config.js` · `references.md` | ⏳ Phase 0(작가님 Resend 가입·키 발급) 대기 |
| 08/13 | iMac/막내2 | **메일 발신 인프라 가동 — `info@monkos.ai`가 보낼 수 있는 주소가 됨** — ① **Phase 1 DNS 검증**(작가님 등록분, 막내 무변경): 루트 MX 3행·루트 SPF 1개 **무손상 확인**(CF Email Routing 수신 보존), 신규 4건(DKIM `resend._domainkey` / `send` MX / `send` SPF / `_dmarc p=none`) 권위 NS 2종 + 공용 리졸버 2종 **전건 일치**. ⭐ **Resend는 return-path를 `send` 서브도메인에 두는 방식** → 루트 SPF 병합 불요, DMARC 정렬은 루트 DKIM(`d=monkos.ai`)으로 성립 ② 🟢 **실발송 스모크 합격** — 1통 발송 성공(`id=92140503…`), Gmail 실측 `labelIds=["UNREAD","INBOX"]` **스팸함 아닌 받은편지함 직행**, 발송→수신 **3초**. **발송 성공 자체가 도메인 인증 실증**(미인증 도메인은 Resend가 거부) ③ 🔴 **자체 판독 오류 정정** — 1차에 "4건 중 2건 미등록 + NS 전파 지연"으로 오판. 원인은 DNS가 아니라 **UDP 8쿼리 연타가 CF 레이트리밋에 걸린 것**, `dig +tcp` 단발로는 전건 정상. **측정기가 측정 대상을 교란** — 07-26 막내1 "11분 대기가 유휴 반납 타이머를 리셋"과 동형. 간헐 결과 시 대상보다 측정 경로를 먼저 의심할 것 ④ 💡 `RESEND_API_KEY`가 **발송 전용 제한 키**로 발급(`/domains`·`/emails/{id}` 전부 401 `restricted_api_key`) — 유출돼도 설정 변경·이력 열람 불가, 최소권한 부합 ⑤ dev 배포 `monkos-portal-dev-00179-wxw`, `/health` 200, 시크릿 `secretKeyRef` 주입·평문 value 부재 실측 ⑥ ⏳ **잔여**: `Authentication-Results` 헤더 원문 미확보(Gmail MCP가 임의 헤더 미노출 + 제한 키로 우회 불가) → 작가님 「원본 보기」 확인 필요. **정황은 pass 유력하나 정황≠실측이라 미확인으로 남김** ⑦ ⏸️ **prod 보류** — 08-02 이후 타 커밋 2건(`a54ae2b1` gcs-save/config, `0a9a7921` FACEREAD 판정 로직)이 동반 라이브되므로 07-25 선례대로 범위 고지 후 대기. 발신 기능은 아직 호출부가 없어 prod 미반영이 기능 손실 아님 | [COMPLETION](../../reports/2026-08/COMPLETION_20260813_iMac막내2_INFRA_메일발신인프라.md) · `portal/deploy.sh` · `SECRET_INVENTORY.md`(43) · `dev-00179-wxw` | ✅ (헤더 확인 + prod 승인 대기) |
| 08/13 | iMac/막내2 | **메일 발신 인프라 prod 라이브** (작가님 17:36 배포 승인) — `monkos-portal-00544-sh8` 트래픽 100%(이전 `00543-trd`, 08-02). 범위 고지대로 **커밋 3건 동반 라이브**: 본 건(mailer.js·config·deploy.sh) + `a54ae2b1`(막내1 gcs-save/config) + `0a9a7921`(FACEREAD 상대판정). 검증: `/health` 200(0.51s), 홈·`/specs/passport/kr`·`/admin/gwansang` 전 200, `/app`→idphoto-kr 302 정상, **배포 후 prod ERROR 0건**. `RESEND_API_KEY → secretKeyRef(latest)` 주입·**평문 value 부재** 실측. ⚠️ `/idphoto` 404는 회귀 아님 — 포털에 해당 라우트가 애초에 없고(`/api/idphoto/*`만 존재) 진입은 `/app` 302 또는 `idphoto-kr.monkos.ai` 직행. **롤백**: `gcloud run services update-traffic monkos-portal --region us-central1 --to-revisions monkos-portal-00543-trd=100`. 발신 기능은 호출부 미배선 상태로 라이브(배선은 별건 지시서) | [COMPLETION](../../reports/2026-08/COMPLETION_20260813_iMac막내2_INFRA_메일발신인프라.md) §3 · `00544-sh8` | ✅ |
| 09/01 | iMac/민아 | **배포 가드레일 G1~G6 직접 실행** (작가님 직접 지시·[예외]) — 12본 완성도 실측(종합 B) 후: G1 specs_drift.sh(무음 구본 감지+pre-push 훅)·G2 콘텐츠 어서션(edge 내장, live-verify 코드화)·G4 미커밋 게이트 9본 이식·G5 pipefail 승급 8본·G6 이중소스 경고 4본+좀비 가드 2본. 구문 12/12·스모크 5/5(드리프트 경보 시뮬·G4 실차단·좀비 차단). 잔여: 이중소스 라벨 자동화·ch5 게이트 표준 조항화(개정 청구) | [COMPLETION](../../reports/2026-09/COMPLETION_20260901_iMac민아_배포가드레일.md) | ✅ |
| 09/19 | iMac/쌍아 | **Codex CLI 도입** (작가님 직접 지시, Astra 테스트 목적·ChatGPT Plus) — `brew install codex` 0.155.1(`/usr/local/bin/codex`). npm 전역은 `/usr/local/lib/node_modules` root 소유로 sudo 필요해 cask 선택. 모델 `gpt-6-astra` 확인. `~/.bash_profile`에 기존 `mk-*` 컨벤션으로 `mk-g`(read-only)·`mk-gw`(workspace-write) 2행 추가, 백업 `~/.bash_profile.bak-20260919`. ⚠️ 잔여 리스크: 레포 `.env` 6본에 40자+ 실키 19건(광역오더 #8 위반, 별건 정리 필요) + `governance/`·`monkos-ops/` 전량이 외부 벤더 읽기 범위(헌법 4조 3항, 작가님 인지 하 수용) | 세션로그 2026-09-19_iMac_쌍아.md, `~/.bash_profile` | ✅ |
| 09/27 | iMac/민아 | **retrieval 인덱스 9시간 무음 공백 적발·강화 + 기록 탐색 서브에이전트** — 09-26 17:42~09-27 02:47 monk_index.db 빈 파일(mk-push `--embed` 30분 정지 후), 전 에이전트 grep 무음 강등. 재빌드 후 서브에이전트(막내 역할) 강화: 타임아웃·원자적 교체·헬스체크·OR 폴백·스모크. 벤치 top5 4/6·9월 사용 1/59 → 규칙 개정: 기록 탐색은 `record-explorer` 위임, grep 1순위, monk_search=의미·이력 | 1edebdac · `COMPLETION_20260927_iMac막내_retrieval_index_hardening.md` · `.claude/agents/record-explorer.md` | ✅ |
| 10/03 | iMac/쌍아 | **ORDER** M2 개발 도구를 iMac 기준에 맞게 세팅 — Python 3.10+, gitleaks, git 훅 2종, Claude Code 갱신 | [ORDER_20261003_iMac쌍아_M2쌍아_INFRA_M2도구세팅](../../orders/2026-10/ORDER_20261003_iMac쌍아_M2쌍아_INFRA_M2도구세팅.md) | ⏳ |
| 10/03 | M2/쌍아 | **COMPLETION** COMPLETION_20261003_M2쌍아_INFRA_M2도구세팅 | [COMPLETION_20261003_M2쌍아_INFRA_M2도구세팅](../../reports/2026-10/COMPLETION_20261003_M2쌍아_INFRA_M2도구세팅.md) | ✅ |
| 10/22 | iMac/쌍아 | **DESIGN** M1 애플 비전 매팅 서버 테스트 — matte-server 계약 불변, Q·S·E·F 4판정, 0단계 품질은 iMac 선행 | [DESIGN_20261022_INFRA_M1_애플비전_매팅서버_테스트](../../../tech/designs/2026-10/DESIGN_20261022_INFRA_M1_애플비전_매팅서버_테스트.md) | ⏳ |
| 10/22 | iMac/쌍아 | **ORDER** 애플 비전 매팅 서버 1단계 — Swift 계약 준수 서버 + iMac 로컬 계약 테스트 (0단계는 07-07 실측으로 생략) | [ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_1단계](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_1단계.md) | ⏳ |
| 10/22 | iMac/쌍아-막내8 | 애플 비전 매팅 서버 1단계 — vision-matte Swift 서버(4060 계약 준수) + iMac 로컬 계약 테스트 8/8, 3MP p50 0.206s | [COMPLETION_20261022_iMac쌍아-막내8_INFRA_애플비전_매팅서버_1단계](../../reports/2026-10/COMPLETION_20261022_iMac쌍아-막내8_INFRA_애플비전_매팅서버_1단계.md) | ✅ |
| 10/22 | iMac/쌍아 | **ORDER** Gemini 2.5→3.x 이전(원장 187) | [ORDER_20261022_iMac쌍아_막내_INFRA_Gemini25_3x이전](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_Gemini25_3x이전.md) | ⏳ |
| 10/22 | iMac/쌍아 | **ORDER** 애플 비전 매팅 2단계 iMac dev 시험(터널 matte-imac) | [ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_2단계_iMac](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_2단계_iMac.md) | ⏳ |
| 10/22 | iMac/쌍아 | **ORDER** 매팅 1순위(옛 4060 자리) Vision 전환 — 테두리 보정·iMac 상주·체인 Vision→RunPod | [ORDER_20261022_iMac쌍아_막내_INFRA_매팅_4060자리_Vision전환](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_매팅_4060자리_Vision전환.md) | ⏳ |
| 10/22 | iMac/쌍아 | **COMPLETION** 애플 비전 매팅 2단계(막내10) — 터널 matte-imac·dev E/F 통과·마스크 2016×1512 고정·품질 띠 MAE 0.06~0.10 | [COMPLETION_20261022_iMac쌍아-막내10_INFRA_애플비전_매팅서버_2단계](../../reports/2026-10/COMPLETION_20261022_iMac쌍아-막내10_INFRA_애플비전_매팅서버_2단계.md) | ✅ |
| 10/22 | iMac/쌍아-막내9 | Gemini 2.5→3.5 텍스트 이전 dev 완료 — 4서비스 global 3.5-flash, 콜스코프 thinkingLevel 호환 수정, prod 승인 대기 | [COMPLETION_20261022_iMac쌍아-막내9_INFRA_Gemini25_3x이전](../../reports/2026-10/COMPLETION_20261022_iMac쌍아-막내9_INFRA_Gemini25_3x이전.md) | dev 완료 |
| 10/22 | iMac/쌍아 | **ORDER** Gemini 3.5 타임아웃·건너뛰기 가드(원장 187 prod 선행) | [ORDER_20261022_iMac쌍아_막내_INFRA_Gemini35_타임아웃가드](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_Gemini35_타임아웃가드.md) | ⏳ |
| 10/22 | iMac/쌍아 | **COMPLETION** 매팅 1순위 Vision 전환(막내10) — 흰 테두리 보정·launchd 상주·dev E/F, prod 00568-w2l 반영(쌍아 23:24) | [COMPLETION_20261022_iMac쌍아-막내10_INFRA_매팅_4060자리_Vision전환](../../reports/2026-10/COMPLETION_20261022_iMac쌍아-막내10_INFRA_매팅_4060자리_Vision전환.md) | ✅ |
| 10/24 | iMac/민아 | 디바이스 맵 정본 포인터 신설(ch1 4조·rules·references→devices/README) + 테일넷 호스트명 실측 열·4060 배제·M4 실효·M1/4060 호스트명 드리프트 교정. 근거: 10-23 macmini-macmini(M1)→M2 오판. [예외] 규정 계층, 작가님 직접 지시 | [DEVICE_CHANGELOG](../../devices/DEVICE_CHANGELOG.md) | ✅ |
| 10/24 | iMac/쌍아 | **ORDER** 집행 훅 — 새로 쓰는 `**[YYYY-MM-DD HH:MM KST]**` 헤더를 쓰기 직전에 실측 시각과 대조(±2분 초과 차단 + 실측값 안내) | [ORDER_20261024_iMac쌍아_막내16_MONK_OS_시각헤더_쓰기직전대조훅](../../orders/2026-10/ORDER_20261024_iMac쌍아_막내16_MONK_OS_시각헤더_쓰기직전대조훅.md) | ⏳ |
| 10/24 | iMac/쌍아-막내16 | 집행 훅 E11 시각 헤더 쓰기 직전 대조 — time_header.py + guard_write·guard_bash·guard_message(SendMessage matcher 신설), +2분 미래·10분 과거 deny+실측값 안내. 스모크 123→146/146, 실세션 Write·Bash 차단 실측 | [COMPLETION_20261024_iMac쌍아-막내16_MONK_OS_시각헤더대조훅](../../reports/2026-10/COMPLETION_20261024_iMac쌍아-막내16_MONK_OS_시각헤더대조훅.md) | ✅ |
| 10/27 | iMac/쌍아 | **DESIGN** RunPod 워밍 조건부화(iMac 생존 시 비가동·백업 전용) + 백업 전환 시 고객 안내·팀 알림 설계 | [DESIGN_20261027_PORTAL_매팅워밍조건부_백업지연안내](../../../tech/designs/2026-10/DESIGN_20261027_PORTAL_매팅워밍조건부_백업지연안내.md) | ⏳ |
| 10/27 | iMac/쌍아 | **ORDER** RunPod 매팅 워밍 조건부화 + 백업 전환 시 고객 안내(4언어)·팀 알림 — 구현·dev 검증까지 (prod 배포 없음) | [ORDER_20261027_iMac쌍아_막내21_INFRA_매팅워밍조건부_백업지연안내](../../orders/2026-10/ORDER_20261027_iMac쌍아_막내21_INFRA_매팅워밍조건부_백업지연안내.md) | ⏳ |
| 10/27 | iMac/쌍아-막내21 | **COMPLETION** COMPLETION_20261027_iMac쌍아-막내21_INFRA_매팅워밍조건부 | [COMPLETION_20261027_iMac쌍아-막내21_INFRA_매팅워밍조건부](../../reports/2026-10/COMPLETION_20261027_iMac쌍아-막내21_INFRA_매팅워밍조건부.md) | ✅ |
| 10/27 | iMac/쌍아 | **ORDER** 매팅 백업 알림 문구 사유별 분리 + 백업 안내 3키 id·vi 추가 — dev 검증까지 (prod 배포 없음) | [ORDER_20261027_iMac쌍아_막내21_INFRA_백업알림사유분리_id_vi](../../orders/2026-10/ORDER_20261027_iMac쌍아_막내21_INFRA_백업알림사유분리_id_vi.md) | ⏳ |
| 10/27 | iMac/쌍아 | **DEPLOY** 매팅 워밍 조건부화·백업 안내(6언어)·알림 사유 분리 prod 반영 — 포털 monkos-portal-00570-22q · 엣지 fde2fe79 (2회 히트 ko·ja·id·vi 정합, 작가님 배포 승인 10-27 20:22·20:49) | — | ✅ |
| 10/28 | iMac/쌍아 | preview.monkos.ai 도메인 매핑 인증서 정체(ACME 404 131건) 조사·정리안 지시 → 막내3 | [ORDER_20261028_iMac쌍아_막내3_INFRA_preview도메인매핑_인증서](../../orders/2026-10/ORDER_20261028_iMac쌍아_막내3_INFRA_preview도메인매핑_인증서.md) | ✅ |
| 10/28 | iMac/쌍아-막내3 | **REPORT** preview.monkos.ai 도메인 매핑 인증서 정체 + ACME 404 원인 — 조회만, 변경 0 | [REPORT_20261028_iMac막내3_preview도메인_인증서](../../reports/2026-10/REPORT_20261028_iMac막내3_preview도메인_인증서.md) | 📁 |
| 10/28 | iMac/쌍아 | M-A ACME 워커 제외 라우트 + P-A preview 매핑 삭제 집행 지시 → 막내3(작가님 18:29 승인) | [ORDER_20261028_iMac쌍아_막내3_INFRA_ACME워커제외라우트_preview매핑삭제](../../orders/2026-10/ORDER_20261028_iMac쌍아_막내3_INFRA_ACME워커제외라우트_preview매핑삭제.md) | ✅ |
| 10/28 | iMac/쌍아 | P-A 집행 — preview.monkos.ai 도메인 매핑 삭제(쌍아, 작가님 승인). 사후 5개 True·monkos.ai 2회 히트 200. M-A는 도구 한계로 대기 | — | ✅ |
| 10/28 | iMac/쌍아 | 엣지 배포 5e6b4a18 — M-A ACME 워커 통과 + ASN 전달. 라이브 200, ACME 경로가 도메인 매핑으로 도달 확인. 갱신 확정은 원장 (192) 11-08 | — | ✅ |
| 10/22 | iMac/쌍아-막내9 | Gemini 3.5 타임아웃·건너뛰기 가드 dev 완료 — 사전분석 15s 생략·콜스코프 30s 명시 오류, 자연 429 1회 생략 실증, prod 승인 대기 | [COMPLETION_20261022_iMac쌍아-막내9_INFRA_Gemini35_타임아웃가드](../../reports/2026-10/COMPLETION_20261022_iMac쌍아-막내9_INFRA_Gemini35_타임아웃가드.md) | dev 완료 |
| 11/03 | ?/? | **ORDER** SessionStart 훅 기기 판별 정본화 — M1·4060 오판(→"웹(원격)/민아") 제거, 기기 식별 파일 우선·미확인은 명시 경고, 스모크·일람표·스킬표 동기화 | [ORDER_20261103_iMac쌍아_막내8_INFRA_세션시작훅_기기판별_정본화](../../orders/2026-11/ORDER_20261103_iMac쌍아_막내8_INFRA_세션시작훅_기기판별_정본화.md) | ⏳ |

---
| 08/13 | iMac/민아 | **2주 운영 감사 — 4060 매팅 불통 확정 + 폴백 체계 실전 검증** — matte.monkos.ai 전 경로 530(CF 터널 불통) + Tailscale 노드 소멸 + SSH 타임아웃 = 기계 자체 오프라인. 마지막 4060 정상 서빙 08-12 16:54 KST → 08-13 01:14 KST부터 전량 프리플라이트 불통. 14일 매팅 74건 중 RunPod 폴백 약 27건(36%), 최근 3일 사실상 전량 RunPod(종량 과금 중). 야간·새벽 간헐 이탈 포함 15일 중 8일 이탈 관측. **유저 실패 0건** — 07-25 조치(세마포어·줄서기·25s) 실전 합격: 최악 08-10 20:49 KST 4060 hang+RunPod 순간 동시실패에도 200/87.7s 납품, 504 재발 0. 물리 점검(전원/네트워크) 필요 | 세션 보고 (sessions/2026-08/2026-08-13_iMac_민아.md) | 🔴 4060 물리 확인 대기 |
| 08/24 | iMac/민아 | **CF 엣지 이관 + 웜 전면 해제** — monkos.ai 전 트래픽 CF Worker(monkos-portal-edge) 경유 컷오버(specs 2,574p 정적+CMS 캐시). idphoto-kr(08-23)·portal(08-24) MIN 1→0, 전 서비스 minScale 0 실측. 비용 월 13만→6만 안팎. 신뢰 체계 EDGE_TRUST_KEY(AND 대역, 쌍아 P2-2). ⚠️ 관찰: 한산 시간대 첫 생성·결제 콜드스타트 | [COMPLETION](../../reports/2026-08/COMPLETION_20260824_iMac민아_specs_CF엣지정적화_컷오버.md) + 사후오더 2건 | ✅ |
| 08/25 | iMac/민아 | **배포 도구 보정 4건** — portal deploy.sh 엣지 드리프트 검사(양상태 실증)·edge/deploy.sh 스모크 게이트 4콜(첫 실전 4/4)·EDGE_TRUST_KEY 기동 경고(양방향 실증)·getSetCookie 가시화. "SSG 재배포 누락=무음 구본" 재발 방지 체계 완성 | [COMPLETION](../../reports/2026-08/COMPLETION_20260825_iMac민아_specs14키교정_배포도구보정.md) | ✅ |
| 09/02 | iMac/민아 | **09-01 가드레일 결함 2건 자인** (PETITION_20260902 행정심사 막내2 ④·⑤ 적발) — G1 `specs_drift.sh`가 gitignore된 `tools/specs-ssg/dist/` 해싱 → 타 디바이스 상시 오탐(단일 디바이스 스모크의 이식성 미시험) / portal deploy.sh 드리프트 게이트 gitRev 부재·빈값·필드없음 3경로 무음(필드없음=배포 후 무메시지 exit 1). 보정은 개정 3 발효 선행 조건으로 편입(지시서 사안). -u 보류(09-01) 철회 — 막내2 `bash -u` 12본 실측 파손 1건(에러 경로)로 즉시 적용 지지 | `REVIEW_20260902_iMac민아_PETITION20260902_청구인의견.md` §3 · COMPLETION_20260901 정정 각주 | ⏳ 보정 대기 |
| 09/02 | iMac/막내1 | **ch5 7조 발효 선행 조건 4건 보정 — 발효 요건 충족** — ① `edge/smoke_assert.txt` 실배치(3행: specs 대표 슬러그·CMS canonical·구문구 부재) + 파서 서식 검증(탭 누락·부호 미상·문구 공백·유효 0건을 실패로 계상) ② 어서션 파일 부재 시 "스킵(파일 부재)" 명시 출력 ③ `specs_drift.sh` `calc()` → `git ls-files` 전환(gitignore `dist/` 7건 제외) + MIN_FILES 가드 + 해시 재기록 ④ portal deploy.sh 드리프트 게이트 무음 3경로(gitRev 부재·빈값·로컬 미존재) 명시 출력, 필드부재 시 pipefail 무음 exit 1 제거. **2환경 검증**(iMac + 클린 클론): 어서션 파서 격리 9케이스 전건 기대대로 · 드리프트 게이트 5조건 전건 명시 출력 · **클린 클론 G1 "드리프트 없음"**(대조군: 구 알고리즘은 같은 클론에서 불일치=오탐 재현). 라이브 2회 히트로 엣지 현행 확인 후 원장 재기록. ⏳ 잔여 2건: 게이트 4 종료 위치(ch5 6조) · portal 게이트의 로컬빌드 기준 판정 | [COMPLETION](../../reports/2026-09/COMPLETION_20260902_iMac막내1_ch5_7조_발효선행조건.md) · `690d87cb` | ✅ |
| 09/02 | 작가님·iMac/민아 | **4060 GPU 서버 라인업 배제** — 자녀가 포맷, 당분간 재구축 없음. matte.monkos.ai 530×2 실측(20:44)=정상 상태, 매팅은 `matte.js` 체인 폴백으로 RunPod Serverless 전량 처리(서비스 영향 0). 방향: RunPod 당분간 → 정부 지원·저가 GPU. 4060 전제 자산(`/4060` 스킬·ComfyUI/VTON·matte-server deploy·loadtest 사본) 보류. 메모리 갱신 | 세션로그 09-02 20:44 · 메모리 `project_4060_intentional_downtime` | ⏸️ 4060 보류 · RunPod 상시 |
| 09/27 | iMac/민아 | **retrieval 임베딩 영구 미완 구조 교정** — 정본에 chunk_embeddings 부재(벡터 검색 전면 미가동) 실측. [B] kill 시 임시 DB와 함께 진행분 폐기가 기전 → 사이드카 `embed_cache.db`(content_hash+model) 배치 커밋·중단 재개, mk-push [A'] 이월. 전량 24,461 반영(sqlite count), 스모크 PASS, vector 모드 실작동. [예외] 쌍아 추인 대상 | a85f5f24 · COMPLETION_20260927_iMac민아_retrieval_임베딩캐시_사이드카.md | ✅ |
| 09/29 | 4060/쌍아 | **4060 원격 접속층 재구축 (포맷 후)** — 호스트명 `MONK-4060`(재부팅 시 적용) · 방화벽 22번 Tailscale 대역 한정(공인 IP 직수령 환경) · sshd 자동 시작 + `AllowUsers smuse73` + iMac 키 등록(fingerprint 일치) · Tailscale 1.102.4 → 노드 `monk-4060` IP `100.118.31.62` 재지정·키 만료 해제, 구 노드·han-macbookpro 삭제. 계정: smuse73 무비밀번호(작가님 결정)·kku06(아이 사용) 불가침. 매팅 서버·cloudflared는 미복구(09-02 배제 방침 유지). 잔여: 재부팅 후 iMac `ssh 4060` 키 인증 실측 → `PasswordAuthentication no` | 세션로그 2026-09-29_4060_쌍아.md | ⏳ 재부팅·접속 실측 대기 |
| 09/29 | 4060/민아 | **4060 복귀(아이 PC 대여 원칙) + RunPod 매팅 진단·설정 변경** — RunPod 월 $20 소진 구조 실측: 상시 누수 0(Pod·볼륨 0, 최소 워커 0), 잡 2,022건/하루 약 22건, 실패(콜드 25s×2 abort→폴백) 하루 2~8건이 비용 절반 추정. 실기 프로브: 24GB 등급이 전부 PRO 6000 MIG로 배정돼 **첫 추론 72초**(JIT 추정) vs A4500 1.3초 → 작가님 콘솔에서 US-NE-1 DC 제외 + 24GB 등급 해제(16GB만). 잔존: 신규 워커 기동 86초(이미지 수신 추정) > 포털 50초 한도. 시간대 분석(30일 391건): 12~17시 43%, 심야 실패율 38% → 작가님 "4060 새벽 1순위" 검토(며칠 후 세팅). 도구: 4060에 gcloud 586(사용자 범위, Norton SSL 검사 CA 번들·bash 심)·Node 24 포터블. `RUNPOD_USAGE.jsonl` 08-01 이후 정지 발견(원인 미확인) | 세션 로그 2026-09-29_4060_민아 · RunPod 엔드포인트 v5 | ⏳ 효과 관찰 1~2일 |

## 5. Phase 현황

### Phase 1 — 현황 파악 ✅

| 항목 | 상태 |
|------|------|
| GCS 버킷 전수 파악 (9개) | ✅ |
| 로컬 에셋 전수 조사 (661개) | ✅ |
| 코드→GCS 참조 맵 (라인 단위) | ✅ |

### Phase 2 — 구조 설계 ⏳

| 항목 | 상태 |
|------|------|
| 고객/에셋 버킷 분리 설계 | ✅ (코드 변경 완료, 배포 보류) |
| 로컬 워크벤치 구조안 | ✅ (제안서 기안) |
| Drive 소통 허브 설계 | ⏳ (방향 확정, 상세 미정) |
| GCS prefix 확정 (STYLER 로드맵 감안) | ⏳ |

### Phase 3 — 실행

| 항목 | 상태 |
|------|------|
| 고객 버킷 분리 배포 | ⏳ (GCS prefix 확정 후) |
| 로컬 워크벤치 구축 + 중복 정리 | ⏳ |
| Drive 폴더 구조 생성 + macOS 동기화 | ⏳ |
| sync-assets.sh 스크립트 | ⏳ |
| ASSET_REGISTRY.md 현행화 or 폐기 | ⏳ |

### Phase 4 — 어드민

| 항목 | 상태 |
|------|------|
| 어드민 에셋 브라우저 (트리+썸네일) | ❌ |
| 고객 사진 리뷰 대시보드 | ❌ |

---

## 6. 관련 PF

| PF | 관계 |
|----|------|
| PF_STYLER | 서비스별 에셋 prefix 설계. 고객 데이터 구조 |
| PF_SECURITY | SA 권한, 보안 감사 결과 |
| PF_AUTOPILOT | CF↔CR 중계, 시크릿 통합, 브리핑 파이프라인 |
| PF_RETRIEVAL | 문서 인덱스. PF_INFRA 변경 시 리빌드 대상 |
| PF_MONK_OS | 하네스 아키텍처. 인프라는 하네스가 동작하는 기반 |
| PF_KKU | 꾸 워크벤치 (M2 동일 구조 적용) |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 버킷 분리 후 기존 Signed URL 깨짐 | 낮음 | 원본 데이터 보존, 롤백 즉시 가능 |
| Drive 동기화 충돌 | 중 | macOS Drive 앱 충돌 해소 + 단방향 우선 |
| ASSET_REGISTRY 이중 정본 | 중 | PF_INFRA가 정본 선언, ASSET_REGISTRY는 참조/폐기 판정 |
