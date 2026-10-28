---
type: report
date: 2026-10-28
device: iMac
agent: 쌍아-막내3
subject: preview.monkos.ai 도메인 매핑 인증서 정체 + ACME 404 원인 — 조회만, 변경 0
portfolio: PF_INFRA
order: ORDER_20261028_iMac쌍아_막내3_INFRA_preview도메인매핑_인증서.md
status: 마감
---

# REPORT — preview.monkos.ai 인증서 정체

**[2026-10-28 18:26 KST]** iMac/쌍아-막내3 → 쌍아 (참조: 작가님)

## 결론 1줄

**preview는 DNS 레코드가 없는 미사용 매핑(3월부터 방치, 무해)이고, ACME 404 131건/일의 주인은 preview가 아니라 `monkos.ai` 본 매핑의 인증서 갱신 실패다.** 라이브 영향은 0이지만, 08-24 컷오버의 롤백 절차("프록시 토글 OFF")가 기대는 Google 인증서가 **2026-11-15에 만료**되므로 그 전에 결정이 필요하다.

| 대상 | 판정 | 권고 | 기한 |
|---|---|---|---|
| preview.monkos.ai 매핑 | 미사용·DNS 없음·소비처 0 | **P-A 매핑 삭제** | 없음(급하지 않음) |
| monkos.ai 매핑 인증서 | 10-09부터 갱신 실패 중, 만료 11-15 | **M-A 워커 제외 라우트로 ACME만 통과** (검증 1회 선행) | **11-15 전** |

---

## 1. 실측 (18:22~18:26, 조회만)

### 1-1. preview.monkos.ai — 실제 경로

| 항목 | 값 | 방법 |
|---|---|---|
| DNS | **레코드 없음** — 공용 리졸버 빈 응답, 권한 NS `edna.ns.cloudflare.com` 직접 질의도 A·CNAME 모두 빈 응답 | 양성 대조군: 같은 NS에서 `studio.monkos.ai` → `ghs.googlehosted.com.` 응답 |
| 라이브 | `Could not resolve host` ×2 | 2회 히트(live-verify.md 1항). 대조군 `monkos.ai/` 200 ×2 |
| 엣지 워커 라우트 | `monkos.ai/*` 하나뿐(`edge/wrangler.toml:14`) — `*.monkos.ai`를 받지 않는다. preview는 워커 대상이 아니다 | 코드 실측 |
| Cloud Run 매핑 | `preview.monkos.ai → monkos-portal`(**prod 서비스**, dev 아님), 생성 2026-03-14 13:22Z, Ready=False "Resource readiness deadline exceeded"(03-16 이후 정지), CertificateProvisioned=Unknown "challenge data was not visible through the public internet" | `gcloud beta run domain-mappings list --format=json` |
| 소비처 | 코드·스크립트·워크플로 grep 0건. `deploy.sh preview` 모드는 이 도메인이 아니라 **트래픽 0% 태그 URL(run.app)**을 쓴다(`portal/deploy.sh:14`) | grep |
| 생성 경위 | 03-14 M1 쌍아 세션 로그 38행 — 프리뷰 OAuth 테스트 문제의 "장기 대안: preview.monkos.ai 커스텀 도메인 매핑(쿠키 공유 + OAuth 1회 등록)". 매핑만 만들고 **DNS 레코드는 끝내 추가하지 않은 것으로 보인다** `[추정 — 레코드가 있다가 지워졌을 가능성은 CF 감사 로그로만 확인 가능]` | git log -S |

> `references.md` §서비스 매핑은 포털 도메인을 "monkos.ai, preview.monkos.ai"로 적고 있어 preview가 살아 있는 표면처럼 읽힌다 → 정리 시 같이 고칠 대상.

### 1-2. ACME 404의 주인 = monkos.ai 본 매핑

| 근거 | 값 |
|---|---|
| 요청 출발 IP | `104.23.213.142`, `172.68.244.172` — **Cloudflare 대역**. DNS가 없는 preview로는 Google이 도달조차 못 한다. CF를 거쳐 오는 건 프록시된 `monkos.ai`뿐이다 |
| 요청 경로 | Google-Certificates-Bridge → `monkos.ai/.well-known/acme-challenge/…` → CF 워커 → 오리진 `ORIGIN_URL = monkos-portal-…run.app`(`edge/wrangler.toml:26`) → 포털 컨테이너 404. 로그 호스트가 run.app인 이유 |
| 재현 | `https://monkos.ai/.well-known/acme-challenge/probe-zz` → 404 ×2 (엣지가 오리진으로 넘기는 경로 확인) |
| 시작 시점 | 2026-02 이후 로그에서 **10-09부터 하루 약 131건**(10-09 691건 이상, 이후 131~262/일). 그 이전은 09-29 1건뿐 |
| 인증서 | Google 프런트(216.239.32.21, SNI monkos.ai): **CN=monkos.ai, Google Trust Services WR3, 발급 2026-08-17, 만료 2026-11-15**. 90일 인증서의 갱신 창이 10월 중순에 열린 시점과 404 시작(10-09)이 맞물린다 |
| 왜 실패하나 | 08-24 컷오버로 apex가 CF 프록시가 됐다. Google의 HTTP-01 응답은 Google 프런트(도메인 매핑 계층)가 해야 하는데, 요청이 워커를 거쳐 **run.app(서비스 기본 URL)**으로 가서 컨테이너가 받는다 → 404. 08-17 발급분은 컷오버 전이라 성공했다 |

### 1-3. 실영향 판정

- **현재 라이브 영향: 0.** 사용자는 CF 엣지 인증서(Google Trust WE1, 만료 2026-12-20, CF 자동 관리)를 보고, 엣지 → 오리진은 run.app 자체 인증서를 쓴다. monkos.ai 매핑 인증서는 지금 아무 경로에서도 쓰이지 않는다.
- **잠재 영향 — 롤백 경로가 끊긴다.** 08-24 컷오버 기록(COMPLETION_20260824_iMac민아_specs_CF엣지정적화_컷오버)의 롤백 절차는 "CF 대시보드에서 apex 8레코드 프록시 토글 OFF(레코드·도메인 매핑 무손실 유지 중)"이다. **11-15 이후 이 롤백을 실행하면 브라우저가 만료된 Google 인증서를 받아 monkos.ai 전체가 접속 불가**가 된다(재발급까지 수십 분~수 시간 `[추정]`).
- 부수: 로그에 하루 약 131건의 404가 쌓이고, 매핑 상태가 만료 후 False로 바뀌어 헬스 점검에 경보 소음이 생긴다. 비용은 무시할 수준이다.
- 다른 4개 매핑(idphoto-kr/jp·image·studio)은 CF 존에 **DNS-only CNAME**(`ghs.googlehosted.com`)으로 있어 Google이 직접 검증한다 → 같은 구조 위험 없음 `[실측 18:27: 권한 NS에서 idphoto-kr·idphoto-jp·image·studio 4개 모두 CNAME ghs.googlehosted.com 그대로 응답 = 프록시 아님]`.

## 2. 정리안

### preview.monkos.ai

| 안 | 내용 | 비용 | 위험 | 권고 |
|---|---|---|---|---|
| **P-A 매핑 삭제** | `gcloud beta run domain-mappings delete --domain preview.monkos.ai --region us-central1` 1회 + references.md·SERVICE_MAP의 preview 표기 정리 | 0 | ≈0 — DNS 없음·소비처 0. 필요하면 다시 만들 수 있다 | ✅ |
| P-B 살리기 | CF에 `preview` CNAME → ghs.googlehosted.com (**DNS-only**) 추가 → Google이 인증서 발급 | 0 | 낮음. 단 대상이 **prod 서비스**라 "프리뷰"라는 이름과 달리 실서비스가 하나 더 노출된다. 쓸 사람이 없다 | — |
| P-C 유지 | 손대지 않음 | 0 | 상태 False 소음이 계속된다. 실해 없음 | — |

### monkos.ai 본 매핑 인증서 (기한 11-15)

| 안 | 내용 | 비용 | 위험 | 권고 |
|---|---|---|---|---|
| **M-A ACME만 워커 제외** | CF Workers 라우트에 `monkos.ai/.well-known/acme-challenge/*`를 **워커 없음**으로 추가(라우트 설정 1행, 워커 코드 무변경). 이 경로만 CF 프록시가 원래 A 레코드(Google 프런트 216.239.x)로 넘기므로, Google이 자기 챌린지에 응답할 수 있다 | 0 | 낮음. 영향 경로가 ACME 1개뿐이다. **미검증 가정 2개**: ① Google 프런트가 CF 경유 요청에도 챌린지를 응답하는가 ② CF의 HTTP→HTTPS 리디렉트·SSL 모드(Full strict)에서 현 인증서가 유효한 동안 오리진 연결이 되는가 → 적용 후 `curl` 2회 히트 + 다음 날 매핑 `CertificateProvisioned` 갱신 확인. 실패하면 라우트 1행을 지워 원복한다 | ✅ (11-15 전, 여유 있게 11월 첫 주까지) |
| M-B 방치 + 롤백 절차 개정 | 11-15 만료를 받아들이고, 08-24 롤백 절차를 "프록시 OFF → Google 재발급 대기(최대 수 시간) → 그동안 장애"로 개정한다. 또는 롤백 방법을 "워커 라우트 제거(CF 프록시 유지, SSL 모드 조정)"로 바꾼다 | 0 | 롤백할 일이 생기면 장애 시간이 늘어난다. 404 소음은 계속된다 | 차선 |
| M-C 매핑 삭제 | monkos.ai 도메인 매핑 자체를 지우고 CF → run.app 구조로 확정 | 0 | 중간. 롤백 경로가 사라지고, 되살리려면 매핑 재생성과 인증서 발급이 필요하다. **apex·prod 인접 변경** | — |

> 참고(시도하지 말 것): 워커 코드에서 ACME 요청을 Google 프런트로 직접 `fetch`하는 방법은, Workers가 IP 직접 접근과 Host 헤더 덮어쓰기를 제한해서 성립하지 않을 가능성이 높다 `[추정]`. 그래서 M-A는 코드가 아니라 라우트 제외 방식이다.

## 3. 결정이 필요한 것 (작가님 승인 사안 — 실행 0)

1. **preview**: P-A 삭제 / P-C 유지 중 선택. 권고 P-A.
2. **monkos.ai 인증서**: M-A 라우트 제외 / M-B 방치+롤백 절차 개정 중 선택. 권고 M-A. **기한 2026-11-15.**
3. 어느 쪽이든 `references.md` §서비스 매핑의 "preview.monkos.ai" 표기와 08-24 롤백 절차 문구를 결과에 맞춰 고친다.

## 4. 확인 수준

- `[실측 18:22~18:26]`: DNS(공용 + 권한 NS + 대조군), 매핑 상태 JSON, 인증서 2종(Google 프런트·CF 엣지), ACME 로그 일자 분포·출발 IP·UA, 라이브 2회 히트(preview·대조군·ACME 경로), 워커 라우트·오리진(wrangler.toml), 컷오버 롤백 문구
- `[추정]`: preview DNS가 처음부터 없었는지, M-A의 가정 2개, 워커 직접 fetch 불가, 만료 뒤 롤백 시 장애 시간
- 변경 0: 매핑·DNS·워커·코드 모두 손대지 않음. 로그 조회(`gcloud logging read`)와 목록 조회만 했다.
