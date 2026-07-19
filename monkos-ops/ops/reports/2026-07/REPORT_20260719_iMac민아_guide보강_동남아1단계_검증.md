---
type: report
date: 2026-07-19
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# 검증 게이트 보고 — guide/ai-photo 보강(00517) + 동남아 id/vi 1단계(00518) : **통과 (P1 보완 1건)**

**[2026-07-19 18:55 KST]** iMac/민아 → 작가님, iMac/쌍아

> 대상: 막내1 b93fd5ba(guide 보강) + 막내2 da24c9f8(동남아 id/vi + EN kr-visa 메타), prod **00518-brg**
> 방법: diff 리뷰 + 라이브 curl 전수 + 인니어 퍼널 실주행 + jest

## 판정 요약

| 항목 | 결과 |
|------|------|
| id/vi 핵심 4 URL | ✅ 200 + **현지어 타이틀이 실측 롱테일 정조준** — "Foto Visa Korea Selatan·Ukuran·Persyaratan" / "Ảnh Visa Hàn Quốc·Kích thước" (금일 키워드 리포트 표현 그대로) |
| 인니어 퍼널 실주행 | ✅ 업로드→precheck→fit 도달, **UI 전면 인니어** (Pemeriksaan foto selesai·Buat gratis·Hapus latar) |
| hreflang | ✅ 전 specs에 id·vi 추가 (ko/en/ja/es/id/vi + x-default) |
| EN kr-visa 메타 보강 (quick win 번들) | ✅ "South Korea Visa Photo Size & Requirements 2026 — Free AI Generator" — 본토 영어 9위 쿼리 정조준 개편 |
| 확장 방식 | ✅ LANGS 전역 추가 — 전 429슬러그 프로그램matic id/vi 렌더 + 커스텀 seo 8슬러그×2언어. 롱테일 스프레이 지형에 정합한 설계 |
| guide/ai-photo | ✅ ko/en/ja 200 · 429 규격 반영(11~12 언급) · 이미지 정상(200) |
| 리그레션 | ✅ ko·en 기존 페이지 무영향, jest 105/105 |

## P1 — id/vi 사이트맵 공백 (보완 필요)

- **현상**: id/vi URL(858+)이 등재된 사이트맵은 **총합본(sitemap-specs.xml)뿐** — 그런데 총합본은 금일 GSC 등록 해제 + 인덱스 참조 제거됨. 즉 **구글에 id/vi URL을 알리는 공식 경로가 현재 없다** (hreflang alternate 발견에만 의존).
- **원인**: da24c9f8이 총합본 생성 루프에만 id/vi를 추가 (`['ko','ja','en','es','id','vi']`), 언어별 사이트맵 라우트·인덱스는 4언어 유지.
- **처방** (소형): ① server.js에 `/sitemap-specs-id.xml`·`/sitemap-specs-vi.xml` 라우트 2줄 ② 인덱스에 2줄 등재 ③ 배포 편승 ④ GSC 사이트맵 등록 원탭 2건(작가님). 동남아 색인이 본 작업의 목적이므로 **다음 배포 전 필수**.

## P2 — typeName 미번역 혼입 (차기)

- 예: `/id/specs/resume/kr` 타이틀 "South Korea **Half-size Portrait** Spesifikasi" — 문서 타입명 일부가 영문 폴백. id/vi typeName 사전 보완으로 해소 (품질 얼룩, 기능 무해).

## 결론

양 트랙 통과. 특히 동남아 1단계는 **아침의 수요 실측(자동완성 1위·720/월) → 저녁의 현지어 라이브 퍼널**까지 하루에 닫힌 사례 — 방향 제안서의 "깔고→측정" 루프 1호 케이스가 됐다. P1(사이트맵 2종)만 다음 배포에 태우면 색인 경로까지 완결된다. 성과 관찰은 국가×free_generate_done 축으로 주간 계측(4주 게이트: 유입 0이면 색인·hreflang 재점검).
