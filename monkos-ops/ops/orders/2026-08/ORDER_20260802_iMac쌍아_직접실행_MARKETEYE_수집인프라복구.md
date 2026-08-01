---
type: order
date: 2026-08-02
from: iMac/쌍아
to: iMac/쌍아 (직접 실행)
subject: "PF_MARKET_EYE 수집 인프라 4종 무음 사망 복구 — 사후 오더"
status: 완료
portfolio: PF_MARKET_EYE
---

# ORDER(사후 기록) — 수집 인프라 복구 직접 실행

**[2026-08-02 03:24 KST]** iMac/쌍아 → 기록

> **[예외] 쌍아 직접 실행** — 작가님 구두 지시 "도구 직접 복구하고 기록해"(03:22). ch1 「쌍아 직접 코딩 금지」의 명시 승인 예외이며, 03-17 승인된 **쌍아 직접수정 프로토콜**(구두 지시 → 수정 → 사후 오더 기록 + 세션로그 어펜드)에 따라 본 문서를 남긴다.

## 1. 배경

작가님 질의("PF 도구화 미완결인가? GA4가 꺼진 것인가?")에서 출발한 전수 진단 결과, **GA4는 정상이며 iMac의 수집 도구 4종이 무음 사망 상태**임이 확인됐다. PF README는 이들을 전부 ✅로 표기하고 있었다 — `references.md` 도구 3요건 중 **③실패 가시화** 위반.

## 2. 진단 → 조치

| # | 도구 | 진단 | 조치 |
|---|------|------|------|
| 1 | `seo_collect.sh ga4-device` | `No module named 'google.analytics'` | `pip install google-analytics-data` |
| 2 | `seo_collect.sh gsc-inspection` | `No module named 'googleapiclient'` | `pip install google-api-python-client` |
| 3 | `ga4_mcp.sh` (GA4 MCP) | `exec uvx analytics-mcp`가 매 기동마다 임시 환경 생성 → **cryptography 50.0.0 소스 빌드**(Intel macOS x86_64 휠 부재) → MCP 연결 타임아웃. **SA 키·gcloud 인증·SM 접근은 전부 정상이었음** | `uv tool install analytics-mcp` 영구 설치 + 스크립트를 `exec analytics-mcp`로 교체, 미설치 시 명시 에러 |
| 4 | `seo_collect.sh pagespeed` | 403 Forbidden ×4. 래퍼가 `PAGESPEED_API_KEY` 슬롯에 **`GEMINI_API_KEY`를 주입** 중이었음. 실패 URL이 stderr에 그대로 출력되며 **Gemini 키 평문 노출** | SM에 전용 키가 **이미 존재**(07-21 등재)함을 `secret.sh map`으로 확인 → 전용 키로 전환 |

**근본 원인**: 환경 재현성 부재. PF 히스토리 110행 "07/21 **M1**/쌍아 수집기 스모크 5/6 복구 — GA4/GSC pip install"이 M1에만 적용되고 레포에 고정되지 않아 iMac에서 12일간 방치됐다.

## 3. 변경 파일

| 파일 | 변경 |
|------|------|
| `scripts/tools/requirements.txt` | **신설** — 파이썬 의존성 정본 4종 + 셋업 2줄 안내 |
| `scripts/tools/ga4_mcp.sh` | `uvx` → 영구 설치본 직접 실행 + PATH 보정 + 미설치 시 명시 에러(무음 금지) |
| `scripts/tools/seo_collect.sh` | PageSpeed 키를 `GEMINI_API_KEY` → `PAGESPEED_API_KEY`로 교정 |
| `monkos-ops/ops/portfolios/PF_MARKET_EYE/README.md` | 2-1 상태 현행화 + PageSpeed 2-2→2-1 승격 + **상태 표기 규율** 신설 + 히스토리 2행 |

## 4. 검증

```
scripts/tools/seo_collect.sh   (무인자 = 전체 스모크)
[naver-searchad] OK   [naver-datalab] OK   [bing] OK
[pagespeed] OK        [ga4-device] OK      [gsc-inspection] OK    → 6/6
```

- GA4 MCP: 기동 후 6초 생존 확인(빌드 진입 없음). **MCP 재연결은 다음 세션부터 유효**
- GA4 실데이터 조회 성공 — 본 복구로 「조회수 +41% 정체 규명」이 가능해짐(세션로그 참조)

## 5. 잔여 / 후속

- [ ] **GA4 내부 트래픽 필터 미설정** — 이번에 Direct 채널 pv/s 5.16 이상치로 실증됨. GA4 관리 콘솔 작업(작가님 권한)
- [ ] 스모크 결과가 PF 문서에 자동 반영되는 경로 없음 — 상태 표기 규율은 명문화했으나 사람이 지켜야 하는 구조
- [ ] 타 디바이스(M1·M2·4060) 동일 점검 미실시 — `requirements.txt` 배포 확인 필요
- [ ] 노출된 `GEMINI_API_KEY` 로테이션 여부 판단 (로그 전송 경로에 따라)

## 6. 커밋

`[fix] MARKET_EYE 수집 인프라 4종 복구 + 재현성 정본 신설`
