---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내1
portfolio: PF_SPECS
status: 대기
priority: P0
prerequisite: ORDER_20260719_iMac쌍아_막내2_SPECS_V1소각_유색게이트개방.md
---

# 지시서: V1 소각 P0 핫픽스 — funnel JS 즉사 + cn-resume 게이트

**[2026-07-19 12:32 KST]** iMac/쌍아 → 막내1

## 배경

V1 소각(f8d392b5) 후 민아 검증에서 P0 반려. 유색 6페이지 업로드 후 화면 멈춤. 원인:

1. **specs-funnel.js:520** — `ip-t1-buy` 버튼 바인딩이 무조건 실행되나, A5 게이팅으로 T1 카드 마크업이 통째로 빠진 유색 페이지에서 null 참조 즉사 → 아래 안착 시어터·생성·결제 로직 전체 미평가
2. **cn-resume** — 규격 파싱 불가(size 복수)인데 isEngineCompatibleSpec이 사문화돼 퍼널이 열림 → 무규격 Gemini 출고 경로 발생

추가: 막내2의 om 흰색 교정(022633bd)이 00511 빌드 이후 커밋이라 라이브 미반영 — 본건 재배포에 편승.

- 민아 반려 보고: 24ac635f

## ⚠️ 준수 조항

- deploy.sh 경유 배포 필수
- jest 녹색 필수
- 수정 후 유색 페이지(kw-visa, om-visa, id-passport) 업로드 실작동 + kr-passport 대조군 정상 확인

## 작업

### Task 1. specs-funnel.js:520 null 가드

`ip-t1-buy` 버튼 바인딩 부분에서 요소가 존재하지 않으면 스킵하도록 null 체크 추가. T1 카드가 없는 페이지에서 아래 로직이 정상 진행되어야 함.

```javascript
const t1BuyBtn = document.getElementById('ip-t1-buy');
if (t1BuyBtn) {
  // 기존 t1 바인딩 로직
}
```

520행 부근뿐 아니라 **T1 카드 요소를 참조하는 모든 곳**을 grep하여 동일 가드 적용. 누락 시 다른 페이지에서 같은 증상 재발.

### Task 2. cn-resume 퍼널 차단

cn-resume는 size가 "1寸(25×35mm)/2寸(35×49mm)" 복수 규격이라 파싱 불가 → `isEngineCompatibleSpec`이 false를 반환해야 하는데, 현재 게이트가 사문화됐는지 확인.

- `isEngineCompatibleSpec`에 cn-resume가 걸리는지 실측 (size 파싱 m이 null이면 false 반환이므로 원래 차단돼야 함)
- 만약 열려 있다면: cn-resume를 명시적으로 V2 제외하는 가드 추가
- isV2Spec 호출이 0이라는 민아 지적 확인 — 호출 경로가 살아 있는지 grep

### Task 3. 테스트 + 배포

```bash
npm test
./deploy.sh
```

om 흰색 교정(022633bd)도 이 배포에 편승 반영됨.

### Task 4. 라이브 검증

배포 후 직접 확인:
- kw-visa, om-visa, id-passport: 사진 업로드 → 안착 시어터 진입 → T0 생성 정상 진행
- kr-passport: T1 카드 노출 + 전 퍼널 정상 (대조군)
- cn-resume: 퍼널 미진입 (정보 페이지 유지) 확인

## 완료 조건

1. jest 녹색
2. 배포 성공
3. Task 4 라이브 검증 4항 전부 통과
4. **민아 재검증 게이트**: 배포 후 민아에게 인계

## 커밋

```
[fix] V1 소각 P0 — funnel JS T1 null 가드 + cn-resume 퍼널 차단 확인
```
