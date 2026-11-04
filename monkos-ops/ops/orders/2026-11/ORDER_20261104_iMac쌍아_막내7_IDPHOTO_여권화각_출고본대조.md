---
type: order
date: 2026-11-04
from: iMac/쌍아
to: iMac/쌍아-막내7
subject: 여권 화각 실측 대조 1차 — 오늘 prod 반영한 두상 재배율 산식(00578)을 사진관 여권 출고본 200건과 로컬에서 비교(두상 mm·눈 %·머리 위 여백·턱 아래), 고객 픽셀 외부 반출 0
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — 여권 화각 vs 실제 출고본 대조 (1차 200건)

**[2026-11-04 19:07 KST]** iMac/쌍아 → iMac/쌍아-막내7

출처: 작가님 2026-11-04 iMac 쌍아 세션 사람 턴 — 14:14 "너무 자주 수정해서 원칙이 깨진 거 아닌가" · 19:06 "다음 안건" → 쌍아 추천(여권 화각 실측 대조, 투두 8) → 19:07 "둘다 처리해". 범위 승인 = 본 문서 §2.

## 0. 먼저 읽기
- 오늘 반영한 산식: `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내1_IDPHOTO_여권두상_33mm재배율.md`(§2 재배율 순서·§4 표) + 코드 `monkos_AI/portal/lib/hair-measure.js`(`resolveHeadPlacement`·덩어리 머리끝) · `server.js` precheck 판정부.
- 짝 데이터: `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내5_IDPHOTO_사진판별P0.md` + 코드 `AI_Factory/photo_judge/`(register_pairs.py — RAW↔규격 완성본 정합, 오차 p50 2.8px). 매니페스트·경로 매핑은 레포 밖 `~/.monkos/photo_judge/`.

## 1. 원칙 (고객 데이터)
- **고객 원본·출고본 픽셀은 iMac·시놀로지 밖으로 나가지 않는다.** dev/prod 포털 API에 고객 사진을 올리지 않는다. 산식은 **로컬에서** 실행: 포털 함수(`resolveHeadPlacement` 등)를 node로 직접 호출 + 얼굴 랜드마크·매팅은 로컬 경로(crop-engine 로컬 실행 또는 동등 로컬 측정, 매팅은 iMac 로컬 vision-matte `127.0.0.1` 또는 같은 마스크 산출 방식). 선택한 로컬 구성과 prod와의 차이(매팅 엔진 등)를 COMPLETION에 명시.
- 레포·로그·메시지에 고객 이름·폴더명·사진 설명 금지. 가명 id(P0 매니페스트)·수치만. 임시 이미지는 레포 밖, 끝나면 삭제.

## 2. 할 일
1. **표본**: P0 매니페스트에서 하남 시대 `spec_final` 용도=여권(kr-passport 규격) + 정합 성공 짝 중 **200건**(연도·월 분산, 시드 고정).
2. **정답 측정**(출고본): 정합으로 얻은 출고 크롭 상자(원본 좌표) → 규격 프레임(35×45mm) 기준 **두상 mm(턱~머리 덩어리 끝)·거울상 두상 mm·눈 위치 %·머리 위 여백 mm·턱 아래 mm**. 랜드마크·머리끝은 원본에서 한 번 측정해 출고 상자와 산식 상자 양쪽에 같은 값을 쓴다(측정 오차가 비교를 오염하지 않게).
3. **산식 측정**: 같은 원본에 오늘 prod 산식(재배율·얼굴 하한 가드·여백 0.5mm+2행·눈 ≤48%)을 적용한 프레임 → 같은 지표 + 판정(pass/moved/no_room).
4. **대조 표**: 지표별 차이 분포(중앙값·p10·p90), 산식이 출고보다 크게/작게 잡는 경향, `no_room` 판정이 난 출고본 수(사진관은 출고했는데 산식은 막는 경우 = 오판 후보), 그 반대(산식 통과인데 출고 크롭과 크게 다른 경우).
5. **해석 한 단락**(판정은 쌍아): 오늘 산식이 사진관 실무(작가님·꾸의 크롭)와 어디서 갈리는지 — 수치로만.

## 3. ⚠️ 준수 조항
- 개인정보(§1) 최우선. 시놀로지 읽기 전용.
- ch1 7조: 패키지 설치 금지(iMac python numpy·PIL·cv2·scipy, node 기존 의존성만). crop-engine 로컬 실행에 설치가 필요하면 멈추고 보고.
- 헌법 4조 1·2항, 3조 1·2항: 시크릿·파괴 금지, `date` 실측, 세션 로그·완료 보고·PF_IDPHOTO 히스토리 1행.
- 서비스 코드 수정 없음(측정 스크립트만 `AI_Factory/photo_judge/` 아래).
- GitHub SSH 간헐 거부 중 — 푸시 실패 시 `git -c credential.helper= -c credential.helper='!gh auth git-credential' push https://github.com/gdsajin-byte/monk_project.git <브랜치>` 1회성(설정 변경 금지).

## 4. 완료 기준
- [ ] 로컬 측정 스크립트 + 실행법(README 절)
- [ ] 200건 대조 표·차이 분포·오판 후보 건수
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내7_IDPHOTO_여권화각_출고본대조.md`, 브랜치 푸시·origin SHA 대조

## 5. 커밋 메시지
- `[research] 여권 화각 산식 vs 출고본 200건 대조 (PF_IDPHOTO)`
