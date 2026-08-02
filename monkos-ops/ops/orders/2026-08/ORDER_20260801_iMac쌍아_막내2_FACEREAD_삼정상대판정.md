---
type: order
date: 2026-08-01
from: iMac/쌍아
to: iMac/막내2
subject: "FACEREAD — 삼정 절대임계 폐기 → 상대 판정 전환 (변별력 회복)"
status: 완료
portfolio: PF_FACEREAD
---

# ORDER — 삼정 상대 판정 전환

**[2026-08-01 19:19 KST]** iMac/쌍아 → iMac/막내2

> **착수 전 필독**: [PF_FACEREAD/README.md](../../portfolios/PF_FACEREAD/README.md) (원칙 5항 + 시장 전략 §정면 2D 커버리지)

## 1. 배경 — 실측된 결함

작가님이 본인 및 타인 얼굴로 반복 테스트한 결과 **"삼정은 전원 균형, 문구가 두루뭉실"** 증상을 보고했다. 원인은 실측으로 확정됐다.

| | 판정 방식 | 결과 |
|---|----------|------|
| 삼정 | `balance_threshold: 0.045` — **절대 임계** | **전원 balanced** |
| 15부위 | 3구간 절대 임계 | 전원 중앙 |
| **오행형** | score 합성 → **최고점 argmax (상대)** | **사람마다 다름** ✅ |

**같은 DB 안에 대조군이 있다.** 상대 판정인 오행형만 변별력이 있다. 삼정 baseline `[0.28,0.36,0.36]`에서 임계 0.045는 **상정 비율이 27% 흔들려도 균형**으로 판정하는 관용 구간이며, 삼정은 인체 비례상 안정적인 값이라 이를 넘는 사람이 거의 없다.

**판정이 틀린 게 아니라 변별력이 0이다.** 원전에서도 삼정 균형은 길상이므로 판정 자체는 유효하나, 전원이 같은 답을 받으면 정보량이 0이다.

## 2. 목표

삼정 판정을 **절대 임계 → 자기 얼굴 내 상대 비교**로 전환한다. 모집단 표본이 필요 없는 구조(자기 얼굴 세 구역 간 비교)이므로 **즉시 실행 가능**하다.

## 3. 산출물

| 파일 | 작업 |
|------|------|
| `monkos_AI/portal/public/admin/js/gwansang/engine.js` | `classifySamjeong()` 로직 전환 (12~25행) |
| `monkos_AI/portal/lib/cms/gwansang-data.json` | `samjeong` 파라미터 교체 + `meta.calibration` 갱신 |
| `apps/gwansang-poc/js/engine.js` | 동일 로직 동기화 (표류 방지) |

## 4. 상세 설계

### 4-1. 전환 로직

현행 (engine.js 12~25행):
```js
const devs = [s1,s2,s3].map((v,i)=> v - base[i]);
const maxDev = Math.max(...devs.map(Math.abs));
let key = 'balanced';
if (maxDev >= db.samjeong.balance_threshold) {
  key = ['upper','middle','lower'][devs.indexOf(Math.max(...devs))];
}
```

전환 방향 — **gap 기반 상대 판정** (오행형 `mixed_gap` 패턴 준용):
- baseline 대비 편차 `devs` 산출까지는 동일 (세 값의 합은 0)
- `devs`를 내림차순 정렬 → **1위와 2위의 gap** 산출
- gap이 `balanced_gap` 미만 → `balanced` (세 구역이 실제로 고른 경우만)
- 그 외 → 1위 구역 키(`upper`/`middle`/`lower`)

**절대 임계로 균형을 먼저 판정하지 않는다.** 항상 상대 순위를 먼저 보고, 순위 차가 미미할 때만 균형으로 떨어진다. 이것이 오행형이 변별력을 갖는 원리이며, 두 판정의 철학을 통일한다.

### 4-2. `balanced_gap` 값 결정 — ⚠️ 임의 설정 금지

**값을 추측해서 박지 말 것.** 다음 절차로 실측하여 정한다.

1. 삼정 비율 `(s1,s2,s3)` 격자를 합성 생성 (합=1 제약, 현실 범위 내 수백 조합)
2. 후보 gap 값을 스윕하며 4개 키(`balanced`/`upper`/`middle`/`lower`)의 출현 분포 산출
3. **판정 기준**: 4개 키가 모두 출현하고, 어느 한 키가 전체의 60%를 넘지 않는 값
4. 선택한 값과 **분포 표를 COMPLETION에 첨부**, `gwansang-data.json`의 `meta.calibration`에 근거 1줄 기록

> 격자 합성이 실물 분포를 대신하지 못한다는 한계를 인지할 것. 이는 **"전원 균형" 해소가 목적인 1차 보정**이며, 실사진 표본 기반 정밀 보정은 Phase B 별건이다. 이 한계를 `meta.calibration`에 명시한다(무음 금지).

### 4-3. DB 파라미터

- `balance_threshold` 제거 또는 `_deprecated_balance_threshold`로 보존 + 사유 주석
- `balanced_gap` 신설 (4-2에서 결정한 값)
- `bins`(balanced/upper/middle/lower) **텍스트는 그대로 사용** — 4개 키가 이미 존재하므로 콘텐츠 재작성 불필요

### 4-4. 범위 밖 (하지 말 것)

- 15부위 백분위 전환 / `ohaeng_face.scoring` anchor·scale 재보정 → **실사진 표본 필요, Phase B**
- 원전 인용 매핑·콘텐츠 신규 집필 → Phase B (임의 해석 추가 금지)
- `/admin/*` 정적 파일 인증 게이트 → **별건**(포털 전역 사안, 본 지시서 범위 아님)
- 리포트 UI·14p 구조 변경

## 5. 배포

- `monkos_AI/portal/deploy.sh` 경유. **dev 검증 후 prod까지 출고.**
- 사유: 작가님이 **퇴근 후 모바일로 확인** 예정. dev만 배포하면 확인 불가.
- prod rev + `/admin/gwansang` 접속 경로를 보고에 명기.

## 6. ⚠️ 준수 조항

- 헌법 3조 1항: 매 턴 `date` / 3조 2항: 완료 보고 + 세션 로그 어펜드
- 헌법 4조 1항: 비밀정보 생성/추측 금지
- ch5: **deploy.sh 경유 필수**, gcloud 직접 배포 금지
- ch4 10조: Firestore 미접촉이 정상
- PF_FACEREAD 원칙 1·2: LLM 자유생성 금지, 측정 없는 해석 금지, **파라미터 임의 생성 금지**(§4-2)
- makne-guard: COMPLETION 파일 필수 + PF 히스토리 1행, 에러 3회 시 에스컬레이션

## 7. 완료 기준

- [ ] `classifySamjeong()` gap 기반 상대 판정 전환 (포털 + POC 동기화)
- [ ] `balanced_gap` **실측 결정** + 분포 표 COMPLETION 첨부 + `meta.calibration` 근거 기록
- [ ] 회귀 확인: 데모 얼굴 E2E 정상 완주, 삼정 외 판정(오행형·15부위·사주) **무변동**
- [ ] 판정 분산 실증: 4개 키 모두 출현 + 단일 키 60% 미만
- [ ] dev → **prod 배포**, rev + 접속 경로 보고
- [ ] COMPLETION + PF_FACEREAD 히스토리 1행 + 커밋·푸시

## 8. 커밋 메시지

`[fix] FACEREAD 삼정 절대임계 폐기 → 상대 판정 전환 (변별력 회복)`

---

> **[집행 기록] [2026-08-02 11:53 KST]** iMac/민아 — 수신자 막내2가 지시서 수신 전 세션 종료(08-01 세션로그 실측)로 미착수 상태였음. 작가님 직접 지시("사주 PF 마무리하자")에 따라 민아가 경로 ③(②항 준용)으로 대체 실행 완료. balanced_gap=0.013, dev `00178-gk7` → prod `00543-trd`. 상세: [COMPLETION_20260802_iMac민아_FACEREAD_삼정상대판정](../../reports/2026-08/COMPLETION_20260802_iMac민아_FACEREAD_삼정상대판정.md). **쌍아 사후 추인 대상.**
