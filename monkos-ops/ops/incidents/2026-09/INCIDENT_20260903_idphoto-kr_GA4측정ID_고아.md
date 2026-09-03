---
type: incident
date: 2026-09-03
service: idphoto-kr (+ studio·portal 이중 config)
severity: P1 (데이터 유실 — 서비스 영향 없음)
device: iMac
agent: 민아
status: 원인 확정 · 수정 승인 대기
portfolio: PF_IDPHOTO
related: PF_ANCHOR(G-M1)
---

**[2026-09-03 12:15 KST]** iMac/민아 → 작가님

## 증상
idphoto-kr 앱 이벤트(spec_select·photo_upload·generate_click·begin_checkout·purchase)가 **2026-06-14부터 GA4 속성 521406894에 미도달.** 속성 실측(hostName idphoto-kr.monkos.ai): 5월 667u · 6월 433u → 7월 4u · 8월 2u. 브리핑은 이를 3주간 "생성 0"으로 읽음.

## 원인 (확정)
1. **03-14 `def0074a`** — 철창이 분석("Ads 전환 태그 미설치")을 근거로 `G-FKG0CPTC14`를 31파일에 긴급 삽입. Ads 전환 태그는 AW- ID이며 G- ID는 GA4 속성 ID → **전제 오류. FKG는 작가님 계정 어디에도 없는 ID**(09-03 작가님 실측: 애널리틱스 계정 1개·속성 1개 monkos-3c6e4 / Google 태그 3개 = C2H9·JPZW·AW-17916950287. 검색 FKG 0건).
2. **06-14 교차오염 수정** — "KR=FKG, JP=JPZ"로 단일화하며 idphoto-kr에서 정상 ID(JPZ)를 제거. 감사 보고서 R-1의 "쌍아 1차 확인" TODO 미이행. 검증은 collect **204** 응답으로 "정상" 판정 — 204는 존재하지 않는 ID에도 반환됨(능력은 시켜봐야 안다: 수신 속성에서 실데이터로 판정했어야 함).
3. 06-14~09-03 **81일**간 idphoto-kr 이벤트 전량 소실(회수 불가 — 수신 속성 부재).

## 영향
- G-M1 퍼널 판정의 idphoto-kr 축 공백 81일. 08-25 브리핑 "표면 분리 불가" 진단의 실체 일부.
- 서비스·결제·고객 영향 0 (계측만).
- studio(11파일)·portal(6+render-shell 1)은 JPZ+FKG 이중 config라 데이터는 도달, FKG 쪽 전송만 낭비.

## 수정안 (승인 대기 — prod 3서비스)
| # | 대상 | 변경 | 배포 |
|---|---|---|---|
| 1 | idphoto-kr 12파일 | 로더 `id=G-FKG0CPTC14` → `G-JPZWSJ3323`, `gtag('config','G-FKG0CPTC14')` → JPZ | idphoto-kr prod |
| 2 | studio 11파일 · portal 6파일 · render-shell.js | FKG config 라인 제거(JPZ 단독) | studio·portal prod |
| 3 | 검증 | 배포 후 GA4 실시간/DebugView에서 hostName idphoto-kr 이벤트 수신 실측(204가 아니라 **속성 도달**로 판정) + 익일 브리핑 host별 표에 idphoto-kr 행 복귀 | — |
| 4 | 재발 방지 | 측정 ID 정본을 `references.md`에 등재(JPZ=MONKOS AI 스트림, C2H9=monk.kr, AW-17916950287=Ads). 신규 ID는 관리 UI 실측 없이 코드 삽입 금지 | 규정 |

## 교훈
- 외부 분석(철창이=코드·계정 접근 없음)이 제시한 **식별자**는 실측 전 코드에 넣지 않는다.
- collect 204 ≠ 수신. 수신 속성 실데이터가 유일한 증거.
- 감사 보고서의 "확인 TODO"가 미이행인 채 수정이 실행되면 감사가 사고를 확정한다.
