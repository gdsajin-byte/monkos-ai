---
type: completion
date: 2026-06-08
device: iMac
agent: 막내1
portfolio: PF_PORTAL, PF_CITADEL
status: 완료
---

# COMPLETION — 번역본(ja/en) 색인 요청 누락 수정

**[2026-06-08 14:36 KST] iMac/막내1 → 작가님**

---

## 변경 요약

| 파일 | 작업 | 내용 |
|------|------|------|
| `lib/cms/seo.js` | **신규** | `requestIndexing`, `appendToLlmsTxt`, `pingSitemap` 3개 함수 — blog.js에서 추출 |
| `lib/cms/blog.js` | **수정** | 내부 함수 2개 삭제 → seo.js import 전환. 미사용 import 정리(fs, path/resolve, GoogleAuth, __dirname) |
| `lib/cms/translate.js` | **수정** | seo.js import 추가. 번역본 저장 완료 시점에 `published` 체크 후 색인 3종(Indexing API + llms.txt + sitemap ping) 추가 |

## 동작 흐름 (수정 후)

```
블로그 발행 (published=true, lang=ko)
  ├── blog.js: kr 원본 → requestIndexing + llms.txt + sitemap ping  ← 기존 동작 유지
  └── blog.js: translateAndSaveBlogPost 호출
        ├── translate.js: ja 번역 저장 → requestIndexing(ja) + llms.txt(ja) + sitemap ping  ← 신규
        └── translate.js: en 번역 저장 → requestIndexing(en) + llms.txt(en) + sitemap ping  ← 신규
```

## ✅❌💡⏳📁🔀

- ✅ Task 1: seo.js 신규 생성 — requestIndexing, appendToLlmsTxt, pingSitemap
- ✅ Task 2: blog.js 내부 함수 삭제 → seo.js import 전환 + 미사용 import 정리
- ✅ Task 3: translate.js 저장 완료 시점에 색인 3종 추가 (published 체크 포함)
- ❌ Task 검증(로컬 서버 기동): 환경 미확인 — prod 배포 전 로컬 테스트 필요
- 💡 번역 실패 시 색인도 자연스럽게 skip (try-catch 내부이므로)
- 📁 `monkos-ops/ops/completions/2026-06/COMPLETION_20260608_막내1_번역본색인누락_수정.md`
- 🔀 `lib/cms/seo.js` 신규, `lib/cms/blog.js` + `lib/cms/translate.js` 수정
