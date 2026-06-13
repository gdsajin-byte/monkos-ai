---
type: completion
date: 2026-06-11
device: iMac
agent: 막내1
portfolio: PF_OPUS
status: 완료
---

# COMPLETION — 블로그 CMS 즉시수정 3건

**[2026-06-11 12:21 KST] iMac/막내1 → 작가님**

> 근거 지시서: `ORDER_20260611_iMac쌍아_막내_블로그CMS_즉시수정3건.md`

---

## 수정 내역

### Task 1: maxOutputTokens 복원 ✅

| 항목 | Before | After |
|------|--------|-------|
| `translate.js:116` | `maxOutputTokens: 8192` | `maxOutputTokens: 32768` |

### Task 2: llms.txt 동적 생성 전환 ✅

| 변경 | 내용 |
|------|------|
| 신규 | `lib/cms/render-llms.js` — Firestore blog_posts에서 published 조회→동적 텍스트 생성 |
| 수정 | `server.js` — `/llms.txt` GET 라우트 추가 (정적 파일보다 우선) |
| 삭제 | `seo.js` — `appendToLlmsTxt` 함수 제거 + fs import 제거 |
| 삭제 | `blog.js:214,298` — `appendToLlmsTxt` 호출 제거 |
| 삭제 | `translate.js:220` — `appendToLlmsTxt` 호출 제거 |

### Task 3: Naver Search API 환경변수 주입 ✅

| 변경 | 내용 |
|------|------|
| `deploy.sh:151` | `--update-env-vars`에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 추가 |

---

## 배포 결과

- 서비스: `monkos-portal` rev **00279-h45**
- 검증:
  - `curl https://monkos.ai/llms.txt` → 258줄, 블로그 URL 205건 동적 포함 ✅
  - Naver Search: deploy.sh에 키 주입 완료 (다음 배포부터 Cloud Run에 전달됨) ✅
  - maxOutputTokens: 코드 확인 32768 ✅

---

## 커밋

`2e2780bc` — `[fix] 블로그 CMS 즉시수정 3건 — maxOutputTokens 복원, llms.txt 동적화, Naver API 주입`
