---
type: completion
date: 2026-07-12
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# COMPLETION — render-specs 퍼널 분리 수술 (CSS/JS 정적 추출 + 캐시 정책)

**[2026-07-12 18:07 KST]** iMac/민아 → 작가님 (사후 추인: 쌍아)

> 지시 (2026-07-12 17:51, 경로③ 작가님 직접): "너가 직접 처리해, 사후 추인한다, 완벽하게 작업해" — 렌더 비대화 진단(4,163줄·2주 52커밋·인라인 127KB) 및 다국어 확장 스케일 산정(15언어 크롤 218MB/회전) 후 승인된 수술.

## ✅ 수술 결과

| 지표 | 전 | 후 | 감량 |
|------|-----|-----|------|
| render-specs.js | 4,163줄 / 217KB | **1,749줄 / 90KB** | **-58%** |
| kr-passport HTML | 127.0KB (gzip 34.1) | **36.4KB (gzip 10.3)** | **-71% (gzip -70%)** |
| 비파일럿 상세(us) | 118.8KB | 28.2KB | -76% |
| 크롤 1회전(15언어 ~6,400p 환산) | ~218MB | ~66MB | **-70%** |

## 📁 방출 (신규 5파일 + 배선 2파일)

| 파일 | 규모 | 원본 |
|------|------|------|
| public/css/specs-base.css | 607줄 | SPECS_PAGE_STYLE (리스트+v1 상세 공용) |
| public/css/specs-funnel.css | 408줄 | SPECS_V2_STYLE |
| public/css/specs-pilot.css | 60줄 | IDPASS_PILOT_STYLE (+취지 주석 승계) |
| public/js/specs-list.js | 110줄 | 리스트 pageScript (위저드: 용도→대륙→국가) |
| public/js/specs-funnel.js | 1,230줄 | 상세 pageScript (퍼널 전체: 업로드→핏→피사체·의상→결제→결과) |
| lib/cms/render-specs.js | 재구성 | CFG만 인라인 주입(`__SPECS_CFG__`/`__SPECS_LIST_CFG__`), link+defer src 배선, ASSET_VER |
| server.js:1167 | +3줄 | `/{js,css}/specs-*` → `max-age=31536000, immutable` (?v=K_REVISION 버스트) |

- 방식: 마커 기반 기계 추출(스크립트) — 블록 내용 비트 보존, 치환은 보간 3라인만(CFG·hubData·countriesLabel 전역화). 매치 개수 검증·잔존 참조 검사로 이상 시 즉시 중단(1회 중단→파일럿 주석 경계 보정 후 재실행).
- 실행 순서 보존: 인라인 CFG(파싱 시) → defer 퍼널 JS(DOM 완성 후) = 원본 body 끝 IIFE와 등가.

## ✅ 검증 (5축)

1. **HTML diff 감사** — 수술 전/후 kr-passport 비교: 추가 라인이 설계된 4줄뿐(link×2·script src·CFG 인라인), 제거는 인라인 블록 전량. 비파일럿(us)은 원본도 pilot 스타일 포함(T0 전면 개방으로 isPilot 확대) — 등가 확인. v1 페이지(en)는 base.css 링크 정상.
2. **jest 10스위트/103 전체 통과** — render-specs-v2-ga.test.js는 검사 지점을 pageScript→specs-funnel.js(정적)로 이관(검증 의도 불변, CFG 주입·배선 검사 2건 순증 101→103).
3. **실주행(브라우저)** — kr-passport: CFG 로드·드롭존·funnel/pilot CSS 시트·defer 스크립트 태그 전부 확인, 콘솔 에러 0. 리스트: 검색 "미국" 3건 매치 + 용도→대륙→**국가 그리드 32장 렌더**(주입 hubData 소비 실증). 시각 렌더 무결(스크린샷).
4. **정적 서빙** — 5파일 전부 200 + `public, max-age=31536000, immutable` 헤더 적중.
5. **병렬 트랙 무결** — 수술 베이스(fb5cbe22)→쌍아 마감(ce4db337) 사이 portal 변경 0 확인. 막내1 금일 커밋 전량(피사체 칩·인라인화·1:1 비율·sessionStorage) 수술 결과에 보존.

## 💡 효과·후속

- 다국어 확장 대비: 퍼널 JS/CSS는 언어 중립 1벌 — en·ja 개방(이월 #15) 시 언어별 비용은 문구 사전(CFG)뿐. **개방 전 선행 조건 충족.**
- 협업: 퍼널 수정=정적 JS, SSR 수정=렌더 — 충돌 표면 물리 분리 (금일 경합 유형 소멸).
- 후속(비긴급): ① render-headshot 개편 시 specs-funnel 재사용(복제 금지) ② guides 51MB GCS 이관(이월 #9)과 결합 시 컨테이너 추가 경량화 ③ 리스트 hubData(인라인 JSON 잔존, ~80KB)는 규격 데이터라 SSR 성격 유지 — 필요 시 별도 검토.

## 🔀 사후 추인 요청 (쌍아)

- 본 수술은 쌍아 설계 트랙(경로①) 사안을 작가님 직접 지시(경로③)로 민아가 실행한 건 — ch1 2조 ③항 사후 보정 절차에 따라 쌍아 검토·추인 요청.
- 검토 포인트: ①ASSET_VER=K_REVISION 캐시 버스트 전략 ②GA 테스트 검사 지점 이관 ③배포 타이밍(다음 dev 배포에 동승 권장 — prod 승격 전 dev 실주행 1회).
