---
type: order
date: 2026-05-14
from: iMac/쌍아
to: iMac/막내2
subject: PF_CITADEL Phase 2.2 Unit-1 — monkos-portal Tier 1 prod 배포 + 검증
status: 대기
portfolio: PF_CITADEL
prior: PROPOSAL_20260514_민아_CITADEL_Phase22_배포재시작+측정사이클.md
---

# 지시서: monkos-portal Tier 1 prod 배포 + 5개 URL 검증

## 목적

5/11 Tier 1 코드 4건(seoTitle 3건 + guide/ai-photo 1건 + noindex 1건)이 main에 머지 완료 상태이나 prod 미배포. 일주일째 자산이 잠겨 있으므로 즉시 배포하여 라이브화한다.

## 작업

### 1. prod 배포

```bash
cd monkos_AI/portal && ./deploy.sh
```

> ⚠️ 헌법 5장 2조 — `gcloud run deploy` 직접 실행 금지. deploy.sh 경유 필수.

### 2. 배포 후 5개 URL 검증

아래 5개 URL에 대해 `curl -sI` 또는 `curl -s`로 검증:

| # | URL | 검증 항목 |
|---|-----|----------|
| 1 | `https://monkos.ai/specs/korea-passport` | 200 OK + 신규 seoTitle HTML `<title>` 노출 |
| 2 | `https://monkos.ai/specs/korea-drivers-license` | 200 OK + 신규 seoTitle HTML `<title>` 노출 |
| 3 | `https://monkos.ai/specs/korea-resident` | 200 OK + 신규 seoTitle HTML `<title>` 노출 |
| 4 | `https://monkos.ai/guide/ai-photo` | 200 OK + HowTo/FAQ JSON-LD 응답 확인 |
| 5 | `https://monkos.ai/en/blog/claudemax-20x-productivity` | 200 OK + `<meta name="robots" content="noindex">` 확인 |

추가:
- `https://monkos.ai/sitemap.xml` 에서 `/guide/ai-photo` URL 포함 여부 확인

### 3. 검증 결과 보고

COMPLETION 보고서에 5개 URL 검증 결과 표 포함.

## 산출물

- Cloud Run 신규 revision 배포 완료
- `COMPLETION_20260514_막내2_CITADEL_포탈배포.md`

## ⚠️ 준수 조항

- ch5 2조: deploy.sh 경유 필수
- 배포 대상은 monkos-portal만. 다른 서비스 배포 금지
- 코드 수정 없음. 배포 + 검증만

---

> 발행: **[2026-05-14 12:06 KST]** iMac/쌍아 → iMac/막내2 투입 대기
