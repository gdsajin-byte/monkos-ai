---
type: portfolio
id: PF_SECURITY
name: "SECURITY"
subject: "IAM·SA 권한 재조정·분기 재설계 (MONKOS 보안 체계화)"
created: 2026-04-23
owner: 작가님
leads: "iMac/쌍아(설계·통합), 막내(실행)"
status: completed
---

# PF_SECURITY — IAM·SA 권한 재조정·분기 재설계

> 단발성 "Ads 전용 SA 생성"이 아니라, **현 IAM 세팅 전수 재설계**로 승격. 권한 피라미드 해체, SA 분기, impersonation 표준화, blast radius 격리를 하나의 PF로 처리한다.

---

## 1. 비전

**"yong-a 단일 과다권한 구조 → 축별 분기된 최소권한 SA 아키텍처"**

### 왜 이것을 하는가

- **블라스트 레디어스 격리**: MCP·외부 자동화 증가로 단일 SA가 뚫리면 GCP 전체 인프라에 연쇄 영향
- **감사 추적성**: Cloud Audit Log에서 "어느 자동화의 호출인지" 구분 가능해야 포렌식 성립
- **회전 단위 분리**: 한 축이 탈이 나도 다른 자동화 무영향
- **실서비스 전환기 정합**: `memory/project_security_consolidation.md` 방침 — 새 키 발급 대신 **impersonation 우선**
- **촉발 계기**: 2026-04-23 민아 제안서(Google Ads MCP) 검토 중 yong-a 과다권한 중첩 리스크 확인 → 작가님 결정 "국소 해결 대신 전수 재설계"

### 성공 지표

| 지표 | 시작점 | 4주 목표 | 12주 목표 |
|------|--------|---------|----------|
| 전체 SA 수·역할 매핑 | 미문서화 | 인벤토리 완결 | 최소권한 매트릭스 |
| yong-a 보유 권한 수 | 과다 (roles/editor 포함) | 축별 위임 완료 | 오케스트레이터 권한만 잔존 |
| Impersonation 적용 자동화 | 부분 | 전 축 전환 | 키 파일 zero |

---

## 2. 트리거 / 착수 조건

**현재 상태**: 🕒 대기

**착수 조건**: PF_MONK_OS Phase 0 (막내 4기 보고) 완료 → **충족 (2026-04-23)**
- 막내1(A — Anthropic) ✅
- 막내2(B — 업계) ✅
- 막내3(C — Kimi) ✅
- 막내4(D — MONK OS 감사) ✅

**재설계 재료 의존성**:
- Track B(업계) → MCP 생태계 인증 패턴 레퍼런스
- Track D(감사) → 현 `.env`·`credentials_inventory.md`·SA 사용 실태 기반 갭

---

## 3. 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 2026-04-05 | 작가님 | 보안 관리 체계화 방침 선언 (새 키 발급 금지, impersonation 우선) | memory/project_security_consolidation.md | ✅ |
| 2026-04-23 | iMac/민아 | Google Ads MCP 도입 제안서 — §5-3에서 yong-a 과다권한 플래그 | PROPOSAL_20260423_민아_Google_Ads_MCP_도입_제안서.md | ✅ |
| 2026-04-23 | iMac/쌍아 | 전용 SA 필요 5대 이유 제시 | 세션 2026-04-23_iMac_쌍아.md | ✅ |
| 2026-04-23 | 작가님 | **결정**: 국소 해결 대신 IAM 전수 재설계로 승격 | 본 PF | ✅ |
| 2026-04-23 | iMac/쌍아 | PF_SECURITY 창설 (대기 상태) | README.md (본 문서) | ✅ |
| 2026-04-23 | iMac/쌍아 | 기준선 문서 식별 — 4/22 막내1 GCP+Firebase 감사가 SA 인벤토리 80% 완성 상태로 존재. Phase 1은 "신규 조사" → **"4/22 감사 정비·확장"**으로 경로 변경 | 본 PF §4·§5·§7 갱신 | ✅ |
| 2026-06-12 | 웹/민아 | 작가님+웹민아 GCP 합동 콘솔 점검 — Gemini 키 마감 충족, IAM 축소, P0 monk-factory-storage 공개 재발견 | 2026-06-12_웹_민아_수동.md | ✅ |
| 2026-06-12 | 웹/민아 | GCP 전수 정밀조사 지시서 기안 (쌍아 토스용) | ORDER_20260612_웹민아_막내들 | ✅ |
| 2026-06-12 | iMac/쌍아 | **PF 재활성** + 지시서 3건 분할 발행 (막내1:키·IAM, 막내2:버킷, 막내3:CloudRun·종료) — 상호 교차 감사 조항 | ORDER×3 | ✅ |
| 2026-06-12 | iMac/막내1 | GCP 전수조사 A 완료 — API 키 11→2 축소 확인, editor 권한 대량 삭제 확인, yong-a 구키 삭제 완결 확인, smuse73·monk-factory-agent 키 폐기 후보 판정, SECRET_INVENTORY §A·§G 갱신 | REPORT_20260612_iMac막내1_SECURITY_GCP키IAM전수.md | ✅ |
| 2026-06-12 | iMac/막내3 | GCP 전수조사 C 완료 — Cloud Run 11개 SA 맵 (전용 9/기본 2), Compute 기본 SA 사용 서비스 monk-n8n·pt 특정, 종료 판정(aistudio·Gemini·MyMaps=즉시 가능, startMONK=버킷 감사 대기), 막내1 교차 감사 완료 | REPORT_20260612_iMac막내3_SECURITY_CloudRun_SA맵_종료판정.md | ✅ |
| 2026-06-12 | iMac/막내2 | GCP 전수조사 B 완료 — 7개 프로젝트 17개 버킷 전수 실측, monk-factory-storage allUsers 7주 미집행 확인(P0), monk-ai-images 98.3% 비공개 데이터 혼재 실측, startMONK 버킷 2개 내용 감사(종료 장애물 없음), GCS_BUCKET_STRUCTURE.md 신규 작성, 막내3 교차 감사 완료 | REPORT_20260612_iMac막내2_SECURITY_GCP버킷전수.md + GCS_BUCKET_STRUCTURE.md | ✅ |
| 2026-06-12 | iMac/막내1 | monk-ai-images 코드 참조 전수조사 완료 — 20개 파일 분석, 쓰기 경로 8종 식별, 경로 스키마 맵 작성, public/private 분리 기초자료(옵션B 권고: allUsers 제거+파일 레벨 ACL), studio 경로 혼용 이슈 발견 | REPORT_20260612_iMac막내1_SECURITY_GCS버킷코드참조전수.md | ✅ |
| 2026-06-12 | iMac/막내1 | 3권심사 입법 완료 — UBLA 실측(monk-ai-images=Fine-Grained, factory=Uniform-Locked), 경로별 공개/비공개 판정 7경로, allUsers 제거 영향 장애점 3건(G1~G3) 식별, 4-Step 교정 워크플로우 설계, 옵션B(즉시 ACL 보정)→옵션A(장기 분리) 2단계 전략 권고 | REPORT_20260612_iMac막내1_SECURITY_GCS삼권심사_입법.md | ✅ |
| 2026-06-12 | iMac/막내3 | 3권심사 사법 완료 — 고객 증명사진 85명 1,165건 익명 접근·열거 확인(CRITICAL), blog/* ACL 미검증 리스크 발견, 개인정보보호법 위반 소지 판정, 4-Phase 검증 체크리스트 작성, 막내1 옵션B에 조건부 동의(blog ACL 선검증 필수) | REPORT_20260612_iMac막내3_SECURITY_GCS삼권심사_사법.md | ✅ |
| 2026-06-12 | iMac/막내2 | 3권심사 행정 완료 — 7경로 2단계 정밀 맵트리, Fine-Grained ACL 실측(allUsers 파일 레벨: ads 13건+blog slug 125건만 존재), 활성/유휴 판별(80% 유휴), 버킷 IAM 제거 시 부수피해 644건(blog flat+assets) 특정, 안전 시퀀스 제시 | REPORT_20260612_iMac막내2_SECURITY_GCS삼권심사_행정.md | ✅ |
| 2026-06-12 | iMac/막내1 | CF 인프라 맵트리 완료 — Pages Functions 13개(api 6+specs 7) 전수 분석, 외부 Workers 3개 전부 레거시 판정, 환경변수 13개 중 7개 레거시 추정, GEMINI_API_KEY 지문 미대조 경고, D1 monk-db 바인딩 정합 확인 | REPORT_20260612_iMac막내1_인프라_CF맵트리.md | ✅ |
| 2026-06-17 | iMac/막내2 | 노출 표면 4건 보강 — /health 모델명 제거(3서비스), err.message 직통 반환 15곳 교체, /api/info styles 키 제거, admin AI prompt 응답 필드 제거. 3개 서비스 배포+실측 완료 | COMPLETION_20260617_iMac막내2_SECURITY_노출표면보강.md | ✅ |
| 2026-06-17 | 웹/민아 | 시크릿 위생 전수 감사 — git history 무유출 확인(.env 무커밋), 로컬 잔존 5파일·토스 test키 3중복제·photo-coach .pem(history) 적발, INVENTORY 정합성 갭. 막내1 정리로 로컬 5파일 삭제 종결 | [감사보고서](../../reports/2026-06/REPORT_20260617_웹민아_시크릿위생_전수감사.md) | ✅ |
| 06/17 | iMac/막내2 | 보안 노출 표면 4건 보강 — /health 모델명 제거·err.message 일반화 15곳·/api/info styles 제거·admin 프롬프트 반환 제거. 3개 서비스(idphoto-kr/jp/portal) prod 배포·실측 | COMPLETION_20260617, `ba32dcea` | ✅ |
| 06/19 | 웹/민아 | **배포 권한 위협모델 검증 + 정본 보정** — `GCP_SA_KEY`=yong-a-orchestrator 규명, editor·run.admin·secretAccessor 부재 확인→키 유출돼도 배포·파괴·권한상승 불가. **작가님 직접 editor 삭제 확정**으로 INVENTORY 154↔227 모순 해소. 잔여위험: objectAdmin(버킷 R/W/삭제)·aiplatform.user는 🟡, objectViewer 축소 권고 | [COMPLETION](../../reports/2026-06/COMPLETION_20260619_웹민아_IDPHOTO어드민리뷰_퍼널진단.md), `86320205` | ✅ |
| 07/14 | M1/민아 | **인증 신뢰 모델 합의 — impersonation 표준화 항목 실전 판정** (작가님·쌍아·민아) — GSC MCP 인증 경합(SM 키 vs 임퍼소네이션)에서 **SM 키 우선·임퍼 폴백** 확정. 근거: 관리 루트 단일화(1인 운영) > 무키 이점, 임퍼의 gcloud OAuth 세션 의존(만료 시 에이전트 자율성 상실). 구글 공식 서열 원문 확인(키=최후수단). **승격 트리거 3조건 명문화**(키 유출 사고/디바이스·인원 확대/GCP 키리스 전환) + 차기: GH Actions GCP_SA_KEY→WIF 키리스. "벽과 레일" 독트린 탄생 건. 개념 정본: SECRET_INVENTORY §0-2 | 인벤토리 §0-2, gsc_mcp.sh, 세션로그 7/14 | ✅ (WIF 전환은 ⏳ 쌍아 제안서) |
| 07/24 | iMac/민아 | **SA·키·시크릿 종합 감사 + 순찰 체계 신설** (작가님 지시) — 실측: 레포·히스토리 실키 0, SM 53건(미등재 1 소급), 리스크 4(n8n=editor·image-engine 프로젝트 tokenCreator·단일 SA 몰빵·yong-a 무만료키). T1 완료: 인벤토리 평문 SSH비번 2건 마스킹 + **권한 매트릭스 섹션 신설**(에이전트 1-Read 인지 정본) + `sa_audit.sh`(감사 스냅샷)·`gsc_submit.sh`(GSC 쓰기, 임퍼소네이션) 도구 2종(3요건). T2 지시서화 대기(n8n SA 교체·tokenCreator 축소·키 로테이션 크론) | [REPORT](../../reports/2026-07/REPORT_20260724_iMac민아_시크릿SA_종합감사.md) | ⏳ T2 결정 대기 |
| 07/24 | iMac/민아 | **monk-n8n 서비스 삭제 실행 (작가님 승인)** — 근거: SPREAD 3층 구조가 기대체(PF_SPREAD 비전 명문)+30일 무트래픽+볼륨·외부DB 전무(영속 워크플로 자산 구조적 0, 백업 불요 확정). 효과: **감사 T2-1(editor SA 리스크) 과제 통째 소멸**. 후속: deployment.md 예외 조항 소거, 권한 매트릭스 compute default=미사용 갱신, N8N_API_KEY 사문화 표기(폐기 후보 — 작가님 지시 대기) | gcloud delete 실측 0건 확인 | ✅ |
| 07/24 | iMac/민아 | **4060 SSH 키 전용 전환** (작가님 승인 흐름 — 07:55 문답 방향 확정 후 기동 즉시 실행) — 키 인증 기작동 실측(BatchMode) → sshd_config 백업 + PasswordAuthentication no + KbdInteractiveAuthentication no(전역 위치) → SYSTEM schtasks 분리 재시작(락아웃 방지) → 최종 실측 **"Permission denied (publickey)" 단독**(비번·kbd-interactive 사멸)·키 접속 복귀 ✓·작업/스크립트 청소. 잔여: M2 동일 전환(ssh-copy-id 1회 사람 손, 오프라인 대기) | 인벤토리 SSH 섹션 갱신 | ✅ |
| 07/24 | iMac/민아 | **시크릿 인지 코드화 + 관리 시스템 진단** (작가님 지시) — 근원 진단: 정본 이원(SM 실상태 vs 수기 문서)=drift 필연(당일 3건 실증). **`secret map [NAME]` 신설**(존재·버전 상태·용도·실소비처 1콜, 무인자=전체 맵+미등재 적발, 3모드 스모크 ✓) + data-access 규칙 코드화("있네없네=map 1콜") + 구세대 credentials_inventory.md 리다이렉트(3조 4항) + 도구맵 오기 교정. 라이프사이클 5단계 평가(등록·사용=상 / 인지=중상 / 순찰=중 / 로테이션=하). P1-ⓓ(SM 라벨 백필→인벤 자동 뷰)·P2(순찰/로테이션 크론) 승인 대기 | [PROPOSAL](../../proposals/PROPOSAL_20260724_민아_시크릿인지코드화_관리시스템.md) | ⏳ P1-ⓓ·P2 결정 대기 |
| 07/24 | iMac/민아 | **P1-ⓓ·P2 실행 (작가님 승인 "바로처리")** — ① SM 어노테이션 백필 53/53(실패 0, purpose·service·note — `secret_meta_backfill.py` dry-run→apply) ② `secret map` SM 정본 우선 승격 실측("용도(SM):" 출력) + `secret add` 용도 입력→SM 직기록 + `annotate` 신설 ③ 인벤토리 헤더에 "메타 정본=SM" 선언(테이블=참조 뷰 강등) ④ **일간 순찰 배선**: `secret_patrol.sh`(map+sa_audit 스냅샷→전일 diff→PATROL_LOG+텔레그램(chat_id 미배선 시 명시 경고)) + launchd `ai.monkos.secret-patrol` 09:30(crontab은 macOS TCC 블록 — 기존 관례대로 launchd, 킥스타트 실작동 ✓). 유보: yong-a 키 로테이션 크론 — 소비처 캐시 전파 검증 선행 필요, 쌍아 T2 지시서 이관 | 도구 2신설+secret.sh 확장 | ✅ (로테이션만 T2 이관) |

---

## 4. Phase 현황

### Phase 0 — 대기 → ✅ 재활성 (2026-06-12)

PF_MONK_OS Phase 0 완료까지 정지 상태였으나, 06-12 Gemini 키 마감(06-19) + P0 미집행 7주 재발견으로 **재활성**. 4-22 감사 이후 델타 현행화 착수.

### Phase 1 — 기준선 정비·확장 (착수 시)

> **기준선**: [REPORT_20260422_GCP_Firebase_인프라감사.md](../../reports/REPORT_20260422_GCP_Firebase_인프라감사.md) — 4/22 막내1이 읽기 전용 실측한 **SA 6건 + USER_MANAGED 키 3개 + 크로스프로젝트 바인딩** 전수 파악 완료 상태. Phase 1은 재조사 아닌 **정비·확장·추적**.

| 항목 | 예정 담당 | 비고 |
|------|---------|------|
| credentials_inventory.md 업데이트 (2026-02-19 → 4/22 감사 반영) | 막내 | SA 섹션 2건 → 6건 확장, 키 위치 명시 |
| yong-a 권한 해부 (축별 실제 사용 건수) | 막내 | Cloud Audit Log 30일 — 4/22 감사 §8 #5 실행 |
| USER_MANAGED 키 3개 물리 위치 확인 | 막내 | smuse73 / monk-factory-agent / yong-a — 로컬 파일·리포·CF Dashboard 전수 grep |
| 크로스프로젝트 바인딩 의도 확인 | 쌍아 | `monkos-3c6e4@appspot` → `monkos.aiplatform.user` (4/22 감사 §8 #8) |
| SECURITY_AUDIT_REPORT.md 재검토 (monkos-ops/tech/deployment) | 쌍아 | 371줄 기존 감사 — 현 상태 대비 정합 여부 |

### Phase 2 — 재설계 안

| 항목 | 예정 담당 | 비고 |
|------|---------|------|
| 축별 SA 분기안 (오케스트레이터 / GCS / BigQuery / Ads / GSC·GA4 / Cloud Run 배포 등) | 쌍아 | — |
| Impersonation 체인 설계 (yong-a → 전용 SA) | 쌍아 | `iam.serviceAccountTokenCreator` |
| 네이밍 규정 (법률 4조 3항 접두사 — `shared-*`·`ssanga-*`·`soso-*` 등) | 쌍아 | — |
| 키 파일 폐기 대상 리스트 | 쌍아 | — |

### Phase 3 — 이행 실행

| 항목 | 예정 담당 | 비고 |
|------|---------|------|
| 전용 SA 생성 (키 파일 없이) | 막내 | — |
| 역할 재부여 (축별 최소권한) | 막내 | — |
| 자동화·MCP·배포 스크립트 impersonation 전환 | 막내 | 서비스별 순차 |
| 구 키 파일 폐기·yong-a 권한 축소 | 막내 + 작가님 | 최종 단계 |

### Phase 4 — 검증·문서화

| 항목 | 예정 담당 | 비고 |
|------|---------|------|
| Audit Log에서 축별 호출 분리 확인 | 쌍아 | — |
| `credentials_inventory.md` 완결 갱신 | 쌍아 | — |
| 법률 ch5(배포)·ch4 8조(데이터 운영) 필요 시 개정 청구 | 쌍아·작가님 | — |

---

## 5. 민아 제안서(Google Ads MCP) 연동

**결정**: 민아 §7 결정 요청 3건에 대한 작가님 답변

| # | 원 요청 | 작가님 결정 | 쌍아 이행 |
|---|---|---|---|
| Q1 | Developer Token 신청 착수? | **즉시(a)** — 1~2주 심사 병목 메우려면 당장 | 민아 회신 + 작가님 수동 착수 |
| Q2 | Track B 쌍아 지시서 발행? | **보류** — PF_SECURITY 재설계 완료 후 재개 | 지시서 초안 작성 보류 |
| Q3 | 전용 SA 생성? | **PF_SECURITY로 승격** — Ads만 단독 생성하지 않고 IAM 전수 재설계 결과의 일부로 처리 | 본 PF Phase 2에 편입 |

---

## 6. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| Phase 3 이행 중 자동화 대규모 장애 | 高 | 서비스별 순차 전환, 각 단계 검증 후 다음 |
| yong-a 권한 축소가 포털/배포 중단 유발 | 中 | Phase 1 인벤토리에서 yong-a 의존 축 전수 확인 후 대체 완료 뒤 축소 |
| 작가님 수동 개입 포인트 증가 (SA 생성·권한 승인) | 中 | 배치 승인 방식 설계 |
| Ads 심사 통과 타이밍과 PF_SECURITY 일정 어긋남 | 中 | 심사 통과 시점에 Phase 2까지만 완료해도 Ads 전용 SA 선투입 가능 구조 |

---

## 7. 관련 문서

- [REPORT_20260422_GCP_Firebase_인프라감사.md](../../reports/REPORT_20260422_GCP_Firebase_인프라감사.md) — ⭐ **Phase 1 기준선** (4/22 막내1, SA 6건·USER 키 3건·크로스 바인딩 1건 실측)
- [민아 제안서 — Google Ads MCP 도입](../../proposals/PROPOSAL_20260423_민아_Google_Ads_MCP_도입_제안서.md)
- [PF_MONK_OS](../PF_MONK_OS/README.md) — 트리거 PF
- `monkos-ops/ops/credentials_inventory.md` — 2026-02-19 구버전, Phase 1에서 업데이트 대상
- `monkos-ops/tech/deployment/SECURITY_AUDIT_REPORT.md` — 기존 보안 감사 371줄, Phase 1 재검토 대상
- 메모리: `memory/project_security_consolidation.md`
