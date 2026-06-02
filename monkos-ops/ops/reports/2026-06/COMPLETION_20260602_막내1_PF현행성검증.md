---
type: completion
date: 2026-06-02
device: M1
agent: 막내1
order: ORDER_20260602_M1쌍아_막내1_PF현행성검증_상태판정합화.md
status: 완료
---

# COMPLETION — 활성 PF 현행성 검증 + 상태판 정합화

**[2026-06-02 10:58 KST] M1/막내1 → M1/쌍아, 작가님**

---

## 1. 검증 범위

- 대상: active 16 + draft 3 + paused 1 = **20개 PF**
- 제외: completed 3 (PF_PHOTOPRO, PF_SECURITY, PF_BRIEF)
- 검증 방법: PF README 전수 Read + git log + 코드 grep + 배포 상태 실측

---

## 2. PF별 판정표

### 서비스 PF (5건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| **IDPHOTO** | Track A KR precheck | ✅ 완료 | ⚠️ **2.0 롤백** | **변동** | `ce34b4ec`(5/18) "2.5 엄격 이슈"로 롤백. PF 미반영 |
| IDPHOTO | Track A JP precheck | (위에 포함) | ✅ 2.5 정상 | 유효 | `79be913a` 이후 변동 없음 |
| IDPHOTO | Track B Live 모델 | ⏳ | KR/JP 모두 2.0 잔류 | 유효 | 미전환 맞음. 단 D-day(6/1) 경과 |
| IDPHOTO | Gemini 2.0 EOL 리스크 | 고 | **D-day 경과** | **변동** | 6/1 이후 KR precheck+Live가 2.0 의존 |
| IDPHOTO | Phase 5-A/B (iOS앱, 결제개편) | ❌ 미착수 | 미착수 | 유효 | — |
| IDPHOTO | og:image 수정 | ⏳ 막내 대기 | 미실행 | 유효 | 지시서 발행 후 미착수 |
| **CHATBOT** | **프로덕션 모델 전환** | **⏳** | **✅ Workers/Gemma4 전환** | **이미해결** | `52641ebc`(5/25) chat-engine.js 전면 재작성 |
| **CHATBOT** | **E2E 검증** | **⏳** | **✅ Workers 가동 중** | **이미해결** | Gemini 의존성 0 |
| **CHATBOT** | **Gemini 2.0 EOL 리스크** | **높음** | **해소** | **이미해결** | Workers/Gemma로 완전 전환 |
| CROP | Phase 1 특허 | ⏳ | 진행 중 추정 | 유효 | — |
| CROP | Phase 1.5 specs 연동 | ⏳ 설계중 | 대부분 ❌ | 유효 | — |
| CROP | Phase 2 iOS 앱 | ⏳ 진행 중 | 다수 완료(5/29까지 활동) | 유효 | — |
| CROP | RMBG-2.0 HF 승인 | ⏳ | 8일째 대기(5/25~) | 유효 | — |
| CROP | Step2 규정카드 | ⏳ 승인대기 | 14일째 대기(5/19~) | 유효 | — |
| VTON | Phase 3 RunPod | 🔄 진행 중 | 첫 컷 성공(6/1) | 유효 | 최신 PF |
| VTON | Studio 어드민 편입 | active | 배포 대기(RUNPOD_API_KEY) | 유효 | — |
| PORTAL | Phase 7 IA 개편 | ⏳ 검토중 | 철창이 JSX 시안 **38일째 대기** | 유효 | 장기 교착 |
| PORTAL | Phase 5 i18n 잔여 | ⏳ | 미완 | 유효 | — |

### 인프라 PF (3건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| CDP | Phase 2.5 | 🔄 진행 중 | 진행 중 | 유효 | — |
| **AUTOPILOT** | **Phase 2 (6항목)** | **❌×6** | **✅×5, ❌×1** | **이미해결(5건)** | daily_briefing.py, yml, Issue, 브리핑md, PF_BRIEF 전환 모두 5/11 완료 |
| **AUTOPILOT** | **Phase 3 (5항목)** | **❌×5** | **✅×2, ❌×3** | **이미해결(2건)** | 텔레그램 허브, R&D 알림 5/11 완료 |
| CHATBOT | (위 서비스 섹션 참조) | | | | |

### 전략 PF (4건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| CITADEL | 블로그 본문 잘림 67건 | 🔴 | 미해소 | 유효 | Firestore 데이터 품질 |
| CITADEL | Phase 2.3 번역 보정 | ⏳ 지시서 발행 | 막내 투입 대기 | 유효 | — |
| SPREAD | PAT 활성 | ⏳ Phase 테이블 | 히스토리에 완료 기록 | **이미해결** | Phase 테이블 미반영 |
| SPREAD | v2 종합전략 기안 | ⏳ 검토대기 | 장기 미결 | 유효 | — |
| **EVENT** | **Lemon Squeezy 락아웃** | **🔴 블로커** | **42일째 미해소** | **유효 (교착)** | 4/21 티켓 발송 후 무응답 추정 |
| EVENT | Phase 0 전 항목 | ❌ | 미착수 | 유효 | 블로커에 의한 교착 |
| SPECS | Phase 1 히스토리 반영 | 미표시 | 다수 완료 추정 | **이미해결** | Phase 테이블 갱신 안 됨 |

### 콘텐츠 PF (4건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| PRESENTATION | Phase 1.7 | ✅ | 완료 | 유효 | — |
| VIDEO | PF_PRESENTATION 관계 | 결정 필요 | 작가님 확정 대기 | 유효 | — |
| MUSE | Phase 1 | ⏳ | 전 항목 ❌ | 유효 | — |
| DOCS | Phase 구조 | 없음 | 도구 트래커 성격 | 유효 | Phase 불필요 판단 |

### 운영 PF (2건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| **RND** | **Phase 1 마감 05-06** | **⏳** | **27일 경과** | **변동** | 접수 완료 여부 미확인 — 세션 로그 갱신 없음 |
| **RND** | **Phase 2 마감 05-11** | **⏳** | **22일 경과** | **변동** | 접수 완료 여부 미확인 — 세션 로그 갱신 없음 |

### Draft PF (3건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| PROFILES | status: draft | draft | PF_STUDIO에 흡수 기록(4/29) | **변동** | 독립 draft vs 흡수 — 정합성 미달 |
| MONK_OS | Phase 1 작가님 검토 | ⏳ | 40일째 대기(4/23~) | 유효 | — |
| FACTORY | n8n 처분 | ❌ 결정대기 | 미결 | 유효 | — |

### Paused PF (1건)

| PF | 항목 | PF 기재 | 실제 | 판정 | 근거 |
|----|------|---------|------|------|------|
| **STUDIO** | **status: paused** | **paused** | **5/31 활동 + 커밋 `88dde5f6`** | **변동** | → active로 현행화 완료 |

---

## 3. 판정 집계

| 판정 | 건수 | PF |
|------|------|-----|
| **이미해결** | **10건** | CHATBOT(3), AUTOPILOT(7) |
| **변동** | **6건** | IDPHOTO(2), RND(2), STUDIO(1), PROFILES(1) |
| **유효** | **나머지** | 기재 내용이 현실과 일치 |

---

## 4. 현행화 실행 내역

| PF | 변경 내용 |
|----|----------|
| PF_CHATBOT | Phase 4 "🔄 진행중" → "✅ 완료". 프로덕션 전환·E2E 검증 ✅. EOL 리스크 취소선. 히스토리 2행 어펜드 |
| PF_IDPHOTO | Track A KR "✅" → "⚠️ 2.0 롤백". KR/JP 분리 표기. EOL 리스크 "D-day 경과" 반영. 히스토리 2행 어펜드 |
| PF_AUTOPILOT | Phase 2 "❌×6" → "✅×5, ❌×1". Phase 3 "❌×5" → "✅×2, ❌×3". 히스토리 1행 어펜드 |
| PF_STUDIO | YAML status "paused" → "active". 인덱스 동기화 |

---

## 5. 미현행화 항목 (쌍아·작가님 판단 필요)

| # | PF | 항목 | 이유 |
|---|-----|------|------|
| 1 | **IDPHOTO** | KR precheck 2.0 롤백 → 재전환 여부 | **실제 블로커**: 6/1 EOL 경과. 2.5 엄격 이슈 해결 필요 or 대안 모델 |
| 2 | **IDPHOTO** | KR/JP Live API 2.0 잔류 | Track B 전환 전략 재검토 필요 |
| 3 | **RND** | Phase 1(05-06), Phase 2(05-11) 마감 경과 | 접수 완료 여부 작가님만 확인 가능 |
| 4 | **EVENT** | Lemon Squeezy 42일 교착 | 대안 결제수단 검토 or 에스컬레이션 판단 필요 |
| 5 | **PROFILES** | PF_STUDIO 흡수 vs 독립 유지 | 정합성 정리 필요 |
| 6 | **SPREAD** | Phase 테이블 잔여 비동기 | PAT 외 추가 확인 후 갱신 필요 |
| 7 | **SPECS** | Phase 테이블 히스토리 미반영 | Phase 1 완료 범위 정밀 판정 필요 |
| 8 | **PORTAL** | 철창이 JSX 시안 38일 대기 | Phase 7 재기획 or 대안 경로 필요 |

---

## 6. 재발 방지 제언

### 원인 분석

비동기의 근본 원인은 **"코드 변경 → PF 갱신"이 1:1로 묶이지 않음**:
- 롤백(IDPHOTO)이 히스토리에 미기록
- 아키텍처 전환(CHATBOT Workers)이 Phase 테이블에 미반영
- 다수 에이전트(막내1~3)가 동시 실행 후 히스토리만 append하고 Phase 현황 미갱신

### 제언

1. **Phase 현황 갱신을 세션 마감 체크리스트에 포함**: 현재 ch7에 "히스토리 1행 어펜드"만 의무화됨. "히스토리 완료 → Phase 테이블 상태 동기화"를 추가
2. **롤백도 히스토리 필수 기록**: 코드 변경뿐 아니라 롤백·방향 전환도 PF 히스토리에 append 의무화
3. **월 1회 정합성 순회**: 본 오더와 같은 검증을 월별 정기 작업으로 편성 (AUTOPILOT Actions 자동화 가능)
4. **상태 불일치 자동 감지**: YAML status와 최근 히스토리 날짜를 비교하는 스크립트로 paused인데 활동 있는 PF 자동 플래그

---

## 7. 완료 보고

✅ PF별 판정표 작성 (20개 PF, 40+ 항목)
✅ PF 문서 현행화 (CHATBOT, IDPHOTO, AUTOPILOT, STUDIO — 4건)
✅ 갭 리포트 작성 (본 문서)
❌ SPREAD, SPECS Phase 테이블 상세 갱신 — 쌍아 정밀 판정 후 갱신 권장
💡 Gemini 2.0 EOL 대응 긴급: idphoto-kr precheck(2.0 롤백) + KR/JP Live(2.0 잔류)
💡 Lemon Squeezy 42일 교착: PF_EVENT 전체 블록
💡 PF_RND 마감 경과: 작가님 확인 필요
⏳ 미현행화 8건은 쌍아·작가님 판단 후 별도 오더
📁 본 리포트: `monkos-ops/ops/reports/2026-06/COMPLETION_20260602_막내1_PF현행성검증.md`
🔀 커밋 대기
