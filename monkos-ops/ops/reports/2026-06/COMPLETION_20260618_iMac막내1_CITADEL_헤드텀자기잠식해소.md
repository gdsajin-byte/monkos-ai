---
type: completion
date: 2026-06-18
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# 완료 보고: 헤드텀 자기잠식 해소 — canonical 통일 + title 교정

> **[2026-06-18 13:04 KST]** iMac/막내1 → 작가님

---

## 결과

✅ **A. idphoto-kr canonical+hreflang** — `/app` → `/` 3줄 변경. prod 배포 rev **00198-v2r**
✅ **B. idphoto-jp canonical+hreflang** — `/app` → `/` 3줄 변경. prod 배포 rev **00123-mkq**
✅ **C. 포털 내부링크/CTA 루트 통일** — 9파일 전수 변경 (render-static.js, i18n.js, seed-layout.js, prompts.js×2, seed_cs_knowledge.js, functions/api prompts.js)
✅ **D. 블로그 title/H1 교정** — render-blog.js에 slug별 SEO title 오버라이드 + CTA 삽입
  - `vol38-ai-kr` → "셀카로 증명사진 찍을 때 꼭 알아야 할 것"
  - `ai-kr` → "사진관이 만든 AI 플랫폼, MONKOS의 시작"
  - 양쪽 본문 하단에 `idphoto-kr.monkos.ai/` CTA 블록 자동 삽입

⏳ **monk.kr CF Pages** — functions/api prompts.js 변경분은 git push 시 자동 배포

## 배포

| 서비스 | rev | 상태 |
|--------|-----|------|
| idphoto-kr | 00198-v2r | ✅ 100% |
| idphoto-jp | 00123-mkq | ✅ 100% |
| portal | 00299-fsw | ✅ 100% |
| monk.kr (CF) | — | ⏳ git push 대기 |

## 검증

- [x] `curl https://idphoto-kr.monkos.ai/` canonical → 루트(/) ✅
- [x] `curl https://idphoto-kr.monkos.ai/` hreflang ko=루트, ja=루트 ✅
- [x] `curl https://idphoto-jp.monkos.ai/` canonical → 루트(/) ✅
- [x] blog vol38-ai-kr title → "셀카로 증명사진 찍을 때 꼭 알아야 할 것 | MONKOS AI" ✅
- [x] blog ai-kr title → "사진관이 만든 AI 플랫폼, MONKOS의 시작 | MONKOS AI" ✅
- [x] H1 태그 동일 교체 확인 ✅
- [x] JSON-LD headline 동일 교체 확인 ✅
- [x] CTA 내부링크 (idphoto-kr.monkos.ai/) 삽입 확인 ✅

## 특이사항

💡 지시서 경로 `MONK_kr/` ≠ 실제 위치 `monkos_AI/portal/` + `functions/api/`. grep 전수 탐색으로 확인 후 실제 위치에서 변경.
💡 블로그 title은 Firestore 데이터에서 렌더링되므로 render-blog.js에 slug 기반 오버라이드 맵 구현 (코드 레벨 해결).
💡 첫 배포 시 `docId` vs `slug` 키 불일치로 title 오버라이드 미적용 → `slug` 기준으로 수정 후 재배포.

## 산출물

📁 변경 파일 9개 (idphoto-kr/jp index.html, portal 7파일, functions 1파일)
