---
type: proposal
date: 2026-03-29
from: M1/민아
to: M1/쌍아, 막내
subject: monkos.ai SEO 검색 노출 — CDP 진단 기반 수정 제안서
priority: 긴급
---

# SEO 검색 노출 수정 제안서

**[2026-03-29 07:35 KST] M1/민아 → M1/쌍아, 막내**

---

## 1. 진단 경위

2026-03-29 06:43~07:10, 작가님 입회 하에 CDP 디버그 크롬(localhost:9222)으로 monkos.ai 라이브 사이트 전수 크롤 수행.

### 진단 범위
- 메인, 블로그 목록(ko/ja/en), 블로그 개별 포스트, FAQ, 갤러리, sitemap.xml, robots.txt
- sitemap 등재 126 URL 전수 HTTP 상태 점검
- 개별 페이지 SEO 메타 추출 (title, description, canonical, hreflang, OG, JSON-LD)

---

## 2. 발견 이슈 3건

### P0 (치명): JA 한자/가나 슬러그 블로그 포스트 404 — 13건

**현상**: sitemap에 등재된 JA 블로그 포스트 중 일본어 문자 슬러그 13건이 404 반환

**검증 결과**:
| 경로 | 상태 |
|------|------|
| `/ja/blog/証明写真で輝くメイクの秘訣...` | 404 |
| `/blog/証明写真で輝くメイクの秘訣...` (KR 경로) | 200 |

같은 슬러그가 KR 경로에서는 200, JA 경로에서는 404.

**원인**: `blogPostFragment` (render.js:355)의 Firestore doc ID 조회 로직

```
현행: const docId = lang ? `${slug}-${lang}` : slug;
```

- 신규 방식 포스트: doc ID = `baseSlug-ja` → 정상 조회
- 구 방식 포스트: doc ID = `일본어슬러그` (접미사 없음) → `일본어슬러그-ja`로 조회 → 문서 없음 → 404

**영향**:
- sitemap에 404 URL 13건 제출 → 구글 크롤 버짓 낭비
- GSC "크롤링됨 - 색인 미생성" 원인 중 하나일 가능성
- JA 콘텐츠 SEO 노출 차단

**해결 방향**: `blogPostFragment`에서 `slug-lang` 조회 실패 시 `slug` 자체로 fallback 조회 + `doc.data().lang === lang` 검증

**404 전체 목록** (sitemap 등재 URL 기준):
1. `/ja/blog/証明写真で輝くメイクの秘訣就職パスポトビザ-一枚の写真が第一印象を決める`
2. `/ja/blog/証明写真のヘアスタイル-メイクの次はヘア-印象を完成させる最後の一手`
3. `/ja/blog/パスポト写真自分で切ったことありますか-monkos-crop-無料トリミングツル`
4. `/ja/blog/就職証明写真の服装カラ選び-服一枚が合否を変える`
5. `/ja/blog/aiとは何か-写真家がai開発者になって気づいたこと序章写真家辛シン-aiデベロッパ-monkos-ai`
6. `/ja/blog/ハン研究員マガジン-2026年-就活生ヘアメイクガイド`
7. `/ja/blog/ハン研究員マガジン-おうちでできるボリュムアップ法`
8. `/ja/blog/手のひらの写真館-monkosai-の使い方をご紹介します`
9. `/ja/blog/ハン研究員マガジン証明写真面接ヘアメイクに重要な角質ケア清潔感信頼感の始まり`
10. `/ja/blog/証明写真がキレイに撮れる表情-ポズ練習法-第一印象は表情が作る`
11. `/ja/blog/写真館12年ai証明写真アプリを開発した写真家の話`
12. `/ja/blog/パスポト写真-monkosai-チェックマクで詳しくお知らせします`
13. `/ja/blog/ハン研究員マガジン就活写真と面接に必要な服装面接ヘア-自信の始まりは自分らしい姿`

---

### P1 (중요): FAQ hreflang 미연결 + OG 태그 누락

**현상**: `/faq`, `/ja/faq`, `/en/faq` 페이지에:
- hreflang 태그 0건 (ko/ja/en 상호 연결 없음)
- `og:image` 누락
- `og:locale` 누락

**비교**:
| 항목 | 블로그 포스트 | FAQ |
|------|-------------|-----|
| hreflang | ko/ja/en/x-default 4개 | 없음 |
| og:image | 있음 | 없음 |
| og:locale | 있음 (블로그 목록) | 없음 |

**영향**:
- JA/EN FAQ가 KO FAQ와 중복 콘텐츠로 판정될 위험
- SNS 공유 시 미리보기 불완전

**해결 방향**: `faqFragment` (render.js)의 `seoMeta` 생성 블록에 hreflang 4건 + og:image + og:locale 추가. 블로그 포스트의 기존 패턴 복제.

---

### P2 (개선): 블로그 포스트 내부 링크 부족

**현상**: 블로그 개별 포스트 페이지의 내부 링크 6개 (네비게이션 포함). 포스트 본문 영역에서 다른 포스트로 연결하는 링크 거의 없음.

**영향**:
- 구글 크롤러가 포스트 간 탐색 경로 부족 → 신규 포스트 크롤/색인 지연
- 사용자 체류 시간 감소 (이탈률 상승)

**해결 방향**: 포스트 하단에 "관련 글" 섹션 추가 (같은 언어 최근 3건 카드 표시)

**설계 시 검토 필요 사항** (쌍아 리뷰에서 식별):
1. **slug 역산 로직**: 구 방식 doc ID(`-ja` 접미사 없음)와 신규 방식 doc ID의 혼재를 감안한 URL 생성 로직 필요
2. **Firestore 복합 인덱스**: `published + lang + createdAt` 복합 인덱스 존재 여부 확인 필수. 미존재 시 인덱스 생성 선행
3. **캐싱 전략**: 매 렌더마다 Firestore 추가 쿼리 1회 발생. 현재 트래픽(일 12클릭 수준)에서는 무시 가능하나, 성장 시 대응 방안 검토
4. **CSS 설계**: 카드 레이아웃(3컬럼 그리드, 모바일 1컬럼), 썸네일 비율, 포스트 없는 경우 처리

---

## 3. 진단 기반 현황 요약 (참고)

### sitemap 현황
- 총 등재: **126 URL**
- GSC 색인: 30 (3/27 기준) → 색인률 **23.8%**
- JA 404: 13건 (sitemap에 죽은 URL 제출 중)

### HTTP 상태 총괄 (블로그 포스트)
| 언어 | 총 수 | 200 | 404 |
|------|-------|-----|-----|
| KR | 28 | 28 | 0 |
| EN | 25 | 25 | 0 |
| JA | 33 | 20 | **13** |

### 메인 페이지 SEO — 양호
- title, description, hreflang, OG, JSON-LD(WebApplication+FAQPage+ItemList) 전부 정상
- 내부 링크 28개

### 블로그 포스트 SEO — 부분 양호
- Article JSON-LD 존재, hreflang 4개 정상
- description HTML 오염 없음 (3/28 지시서 이슈는 해결된 상태)

### robots.txt — 정상
- AI 크롤러(GPTBot, ClaudeBot, PerplexityBot 등) Allow

---

## 4. 기존 미실행 SEO 지시서와의 관계

| 지시서 | 상태 | 이번 제안서와의 관계 |
|--------|------|---------------------|
| ORDER_20260328 (구글 색인 촉진) | 미실행 | P0(meta desc 정리)는 이미 해결됨. JSON-LD는 이미 존재. **내부 링크 강화(P2)만 미실행** |
| ORDER_20260325 (hreflang+sitemap 보강) | 부분 실행 | 블로그 hreflang 완료. **FAQ hreflang(P1)이 누락** |
| ORDER_20260322 (SEO 보강) | 부분 실행 | GA 태그 완료, sitemap ping 미확인 |

→ 이번 제안서는 기존 지시서들의 **미실행 잔여분 + 신규 발견분**을 통합.

---

## 5. 실행 제안

| 순위 | 항목 | 수정 파일 | 예상 규모 | 비고 |
|------|------|----------|----------|------|
| P0 | JA slug fallback | `render.js` blogPostFragment | ~8줄 | 버그 수정 |
| P1 | FAQ hreflang + OG | `render.js` faqFragment | ~10줄 | 패턴 복제 |
| P2 | 관련 포스트 섹션 | `render.js` blogPostFragment | ~50줄 | 신규 기능, 설계 검토 필요 |

**P0·P1은 즉시 실행 가능 (막내 지시서). P2는 쌍아 설계 검토 후 지시서 별도 하달 권장.**

---

## 6. 검증 계획

수정 배포 후 민아가 CDP로 재크롤하여 검증:
- [ ] JA 404 13건 → 200 전환 확인
- [ ] FAQ hreflang 4건 + og:image + og:locale 존재 확인
- [ ] (P2 실행 시) 관련 포스트 카드 렌더 + 내부 링크 수 증가 확인
- [ ] sitemap 등재 URL vs 실제 응답 상태 전수 재점검
