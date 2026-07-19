---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내1
portfolio: PF_SPECS
status: 대기
priority: P2
---

# 지시서: 블로그 404 URL 분류 + 핀셋 301 보수 + 사이트맵 정리

**[2026-07-19 14:02 KST]** iMac/쌍아 → 막내1

## 배경

GSC 색인 리포트에서 404가 127건 보고됨. 분석 결과 대부분 블로그 슬러그 변경/삭제 잔해(~120건). 민아 처방: 일괄 301 폴백은 반패턴(soft-404 위험). originalSlug 대조로 "생존 후속 있음 / 진짜 삭제" 분류 → 구멍만 개별 301 보수, 삭제분은 404 유지.

- 404 목록 CSV: GSC export (작가님 다운로드 완료)
- 기존 블로그 301 체계: render-blog.js:256 변형 슬러그(-kr/-en/-ja) 리다이렉트 (7/18 7차)

## ⚠️ 준수 조항

- Firestore 직접 접근 금지 → `scripts/credits.sh` 경유... 는 블로그 데이터에는 해당 없음. 블로그 Firestore 조회는 서비스 코드(render-blog.js) 경유로 확인.
- 삭제된 블로그의 404는 의도된 동작 — 301로 바꾸지 않는다
- deploy.sh 경유 배포

## 작업

### Task 1. 404 URL 분류 스크립트

404 CSV 127건의 블로그 URL (~120건)을 분류:

```
분류 A: 생존 문서 있음 — originalSlug/baseSlug 매칭으로 현행 URL 특정 가능 → 301 보수 대상
분류 B: 진짜 삭제 — Firestore에 레코드 없음 → 404 유지 (작업 불요)
분류 C: 비블로그 (서비스 경로 등) — 별도 판단
```

방법:
1. 404 CSV에서 `/blog/` 포함 URL 추출
2. 슬러그 파싱
3. render-blog.js의 blogDetailFragment 로직을 참조하여 Firestore blog_posts 컬렉션 매칭:
   - 변형 슬러그 체크 (suffix -kr/-en/-ja)
   - originalSlug 필드 대조
   - baseSlug 필드 대조
4. 결과: 분류 A/B/C 목록 산출

### Task 2. 분류 A — 핀셋 301 보수

생존 문서인데 404인 URL이 있으면:
- render-blog.js의 리다이렉트 로직에 해당 패턴 추가
- 또는 REDIRECT_MAP에 개별 매핑 추가
- **일괄 폴백(/blog/ 목록 페이지로 301) 금지**

### Task 3. 사이트맵 총합본 정리 확인

`render-sitemap.js:70`에서 `sitemap-specs.xml`을 sitemap index에 포함하고 있음. 언어별 4종(`sitemap-specs-ko/en/ja/es.xml`)과 총합본(`sitemap-specs.xml`)이 중복 등록 상태.

- 총합본이 언어별 4종과 동일 데이터인지 확인
- 중복이면: sitemap index에서 총합본 참조 제거 제안 (코드 수정은 보고 후 승인 대기)
- 중복이 아니면 (예: 총합본이 4언어 통합): 현상 유지 보고

### Task 4. 산출물

보고서:
```
monkos-ops/ops/reports/2026-07/REPORT_20260719_iMac막내1_블로그404_분류결과.md
```

포함:
- 분류 A/B/C 건수 + 각 URL 목록
- 분류 A 301 보수 내역 (있을 경우)
- 사이트맵 중복 상태 판정

## 완료 조건

1. 분류 스크립트 실행 + 보고서
2. 분류 A 보수 시: jest + deploy.sh
3. 커밋·푸시

## 커밋

```
[fix] 블로그 404 핀셋 301 보수 — GSC 미색인 URL originalSlug 분류 기반
```

(분류 A = 0건이면 보고서만 커밋)
