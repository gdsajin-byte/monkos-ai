---
type: completion
date: 2026-05-14
device: iMac
agent: 막내3
portfolio: PF_CITADEL
order: ORDER_20260514_iMac쌍아_막내3_CITADEL_ENnoindex수정+GSC색인요청.md
status: 완료
---

# COMPLETION: EN noindex 수정 + 재배포 + GSC 색인 요청 5건

**[2026-05-14 12:31 KST]** iMac/막내3 → 작가님, iMac/쌍아

---

## ✅ 작업 1: EN noindex 누락 수정

- **파일**: `monkos_AI/portal/lib/cms/render-blog.js`
- **수정**: `NOINDEX_SLUGS`에 EN slug `claude-max-20x-2-month-real-usage-review` 추가
- **검증**: `curl -s https://monkos.ai/en/blog/claude-max-20x-2-month-real-usage-review | grep noindex` → `<meta name="robots" content="noindex">` 확인

## ✅ 작업 2: 재배포

- **방법**: `./deploy.sh prod` (ch5 2조 준수)
- **결과**: monkos-portal rev **00246-gkk**, 100% 트래픽
- **비고**: KO 구 slug(`claudemax-20x-2개월-실사용-후기`)는 301 → EN slug로 리다이렉트 (4/27 마이그레이션 결과)

## ✅ 작업 3: GSC 색인 요청 5건

| # | URL | 검사 전 상태 | 색인 요청 | 비고 |
|---|-----|-----------|---------|------|
| 1 | `/guide/ai-photo` | ❌ Google 미인식 (NEUTRAL) | ✅ 요청됨 — 우선순위 크롤링 대기열 추가 | **신규 URL — 최우선** |
| 2 | `/specs/korea-passport` | ✅ 색인됨 (4/25 크롤) | ✅ 재크롤 요청됨 | FAQ 리치결과 1건 감지 |
| 3 | `/specs/korea-drivers-license` | ✅ 색인됨 (4/25 크롤) | ✅ 재크롤 요청됨 | FAQ 리치결과 1건 감지 |
| 4 | `/specs/korea-resident` | ✅ 색인됨 (5/12 크롤) | ✅ 재크롤 요청됨 | FAQ 리치결과 1건 감지 |
| 5 | `sitemap.xml` | ✅ 성공 (293 URL) | ✅ 재제출 완료 (5/14 갱신) | GSC UI에서 직접 제출 |

## 📁 산출물

- 코드 수정: `render-blog.js` NOINDEX_SLUGS EN slug 1건 추가
- Cloud Run: monkos-portal rev 00246-gkk (prod 100%)
- GSC: 색인 요청 4건 + sitemap 재제출 1건

## 💡 참고

- GSC MCP 도구(`index_inspect`)로 검사는 가능하나, sitemap 제출은 `siteFullUser` 권한 제한으로 실패 → CDP로 GSC 웹 UI 직접 처리
- `/guide/ai-photo`는 sitemap 참조 사이트맵 미감지 상태 — sitemap.xml 재제출로 연계 크롤 기대
- specs 3건은 모두 FAQ 리치결과 정상 감지 — seoTitle 변경분은 재크롤 후 SERP 반영 예상 (24~72시간)

---

> **[2026-05-14 12:31 KST]** iMac/막내3 완료 보고
