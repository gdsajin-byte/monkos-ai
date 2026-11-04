---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/쌍아-막내8
subject: specs 유니크 콘텐츠 본문 모바일 가독성 1안 — 640px 이하에서 카드 제거·여백 16px·본문 16.5px·요약 17px(세로 막대 제거). CSS만, 데스크톱 불변. dev까지, prod는 검색 제목 시험과 같은 엣지 배포
status: 대기
portfolio: PF_SPECS
---

# ORDER — specs 모바일 본문 가독성 1안

**[2026-11-05 05:26 KST]** iMac/쌍아 → iMac/쌍아-막내8

출처: 작가님 2026-11-05 iMac 쌍아 세션 사람 턴.
- 05:20 캡처와 함께: "시인성이 너무 떨어져. 폰트도 작고 내용이 많은데 2중 컨테이너라 여백이 너무 많고"
- 쌍아 비교 시안: `monkos-ops/tech/designs/2026-11/DESIGN_20261105_iMac쌍아_SPECS_본문가독성_시안.html`
- 05:24 쌍아 순서 제안: 1안 먼저, 다크 테마는 별도 시안
- 05:25 작가님 "ㅇㅇ 진행"

범위 승인 = §1·§2(구현·dev).

## 1. 바꿀 것
`monkos_AI/portal/public/css/specs-funnel.css` 364~368행(`.v2-uc-*`)에 `@media (max-width: 640px)` 블록을 추가한다. 데스크톱 값은 바꾸지 않는다.

| 대상 | 640px 이하 값 |
|---|---|
| `.v2-uc-block` | 테두리·배경·둥근 모서리 제거, 안쪽 여백 0. 블록 사이는 `border-top: 1px solid #e7e5f0` + `padding-top: 20px`로 구분(첫 블록 제외) |
| `.v2-wrap` | 모바일 좌우 여백 16px. 다른 섹션이 이 값에 기대고 있으면 `.v2-uc-section`에만 음수 마진 같은 우회를 쓰지 말고, 영향 범위를 확인한 뒤 보고한다 |
| `.v2-uc-block h2` | 22px, `text-wrap: balance` |
| `.v2-uc-answer` | 17px, 왼쪽 세로 막대 제거, 둥근 모서리 10px 전체, 안쪽 여백 14px 16px |
| `.v2-uc-p` | 16.5px, 줄 간격 1.72, `word-break: keep-all` |

- 문안(요약 문장)은 바꾸지 않는다. 2안은 범위 밖이다.
- 같은 이중 컨테이너 패턴이 있는 다른 specs 섹션(v2-same·FAQ 등)이 있으면 목록과 캡처만 보고한다. 고치지 않는다.

## 2. 검증
- 375px·390px 폭 캡처 전/후: 미국 비자(`/specs/visa/us`), 한국 여권, en 1페이지. 데스크톱 1280px 캡처로 불변 확인.
- 가로 스크롤 0, 표·이미지 넘침 0.
- SSG 빌드, 포털 테스트.
- dev 배포 후 확인한다. 공유 브라우저는 새 탭만 쓴다.

## 3. ⚠️ 준수 조항
- ch5: dev까지. prod는 엣지 재배포 대상이다(specs CSS). 검색 제목 시험(892fbc87)과 한 번에 배포하므로, 배포 판정표에 두 건을 합쳐 적는다. 작가님 '배포 승인' 사안이다.
- 헌법 4조 1·2항(시크릿·파괴 금지), 3조 1·2항(`date` 실측·세션 로그·완료 보고·PF_SPECS 1행), ch1 7조(설치 금지).
- 검색 제목 시험 기간에는 `seo-headterm-regen.mjs` 실행 금지(시험 기록과 같다).

## 4. 완료 기준
- [ ] CSS 반영 + 전/후 캡처(모바일 3 · 데스크톱 1)
- [ ] 이중 컨테이너 다른 섹션 목록
- [ ] dev rev + 확인
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261105_iMac쌍아-막내8_SPECS_모바일본문가독성.md`, 브랜치 푸시·origin SHA 대조

## 5. 커밋 메시지
- `[feat] specs 모바일 본문 가독성 — 카드 제거·글자 확대 (PF_SPECS)`
