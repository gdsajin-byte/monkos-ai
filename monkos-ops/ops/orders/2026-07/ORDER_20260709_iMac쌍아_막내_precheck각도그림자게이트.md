---
type: order
date: 2026-07-09
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_SPECS
priority: P0
status: 대기
---

# 지시서: precheck 각도·그림자 게이트 추가

**[2026-07-09 11:22 KST]** iMac/쌍아 → 막내

## ⚠️ 준수 조항

- 헌법 4조 1항(비밀정보 보호), 4조 2항(파괴적 명령 금지)
- ch5 2조(배포는 deploy.sh 경유)

## 배경

현행 precheck에서 rollDeg·yawRatio·shadowDiff를 **계산하고 로그만 찍고 차단하지 않는다.**
결과: 고개 기울기·측면·강한 그림자 사진이 통과 → 결제 후 관청 반려 수준 사진 생성 → 서비스 신뢰 문제.

7/9 새벽 지시서(Task 1-4)에서 "각도 판정은 postcheck로 이관"으로 설계했으나,
**결제 전에 차단해야 할 사진을 결제 후에 알려주는 것은 구조적 결함이다.** precheck로 복원한다.

## 설계 원칙

```
precheck = 결제 전 차단. "이 사진으로는 증명사진을 만들 수 없어요" → 재촬영 유도
postcheck = 결제 후 정보. "규격 안착 수치 + 참고 뱃지" → 이미 가능한 사진이므로 안내만
```

---

## Task 1 — 서버: precheck 각도·그림자 게이트 추가

파일: `portal/server.js` — `/api/idphoto/precheck` 엔드포인트

현재 490행 부근의 각도 코드:
```javascript
// 각도(5점 kps): 관측 로그만 — 판정은 postcheck(fit judge)로 이관
const k = f.kps;
if (k && k.length >= 5) {
  rollDeg = +((Math.atan2(k[1][1] - k[0][1], k[1][0] - k[0][0]) * 180) / Math.PI).toFixed(1);
  ...
  yawRatio = +(((k[2][0] - midX) / eyeSpan)).toFixed(3);
}
```

### 1-1. roll 게이트 (기울기)

주석 아래, rollDeg·yawRatio 산출 **직후에** 게이트 추가:

```javascript
if (measurable && rollDeg !== null && Math.abs(rollDeg) > 8) {
  measurable = false; reason = 'head_tilted';
}
```

### 1-2. yaw 게이트 (정면성)

```javascript
if (measurable && yawRatio !== null && Math.abs(yawRatio) > 0.15) {
  measurable = false; reason = 'not_frontal';
}
```

### 1-3. 그림자 게이트 (좌우 밝기 차)

기존 `shadowDiff` 산출 직후 (`bright > 240` 게이트 뒤):

```javascript
if (measurable && shadowDiff !== null && shadowDiff > 50) {
  measurable = false; reason = 'uneven_lighting';
}
```

### 1-4. 주석 수정

```javascript
// 각도(5점 kps) + 그림자: 측정 불가 차단 (2026-07-09 precheck 복원)
```

기존 "관측 로그만" 주석 삭제.

---

## Task 2 — 클라이언트: 거부 문구 추가

파일: `portal/lib/cms/render-specs.js` — `reasons` 객체 (line ~2435 부근)

기존 `reasons` 객체에 3개 추가:

```javascript
head_tilted: '고개가 기울어져 있어요. 고개를 바로 세우고 찍어주세요.',
not_frontal: '옆모습이에요. 정면을 바라보고 찍어주세요.',
uneven_lighting: '얼굴에 그림자가 져 있어요. 균일한 조명에서 찍어주세요.',
```

기존 `side_angle` 키가 있다면 제거 (중복 — `not_frontal`로 통합).

---

## Task 3 — idphoto-kr 동기화

파일: `idphoto-kr/server.js` — precheck 엔드포인트가 별도로 존재하는 경우 동일 게이트 적용.
존재하지 않으면 (portal 프록시 경유) 스킵.

---

## 임계값 근거

| 항목 | 임계값 | 근거 |
|------|--------|------|
| roll | 8° | 여권 규정 ±5° + 셀카 관용 3° |
| yaw | 0.15 | 코-눈중점 거리 / 눈간 거리. 정면=0, 15%=약 10° 회전 |
| shadow | 50 | 좌우 평균밝기 차 50 = 육안으로 명확한 그림자 |

보수적 시작. 로그 실측 데이터 축적 후 조일 수 있다.

---

## 검증

| 케이스 | 기대 결과 |
|--------|----------|
| 정면·균일조명 셀카 | 통과 |
| 고개 10° 이상 기울임 | `head_tilted` 차단 |
| 3/4 측면 | `not_frontal` 차단 |
| 한쪽 강한 그림자 | `uneven_lighting` 차단 |
| 기존 게이트(얼굴크기·위치·밝기) | 동작 유지 |

## 배포

- 검증 통과 후 `./deploy.sh portal` 실행
- crop-engine 변경 없음 (5점 kps는 SCRFD 기존 응답)
