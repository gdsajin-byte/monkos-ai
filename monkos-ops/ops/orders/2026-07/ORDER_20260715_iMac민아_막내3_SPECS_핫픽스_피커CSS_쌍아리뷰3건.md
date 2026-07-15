---
type: order
date: 2026-07-15
from: iMac/민아
to: iMac/막내3
subject: prod 핫픽스 — attire-picker CSS 로드 + 쌍아 리뷰 P1 3건 (소수정 4건 일괄)
status: 대기
portfolio: PF_SPECS
---

# 지시서: prod 핫픽스 4건 (피커 CSS + 쌍아 리뷰 반영)

**[2026-07-15 17:51 KST]** iMac/민아 → iMac/막내3

> 작가님 실캡처로 prod 피커 레이아웃 깨짐 확인 → 원인 실측 완료(민아). 롤백 아닌 핫픽스 결정(작가님). 전부 소수정 — 1커밋 일괄, dev 확인 후 **prod까지 승인됨**.

## 수정 4건

1. **attire-picker.css 로드** — [render-specs.js:642](../../../../monkos_AI/portal/lib/cms/render-specs.js) 부근에서 JS만 로드 중. `<link rel="stylesheet" href="/components/attire-picker/attire-picker.css?v=${ASSET_VER}">`를 head(seoMeta 체인 또는 specsCssLink 패턴)에 추가. **깨짐의 전부가 이 1줄** — 카드 그리드·이미지 크기 정상화 예상. dev에서 T1 의상 패널 육안 확인 필수(업로드→무료생성→アップグレード 진입).
2. **크로스셀 언어 prefix** — [components/related-services.js:10](../../../../monkos_AI/portal/lib/cms/components/related-services.js) `href="/headshot"`·`href="/"` → ctx의 prefix 적용(`${prefix}/headshot` 등). /ja/blog 기존 패턴 준용.
3. **SPECS_I18N 폴백 체인** — `SPECS_I18N[lang] || SPECS_I18N.ko` 전 지점(render-specs.js 112·214·378 부근, L0 후 라인 이동 가능 — grep으로) → `SPECS_I18N[lang] || SPECS_I18N.en || SPECS_I18N.ko`.
4. **tokens.css 연결** — 파일 존재하나 link 0건. specs 페이지 head에 link 추가(또는 specs-funnel.css 상단 @import — 요청 1회 줄이려면 import 권장).

## 완료 기준

- [ ] dev에서 ja 페이지 T1 의상 패널 정상 레이아웃 (전후 스크린샷)
- [ ] ja 페이지 크로스셀 링크 href="/ja/headshot" 확인
- [ ] 기존 ko/en/ja 3언어 렌더 회귀 없음 (지문: title·lang·CTA 불변, link 태그 2행 추가만)
- [ ] prod 배포(`./deploy.sh` prod) + prod ja 페이지 실측
- [ ] COMPLETION + 세션로그 + PF 히스토리

## ⚠️ 준수

- ch5 deploy.sh 경유 / 시크릿 미접촉 / specs-data.json 접촉 금지(막내2 ES 후속 작업 관할)
