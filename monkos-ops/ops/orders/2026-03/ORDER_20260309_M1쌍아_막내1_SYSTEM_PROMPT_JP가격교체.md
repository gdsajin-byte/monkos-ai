---
type: order
date: 2026-03-09
from: M1/쌍아
to: 막내1
priority: P0
category: implementation
---

# 지시서: SYSTEM_PROMPT (web/kakao) JP 가격 현행화

**[2026-03-09 22:37 KST] M1/쌍아 → 막내1**

## 배경

`SYSTEM_PROMPT`는 포털 web 채널과 kakao 채널이 공유하는 프롬프트.
JP 가격표가 구 USD 체계(`$10/$25/$40`)로 잔존 — 현행 JPY v3 패키지와 완전 불일치.
JP 사용자가 포털 챗봇에 가격 문의 시 존재하지 않는 달러 가격을 안내하는 상태.

## 수정 대상

### 파일: `monkos_AI/portal/lib/prompts.js`

### 수정 위치: `SYSTEM_PROMPT` 내 `[クレジットシステム]` 섹션

### 현재 (구형):
```
- 購入（韓国・Toss）: 10c/₩1,450 | 80c(70+ボーナス10)/₩9,900（📸1枚パック） | 130c(100+ボーナス30)/₩12,900 | 420c(300+ボーナス120)/₩34,900（おすすめ） | 750c(500+ボーナス250)/₩49,900
- 購入（グローバル・Lemon Squeezy）: 10c/$10 | 30c/$25 | 50c/$40
- 決済: Toss Payments（韓国）/ Lemon Squeezy（グローバル、カード・PayPal・Apple Pay・Google Pay）
```

### 변경 후 (현행 반영):
```
- 購入（韓国・Toss Payments）:
  · 📸 1枚パック: ₩9,900 (70c + ボーナス10c = 80c)
  · 10c チャージ: ₩1,450
  · 130c パッケージ: ₩12,900 (100c + ボーナス30c)
  · 420c パッケージ: ₩34,900 (300c + ボーナス120c) — おすすめ
  · 750c パッケージ: ₩49,900 (500c + ボーナス250c)
- 購入（日本・Lemon Squeezy）:
  · 📸 1枚分: ¥990 (70c + ボーナス10c = 80c)
  · 10c チャージ: ¥150
  · 130c パッケージ: ¥1,490 (100c + ボーナス30c)
  · 420c パッケージ: ¥3,990 (300c + ボーナス120c) — おすすめ
  · 750c パッケージ: ¥5,990 (500c + ボーナス250c)
- 決済: Toss Payments（韓国）/ Lemon Squeezy（日本・グローバル、カード・PayPal・Apple Pay・Google Pay）
```

## 주의사항

- `SYSTEM_PROMPT` **이외의 프롬프트는 수정하지 않는다** (SYSTEM_PROMPT_KR, SYSTEM_PROMPT_JP 등 건드리지 않음)
- "グローバル" → "日本・グローバル"로 표현 변경 (JP가 현재 유일한 글로벌 시장)
- KR 가격은 기존과 동일하나 포맷을 JP와 통일 (항목별 줄바꿈)

## 완료 조건

- [ ] SYSTEM_PROMPT 내 JP 가격 $구형 → ¥현행 교체 완료
- [ ] KR 가격 포맷 정리 완료
- [ ] 다른 프롬프트 미수정 확인

## 보고 형식

```
✅ SYSTEM_PROMPT JP 가격 현행화 완료
📁 수정: prompts.js (SYSTEM_PROMPT만)
```
