---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내3
subject: "웹/민아 색인 최적화(슬러그 위생+404→410) 코드 변경 검수"
status: 발행
portfolio: PF_SPECS
priority: 즉시
---

# 지시서 — 웹/민아 색인 최적화 코드 검수

> **[2026-06-15 15:26 KST] iMac/쌍아 → iMac/막내3**
> 작가님 지시: 민아 작업을 꼼꼼히 검수할 것.
> 대상: 커밋 `37c87cd0` (웹/민아, `claude/gracious-franklin-nra9c1` → main 머지 완료)
> 제안서: `PROPOSAL_20260615_웹민아_색인최적화_블로그슬러그_404정리.md`

---

## 검수 대상 파일 (10파일, +218/-74)

| 파일 | 변경 내용 |
|------|----------|
| `lib/cms/slug.js` | `isWeakSlug()` 추가 — 4자↓·영문자3자↓ 감지 |
| `lib/cms/blog.js` | 발행 시 약한 슬러그 → AI 재생성 분기 |
| `lib/cms/seo-exclude.js` | **신규** — `isIndexableBlogUrl()` 사이트맵 필터 |
| `lib/cms/redirects.js` | **신규** — blogRedirects 맵 server.js에서 DRY 추출 |
| `lib/cms/render-sitemap.js` | 사이트맵 생성 시 seo-exclude 필터 적용 + lastmod 보정 |
| `lib/cms/render-blog.js` | 슬러그 관련 변경 |
| `server.js` | 레거시 monk.kr 경로 → 410 Gone + 리다이렉트 맵 DRY |
| `public/admin/js/blog-editor.js` | 에디터 슬러그 입력 `[a-z0-9-]` 필터 |
| 제안서 | PROPOSAL 문서 |
| 세션 로그 | 웹/민아 6/15 세션 |

---

## 검수 항목 — 꼼꼼히

### 1. 코드 정확성
- `isWeakSlug()` 판정 로직 — 정상 슬러그를 false positive로 걸러내지 않는지
- `isIndexableBlogUrl()` — 정상 글을 사이트맵에서 제외하지 않는지
- 410 응답 대상 경로 — 실제 라이브 서비스 경로를 잘못 포함하지 않는지
- `redirects.js` — server.js 기존 리다이렉트 맵과 1:1 일치하는지 (추출 과정에서 누락·변형 없는지)

### 2. 사이드이펙트
- blog.js 변경이 기존 발행 플로우를 깨뜨리지 않는지
- render-sitemap.js 변경이 specs·static sitemap에 영향 없는지 (blog만 필터링하는지)
- server.js 410 경로 중 현재 사용 중인 경로가 없는지
- blog-editor.js 필터가 기존 저장된 슬러그 편집을 막지 않는지

### 3. 기존 코드와 충돌
- 오늘 막내2가 구현한 IndexNow (`notifySearchEngines`) 코드와 충돌 없는지
- 오늘 막내1이 수정한 specs-data.json 관련 render-sitemap.js 변경과 충돌 없는지

### 4. 제안서 B/C 항목 검토
- B1(정크 슬러그 31개 리슬러그)이 A1(사이트맵 제외)과 정합적인지
- A3(410)이 크로스도메인 301 가능성을 고려했는지

### 5. 배포 전 검증
- `node --check` 전 파일 통과 확인
- 가능하면 로컬에서 server.js 구동하여 410 경로·사이트맵 필터 실측

---

## 산출물

1. **검수 보고서**: `REVIEW_20260615_iMac막내3_민아슬러그위생_코드검수.md`
   - 항목별 PASS/FAIL + 발견 사항
   - `monkos-ops/ops/reports/2026-06/` 배치
2. 수정 필요 시 목록화 (수정 자체는 하지 않음 — 보고만)
3. 커밋

---

## ⚠️ 준수 조항

- **읽기 전용 검수** — 코드 수정 금지. 발견 사항은 보고만
- 민아 작업이므로 감사 원칙 준용 (ch7 → feedback_audit_is_mina_role.md: 코드 작성자에게 자기 감사 금지)
