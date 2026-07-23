---
type: report
date: 2026-07-24
device: iMac
agent: 민아
status: 마감
portfolio: PF_SECURITY
---

# REPORT — SA·키·시크릿 종합 관리 수준 감사 + 강화 방안

**[2026-07-24 05:16 KST]** iMac/민아 → 작가님

> 발단: GSC 403 근본 해소 직후 작가님 지시 — "SA 권한·키 등 종합 시크릿 관리 수준 체크. 에이전트가 즉시 인지·처리하되 보안은 강한 방안"
> 방법: gcloud IAM/SA/키/SM 전량 실측 + 레포·히스토리·로컬 파일시스템 키 스캔 + 인벤토리 대조

## 총평

**중상 수준.** 정본 체계(SM 단일 정본·인벤토리·에이전트 비접촉 규약)와 레포 위생(커밋 키 0)은 이미 상위권. 실리스크는 **IAM 구조 3건**(n8n editor·프로젝트급 tokenCreator·단일 SA 몰빵)에 몰려 있고, 전부 저비용 교정 가능. 순찰 자동화 기반(도구 2종)을 금일 신설했다.

## ① 실측 지도

**✅ 양호 (지킬 것)**
| 항목 | 실측 |
|------|------|
| 레포 위생 | 추적 파일·untracked·git 전 히스토리에 실키 0 (히스토리 'BEGIN PRIVATE KEY' 히트는 웹민아 순찰 문구 오탐 — 역으로 48h diff 순찰 가동 확인) |
| .env | git 추적분은 example/sample뿐. 실 .env 4개 미추적 |
| 런타임 키리스 | monk-image-engine 사용자 키 0 — Cloud Run은 키 없이 동작 ✓ |
| SM 정본 | 53건, 인벤토리 등재 52/53 (누락 1 → 금일 소급 등재) |
| 로컬 키 | yong-a 키 1파일, 600 퍼미션, SM에서 자율 복원 구조(gsc_mcp.sh) |
| 임퍼소네이션 그래프 | gdsajin→{yong-a, image-engine} 2엣지뿐 — 좁고 명시적 |

**🔴 리스크 (우선순위순)**
1. **monk-n8n = compute default SA(roles/editor)** — 외부 워크플로 실행기가 프로젝트 준-전권으로 구동. 공격면 대비 최대 과권한. **교체 1순위.**
2. **monk-image-engine에 프로젝트 레벨 tokenCreator** — 전 CR 서비스(10개)의 런타임 SA가 프로젝트 내 **모든 SA를 임퍼소네이션 가능**. 서버 측 침해 = 전 SA 장악 경로. 용도는 GCS signed URL 자기서명으로 추정 → 자기 자신 대상 signBlob/tokenCreator(SA-level)로 축소 가능.
3. **전 서비스 단일 SA** — portal·idphoto·studio·jangsam이 datastore.owner+objectAdmin+BQ+secretAccessor를 공유. 서비스 간 격리 0.
4. **yong-a 영구 키, 로테이션 0** — 06-10 생성·무만료(44일 경과). 유출 시 무기한 유효.
5. 소소: compute default SA 자체가 editor(신규 리소스가 물면 재발) · appspot SA aiplatform.user(미사용 추정) · storage.objectAdmin 프로젝트 스코프 2건(버킷 한정 여지) · **인벤토리 SSH 섹션 평문 비밀번호 2건**(약한 값 포함 — 정본 문서의 "값 금지" 자기 위반).

## ② 금일 조치 완료 (T1)

- **평문 비밀번호 마스킹**: SSH 섹션 2건 소거(구값 이력 포함). ⚠️ 값 자체가 약함 — M2·4060 비밀번호 변경 + SSH 키 전환 권고(작가님·꾸 액션).
- **PAGESPEED_API_KEY 소급 등재** (7/21 생성, 미등재 적발).
- **권한 매트릭스 섹션 신설** (SECRET_INVENTORY.md): SA×롤×키 상태×임퍼소네이션 그래프×용도 — **에이전트가 Read 1회로 전 권한 지형 인지**. IAM 변경 시 동반 갱신 의무 명문화.
- **감사 도구 `scripts/tools/sa_audit.sh` 신설** (3요건: references.md 등재·스모크 전 구간 실작동·실패 가시화): SA/IAM/키 나이/임퍼소네이션/CR 실행 SA/SM↔인벤 대조를 1회 실행으로 덤프 — 순찰 에이전트가 매트릭스와 diff.
- (직전 턴) GSC 쓰기 `gsc_submit.sh` — 같은 체계의 1호 도구.

## ③ 강화 방안 — "즉시 인지·처리 + 강보안"의 구조

> 원칙 4: **키 최소**(가능하면 키리스·임퍼소네이션) / **권한 최소**(서비스별 SA·리소스 스코프) / **정본 단일**(SM+인벤토리 매트릭스) / **순찰 자동**(도구+크론이 drift 적발).

**T2 — 단기 (쌍아 지시서, 저위험 순차. 각 30분~2시간)**
1. `monk-n8n-sa` 신설(최소롤: 필요 API 실측 후 부여) → n8n 서비스 SA 교체 → compute default에서 editor 제거 검토.
2. image-engine의 프로젝트 tokenCreator 회수 → signed URL 용도 실측 후 **자기 자신 SA-level signBlob**으로 대체 (코드 영향 0 예상, dev 게이트 검증).
3. appspot SA aiplatform.user 회수 (미사용 실측 후).
4. **yong-a 키 로테이션 정례화**: 90일 크론 — 신키 발급→SM 신버전→구키 폐기→로컬 캐시 자동 재복원(gsc_mcp.sh 기존 로직 재사용). *대안: 키 전면 파기 + 임퍼소네이션 ADC 전환 — 7/14 합의(SM 키 정본) 개정 사안이라 작가님 판단.*

**T3 — 중기 (트랙화)**
5. 서비스별 SA 분리 (portal/idphoto/studio 각각 — datastore·버킷 스코프 최소화). Phase 7(min0)과 함께.
6. gitleaks pre-commit + CI 스캔 (웹민아 48h 순찰의 커밋 전 단계 이중화).
7. **주간 순찰 크론**: sa_audit.sh → 매트릭스 diff → 불일치·키 90일+·미등재 시크릿을 텔레그램 보고 (소넷이 데몬 편입).
8. 4060·M2 SSH 키 전환 + 비밀번호 폐기 (Tailscale 내부라 긴급도 중, 위생상 필수).

## ④ 작가님 결정 요청

| # | 사안 | 권고 |
|---|------|------|
| 1 | T2 지시서화 (n8n SA·tokenCreator 축소·로테이션 크론) | 쌍아 설계 → 막내 실행. 1~2일감 |
| 2 | yong-a 키: 로테이션 유지 vs 키리스 전환 | **로테이션 유지 권고** (7/14 합의의 "gcloud 세션 만료 무영향" 이점 존속, 크론으로 리스크 상쇄) |
| 3 | M2·4060 비밀번호 변경+키 전환 | 작가님·꾸 직접 (값 접촉 배제) |
