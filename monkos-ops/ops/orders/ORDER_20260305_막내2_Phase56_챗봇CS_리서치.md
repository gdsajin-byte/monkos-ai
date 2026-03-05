---
type: ORDER
date: 2026-03-05
from: iMac/쌍아
to: 막내2 (CLI 배정)
subject: Phase 5+6 사전 리서치 — 챗봇 & CS 전체 현황 파악
priority: HIGH
scope: 전 코드베이스 (monkos_AI/, MONK_kr/, functions/, monkos-ops/)
---

# Phase 5+6 사전 리서치: 챗봇 & CS 시스템 전수 조사

## 목적

Phase 5(챗봇 업그레이드)와 Phase 6(텔레그램 CS 연동)를 통합 설계하기 위해, 현재 챗봇·CS·고객응대 관련 코드가 **어디에, 어떤 형태로, 무엇과 연결되어** 있는지 전수 파악한다.

리서치 전용 지시서. **코드 수정 없음**.

---

## 조사 항목

### 1. 챗봇 코드 전수 탐색

프로젝트 전체에서 챗봇 관련 코드를 찾아라:

**검색 키워드**: `chatbot`, `chat`, `bot`, `rag`, `knowledge`, `cs`, `support`, `faq`, `assistant`, `gemini`, `vertex`

**파악 대상**:
- 파일 위치 + 라인 수 + 최종 수정일
- 어떤 AI 모델/API를 사용하는지 (Gemini, Vertex AI, 기타)
- 프론트엔드 UI 위치 (어느 HTML에 챗봇 위젯이 있는지)
- 백엔드 API 엔드포인트 (챗봇 요청 처리)
- Knowledge Base / RAG 데이터 소스 (어디서 읽어오는지)

### 2. 텔레그램 연동 현황

**검색 키워드**: `telegram`, `tg`, `webhook`, `bot_token`, `sendMessage`, `@monkos`

**파악 대상**:
- 텔레그램 봇 관련 코드 위치
- 웹훅 엔드포인트 존재 여부
- 현재 텔레그램으로 전달되는 이벤트 (결제 알림, CS 알림 등)
- 봇 토큰 관리 방식 (env, secrets)

### 3. 고객 응대 경로 전수 파악

사용자(고객)가 문의할 수 있는 모든 진입점:

- **인앱 챗봇**: 어느 페이지에 위젯이 있는지
- **이메일**: info@monkos.ai 수신 처리가 있는지
- **텔레그램**: @monkos_support_bot 연결 상태
- **카카오**: @monkos 채널 연동 코드가 있는지
- **푸터/연락처**: 각 HTML 푸터에 표시된 연락 수단

### 4. Knowledge Base / seed 데이터

챗봇이 참조하는 지식 데이터:

- `seed_cs_knowledge.js` 또는 유사 파일
- 프롬프트 템플릿 파일
- FAQ 데이터
- 가격/상품 정보 참조 경로 (Phase 1에서 수정한 KB 포함)

### 5. 배포 구조

챗봇 관련 코드의 배포 라인:

- Cloud Run (monkos.ai) 에 포함되는지
- CF Workers (functions/) 에 별도 있는지
- 정적 파일(public/) 에만 있는지
- 별도 서비스로 분리되어 있는지

---

## 산출물

코드 수정 없이 **리서치 보고서만** 제출:

`monkos-ops/ops/reports/REPORT_20260305_막내2_Phase56_챗봇CS_리서치.md`

### 보고서 구성

```markdown
## 1. 챗봇 코드 인벤토리
| 파일 | 위치 | 라인수 | 역할 | AI모델 | 상태(활성/미사용/deprecated) |

## 2. 텔레그램 연동 인벤토리
| 파일 | 위치 | 역할 | 상태 |

## 3. 고객 응대 진입점 맵
| 채널 | 진입점 | 처리 방식 | 상태 |

## 4. Knowledge Base 맵
| 파일 | 내용 | 참조처 | v3 반영 여부 |

## 5. 배포 구조도
(텍스트 다이어그램)

## 6. 발견사항 및 개선 제안
- 중복/사각지대/deprecated 코드
- Phase 5+6 통합 설계 시 고려사항
```

## ⚠️ 준수 조항
- **헌법 1조**: 타임스탬프 시스템 명령 취득
- **헌법 2조**: 완료 보고 형식 준수
- **코드 수정 금지** — 리서치 전용. 수정이 필요한 부분은 보고서에 명시만 할 것
