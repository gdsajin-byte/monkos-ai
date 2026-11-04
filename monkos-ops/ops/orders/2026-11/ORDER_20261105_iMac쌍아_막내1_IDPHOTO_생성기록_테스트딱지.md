---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/쌍아-막내1
subject: 생성 기록(generations)에 테스트 딱지 — 저장 시 originService·isTest 필드를 남기고, 어드민 생성 검토 화면에 '테스트' 배지와 기본 숨김 필터를 둔다. dev까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — 생성 기록 테스트 딱지

**[2026-11-05 04:34 KST]** iMac/쌍아 → iMac/쌍아-막내1

출처: 작가님 2026-11-05 iMac 쌍아 세션 사람 턴.
- 04:31 어드민 생성 기록 캡처를 보시고 "이 사람들 뭐지 미국 공무원들같은데"라고 물으셨다. 확인해 보니 11-04 14:19 막내1의 Wikimedia 공개 사진 dev 시험(kr-passport 무료, 익명)이 prod 어드민에 섞여 보인 것이다.
- 04:34 "테스트 딱지 붙이는건 찬성".

범위 승인은 §1·§2(구현·dev)까지다.

## 0. 원인
- dev와 prod 포털은 같은 Firestore `generations` 컬렉션을 쓴다. 저장은 `lib/gcs-save.js` `saveImages`(genDoc 41~56행)가 한다.
- genDoc에는 어느 서비스에서 왔는지, 시험인지를 가리는 필드가 없다.
- 어드민 화면은 `public/admin/idphoto-review.html`, API는 `lib/cms/idphoto-review.js`(service 필터·createdAt 정렬)다. 둘 다 시험 기록을 구분하지 못한다.

## 1. 바꿀 것
1. **저장 필드** — genDoc에 두 필드를 넣는다.
   - `originService: process.env.K_SERVICE || null`
   - `isTest: boolean`. 아래 둘 중 하나면 true다.
     - (a) K_SERVICE가 `-dev`로 끝난다.
     - (b) 요청에 시험 표시가 있고, 그 요청이 관리자 인증(`requireAdmin`과 같은 AGENT_API_KEYS 체계)을 통과했다. 이 경우는 prod에서 에이전트가 시험할 때를 위한 것이다.
   - (b)의 표시 이름과 전달 경로(헤더·바디)는 기존 패턴을 보고 정하고, 근거를 남긴다. 인증 없이 표시만 붙은 요청은 무시한다. 고객이 자기 기록을 숨기는 통로가 되면 안 된다.
   - `saveImages` 호출부(server.js, headshot-route.js 등)가 req 정보를 넘겨야 하면 extras로 전달한다. 호출부는 전수 grep으로 찾는다.
2. **어드민**
   - 목록에서 `isTest`이거나 `originService`가 `-dev`로 끝나면 '테스트' 배지를 단다.
   - 상단에 "테스트 포함" 토글을 두고, **기본은 숨김**으로 한다.
   - 서버 쪽에서 거른다(where 조건이나 limit 보정). Firestore 복합 색인이 필요하면 멈추고 보고한다. 색인 생성은 prod 설정 변경이다.
3. **과거 기록**: 필드가 없는 기존 문서는 손대지 않는다. Firestore 일괄 쓰기 금지(ch4 10조).
   - 11-04 14:19 시험 건처럼 시각으로 특정할 수 있는 과거 시험 기록은 목록(문서 id·시각·건수)만 COMPLETION에 남긴다.
   - 처리 방식은 쌍아가 정한다.
4. **집계 소비처 점검**: `generations`를 세는 다른 곳(대시보드·통계·브리핑)을 grep으로 찾아 표로 정리한다. 이번에는 고치지 않고 표만 만든다.

## 2. 검증
- 단위 테스트: isTest 판정 4가지(dev 서비스 / prod+인증+표시 / prod+표시만 / prod 일반).
- 포털 전체 테스트를 돌린다.
- dev 배포(`deploy.sh dev`) 후 공개 사진 1회 생성 → 새 문서에 `originService`가 dev 값이고 `isTest:true`인지 확인한다(읽기만).
- 어드민 dev 화면 확인: 기본 숨김, 토글하면 배지가 붙어 보인다.

## 3. ⚠️ 준수 조항
- ch4 10조: 기존 고객 데이터 쓰기·삭제 0. 새 문서에 필드를 더하는 것만 허용한다.
- 고객 데이터: 고객 사진·이름을 레포·로그·메시지에 쓰지 않는다. 시험에는 공개 사진만 쓴다.
- ch5: 작업은 dev까지다. prod는 작가님 '배포 승인' 사안이다. 엣지 영향이 있는지 판정표에 적는다.
- 헌법 4조 1·2항: 시크릿 생성·추측 금지, 파괴 금지.
- 헌법 3조 1·2항: `date` 실측, 세션 로그·완료 보고·PF_IDPHOTO 1행.
- ch1 7조: 설치 금지.
- 푸시: SSH 장애가 계속되면 HTTPS 1회성 푸시를 쓴다(직전 지시서와 같다).

## 4. 완료 기준
- [ ] 저장 필드 2개 + 인증된 시험 표시 + 테스트
- [ ] 어드민 배지·기본 숨김 토글
- [ ] 과거 시험 기록 목록(수정 없음) + 집계 소비처 표
- [ ] dev rev + 실호출 1회 + 어드민 확인
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261105_iMac쌍아-막내1_IDPHOTO_생성기록_테스트딱지.md`, 브랜치 푸시·origin SHA 대조

## 5. 커밋 메시지
- `[feat] 생성 기록 테스트 딱지 — originService·isTest·어드민 기본 숨김 (PF_IDPHOTO)`
