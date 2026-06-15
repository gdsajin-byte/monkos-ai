---
type: report
date: 2026-06-15
device: M2
agent: 쌍아
status: 진행
---

# GSC 색인 생성 실패 — 서버 오류(5xx) 보고

**[2026-06-15 17:40 KST]** M2/쌍아 → 작가님

## 증상
- Google Search Console에서 monkos.ai 블로그 URL 색인 요청 시 **"서버 오류(5xx)"**로 거부됨
- 대상 URL:
  - `https://monkos.ai/blog/id-photo-background-color`
  - `https://monkos.ai/en/blog/id-photo-background-color`
  - `https://monkos.ai/blog/fable-5-mythos-5`
  - `https://monkos.ai/en/blog/fable-5-mythos-5`
  - `https://monkos.ai/ja/blog/fable-5-mythos-5`

## M2에서 확인한 것
- curl 테스트 (일반 + Googlebot UA): 5회 연속 **HTTP 200 정상** (TTFB ~0.4초)
- robots.txt: 정상 (blog 허용)
- hreflang 태그: 정상 (ko/en/ja/x-default)
- canonical 태그: 정상
- sitemap-blog.xml: 최신 글 포함 확인

## 원인 추정
- **Cloud Run 콜드스타트 타임아웃**: GSC 검사 도구(모바일)가 접근할 때 Cloud Run 인스턴스가 꺼져있으면 응답 지연 → 5xx 반환
- curl은 되는데 GSC만 실패하는 패턴이 콜드스타트와 일치

## 조치 요청 (iMac에서 처리 필요)
1. **Cloud Run 로그 확인**: 최근 5xx 에러 로그에서 원인 특정
   ```
   gcloud run services logs read portal --project=monkos --limit=50
   ```
2. **min-instances를 1로 설정**: 콜드스타트 제거
   ```
   gcloud run services update portal --min-instances=1 --project=monkos --region=asia-northeast3
   ```
3. 설정 후 GSC에서 색인 요청 재시도

## 영향
- 6월 신규 블로그 글 전체가 구글 검색에 노출 안 되는 상태
- 네이버 서치어드바이저도 별도 확인 필요
