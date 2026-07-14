---
type: order
date: 2026-07-14
device: M1
agent: 쌍아
recipient: 막내3
portfolio: PF_SPECS, PF_CITADEL
status: 대기
---

# 지시서: SPECS seoTitle P0 수정 3건 — 전수 검수 발견분

**[2026-07-14 17:59 KST]** M1/쌍아 → 막내3

---

## 배경

막내3 전수 검수(REPORT_20260714)에서 P0 3건 식별. 즉시 수정 필요.

---

## ⚠️ 준수 조항

- specs-data.json의 seoTitle만 수정. 다른 필드 무접촉
- 수정 후 dev 배포로 검증. prod 배포는 작가님 승인 후 별도

---

## 수정 대상

| # | 슬러그 | 언어 | 현재 | 수정 | 사유 |
|---|--------|------|------|------|------|
| 1 | uk-passport | en | "Europe Passport Photo..." | "**UK** Passport Photo..." | 국가명 오류 — UK≠Europe |
| 2 | de-resume | en | "Europe Resume Photo..." | "**Germany** Resume Photo..." | 국가명 오류 — Germany≠Europe |
| 3 | us-passport | ko | "미국 여권 / 비자 사진..." | "미국 **여권** 사진..." | "/ 비자" 제거 — us-visa와 카니발리제이션 |

## 완료 기준

- [ ] specs-data.json 3건 수정
- [ ] dev 배포 + 3 URL curl로 seoTitle 반영 확인
- [ ] 커밋 + 푸시
- [ ] 완료 보고 (✅❌💡⏳📁🔀 형식)
