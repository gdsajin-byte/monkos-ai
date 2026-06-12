---
type: portfolio
id: PF_SECURITY
name: "SECURITY"
subject: "IAM·SA 권한 재조정·분기 재설계 (MONKOS 보안 체계화)"
created: 2026-04-23
owner: 작가님
leads: "iMac/쌍아(설계·통합), 막내(실행)"
status: active
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
