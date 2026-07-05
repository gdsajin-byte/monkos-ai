---
type: proposal
date: 2026-07-02
device: 웹
agent: 민아
to: 작가님, 쌍아
status: 기안
---

**[2026-07-02 08:48 KST]** 웹/민아 → 작가님, 쌍아

# PF 정리 실행안 — active 25 → 9 (척추 기준 재편)

> 근거: 7/2 PF 전수 스캔 (active 25·draft 2·completed 3). active의 정의를 **"매출 척추(스펙스 단일 척추 전략, PROPOSAL_20260702 수익모델 v2)에 기여하는 것"**으로 좁힌다.
> 원칙: 삭제 없음. 병합 = `completed` + README 상단 리다이렉트 노트. 동결 = `paused` + 재개 조건 1줄. 히스토리는 append-only 불변.

## 1. 판정표

### 유지 (active 9)

| PF | 축 | 역할 | 비고 |
|----|----|------|------|
| PF_CITADEL | 도달 (메타) | SEO/GEO/AEO 총괄 — 도달축 KPI 정본 | 메타 PF (ch4 9조 7항) |
| PF_SPECS | 도달 | 200국 규격 허브 = 척추 본체 | 1,284페이지 확장 + JP 허브 |
| PF_OPUS | 도달 | 콘텐츠 플라이휠 (블로그 파이프라인) | |
| PF_KKU | 도달 | 꾸 7채널 배포 루틴 | **PF_SPREAD 흡수** (21채널 배포 인프라 — 꾸 루틴과 기능 중복) |
| PF_IDPHOTO | 전환 (메타) | 결제 레이어 총괄 — 전환축 KPI 정본 | **PROFILES·STUDIO·IMAGE_PRO·EVENT·STYLER 흡수** (전부 "생성해서 판다"의 변주) |
| PF_PORTAL | 전환 | 서빙 표면 (포털·CMS·specs 렌더) | Phase 9 인증·마이페이지 |
| PF_INFRA | 기반 | 인프라 통합 | **AUTOPILOT·RETRIEVAL 편입** (둘 다 구축 완료 → 유지보수 모드) |
| PF_MONK_OS | 기반 | 하네스/거버넌스 | |
| PF_TEMPLATE | — | 템플릿 (계수 제외) | |

### 병합 (completed + 리다이렉트, 7건)

| PF | 흡수처 | 사유 |
|----|--------|------|
| PF_PROFILES (draft) | PF_IDPHOTO | 수익 상품 본선이나 2단계 보류 상품 — 메타 PF 내 Phase로 관리 |
| PF_STUDIO | PF_IDPHOTO | Phase 0, PROFILES 병합 대기 중이었음 — 함께 편입 |
| PF_IMAGE_PRO | PF_IDPHOTO | 과금 미정의 내부 R&D 툴 — 독립 PF 사유 소멸 |
| PF_EVENT | PF_IDPHOTO | 매출 이벤트는 전환축 Phase로 (Lemon 락아웃 이슈 포함 이관) |
| PF_STYLER | PF_IDPHOTO | 헤드샷 프리셋·서비스 진화 — 전환축 로드맵으로 |
| PF_SPREAD | PF_KKU | 배포 채널 운용 일원화 |
| PF_AUTOPILOT · PF_RETRIEVAL | PF_INFRA | 구축 완료, 운영 항목(Fable5 차단·데이터랙·MCP 유지)만 잔존 |

### 동결 (paused + 재개 조건, 11건)

| PF | 마지막 갱신 | 재개 조건 |
|----|------------|----------|
| PF_CDP | 04-07 (86일) | 계측·CTR 작업에서 브라우저 자동화 필요 시 |
| PF_VTON | 06-02 | 척추 손익분기 후 신사업 슬롯 |
| PF_VIDEO | 06-05 | 동상 |
| PF_MUSE | 05-14 | 동상 |
| PF_PRESENTATION | 05-17 | PT 수요 발생 시 |
| PF_DOCS | 05-06 | 문서 자동화 수요 발생 시 |
| PF_RND | 04-24 | 적격 공고 발생 시 (bizinfo 키 재발급 후 자동 브리핑이 감시) |
| PF_CHATBOT | 06-02 | Phase 5 품질 고도화는 트래픽 성장 후 |
| PF_CROP | 06-14 | 앱스토어 배포 재개 결정 시 |
| PF_PARTNER | 06-17 | 일 클릭 100 도달 시 (B2B는 트래픽 실적이 영업 자산) |
| PF_FACTORY (draft) | 05-11 | GPU 야간 생산 수요 발생 시 |

## 2. 집행 절차 (쌍아 추인 후 — 예상 1세션)

1. 판정표 확정 (쌍아 보정 → 작가님 승인)
2. 병합 7건: 흡수처 README에 병합 기록 1행 + 피병합 README 상단 리다이렉트 노트 + `status: completed`
3. 동결 11건: `status: paused` + 재개 조건 1줄 어펜드
4. `portfolios/README.md` 인덱스 일괄 갱신 (active 9 체제)
5. weekly-dashboard.yml의 PF 스캔이 신규 status를 그대로 반영하는지 확인

## 3. 효과

- 작가님 관제 대상 25 → **9** (메타 2 + 실행 7). 주간 대시보드 소음 60%↓.
- "2주 미갱신 active" 상시 감시 가능해짐 → ch4 9조에 "14일 미갱신 시 paused 후보 자동 플래그" 신설 제안 (weekly-dashboard 확장, 별도 경미 개정).
