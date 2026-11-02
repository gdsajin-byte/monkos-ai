---
type: completion
date: 2026-11-02
device: iMac
agent: 쌍아-막내3
status: 마감
portfolio: PF_IDPHOTO
order: ORDER_20261102_iMac쌍아_막내3_IDPHOTO_정수리게이트_실측전환.md §8
---

# COMPLETION — 화각 판정 전 규격 일반화 + 내 사진 위 틀

**[2026-11-02 20:25 KST]** iMac/쌍아-막내3 → iMac/쌍아

결론: 전 규격에 화각 판정과 내 사진 위 틀이 dev에 올라갔다. 다만 합격선 "오반려 0"은 **딱 맞게 자른 증명사진 표본 4건이 block이어서 쌍아 판단이 필요하다**(§1). prod·엣지 미배포.

**작가님 확인 주소 (dev `monkos-portal-dev-00218-pbz`, 막내4 업로드 안내 포함):**
- 미국 비자: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/visa/us
- 한국 여권: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/passport/kr
- 캐나다 여권: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/passport/ca
- 미국 여권: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/passport/us

⚠️ dev는 공유 서비스라 다른 세션이 배포하면 내용이 바뀐다. 확인 전에 리비전을 대조할 것.

## 1. 쌍아 결정 항목

1. **딱 맞게 자른 증명사진의 block.** 프레임이 큰 규격에 얼굴 위주로 자른 사진을 넣으면 block이 된다.
   - ca-passport: normal_c11(아래 13.0%), normal_c12(아래 11.0%), border_c14(아래 35.6%)
   - us-visa: border_c14(아래 21.7%·좌 20.3%·우 17.0%)

   실제로 프레임이 사진을 넘쳐 몸이 직선으로 잘리는 경우라 문구는 사실이지만, 이미 증명사진처럼 찍힌 사진을 올린 고객은 "오반려"로 느낄 수 있다. 상반신 사진은 전부 통과했다.
   닫힌 대안: ① 현행 block 유지(지시 §8-5, 현재 상태) ② 첫 배포는 warn만 켜고 분포 관찰(설계 §7) ③ 아래 이탈만 block 임계를 높임.
2. **precheck 지연.** 통과 사진 기준 평균 6.6초(최대 12.5초, n=28, dev). 구 게이트 prod 2.9초(n=10) 대비 늘었다. 화각 기하 호출과 매팅 1회가 더해졌기 때문이다. 표본·서비스가 달라 차이는 참고값이다. prod 전에 수용 여부를 정해야 한다.

## 2. diff 요약

| 커밋 | 내용 |
|---|---|
| 43bff034 | us-passport `faceTargetExplicitMm: 31` 1줄 — 별도 커밋 |
| 66e28728 | 아래 전부 |

- `lib/fit-fov.js`: 노출 목록 폐지(전 규격), `assessFov`·`judgeWide`·`fovRejectionReason`. 배율 1.0~1.5 warn, 1.5 초과 block.
- `server.js`: 고정 얼굴 비율 20~80%·박스 윗변 5% 게이트 폐지. 코드 `fov_tight_top`·`fov_tight_side`·`fov_off_center`·`fov_wide`. 로그에 outside·배율·얼굴 비율. 기하 실패는 WARNING + 통과.
- `specs-i18n.js`: 새 키 6언어. 기존 `narrow_fov*`·`crown_cropped` 키는 그대로 둠.
- `specs-funnel.js`: 내 사진 위 틀 SVG, 문구 `{spec}`·`{side}` 치환.
- `render-specs.js`: 클라이언트 설정에 `specLabel` 1줄.
- `spec-funnel-markup.js`는 건드리지 않았다. main ff67da0e 위로 rebase했고 포털 테스트 17 스위트 187건 통과.

**그대로 둔 고정 게이트**: `chin_cropped`(아래 여백 5%)와 `off_center`(얼굴 중심 15%)는 지시 범위 밖이라 유지했다. 둘 다 화각 판정보다 먼저 멈추므로, 판정 순서 "사람 조건 → 화각"에 완전히 맞지는 않는다.

## 3. 판정 분포 (dev 00218-pbz, API)

| 규격 | 상반신 5장 (c11·c12·c14·c15·c02) | normal_c11 | normal_c12 | border_c14 |
|---|---|---|---|---|
| kr-passport | ok 5 | ok | ok | warn(아래 5.6) |
| us-visa | ok 5 | warn(우 7.9) | warn(좌 7.0) | **block** |
| ca-passport | ok 5 | **block** | **block** | **block** |
| jp-passport | ok 5 | ok | ok | warn(아래 5.6) |

normal = 여백 3%, 얼굴 비율 약 49% / border = 여백 2%, 얼굴 비율 63%. 전부 공개 사진을 잘라 만든 모사다.

### 그 밖의 경로

| 경우 | 사진 | us-visa | kr-passport |
|---|---|---|---|
| 정수리 큰 절단 (구 `head_cropped` 대상) | cut_c09_k10·c11_k18·c12_k18 | `fov_tight_top` ×3 | `fov_tight_top` ×3 |
| 작게 줄어든 사진 | small_c11_320·c14_320 (배율 2.2~2.4) | `fov_wide` block | `fov_wide` block |
| 〃 | small_c12_500 (1.6~1.7) | `fov_wide` block | `fov_wide` block |
| 〃 | small_c11_500 | warn(1.44) | block(1.54) |
| 〃 | small_c07_640 | warn(1.35) | warn(1.44) |
| 얼굴 작은 원본 | c07 (얼굴 22%, 배율 0.67~0.72) | ok | ok |
| 가까운 사진 | close_c11 | `fov_tight_side` | ok(아래 4.3) |

c01(얼굴 15%)·c10은 `head_tilted`로 먼저 반려되어 화각까지 가지 못했다.

**`fov_wide` 표본 한계**: 전부 축소 모사다. 정말 멀리서 찍은 고해상도 사진은 c07 1장뿐이고 ok였다. 2048px로 정규화한 뒤 계산하므로, 휴대폰 원본은 얼굴이 작아도 배율이 낮다.

## 4. 브라우저 확인 (dev 00218-pbz, 뷰포트 430px)

| 경우 | 문구 | 틀 | 만들기 버튼 |
|---|---|---|---|
| ok (us-visa c11) | 없음 | 흰 틀 | 있음 |
| warn (normal_c11) | 몸 채움 경고 | 넘친 양옆 빨강 + 주황 테두리 | 있음 |
| block side (close_c11) | "미국 비자 사진에는…" | 좌·우·아래 빨강 + 주황 | 없음 |
| block wide (small_c12_500) | 작게 찍힘 + 원본 안내 | 흰 틀 | 없음 |
| block top (kr, cut_c12_k18) | 머리 윗부분 잘림 | 흰 틀 + 위 주황 | 없음 |
| block (ca, normal_c12) | "캐나다 여권 사진에는…" | 아래 빨강 | 없음 |
| block side (en) | "A United States Visa photo…" | 표시됨 | 없음 |

캡처: iMac `/tmp/monk-fov/g_*.png`, `g_all.jpg`(커밋 안 함, 재부팅 시 소실 가능).

**미확인**:
- `fov_off_center`의 이번 빌드 화면·`{side}` 치환(단위 테스트만). 이번 표본에는 해당 사진이 없었다.
- 틀 표시 뒤 "만들기"를 눌러 실제 생성까지 가는 흐름(이번 빌드 미실행). `runFit` 시작 시 틀을 지우도록 했다.
- id·vi·ja·es 화면. 문구 키가 페이지에 실린 것만 확인했다.
- 작가님 실제 사진.

## 5. prod 판정표

| 대상 | 필요 | 사유 |
|---|---|---|
| 포털 prod | **필요** (작가님 '배포 승인') | 판정·API |
| 엣지 재배포 | **필요** (작가님 '배포 승인') | i18n·specs-data·렌더러·funnel 변경 |
| crop-engine | 불필요 | |

순서는 포털 → 엣지. 그 사이 구본 페이지는 새 반려 코드의 문구가 없어 일반 반려 문구(`rejDefault`)로 나간다. 경고와 틀은 표시되지 않는다. 사진 처리는 정상이다.

## 6. dev 기록

- 배포 직전 리비전 00217-bwt(막내4 안내 포함) 확인 → main ff67da0e rebase 후 00218-pbz.
- 첫 측정 1회는 배포가 거부된 채 구 리비전을 잰 것이라 폐기했다. 이 보고의 수치는 전부 00218 이후다.
