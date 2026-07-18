---
type: completion
date: 2026-07-18
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: 크롭 엔진 통합수선 보완 패치

**[2026-07-18 14:48 KST]** iMac/막내2 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260718_iMac쌍아_막내2_크롭엔진_보완패치.md`

## 작업 결과

### ✅ 1. vn headHeight 범위 제거 (P0)
- specs-data.json: vn-passport, vn-visa의 headHeightMin/Max 필드 삭제
- spec-crop.js: 명시값이 텍스트 파싱 범위 밖일 때 범위를 자동 확장 (자기모순 구조적 방지)

### ✅ 2. T1 실패 응답 정비
- server.js: `code: 'T1_GENERATE_FAILED'` 필드 추가
- 4언어 메시지에 "크레딧은 소모되지 않았습니다" 안내 추가
- specs-funnel.js: `lang` 파라미터 generate 요청에 추가 + `T1_GENERATE_FAILED` code 분기 추가

### ✅ 3. bg 3언어 텍스트 정리
- 회색 12슬러그: backgroundEn="Gray", backgroundJa="グレー", backgroundEs="Gris"
- de-passport: background="회색" (유저 대면 카피 정리) + matte.js BG_OVERRIDE 슬러그 오버라이드 #CCCCCC
- jm 2슬러그: backgroundEn="Varies", backgroundJa="多様", backgroundEs="Variado"

### ✅ 4. 경고 배너 렌더링
- render-specs.js: 히어로 아래에 경고 배너 삽입
  - onsite: 📍 + warning 텍스트 (4언어)
  - warning: ⚠️ + warning 텍스트 (4언어)
  - digitalOnly: 💻 + "디지털 사진만 허용" (4언어)

### ✅ 5. jest 정비 + 전량 녹색
- matte.test.js: 안착 가드 → warn-only 반영 (전 범위 true 기대)
- spec-crop.test.js: 커버 크롭 → FACE_NOT_DETECTED 에러 기대 + headHeight 전수 테스트 명시값 슬러그 예외
- spec-crop-consistency.test.js: vn 범위 확장으로 자동 해소
- **11 suites, 105 tests, 0 failures**

### ✅ 비고: JSDoc 'facemesh' 잔존 3곳 정리

## 배포

| 서비스 | 리비전 | 상태 |
|--------|--------|------|
| portal | monkos-portal-00504-pt9 | ✅ 100% 트래픽 |

## 변경 파일

- portal/server.js: T1 code 필드 + 메시지 보완
- portal/lib/matte.js: BG_OVERRIDE + JSDoc 정리
- portal/lib/spec-crop.js: 명시값 범위 확장 + JSDoc 정리
- portal/lib/spec-judge.js: (변경 없음)
- portal/lib/cms/render-specs.js: 경고 배너 삽입
- portal/lib/cms/specs-data.json: vn 범위 제거 + bg 3언어 + 기타
- portal/public/js/specs-funnel.js: lang 전달 + T1 code 분기
- __tests__/matte.test.js, spec-crop.test.js: 테스트 현행화
