---
type: completion
date: 2026-06-11
device: iMac
agent: 막내1
portfolio: PF_PORTAL
status: 완료
---

# COMPLETION — 블로그 CMS 색인·보안 잔여 3건

**[2026-06-11 13:52 KST] iMac/막내1 → 작가님**

> 근거 지시서: `ORDER_20260611_iMac민아_막내_블로그CMS_색인보안잔여3건.md`

---

## Task 1: /admin/*.html 무인증 노출 차단 ✅

| 변경 | 내용 |
|------|------|
| `server.js:38` | `requireAdmin` import 추가 |
| `server.js:388-390` | 정적 서빙 전 `/admin/*.html` 가드 삽입 (로그인 `/admin/index.html` 제외) |

검증:
- 익명 `GET /admin/blog-list.html` → **401** ✅
- 로그인 페이지 `GET /admin/index.html` → **200** ✅
- 일반 페이지 `GET /blog` → **200** ✅

## Task 2: pingSitemap 폐기 엔드포인트 제거 ✅

| 변경 | 내용 |
|------|------|
| `seo.js` | `pingSitemap` 함수 삭제 |
| `blog.js:11,178,261` | import·호출 제거 |
| `translate.js:7,220` | import·호출 제거 |

검증: `grep -rn pingSitemap lib/` → **0건** ✅

## Task 3: requestIndexing 403/429 구분 로깅 + 일일 카운터 ✅

| 변경 | 내용 |
|------|------|
| `seo.js` | 모듈 스코프 일일 카운터 (`indexingCount`, UTC 날짜 리셋) |
| `seo.js` | 180건 이상 시 쿼터 근접 WARN |
| `seo.js` | catch에서 403→ERROR, 429→WARN, 기타→WARN 분기 로깅 |
| `seo.js` | 성공 로그에 카운터 표시 (`N/200`) |

---

## 배포

- 리비전: `monkos-portal-00284-2gd`
- 헬스체크: ✅
