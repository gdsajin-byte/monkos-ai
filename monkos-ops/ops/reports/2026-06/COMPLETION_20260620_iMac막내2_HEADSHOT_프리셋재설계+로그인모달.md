---
type: completion
date: 2026-06-20
device: iMac
agent: 막내2
portfolio: PF_PROFILES
status: 완료
order: ORDER_20260620_iMac쌍아_막내_HEADSHOT_프리셋재설계+로그인모달.md
---

# COMPLETION: 헤드샷 프리셋 재설계 + 로그인 모달 CSS 수정

> **[2026-06-20 19:05 KST]** iMac/막내2 → 작가님

---

## ✅ 작업 1: 프리셋 프롬프트 전면 재설계

- `server.js:176~186` — styleModifiers 5종 전면 교체
  - 4축 스키마: 배경·포멀도·헤어·메이크업
  - Corporate: 다크 배경, 드라마틱 조명, 포멀
  - LinkedIn: 오피스 보케 배경, 자연광, 스마트 프로페셔널
  - Professional: 밝은 단색 스튜디오, 비즈니스 캐주얼
  - Creative: 따뜻한 질감 배경, 개성 우선
  - Dating: 골든아워 야외, 캐주얼 시크
- basePrompt에 메이크업 가드 추가: "Enhance existing makeup... Do NOT add makeup that is not present in the original."

## ✅ 작업 2: KR/EN/JA 네이밍 분리

- `render-headshot.js` i18n styles 변경:
  - `realtor` → `professional` 키 변경 (EN/KO/JA 3개국어)
  - KO: 기업 프로필→코포레이트, 비즈니스 프로→프로페셔널, 데이팅 프로필→데일리
  - JA: ビジネスプロ→プロフェッショナル, デートプロフィール→デイリー
- `headshot.js` — data-style은 buildStyleButtons()에서 i18n 키 자동 생성이므로 변경 불필요

## ✅ 작업 3: portal.css 누락 확인

- `render-headshot.js:288` — `<link rel="stylesheet" href="/css/portal.css">` 이미 존재 (쌍아 선수정)
- 로그인 모달 `.modal-overlay` display:none 기본 숨김 정상

## 📁 산출물

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/server.js` | styleModifiers 전면 교체 + basePrompt 메이크업 가드 |
| `monkos_AI/portal/lib/cms/render-headshot.js` | i18n styles 키·레이블 변경 (3개국어) |

## 🔀 배포

- `monkos-portal` rev `00307-dbb` — 프로덕션 100% 트래픽
- deploy.sh 경유 (ch5 준수)
