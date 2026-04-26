---
type: proposal
date: 2026-04-23
device: iMac
from: iMac/민아
to: 작가님
cc: iMac/쌍아
subject: Google Ads MCP 도입 — 전략 즉시 반영 구조 완결 (3트랙 병렬)
priority: P1
related_pf: PF_SECURITY, PF_CITADEL, PF_CDP
depends_on:
  - REPORT_20260423_민아_GA4_GSC_MCP_정비완결+Ads_병목진단.md
---

# Google Ads MCP 도입 제안서

[2026-04-23 11:50 KST] iMac/민아 → 작가님

> "매번 수동으로 하느니 전략을 즉시 반영할 수 있는 구조로 가는거다" — 작가님 2026-04-23 선언.
> GA4·GSC MCP 가동 완결로 오가닉·검색 실측 즉시화 구현. 잔여 공백은 **광고(Ads)** 한 축. 본 제안서로 매듭 계획 제시.

---

## 0. 한 줄 요약

Google Ads API의 **Developer Token 심사(1~2주)**가 유일 병목. 이 대기 구간을 활용해 MCP 설치·인증 구조를 선행 준비하고, 심사 통과 즉시 "캠페인 조회·조작 자동화"를 연결한다.

---

## 1. 배경

### 1-1. 현 실측·조작 공백

| 축 | 실측 MCP | 조작 MCP | 상태 |
|---|---|---|---|
| GA4 (행동) | ✅ `google-analytics` | — (GA4는 조작 도구가 원래 없음) | 완결 |
| GSC (검색) | ✅ `google-search-console` | ✅ `submit_sitemap` 쓰기 | 완결 |
| Google Ads (광고) | ❌ | ❌ | **공백** |

### 1-2. 작가님 핵심 전략

메모리 `project_advertising_organic_booster.md`:
- 광고 = 오가닉 부스터
- 오가닉이 진짜 자산, 광고는 보조
- SEO·광고·콘텐츠 판단의 1차 원리

**귀결**: 광고를 "수동 UI 드래그"로 운영하면 전략 변경이 실행까지 며칠 지연. 오가닉 지표(GSC) 변화 → 광고 예산 재조정이 **같은 턴 안에** 닫혀야 원리 구현.

### 1-3. 계정·인프라 현황

- Google Ads 계정: `586-642-3846` (GA4 링크 5단계 이미 구성)
- SA 단일 창구: `yong-a-orchestrator@monkos.iam.gserviceaccount.com`
- MCP 설정 파일: `/Users/jeong-kyushin/developer/monk_project/.mcp.json` (5개 MCP 등록 중)
- 인증 표준: `adc_impersonated.json` (yong-a impersonation)

---

## 2. Developer Token 구조 (외부 병목)

### 2-1. Why 별도 필요

Google Ads API는 GCP IAM이 아닌 **Google Ads 플랫폼 자체 인증**을 사용. Developer Token은 Ads 계정별로 발급되는 API 접근권.

### 2-2. 액세스 레벨

| 레벨 | 심사 | 제약 |
|---|---|---|
| **테스트** | 즉시 | 테스트 계정(7일 미만·0 실지출)만 호출 가능 |
| **기본(Basic)** | Google 심사 **1~2주** | 프로덕션 계정 호출 가능, 15k ops/일 |
| **표준(Standard)** | 기본 승인 후 추가 심사 | 제한 없음 (대규모 운영자용) |

### 2-3. 신청 경로

1. `ads.google.com/aw/apicenter` 접속 (Ads 계정 관리자 로그인)
2. "API 센터" → Developer Token 발급
3. 초기 상태: **테스트 액세스**로 자동 부여
4. **기본 액세스 요청** 버튼 → 양식 작성 (API 용도·볼륨·보안 설명)
5. 제출 → 이메일 승인/반려 통보

### 2-4. 제출 양식 권장 내용 (민아 초안)

```
Company / Organization: MONKOS (monkos.ai)
API Use Case:
  Internal operational dashboard that connects organic search
  performance (GSC) and site analytics (GA4) with Google Ads
  campaign state. Agents (MCP clients) query campaign metrics,
  adjust bids and budgets based on organic momentum signals.
  No client-facing product, no third-party resale.

Tool Access: Internal employees only (1 MCC, 1 linked account).
Monthly API Call Volume: <10,000 / month.
```

---

## 3. MCP 패키지 후보 비교 (내부 선정 필요)

### 3-1. 후보 3종

| 패키지 | 언어 | 활성도 (추정) | 도구 범위 | 인증 |
|---|---|---|---|---|
| `gomarble-ai/google-ads-mcp-server` | Python | ⭐⭐⭐ | 리포팅·캠페인 읽기 | OAuth + dev_token |
| `cohnen/google-ads-mcp` | TypeScript | ⭐⭐ | 리포팅·기본 캠페인 편집 | OAuth + dev_token |
| **자체 래퍼 (Python, `google-ads-python` SDK 기반)** | Python | — | 설계에 따라 조정 가능 | SA + dev_token (yong-a 재활용) |

### 3-2. 선정 기준

1. 업데이트 활성도 (최근 커밋 6개월 이내)
2. 라이선스 (MIT/Apache 선호)
3. **인증 방식이 yong-a SA + dev_token 모델 수용 가능한지**
4. 도구 스코프가 "조회 + 예산·입찰 조작"까지 커버하는지

### 3-3. 권고

- **Track B 1차 리서치**에서 3종 실제 동작 테스트
- SA impersonation 지원 불충분하면 **자체 래퍼** 선택 (2~3일 개발, 쌍아·막내 경로)

---

## 4. 실행 로드맵 — 3트랙 병렬

```
[T=0 오늘]
├─ Track A (작가님 수동)
│    Developer Token 기본 액세스 신청
│    → Ads API Center 1분 작업
│
├─ Track B (쌍아 지시서 → 막내 실행, 4~7일)
│    1. MCP 패키지 3종 후보 실제 동작 테스트
│    2. 선정 결과 보고
│    3. `.mcp.json` 등록 + 환경변수 설계
│    4. yong-a SA OAuth 플로우 또는 dev_token 주입 구조 구현
│    5. 더미 Developer Token으로 설치 완결 검증
│
└─ Track C (심사 통과 후, +7~14일)
     1. Developer Token 주입
     2. Claude Code 재시작
     3. MCP로 캠페인 조회 검증
     4. 입찰·예산 조정 테스트 (소액 1회)
     5. 민아 세션 로그에 체화 기록 (엔드게임 프레임)
```

### 4-1. Track A 상세

| 단계 | 작업 | 담당 |
|---|---|---|
| A1 | `ads.google.com/aw/apicenter` 접속 | 작가님 |
| A2 | API 센터 진입 · Developer Token 확인 (테스트 액세스 자동 발급) | 작가님 |
| A3 | "기본 액세스 요청" 제출 (§2-4 양식 내용) | 작가님 |
| A4 | 승인 메일 수신 시 민아·쌍아에 공유 | 작가님 |

**소요**: 5분. **블로킹 대기**: 1~2주.

### 4-2. Track B 상세

쌍아 경로 지시서 초안 (민아가 오늘 작성):

```
ORDER_20260423_쌍아→막내_Google_Ads_MCP_도입_설계

Phase 1 (0.5일): 패키지 후보 3종 실제 설치 시도 + 인증 구조 비교 리포트
Phase 2 (0.5일): 선정 결과 작가님·민아 승인
Phase 3 (1~2일): `.mcp.json` 등록 + adc_impersonated.json 재활용 또는 OAuth 플로우 구현
Phase 4 (0.5일): 더미 토큰으로 설치 완결성 검증
Phase 5 (대기): Developer Token 수신 후 실 호출 검증 (민아 합류)
```

### 4-3. Track C 상세

심사 통과 시점에 민아가 세션 내에서:
- `mcp__google-ads__list_campaigns` (또는 유사명) 호출 → 586-642-3846 계정 캠페인 목록 수신
- 1개 캠페인의 입찰·예산 확인
- 작가님 승인 하에 소액 조정 테스트 (1회)
- 엔드게임 프레임 체화 보고

---

## 5. 리스크 / 대안

### 5-1. Developer Token 반려 리스크

**시나리오**: 기본 액세스 심사 반려 (Google이 용도·보안 설명 부족 판단)
**대안**: 재제출 1회 (사유 보강), 여전히 반려 시 **테스트 액세스 + 테스트 계정**으로 최소 구현 유지 (전략 실행은 수동 복귀)

### 5-2. MCP 커뮤니티 패키지 불안정

**시나리오**: 선정 패키지 6개월 내 유지보수 중단
**대안**: 자체 래퍼 Python 구현 (`google-ads-python` 공식 SDK 기반, 2~3일)

### 5-3. yong-a SA 초과 권한 (별건 리스크 중첩)

- yong-a는 이미 `roles/editor` 포함 과다 권한 보유 (본 작업과 무관하지만 Ads 권한 추가 시 더 커짐)
- 권고: **본 작업에서 yong-a에 Ads 권한 추가하지 말 것**. 별도 전용 SA (`ads-mcp-operator@monkos`) 생성 검토

### 5-4. Developer Token을 `.env`·`.mcp.json`에 하드코딩 리스크

- 헌법 4조 1항: 토큰·시크릿 절대 생성·추측 금지
- 권고: Developer Token은 `~/.config/mcp-google-ads/token` 같은 사용자 홈 설정 파일에 저장, `.mcp.json`에는 경로만 참조

---

## 6. 권한 / 비용

### 6-1. 비용

- Developer Token 자체: 무료
- MCP 패키지: 오픈소스 (커뮤니티) 또는 자체 구현 (내부 인력)
- 운영 비용: Ads API 호출은 무료 (기본 15k ops/일 한도 내)

### 6-2. 권한 영향

- yong-a SA에 Ads 권한 추가 (또는 전용 SA 생성 권고)
- Ads 계정 `586-642-3846`에 yong-a를 읽기+관리자 레벨로 등록

---

## 7. 결정 요청

작가님께 3가지 결정 요청:

| # | 결정 사항 | 선택지 |
|---|---|---|
| Q1 | Developer Token 신청 착수? | (a) 오늘 즉시 · (b) 내일 이후 · (c) 보류 |
| Q2 | Track B 쌍아 지시서 발행? | (a) Q1 승인과 동시 발행 · (b) Dev Token 수신 후 발행 |
| Q3 | 전용 SA(`ads-mcp-operator`) 생성 여부? | (a) 별도 생성 · (b) yong-a 재활용 · (c) 쌍아 판단에 위임 |

민아 권고 조합: **Q1(a) · Q2(a) · Q3(c)**. 병목 1~2주를 설치·설계 작업으로 메우면 심사 통과 시점에 즉시 가동.

---

## 8. 엔드게임 프레임 (참고)

```
[오늘]
  GA4 ✅    GSC ✅    Ads ❌ (수동 UI)
        ↓ 전략 → 실행 지연: 수시간~수일

[심사 통과 후]
  GA4 ✅    GSC ✅    Ads ✅ (MCP)
        ↓ 전략 → 실행 지연: **같은 턴 (수 분)**

→ 광고=오가닉 부스터 원리가 물리적으로 구현됨
→ 크리에이터 에이전트 도구 비전(memory/project_creator_agent_tool.md)의 광고 축 완결
→ 자비스 비전(memory/project_jarvis_vision.md)의 광고 인터페이스 흡수
```

---

**[2026-04-23 11:50 KST] iMac/민아 → 작가님**

본 제안서는 §7 결정 3건 대기. 승인 시 즉시:
1. Developer Token 신청 페이지 CDP로 열기
2. Track B 쌍아 지시서 초안 발행
