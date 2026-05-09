---
type: report
date: 2026-04-23
device: iMac
from: iMac/민아
to: 작가님
cc: iMac/쌍아
subject: GA4·GSC MCP 정비 완결 + Google Ads MCP 도입 병목 진단
priority: P1
related_pf: PF_SECURITY, PF_CITADEL, PF_CDP
status: 1차 완결 (MCP 2종 가동) + 2차 병목 대기 (Developer Token)
---

# GA4·GSC MCP 정비 완결 + Ads MCP 도입 병목 진단

[2026-04-23 11:50 KST] iMac/민아 → 작가님

> 어제 `⏳ 쌍아 SA 정비 후 GSC/GA4 MCP 완결` 블로커 해제. Ads MCP 도입 시도 중 Developer Token 병목 확인. 작가님 결정 필요 지점까지 정합 보고.

---

## 0. 요지 (30초)

1. **GA4·GSC MCP 정상 가동** — yong-a-orchestrator SA 권한 추가 → 두 MCP 호출 검증 성공.
2. **SA 체계 단순 확인** — 의식적으로 쓰는 SA는 yong-a 하나. `project_security_consolidation.md` 방침(집중관리·impersonation 우선) 정합.
3. **Ads MCP는 GCP API가 아님** — Google Ads Developer Token 별도 심사(1~2주). 신청 전 MCP 설치해도 호출 0.
4. **다음 결정**: Ads Developer Token 신청 착수 + MCP 설계·설치 지시서(쌍아 경로) 병렬 진행.

---

## 1. GA4·GSC MCP 정비 세부

### 1-1. 진단 (11:20 KST)

| MCP | 호출 | 결과 |
|---|---|---|
| `mcp__google-analytics__get_account_summaries` | — | `[]` (빈 배열) |
| `mcp__google-search-console__list_sites` | — | `{}` (빈 객체) |

- 인증은 통과(403 아님). **SA에 리소스 권한 미부여** 상태 확정.
- 근거: `.mcp.json`의 `GOOGLE_APPLICATION_CREDENTIALS=/Users/jeong-kyushin/.config/gcloud/adc_impersonated.json` = yong-a-orchestrator impersonation.

### 1-2. GA4 권한 추가 (11:27~11:32 KST)

- 접근: `analytics.google.com/analytics/web/` → 속성 `monkos-3c6e4` (ID `521406894`), 계정 `381723534` (Default Account for Firebase)
- 경로: 관리 → 속성 액세스 관리 → + 사용자 추가
- 추가 이메일: `yong-a-orchestrator@monkos.iam.gserviceaccount.com`
- 역할: **뷰어** · 알림 체크 해제
- 결과: 사용자 10행 → 11행

**부수 발견**: Google Ads 계정 `586-642-3846`이 이미 GA4에 5단계 링크(결제/관리자/이메일/읽기/표준) 구성돼 있음. Ads↔GA4 연결 자체는 완료 상태.

### 1-3. GSC 권한 추가 (11:33~11:35 KST)

- 접근: `search.google.com/search-console/users?resource_id=sc-domain:monkos.ai`
- 기존 사용자: 신정규(gdsajin@gmail.com) 소유자 단독
- 추가 이메일: yong-a 동일
- 권한: **전체** (Full — `submit_sitemap` 쓰기 작업 포함)
- 결과: 사용자 1명 → 2명

### 1-4. 검증 (11:32, 11:35 KST)

```
mcp__google-analytics__get_account_summaries
→ [{
    name: accountSummaries/381723534,
    display_name: "Default Account for Firebase",
    property_summaries: [{
      property: properties/521406894,
      display_name: "monkos-3c6e4",
      property_type: PROPERTY_TYPE_ORDINARY
    }]
  }]

mcp__google-search-console__list_sites
→ {
    siteEntry: [{
      siteUrl: "sc-domain:monkos.ai",
      permissionLevel: "siteFullUser"
    }]
  }
```

✅ 두 MCP 정상 작동. 어제 블로커 해제.

---

## 2. SA 체계 감사

작가님 질문: "사실상 SA는 용아 오케스트레이터만 쓰고 있는가 우리가?"

### monkos 프로젝트 SA 3개

| SA | 용도 | 사용 주체 |
|---|---|---|
| **yong-a-orchestrator** | 오케스트레이션·MCP·GA4/GSC 조회 | 에이전트(쌍아·민아·막내) |
| **monk-image-engine** | 이미지 생성 백엔드 (Vertex AI·GCS) | 실서비스 런타임 |
| **933456016842-compute** | Cloud Run·Cloud Build 기본 런타임 | GCP 자동 |

**결론**: 의식적으로 쓰는 SA는 yong-a 하나. `project_security_consolidation.md`(SA 집중관리·impersonation 우선·새 키 발급 금지)와 정합.

### 별건 (비긴급) — yong-a 초과 권한 경고

- GCP IAM 콘솔: yong-a에 `초과 권한 11337/11338개` 경고 배지
- 부여된 역할: 스토리지 객체 관리자 + 편집자(과다) + Vertex AI 사용자
- 처방 방향: 편집자 역할을 세분 역할(예: `roles/aiplatform.user`, `roles/datastore.user`, 특정 버킷 ObjectAdmin)로 분해
- 본 보고에서는 **경고 포착만**. 별도 PF_SECURITY 서브태스크로 쌍아 경로 권고.

---

## 3. GSC 색인 요청 4건 처리 완료 (11:00~11:17 KST)

- 대상: 4/22 FAQ mainEntity 빈배열 방어 수정 배포(`rev 00227-h62`) 반영용
- 4 URL: `https://monkos.ai/`, `/faq`, `/ja/faq`, `/en/faq`
- `/ja/faq` 이미 색인 / `/en/faq` 미색인 / `/`, `/faq` 이미 색인 — 모두 재크롤 트리거 링크 클릭 완료
- 사전 교차검증: 모든 URL HTTP 200 + sitemap.xml 포함 확인
- **엊그제(4/21) 5 URL 색인 요청과 별건** — 엊그제는 CITADEL Phase 2 대상, 오늘은 FAQ 수정 재반영 트리거
- 작가님 혼선 포인트: Sitemaps 메뉴에 일반 페이지 URL 2건 잘못 제출 → 민아 정정 안내로 복구

---

## 4. Google Ads MCP 도입 병목 진단

### 4-1. 기술 구조 차이

| 구분 | GCP API (GA4·GSC) | Google Ads API |
|---|---|---|
| 인증 엔드포인트 | Google Cloud IAM | Google Ads 플랫폼 |
| 토큰 발급 | gcloud / ADC | **Developer Token** 별도 심사 |
| 권한 관리 | 프로젝트 IAM | Ads 계정 관리자 + login_customer_id |
| 즉시 가동 | ✅ | ❌ (심사 1~2주) |

### 4-2. 병목 (단일)

**Developer Token 심사**. 테스트 액세스(7일 미만·limited accounts)는 즉시 받을 수 있으나, 기본 액세스(basic access)는 Google 검토 필요. 신청 경로: `ads.google.com/aw/apicenter` (작가님 관리자 권한).

### 4-3. MCP 패키지 후보 (미확정)

- `gomarble-ai/google-ads-mcp-server` (Python, 커뮤니티)
- `cohnen/google-ads-mcp` (TypeScript, 커뮤니티)
- 기타 npm/PyPI 산재 중
- 공식 MCP 없음 — 선정 기준 필요: 업데이트 활성도 · 인증 방식(OAuth vs SA) · 도구 스코프(조회·캠페인 조작) · 라이선스

### 4-4. 실행 권고

**병렬 3트랙**:

1. **Track A (작가님 수동, 오늘)**: Developer Token 신청. 1분. 이후 1~2주 대기.
2. **Track B (쌍아 경로 지시서, 대기 중)**: MCP 패키지 선정·설치·`.mcp.json` 등록. 지시서 초안을 민아가 작성.
3. **Track C (심사 통과 후)**: Claude Code 재시작 → MCP로 캠페인 조회·최적화 검증.

---

## 5. 엔드게임 프레임 — "전략 즉시 반영" 구조

작가님 선언: "매번 수동으로 하느니 전략을 즉시 반영할 수 있는 구조로 가는거다"

완결 시 구현되는 아키텍처:

```
작가님 전략 발화
    ↓
민아/쌍아가 MCP 호출로
    - GA4 지표 실측 (현황)
    - GSC 검색 성과 실측 (오가닉)
    - Ads 캠페인 상태·성과 실측 (광고)
    - Ads 캠페인 입찰·예산·키워드 즉시 조작
    ↓
판정·실행 피드백 루프가 "수동 UI 드래그 없이" 닫힘
```

**현 위상**:
- ✅ GA4 MCP 실측 가능
- ✅ GSC MCP 실측 가능
- ⏳ Ads MCP 실측·조작 (Developer Token 대기)

---

## 6. 산출물 / 다음 단계

### 오늘 발행

| # | 문서 | 경로 |
|---|---|---|
| 1 | 본 리포트 | `monkos-ops/ops/reports/REPORT_20260423_민아_GA4_GSC_MCP_정비완결+Ads_병목진단.md` |
| 2 | Ads MCP 도입 제안서 | `monkos-ops/ops/proposals/PROPOSAL_20260423_민아_Google_Ads_MCP_도입_제안서.md` |
| 3 | 세션 로그 | `monkos-ops/ops/sessions/2026-04-23_iMac_민아.md` |

### 대기 (작가님 결정 필요)

- Developer Token 신청 착수 여부
- 쌍아 경로 MCP 설치 지시서 발행 여부
- yong-a SA 초과 권한 정리 지시서 발행 여부(별건)

---

**[2026-04-23 11:50 KST] iMac/민아 → 작가님**

✅ GA4·GSC MCP 가동 (어제 블로커 해제)
✅ SA 체계 감사 (yong-a 단일 창구 확인)
✅ GSC 색인 요청 4건 완결
⏳ Ads MCP — Developer Token 병목 + 제안서 동봉
