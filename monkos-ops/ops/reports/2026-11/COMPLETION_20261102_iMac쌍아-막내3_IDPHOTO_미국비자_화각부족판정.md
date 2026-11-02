---
type: completion
date: 2026-11-02
device: iMac
agent: 쌍아-막내3
status: 마감
portfolio: PF_IDPHOTO
order: ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_화각부족판정.md
---

# COMPLETION — 미국 비자 화각 부족 판정

**[2026-11-02 18:07 KST]** iMac/쌍아-막내3 → iMac/쌍아

결론: dev에서 ok·warn·block 3단 판정과 안내가 작동한다(최종 `monkos-portal-dev-00211-4jp`). 임계 확정값은 **warn 5% / block 8%**, 재확인 결과는 §9. prod·엣지·crop-engine은 배포하지 않았다. §1~§8은 block 12% 시점(rev 00210) 기록이며, 판정이 달라진 부분은 §9가 우선한다.

## 1. 쌍아 결정 항목 (18:10 결정 완료 — §9)

1. **block 임계를 12%로 둘지.** 현행 12%(지시서 초안 유지). 11.0% 사진(selfie_c09)을 실제 생성하면 몸통 좌·우·아래가 직선으로 잘려 또렷이 보이는데, 경고 문안은 "조금 잘려"다. 닫힌 대안: ① 12% 유지(이탈을 알린 뒤 고객이 선택) ② 8%로 하향(6.3%는 warn, 9.5%↑는 반려 — 반려 증가).
2. **머리끝 재배치(막내2)와의 병합 순서.** 코드 충돌은 없다(`git merge-tree` 무충돌, origin/worktree-makne2-kr-hairtop @ 05689f06 대조). 다만 프레임 배치가 바뀌면 이탈량도 바뀔 수 있어, 둘 다 병합할 경우 임계 재측정이 필요하다.

## 2. diff 요약

| 파일 | 변경 |
|---|---|
| `portal/lib/fit-fov.js` (신설) | `frameOutside`·`judgeFov`·임계 2개·노출 슬러그 정본 `us-visa` 1곳 |
| `portal/server.js` | `/fit`의 러프 크롭+피팅 블록을 `computeFitGeometry`로 추출(로직 무변경, 타임아웃만 인자화). `/fit` 응답에 `outside`·`fov` 추가. precheck는 노출 규격만 기하 호출, block이면 `measurable:false`+`narrow_fov`, 응답에 `fov` |
| `portal/public/js/specs-funnel.js` | precheck에 `slug` 전송, warn 1줄 표시(`#v2-fov-notice`) |
| `portal/lib/cms/specs-i18n.js` | `rej_narrow_fov`·`warn_narrow_fov` ko/ja/en/es |
| `crop-engine/lib/crop.js` | `fitSpecGeometry` 반환에 `outside` 추가(`resolvePlacement` 불변) |
| 테스트 | `portal/__tests__/fit-fov.test.js`, `crop-engine/lib/crop.fov.test.js` |

`matte.js`·`resolvePlacement`는 건드리지 않았다.

### 지시서와 다르게 구현한 점

- **고객 판정은 crop-engine의 `outside`를 쓰지 않는다.** 포털은 crop-engine에 러프 크롭을 보내므로 그 값은 원본이 아니라 러프 창 기준이다. 그래서 포털이 원본 좌표로 역산한 프레임과 원본 크기로 같은 비율을 다시 잰다(`fit-fov.js`, 새 산식 아님). crop-engine `outside`는 지시대로 추가했지만 현재 소비처가 없다.
- 이 덕분에 **crop-engine 재배포 없이 기능이 작동한다.** 공유 prod 엔진(asia-northeast3)을 코드 변경 전 상태 그대로 호출해 검증했고, dev 서비스는 없어 배포하지 않았다(crop-engine 단위 테스트는 로컬).

## 3. 임계 근거 (dev 실측, 단위 %)

모사 크롭 스윕에서 좌·우·아래 최댓값별 구도를 대조했다.

| 최댓값 | 사례 | 구도 관찰 | 초안(3/12) | 확정(5/12) |
|---|---|---|---|---|
| 3.2~3.7 | c14 원본·selfie_c04·sweep_c12_4 | 띠가 가늘고 어깨가 가장자리에 거의 닿지 않음 | warn(오경보) | **ok** |
| 6.3 | sweep_c14_3 | 옆 띠 보임 | warn | warn |
| 10.3~11.7 | sweep_c12_6·selfie_c09·c15 | 옆 띠 뚜렷. selfie_c09 생성 결과는 직선 잘림 | warn | warn |
| 12.5 | sweep_c14_5 | 어깨가 양옆에서 끊김 | block | block |
| 13.7~ | sweep_c12_7, 클로즈업 | 어깨 잘림, 아래 띠까지 | block | block |

warn만 초안 3%→5%로 조정했다. 구도 관찰 중 생성 실물로 본 것은 c11·selfie_c09뿐이고, 나머지는 `/fit` 프레임에 원본을 얹은 매팅 전 모사다. 표본이 공개 인물 사진 위주라 실고객 분포는 반영하지 못했다.

## 4. 실측 표 (rev 00210-8vm, API 직접 호출)

`outside`는 `/fit` 응답값, 판정은 precheck 응답값. 위쪽 이탈은 전 사진 0.0이다(`resolvePlacement`가 `extractTop`을 0 이상으로 고정).

| 종류 | 사진 | 아래 | 좌 | 우 | precheck 판정 | 비고 |
|---|---|---:|---:|---:|---|---|
| 상반신 넉넉 | c11 | 0.0 | 0.0 | 0.0 | ok | |
| 상반신 넉넉 | c12 | 0.0 | 0.0 | 0.0 | ok | |
| 상반신 넉넉 | c14 | 0.0 | 3.2 | 0.0 | ok | |
| 상반신 넉넉 | c15 | 0.0 | 2.8 | 11.7 | warn | 넉넉한 사진도 얼굴이 치우치면 한쪽 이탈이 커짐 |
| 상반신 넉넉 | c02 | 0.0 | 0.0 | 0.0 | ok | |
| 셀카(실제) | c03 | 30.9 | 0.0 | 17.6 | `head_tilted` 선행 반려 | 화각 판정 미도달, /fit만 block |
| 셀카(실제) | c05 | 48.2 | 32.3 | 28.8 | `head_cropped` 선행 반려 | 화각 판정 미도달, /fit만 block |
| 셀카(모사) | selfie_c02 | 0.0 | 0.0 | 0.0 | ok | |
| 셀카(모사) | selfie_c04 | 0.0 | 3.5 | 2.2 | ok | |
| 셀카(모사) | selfie_c09 | 4.0 | 11.0 | 8.1 | warn | 화면·산출물 캡처 |
| 클로즈업(모사) | close_c11 | 31.1 | 17.7 | 17.9 | block (`narrow_fov`) | 화면 캡처 |
| 클로즈업(모사) | close_c12 | 29.1 | 17.2 | 16.6 | block (`narrow_fov`) | |
| 클로즈업(모사) | close_c14 | 36.6 | 21.8 | 18.8 | `crown_cropped` 선행 반려 | |
| 스윕 | sweep_c14_3 | 0.0 | 6.3 | 3.4 | warn | |
| 스윕 | sweep_c14_5 | 1.7 | 12.5 | 9.7 | block | |
| 스윕 | sweep_c12_4 | 0.0 | 3.7 | 3.0 | ok | |
| 스윕 | sweep_c12_6 | 0.0 | 10.3 | 9.9 | warn | |

**표본 한계**: 실제 셀카 2장은 다른 게이트에서 먼저 반려돼 화각 판정까지 가지 못했다. 팔 길이 셀카 3장과 클로즈업은 공개 사진을 얼굴 박스 기준으로 잘라 만든 **모사**다. 작가님이 보신 실제 사례의 재현은 아니며, 본인 셀카로 확인하면 가장 확실하다.

### 브라우저 실측 (rev 00210-8vm, /specs/visa/us, ko)

| 경우 | 화면 | 산출물 |
|---|---|---|
| ok (c11) | 경고 없음, 만들기 버튼 | 600×600, 이탈 없음 |
| warn (selfie_c09) | 경고 1줄 + 만들기 버튼 유지 | 600×600, 좌·우·아래 직선 잘림 확인 |
| block (close_c11) | 반려 문안 + 다른 사진 버튼만 | 생성 불가 |

캡처는 iMac `/tmp/monk-fov/`(`ui_{ok,warn,block}.png`, `result_{ok,warn}.png`, `all.jpg`)에 있고 커밋하지 않았다(임시 경로라 재부팅 시 소실될 수 있음). 테스트 사진도 커밋하지 않았다.

### 대조군·언어

- **다른 규격 불변**: kr-passport로 precheck를 호출하면 `fov` 필드가 없고 판정이 통과로 나온다(close_c11 — `/fit` 응답에만 warn 값이 실림, 화면 미사용). 다만 대조군은 이 1규격 1장이다.
- **문안 전달**: `warn_narrow_fov`가 ko·en·ja·es 페이지에 실림(각 1건), id 페이지 0건. 양성 대조 겸 확인. ja·en·es 화면 표시는 브라우저로 보지 않았다.
- **id·vi**: 4언어 지시 범위 밖이라 문안이 없다. id는 페이지 0건 실측, vi는 코드상 동일하게 추정. us-visa에서 block이면 일반 반려 문구(`rejDefault`), warn이면 경고 없음.

### 테스트 사진 출처 (Wikimedia Commons)

| 파일 | 라이선스 | 출처 |
|---|---|---|
| c02 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:2020.hayri_ESMER.jpg |
| c03 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:2011%EC%A1%B0%ED%95%9C%EC%A4%80.jpg |
| c04 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:00100lPORTRAIT_00100_BURST20191019161412311_COVER~2.jpg |
| c05 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:0032_IMG_0282.jpg |
| c09 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:001285_Rhind_Neil.jpg |
| c11 | Public domain | https://commons.wikimedia.org/wiki/File:Joe_Biden_presidential_portrait.jpg |
| c12 | Public domain | https://commons.wikimedia.org/wiki/File:Kamala_Harris_Vice_Presidential_Portrait.jpg |
| c14 | Public domain | https://commons.wikimedia.org/wiki/File:Pete_Buttigieg_official_photo.jpg |
| c15 | Public domain | https://commons.wikimedia.org/wiki/File:Janet_Yellen_official_portrait.jpg |

## 5. 단위 테스트

- 포털 `npm test`: 15 스위트 159건 통과(경계값 포함, 임계 조정 후 재실행). 본 체크아웃 node_modules 임시 심링크로 실행 후 제거, 설치 없음.
- crop-engine `node --test lib/crop.fov.test.js`: 4건 통과.

## 6. prod 판정표

| 대상 | 필요 여부 | 사유 |
|---|---|---|
| 포털 prod | **필요** (작가님 '배포 승인') | API·`specs-funnel.js` |
| 엣지 재배포 | **필요** (작가님 '배포 승인') | `specs-i18n.js` 변경 = 엣지 대상. 누락 시 무음 구본 — 문안 미탑재로 block은 일반 반려 문구, warn은 미표시 |
| crop-engine prod | **불필요** | 포털이 소비하지 않음. `outside` 필드만 다음 배포 때 반영 |

순서는 포털 → 엣지. 포털만 먼저 올라가면 위 무음 구본 상태가 잠시 생긴다.

## 7. 남은 위험

- **응답 지연 미측정**: us-visa precheck는 fit 기하 호출이 추가돼 느려진다. 호출당 타임아웃 15초, 최대 2회. 지연을 재지 않았으므로 prod 전에 로그로 확인할 것.
- **fail-open**: 기하 호출이 실패하면 판정 없이 통과한다(현행처럼 경고 없이 출고). 로그 `화각 판정 불가` 또는 `fov` 필드 부재로 식별.
- **차단 지점은 precheck뿐**: `/fit`·`generate`는 block을 막지 않는다. 퍼널 UI로는 우회되지 않지만 API 직접 호출은 통과한다.
- **좌우 치우침**: 얼굴이 중심에서 벗어나면 넉넉한 사진도 경고가 뜬다(c15). 이때 "멀리서" 안내는 정확한 처방이 아닐 수 있다.

## 8. dev 상태

- 현재 dev = `00210-8vm`(본 브랜치). **막내2의 머리끝 재배치 코드는 들어 있지 않다** — 막내2 코드는 worktree-makne2-kr-hairtop @ 05689f06.
- 계측 도중 막내2 배포(00208, 17:39)가 dev를 교체해 스윕 16건이 무효가 되었다. 00209로 재배포해 재측정했고, 표에는 그 이후 값만 썼다. 재배포 전 막내2에 고지했고, 막내2는 남은 dev 검증이 없다고 회신했다(17:43).
- dev 무료 생성 3회 실행(c11 2회, selfie_c09 1회). dev는 무료 횟수 제한이 해제돼 있으나 매팅 체인은 실제로 호출됐다.

## 9. 쌍아 결정 반영 (rev 00211-4jp)

**[2026-11-02 18:17 KST]** iMac/쌍아-막내3 → iMac/쌍아

결정 출처: iMac/쌍아 18:10 세션 메시지 — block 8%, warn 문안 사실대로 수정, 병합은 이 건 먼저. 막내2 건 재측정은 쌍아가 별도 지시.

- 임계: warn 5% / block 8%. 테스트 159건 통과.
- warn 문안 4언어 교체. ko = "어깨나 몸 아래쪽 일부가 배경색으로 채워져요. 자연스러운 결과를 원하시면 조금 더 멀리서 다시 찍어주세요."

| 사진 | 최댓값 % | API 판정 | 브라우저 |
|---|---:|---|---|
| selfie_c09 (지시) | 11.0 | block (`narrow_fov`) | 반려 문안, 만들기 버튼 없음 |
| sweep_c14_3 (지시, 6.3%) | 6.3 | warn | 새 경고 문안, 만들기 버튼 유지 |
| c15 | 11.7 | **block으로 변경** | 미확인 |
| sweep_c14_4 | 9.5 | **block으로 변경** | 미확인 |
| sweep_c12_6 | 10.3 | **block으로 변경** | 미확인 |
| c11 | 0.0 | ok | 미확인 |
| selfie_c04 | 3.5 | ok | 미확인 |

브라우저 캡처: `/tmp/monk-fov/ui_warn2.png`, `ui_block2.png`(커밋 안 함).

**8%의 부작용 (실측)**: c15는 가슴 위까지 찍힌 공식 초상 원본인데, 오른쪽만 11.7%(왼쪽 2.8%) 이탈해 block이 된다. 고객에게는 "너무 가까이서 찍혔어요"가 뜨지만 실제 원인은 거리보다 좌우 위치 쏠림으로 보인다. 이런 사진은 12%에서는 warn이었다. 얼마나 자주 나올지는 공개 사진 표본으로 알 수 없으므로, prod 후 precheck 로그의 `화각 outside`로 반려율을 볼 것.

최종 dev = 00211-4jp(본 브랜치). 막내2 코드는 없다.
