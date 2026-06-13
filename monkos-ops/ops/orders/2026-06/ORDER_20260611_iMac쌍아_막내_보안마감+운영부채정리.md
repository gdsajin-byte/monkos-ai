---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내
portfolio: PF_PORTAL
status: 대기
---

# 지시서 — 보안 마감 #4 + 운영부채 정리 #5

**[2026-06-11 14:05 KST] iMac/쌍아 → iMac/막내**

---

## 배경

민아 CMS 진단 잔여 별건 2묶음. Task 1~3(Critical/High)은 별도 지시서로 처리 중. 본 건은 저위험 보안 마감 + 슬러그 단일화 후 잔재 청소.

---

## ⚠️ 준수 조항

- ch5 2조: 배포는 deploy.sh 경유 필수
- 헌법 4조 1항: 시크릿 노출 금지
- ch4 2조: 폴더 구조 준수

---

## Task 1: AGENT_API_KEY 비교 timingSafeEqual 전환 [보안 마감]

- 파일: `monkos_AI/portal/lib/cms/admin-auth.js:23,52`
- 현재: `AGENT_API_KEYS.includes(apiKey)` — 일반 문자열 비교
- 수정: `crypto.timingSafeEqual` 기반 비교로 전환
- 참고: 세션 토큰은 이미 `config.js`에서 `timingSafeEqual` 사용 중 — 동일 패턴 적용
- 주의: `timingSafeEqual`은 길이가 다르면 에러나므로 길이 선검사 필수 (config.js의 기존 패턴 참조)

## Task 2: decodeURIComponent 방어 [보안 마감]

- 파일: `monkos_AI/portal/server.js:306,317`
- 현재: 301 리다이렉트 블록에서 `decodeURIComponent(pathname)` 호출 시 깨진 % 시퀀스로 `URIError` → 500
- 수정: `try/catch`로 감싸서 실패 시 원본 pathname 그대로 사용
- 간단한 수정. 과설계 금지.

## Task 3: 일회성 스크립트 격리 [운영부채]

`scripts/` 루트에 현행 유틸과 섞여 있는 일회성 마이그레이션 스크립트를 `scripts/archive/`로 이동.

대상 (확인 후 전수 이동):
```
scripts/cleanup_ghost_posts.js
scripts/migrate_korean_slugs.js
scripts/restore_translation_images.js
scripts/retranslate_*.js (3종)
scripts/migrate_blog_thumbnail.js (monkos_AI/portal/scripts/ 내)
scripts/migrate_blog_category.js (monkos_AI/portal/scripts/ 내)
```

- `mkdir -p scripts/archive/` 후 `git mv`
- scripts/archive/README.md 생성: "일회성 마이그레이션 스크립트 아카이브. 실행 완료. 참조용 보존."
- 현행 유틸(`credits.sh`, `blog-audit.js`, `mk-push.sh`, `mk-pull.sh` 등)은 이동하지 말 것

## Task 4: 301 리다이렉트 데이터화 검토 보고 [운영부채]

- server.js 내 한글→영문 slug 301 하드코딩 블록을 확인하고, 현재 몇 건인지 + Firestore/JSON 파일로 데이터화할 때의 공수를 **보고만** 한다. 실행하지 않는다.
- 보고 내용: 현재 건수, 패턴, 데이터화 시 수정 범위, GSC 캐시 고려사항

---

## 배포

Task 1~3 완료 후:
1. 로컬 검증 (서버 기동, 에이전트 키 인증 동작, 리다이렉트 에러 없음)
2. `./deploy.sh prod`
3. prod 스모크

---

## 산출물

1. admin-auth.js, server.js 수정
2. scripts/archive/ 격리
3. Task 4 검토 보고 (보고서에 포함)
4. **보고서**: `monkos-ops/ops/reports/2026-06/COMPLETION_20260611_iMac막내_보안마감+운영부채.md`
5. 세션 로그 어펜드
6. 완료 보고: ✅❌💡⏳📁🔀 형식
