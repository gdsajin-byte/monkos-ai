---
type: completion
date: 2026-06-20
device: iMac
agent: 막내2
portfolio: PF_PROFILES
status: 완료
order: ORDER_20260620_iMac쌍아_막내_HEADSHOT_안정화_프리셋차이+모달CSS.md
---

# COMPLETION: 헤드샷 안정화 — 프리셋 차이 선명화 + 로그인 모달 CSS

> **[2026-06-20 14:26 KST]** iMac/막내2 → 작가님

---

## ✅ 작업 1: 프리셋별 프롬프트 분기

- `monkos_AI/portal/server.js:176~185` — `styleModifiers` 객체 추가
- 5프리셋(linkedin_pro/corporate/creative/realtor/dating) 각각 배경·조명·분위기·무드 4축 수식어
- `basePrompt` + `styleMod` 결합 구조로 변경
- 정체성 보존 문구("clearly recognizable as the SAME person") 유지
- 의상 구체 지정 없음 — "attire mood", "styling mood" 수준만
- purpose 기본값 `'linkedin'` → `'linkedin_pro'`로 수정 (프론트엔드 data-style 키 일치)

## ✅ 작업 2: 로그인 모달 CSS 확인

- `portal.css:628~661` 공통 `.modal-overlay` 시스템으로 정상 동작
  - 배경 딤: `rgba(0,0,0,.4)` + `backdrop-filter: blur(4px)` ✅
  - 중앙 정렬: `display: flex; align-items: center; justify-content: center` ✅
  - 구글 로그인 버튼: `render-headshot.js:297~308` HTML 포함 ✅
  - 모바일: `width: 90%; max-width: 360px` 반응형 ✅
- **변경 불필요**

## 📁 산출물

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/server.js` | 프리셋별 프롬프트 분기 추가 |

## 🔀 배포

- `monkos-portal` rev `00306-rkk` — 프로덕션 100% 트래픽
- deploy.sh 경유 (ch5 준수)
