---
type: completion
date: 2026-06-11
device: iMac
agent: 막내1
portfolio: PF_PORTAL
status: 완료
---

# COMPLETION — 보안 마감 + 운영부채 정리

**[2026-06-11 14:18 KST] iMac/막내1 → 작가님**

> 근거 지시서: `ORDER_20260611_iMac쌍아_막내_보안마감+운영부채정리.md`

---

## Task 1: AGENT_API_KEY timingSafeEqual 전환 ✅

| 변경 | 내용 |
|------|------|
| `admin-auth.js:2` | `import { timingSafeEqual } from 'crypto'` 추가 |
| `admin-auth.js:8-15` | `safeCompareKey` + `matchAgentKey` 헬퍼 함수 신설 |
| `admin-auth.js:31` | `.includes(apiKey)` → `matchAgentKey(apiKey)` |
| `admin-auth.js:60` | `.includes(key)` → `matchAgentKey(key)` |

## Task 2: decodeURIComponent 방어 ✅

| 변경 | 내용 |
|------|------|
| `server.js:306` | `try/catch` 감싸기 — 실패 시 원본 urlPath 사용 |
| `server.js:317` | 동일 패턴 적용 |

## Task 3: 일회성 스크립트 격리 ✅

`monkos_AI/portal/scripts/archive/`로 9파일 이동:
- cleanup_ghost_posts.js
- migrate_blog_category.js
- migrate_blog_thumbnail.js
- migrate_korean_slugs.js
- migrate_naver_full_content.js
- restore_translation_images.js
- retranslate_all_kr.js
- retranslate_crosscontamination.js
- retranslate_naver_posts.js

`scripts/archive/README.md` 생성.

## Task 4: 301 리다이렉트 데이터화 검토 보고

### 현황
- **총 건수**: ~55건 (server.js:248-305)
- **3블록 구성**:
  - JA/EN 짧은 slug 리다이렉트 (12건) — vol21→영문slug 패턴
  - GSC 404 해소 hreflang 잔존분 (3건)
  - KO 한글 slug→영문 slug (40건) — 2026-04-27 일괄 마이그레이션

### 패턴
- 전부 `{old_path}: {new_path}` 정적 맵핑
- 새 글은 영문 slug 자동 생성이므로 **추가 발생 확률 매우 낮음**

### 데이터화 시 수정 범위
- 방안 A: JSON 파일(`redirects.json`)로 분리 → server.js에서 `import` → 맵 유지
  - 공수: 30분 내. 동작 변화 없음.
- 방안 B: Firestore 컬렉션 → 동적 조회
  - 공수: 1-2시간. 요청마다 DB 호출 발생 (캐시 필요).
  - 장점: 런타임 추가/삭제 가능
  - 단점: 55건 정적 맵에 DB 오버킬

### GSC 캐시 고려
- 301은 브라우저 + GSC에 영구 캐시됨. URL 변경/삭제 시 GSC에서 수동 제거 필요.
- 현 상태(정적 맵)가 가장 안전. 잘못된 리다이렉트를 동적으로 추가하면 GSC 오염 위험.

### 권고
- **방안 A(JSON 분리)** 추천: server.js 가독성 개선, 동작 동일, 리스크 0.
- 방안 B는 현시점 불필요 (추가 발생 확률 없음, 55건 고정).

---

## 배포

- 리비전: prod 배포 완료
- 헬스체크: ✅
- 리다이렉트 301: ✅
