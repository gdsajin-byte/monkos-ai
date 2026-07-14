---
type: order
date: 2026-07-14
from: M1/민아
to: 막내(any, M1 세션 권장)
subject: GSC MCP 인증 M1 항구 픽스 — .mcp.json 경로 일반화 + M1 임퍼소네이션 ADC 생성
status: 대기
portfolio: PF_BRIEF
priority: P2
---

# GSC MCP M1 인증 항구 픽스

**[2026-07-14 12:05 KST]** M1/민아 → 막내(any, M1 세션 권장)

> 경로③ (작가님 직접 지시 "지시서 발제해") — 쌍아 사후 추인 대상.
> 근거: [REPORT_20260714 §6](../../reports/2026-07/REPORT_20260714_M1민아_GSC_GA4동향_헤드텀v2정합.md) + PF_BRIEF 히스토리 04/11 🚨 / 07/14 행

---

## 1. 배경 — 왜

- `.mcp.json`(레포 루트, 전 머신 공유)의 GSC 서버 env가 **iMac 절대경로 하드코딩**: `GOOGLE_APPLICATION_CREDENTIALS: /Users/jeong-kyushin/.config/gcloud/adc_impersonated.json`
- 결과: M1 세션(4/11 🚨 기록, 3개월 방치)·웹 E2E 컨테이너(6/16·6/17 차단 기록)에서 GSC MCP 전 도구 ENOENT.
- 7/14 실측 확정 사실:
  - M1의 gdsajin ADC로 **yong-a-orchestrator@monkos.iam.gserviceaccount.com 임퍼소네이션 성공** (webmasters.readonly + analytics.readonly → GSC sites 200, GA4 정상). **GSC MCP의 실인증 SA = yong-a**.
  - monk-image-engine은 gdsajin에 TokenCreator 부재로 임퍼소네이션 불가 (착각 주의 — GSC "소유자 등록" SA와 "MCP 인증" SA는 다르다).
  - M1에는 `~/.config/gcloud/adc_impersonated.json` 부재, 소스 ADC(`application_default_credentials.json`)는 실존.

## 2. 산출물

| # | 파일 | 역할 |
|---|------|------|
| 1 | `/Users/macmini/.config/gcloud/adc_impersonated.json` (M1 로컬, **레포 밖·커밋 금지**) | yong-a 임퍼소네이션 ADC — iMac과 동일 파일명 |
| 2 | `.mcp.json` (레포 루트) | 경로 일반화 — 양 머신 호환 |
| 3 | `monkos-ops/ops/SECRET_INVENTORY.md` H섹션 | 비고 갱신 (실인증 SA=yong-a 명기, 메타만) |

## 3. 상세 설계

### 3-1. M1 임퍼소네이션 ADC 생성 (표준 래핑 — 시크릿 신규 발급 아님)

`impersonated_service_account` 타입 JSON으로 기존 로컬 ADC를 **참조 래핑**한다:

```json
{
  "type": "impersonated_service_account",
  "service_account_impersonation_url": "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/yong-a-orchestrator@monkos.iam.gserviceaccount.com:generateAccessToken",
  "source_credentials": { /* /Users/macmini/.config/gcloud/application_default_credentials.json 내용 인라인 */ },
  "delegates": []
}
```

- source_credentials는 **기존 파일 내용을 프로그램적으로 복사** (cat/python 병합). 값을 채팅·로그·커밋에 노출 금지.
- 참고: iMac의 동명 파일이 이 방식의 선례. 생성 후 `chmod 600`.
- 검증: `GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/adc_impersonated.json` 지정 후 GSC API sites 목록 curl 200 (액세스 토큰 stdout 출력 금지).

### 3-2. .mcp.json 경로 일반화

- 1안(우선): `"GOOGLE_APPLICATION_CREDENTIALS": "${HOME}/.config/gcloud/adc_impersonated.json"` — Claude Code `.mcp.json`은 `${VAR}` 환경변수 확장을 지원. **적용 전 현행 버전(2.1.207+)에서 확장 동작을 공식 문서/실측으로 확인**하고, 미지원 확인 시 적용 금지.
- 2안(1안 불가 시): `.mcp.json`은 원상 유지하고, M1측 심볼릭 링크 등 **로컬 우회는 금지**(타 계정 홈 생성 불가). 대신 쌍아에게 대안 설계 에스컬레이션 (예: 머신별 로컬 MCP 설정 오버라이드 경로 조사).
- **1급 제약: iMac 동작 보존.** 변경 커밋 전 iMac 경로가 `${HOME}` 치환으로 동일하게 해석되는지 경로 대조표를 보고서에 명기. 실패 시 즉시 revert 가능하도록 단일 커밋 분리.

### 3-3. 인벤토리 갱신

- SECRET_INVENTORY.md H섹션(로컬 인증 파일)에: M1 생성 사실(날짜)·실인증 SA=yong-a·"파일=임퍼소네이션 래핑, 자체 키 아님" 1행. **값·토큰 기재 절대 금지.**

## 4. 완료 기준

- [ ] M1 신규 세션에서 GSC MCP `list_sites` 정상 응답 (재시작 필요 — 다음 세션 검증 계획 명기로 갈음 가능)
- [ ] `.mcp.json` 변경분이 iMac 경로 해석과 호환됨을 대조표로 입증 (iMac 실검증은 차기 iMac 세션 항목으로 이관 명기)
- [ ] 웹 E2E 컨테이너는 **범위 제외** 명기 (키 주입 설계 별도 트랙 — 쌍아 대기건)
- [ ] SECRET_INVENTORY 1행 + COMPLETION 보고서 (인증 파일 내용 미포함)

## 5. ⚠️ 준수 조항

- **헌법 4조 1항 (최상위)**: 시크릿 값 생성/추측/노출 금지. 이 작업은 기존 자격증명의 **참조 래핑**만 허용 — 새 키 발급(`gcloud iam service-accounts keys create`) **절대 금지**. ADC 파일 내용을 stdout·로그·채팅·커밋에 출력 금지.
- **광역오더 #8**: `gcloud secrets create/versions add` 직접 실행 금지 (본 작업 무관하나 명기).
- **헌법 3조 1·2항**: 타임스탬프 실취득, 완료 보고 + COMPLETION 파일.
- **ch6**: `.mcp.json` 변경은 단일 커밋 분리 (revert 용이성).
- **ch7**: 1안 확장 미지원 등 막힘 시 무리한 우회 금지, 에스컬레이션.

## 6. 커밋

`[ops] GSC MCP 인증 경로 일반화 — ${HOME} 확장 (M1/iMac 호환), M1 임퍼소네이션 ADC 생성은 로컬-only`
