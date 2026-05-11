---
type: spec
id: PF_AUTOPILOT_ARCH
parent: PF_AUTOPILOT
date: 2026-05-11
---

# PF_AUTOPILOT — 아키텍처 명세

> §1 비전에서 분리. 접착 레이어의 구조적 상세.

---

## MONK 인프라 아키텍처

```
CF Pages (정적)              Cloud Run (엔진)
  monk.kr                     monkos.ai/*
  · 블로그                    · idphoto-kr/jp
  · 랜딩                      · portal
  · 정적 자산                  · studio
                              · crop-engine
       │                          │
       └────────── Git ────────────┘
                    │
             GitHub Actions
            ─── 접착 레이어 ───
                    │
       ┌────────┬───┴────┬────────────┐
       │        │        │            │
    배포 중계  시크릿   멀티레포     에이전트
    CF↔CR     통합    레포간연결    웹↔로컬
```

---

## Actions의 포지션 — "접착제"

Actions는 CF/CR/에이전트와 동격의 실행 엔진이 **아니다**. 각각이 이미 자기 영역에서 최강인 것들을 Git 위에서 **잇는** 역할이다.

| 분절 | 현재 | Actions 접착 |
|------|------|-------------|
| CF ↔ CR | 배포 라인 완전 분리, 수동 조율 | push 이벤트로 양쪽 배포 연쇄 트리거 |
| 시크릿 4곳 분산 | 인벤토리 없음, 디바이스별 `.env` | GitHub Secrets 중앙 + 인벤토리 정본 |
| 모노레포 → 멀티레포 | 아직 모노, 분리 시 연결점 소실 | repository_dispatch로 레포 간 이벤트 전파 |
| 웹 에이전트 ↔ 로컬 에이전트 | 각각 독립 실행, 핸드오프 없음 | Actions가 중계 — 웹 에이전트 산출물을 git commit → 로컬이 pull |
| PF_BRIEF 3축 | 로컬 세션 의존 → 교착 | Actions(수집) → Routines/Agents(판단) 파이프라인 |

---

## 4대 역할 상세

### ① 배포 중계 (CF↔CR)

- monk.kr 코드 push → CF Pages 자동 배포 (이미 CF가 처리)
- monkos_AI/ 코드 변경 PR → Cloud Run 스테이징 자동 배포 (deploy.sh 경유)
- 양쪽 배포 결과를 하나의 Issue/알림으로 통합 보고

### ② 시크릿 통합

- GitHub Secrets = 시크릿 정본 저장소 (런타임에만 메모리 주입, 코드 노출 없음)
- `SECRET_INVENTORY.md` = 값 제외, 항목+위치+용도만 기록하는 인벤토리
- PF_SECURITY(blocked) 동시 해소 — SA 정비 + 권한 최소화

### ③ 멀티 레포 연결

- 현재: 모노레포 (monk_project) + subtree (monkos-works)
- 전환 시: repository_dispatch로 레포 A push → 레포 B workflow 트리거
- submodule 참조 자동 갱신 (한송이 works push → 본진 반영)

### ④ 에이전트 연결 (웹↔로컬)

- Claude Managed Agents (웹): 자율 웹 탐색 + 판단 → 결과를 git commit
- Claude Routines (/schedule): 스케줄 원격 실행 → 파일 적립
- Claude Code (로컬): git pull로 수신 → 세션 시작 시 브리핑 확인
- Actions = 이 흐름의 트리거+중계. cron → 수집 스크립트 → commit → 에이전트 판단 요청

---

## PF_BRIEF 흡수 매핑

PF_BRIEF(4/10 발족)의 3축(성과/교정/뉴스)은 PF_AUTOPILOT의 출력물이 된다.

| PF_BRIEF 축 | 접착 레이어 경로 |
|-------------|-----------------|
| 축1: 성과 (GSC/GA4) | Actions cron → GCP SA 인증 → API 호출 → Issue + md 적립 |
| 축2: 교정 (SEO 순회) | Actions cron → 헤드리스 브라우저 → HEAD/meta 점검 → 이상 건만 보고 |
| 축3: 뉴스 (크롤링) | Managed Agents 자율 탐색 → git commit → Actions가 Issue 생성 |

PF_BRIEF는 Phase 2 완료 시 `status: completed (merged → PF_AUTOPILOT)` 전환.
