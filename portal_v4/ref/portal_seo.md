---
paths:
  - "monkos_AI/portal/**"
  - "monkos_AI/idphoto-kr/**"
  - "monkos_AI/idphoto-jp/**"
  - "monkos-ops/works/idphoto/**"
  - "monkos-ops/works/portal_v4/**"
---

# 포털 + SEO 집중 작업 컨텍스트

> 이 파일은 포털/증명사진 서비스 파일 접근 시 자동 로딩된다.

## 현재 상태

- **포털**: v3 실서비스 (rev 00133, 100% 트래픽) / v4 preview 유지 (rev 00141, 0% 트래픽)
- **v4 차단 이슈**: 컨텐츠 카드 인터랙션 미동작 → 롤백 상태
- **SEO**: hreflang 양방향 완료 (2026-03-14), 포털 한국어 기본 전환 완료

## 서비스 도메인 맵

| 서비스 | 도메인 | 인프라 |
|--------|--------|--------|
| 포털 | monkos.ai | Cloud Run (Express) |
| 증명사진 KR | idphoto-kr.monkos.ai | Cloud Run |
| 증명사진 JP | idphoto-jp.monkos.ai | Cloud Run |
| monk.kr | monk.kr | CF Pages (정적) |

## 포털 v4 파일 구조

```
monkos_AI/portal/
├── public/
│   ├── index.html          ← v4 진입점 (265줄, lang="ko")
│   ├── css/portal.css      ← v4 스타일 (625줄, 라이트 테마)
│   ├── js/
│   │   ├── i18n.js         ← 다국어 + 리전 감지
│   │   ├── auth.js         ← Google GIS OAuth
│   │   ├── credits.js      ← 크레딧/결제
│   │   ├── chat.js         ← 챗봇
│   │   └── main.js         ← 초기화 + 이벤트
│   ├── admin/              ← CMS 관리 패널 (blog, board, faq, gallery)
│   └── backup/v3/          ← v3 원본 백업
├── lib/
│   ├── cms/render.js       ← SSR 렌더러 (fragment 분리 완료)
│   ├── cms/blog.js, board.js, faq.js, gallery.js
│   ├── auth.js, credits.js, payments.js
│   └── shared/config.js
└── server.js               ← Express 서버
```

## SEO 현황

- hreflang: 포털(ko) ↔ JP(ja) 양방향 완료
- og:locale: ko_KR (포털, KR) / ja_JP (JP) 설정 완료
- canonical: 각 서비스 자체 도메인
- 포털 파비콘: Google 검색 결과에서 미노출 (미해결)

## 미해결 이슈 (코웍이 점검 기준)

1. `/pricing` 404 — nav에서 JS 인터셉트인데 JS 로드 전/직접 접근 시 404
2. `/guide` 404 — 라우트 미존재
3. `/blog` 데이터 끊김 — 홈에 정적 목업 4건, /blog는 Firestore 읽기인데 데이터 없음
4. 히어로 CTA 부재 — 촬영실 앱에는 있고 포털에는 없음
5. Before/After 갤러리 플레이스홀더 — 실 사진 미적용
6. 블로그 썸네일 크기 부족

## 기술 참조

- v4 기술명세: `monkos-ops/tech/architecture/PORTAL_V4_TECHNICAL_SPEC.md`
- 코웍이 UI 점검: `monkos-ops/ops/cowork/2026-03/REPORT_20260314_코웍이_v4preview_비로그인영역_UI점검.md`
- 에디터 설계 논의: `monkos-ops/ops/cowork/2026-03/REPORT_20260314_코웍이_콘텐츠통합에디터_설계배경_맥락전달서.md`
