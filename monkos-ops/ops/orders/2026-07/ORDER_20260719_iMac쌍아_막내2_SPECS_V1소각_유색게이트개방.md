---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내1
note: 원 지시서 target=막내2, 실배급=막내1 (작가님 승인 12:04)
portfolio: PF_SPECS
status: 대기
priority: P0
---

# 지시서: V1 완전 소각 + 유색(파랑·빨강) 게이트 개방

**[2026-07-19 11:59 KST]** iMac/쌍아 → 막내2

## 배경

specs 상세 페이지에 V1(정보 전용·퍼널 미동작) 경로가 6건 잔존 중이며, 해당 페이지가 GSC 상위 랭킹을 점유하면서 전환 0인 데드 상태. V1 진입 원인은 `isEngineCompatibleSpec`의 유색 배경(파랑·빨강) 제외 게이트. 7/18 야간 실측으로 T0 매팅 합성이 파랑·빨강 모두 정상 동작 확인됨 — 기술 장벽 소멸.

- 민아 기획서: `monkos-ops/ops/proposals/PROPOSAL_20260719_민아_V1완전제거_유색국정합_전수조사.md`
- 선행 지시서: `ORDER_20260718_iMac쌍아_막내2_크롭엔진_4차_V2게이트개방.md` (회색 개방 — 본건은 그 후속)

## ⚠️ 준수 조항

- 헌법 4조: deploy.sh 경유 배포 필수
- ch2: 기존 변수명·함수 시그니처 유지
- **V1 코드 삭제 범위 확인**: 삭제 전 `specsDetailFragment` 호출처가 V2 분기(`specsDetailV2Fragment`) 이외에 없는지 grep 확인
- **T1 유색 제외 유지**: T1 리터칭은 유색국에 아직 개방하지 않음 (작가님 시감 미완). T0만 개방
- **jest 녹색 필수**: 테스트 실패 시 배포 금지

## 작업

### Task 1. 유색 게이트 삭제 (render-specs.js:376-378)

현행:
```javascript
const bg = String(specData.background || '').trim();
if (/파란|빨간|blue|red/i.test(bg)) return false;
return true;
```

변경 — 유색 제외 삭제, 기하(가로형) 게이트만 잔존:
```javascript
return true;
```

즉 `isEngineCompatibleSpec`은 size 파싱 + 비율(h/w >= 1.0) 게이트만 남긴다. 376-378행 3줄 삭제.

이로써 kw-passport·kw-visa·om-passport·om-visa(파랑) + id-passport(빨강) = 5건 즉시 V2.

### Task 2. T1 유색국 비노출 — specs-funnel.js 또는 markup에 가드 추가

T1 리터칭은 흰 배경 고정 생성이므로 유색국에서 T1 업셀을 표시하면 규정 위반 산출물 판매가 된다. **파랑·빨강 배경국에서 T1 카드를 숨긴다.**

위치: `spec-funnel-markup.js` 또는 `specsDetailV2Fragment` 내 t1RetouchOn 분기 직전.

구현 방식:
```javascript
// 유색 배경국 T1 비노출 — 재채색 트랙 구현 전까지
const bg = String(specData.background || '').trim();
const isColoredBg = /파란|빨간|blue|red/i.test(bg);
const showT1 = t1RetouchOn && !isColoredBg;
```

`t1RetouchOn`을 참조하는 곳에서 `showT1`로 교체. markup에 넘기는 ctx도 동일 적용.

### Task 3. V1 코드 소각 (render-specs.js:674~1033)

`specsDetailFragment` 함수 본문에서:
- L675: `if (isV2Spec(slug, forceLang || 'ko')) return specsDetailV2Fragment(slug, forceLang);` — 이 분기가 이제 전 슬러그를 커버하므로 아래 V1 본문은 도달 불가.
- **L676~1033 전량 삭제** (V1 HTML 생성 로직).
- 함수 시그니처(`specsDetailFragment`)는 유지 — 외부 호출처 호환. 본문을 V2 직결로 교체:

```javascript
export function specsDetailFragment(slug, forceLang = null) {
  return specsDetailV2Fragment(slug, forceLang);
}
```

- 삭제 전 `grep -rn "specsDetailFragment" monkos_AI/` 실행하여 호출처 확인. V2 래퍼 외 직접 참조가 있으면 보고 후 대기.
- V1 전용 변수(`v1OgGuideKey`, `v1OgImage` 등), V1 전용 import가 있으면 함께 제거.
- `sample-before-kr.png`/`sample-after-kr.webp` 참조 마크업도 V1에만 있으므로 자동 소멸 확인.

### Task 4. 테스트 갱신

- V1 관련 jest 스냅샷/어설션이 있으면 V2 기준으로 갱신.
- `npm test` 녹색 확인.

### Task 5. 배포

```bash
./deploy.sh
```

## 완료 조건

1. jest 녹색
2. 배포 성공
3. kw-visa, om-visa, id-passport 3개 URL 라이브 접속 → V2 퍼널 렌더 확인 (사진 업로드 input 존재)
4. 위 3개에서 T1 카드 미노출 확인
5. **민아 검증 게이트**: 배포 후 민아에게 인계 — 6페이지 V2 실측 + 업로드 실작동 + 유색 T0 생성 각 1건 + jest + GSC 후속 관찰

## 커밋

```
[feat] V1 완전 소각 + 유색(파랑·빨강) V2 개방 — 데드 UI 6건 해소, T1 유색 비노출 가드
```
