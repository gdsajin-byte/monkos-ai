---
type: completion
date: 2026-11-03
device: iMac
agent: 쌍아-막내6
status: 마감
portfolio: PF_IDPHOTO
order: ORDER_20261103_iMac쌍아_막내2_IDPHOTO_업셀문구_의상기본값_아기분기
---

# COMPLETION — ③ 업셀 문구 정합 + 의상 기본값 성인/아기 분기

**[2026-11-03 04:25 KST]** iMac/쌍아-막내6 → iMac/쌍아

재배정: 원 수신 막내2 정지로 쌍아 04:18 재배정 (작가님 04:16 "모두진행해" 범위 승인).

## ⚠️ 먼저 볼 것 — dev는 지금 이 코드가 아니다

내 배포(00225)는 45초 뒤 다른 세션의 dev 배포(00226, 다른 이미지)로 덮였다. 04:25 실측: 00226 트래픽 100%, `attire-picker.js`의 `defaultLabels` 0건. **아래 라이브 판정은 00225가 서빙되던 시점의 값이다.** 다른 막내 검증을 깨지 않으려고 재배포하지 않았다. 병합 후 dev 또는 prod 배포에서 재확인이 필요하다.

## 결과

| 항목 | 내용 | 상태 |
|---|---|---|
| `t1Desc1` 6언어 | ko/ja/en/es/id/vi 교체 | ✅ |
| 기본칩 분기 | `default_option.labels`=정장(기본), 신설 `labels_baby`=지금 옷 그대로, es 보충 | ✅ |
| 아기 폴백 버그 | `buildT1Prompt`: attireDesc 없고 baby면 원복 문구, 그 외 정장(불변) | ✅ |
| 테스트 | `t1-prompt-outfit.test.js` 4케이스 스냅샷 + 2건. 전체 18 스위트 201/201 | ✅ |
| dev 캡처 | 390·1440 × ko·en × 성인·아기 8장 | ✅ (00225 시점) |

## 변경 파일 (커밋 4cc94c79)

- `monkos_AI/portal/lib/cms/specs-i18n.js`
- `monkos_AI/portal/lib/idphoto-generate.js`
- `monkos_AI/portal/public/components/attire-picker/attire-picker.js` — `defaultLabels()` 신설, 0번 칩·`getSelection().labels`가 함께 사용. 아기 안내 문구 유지.
- `monkos_AI/portal/public/components/attire-picker/attire-presets.json`
- `monkos_AI/portal/__tests__/t1-prompt-outfit.test.js` + 스냅샷

## dev 배포

- 배포 전 최신 rev: 00223 (11-02 21:36 KST).
- 배포: `deploy.sh dev`, 4cc94c79(origin/main fa0941cf 기반) → `monkos-portal-dev-00225-4jx`.
- 그 사이 00224(19:23 UTC), 직후 00226(19:25 UTC)은 내 배포가 아니고 이미지가 서로 다르다. 00224는 내 배포가 덮었을 수 있으니 해당 막내 확인 필요.

## 라이브 판정 (방법 포함)

dev run.app 직접 조회라 엣지·SWR 경유가 아니다. 2회 히트 규칙 대상 아님.

- **문구**: curl로 ko·en·es 페이지 조회, 새 문구 각 1건 / 구 문구(대조군 패턴) 0건. ja·id·vi는 소스·diff 확인만 했다.
- **칩**: 실제 dev 페이지에서 `AttirePicker.mount`를 별도 컨테이너에 띄워 판정. 실제 퍼널(업로드 후 화면) 진입이 아니다.

| 언어 | 성인 0번 칩 | 아기 0번 칩 | 칩 수 성인/아기 |
|---|---|---|---|
| ko | 단정한 정장(기본) | 지금 옷 그대로 | 7 / 4 |
| en | Neat suit (default) | Keep current outfit | 7 / 4 |

390·1440 모두 동일, 가로 넘침 없음. ko 아기 안내 문구 표시 확인. 캡처(iMac 로컬, `*.png` gitignore라 레포 미포함): `~/.monkos/captures/20261103_makne6_attire/atp_{ko,en}_{390,1440}_{adult,baby}.png`

- **아기 프롬프트**: 유료 생성 없이 단위 테스트로 대체(지시서 허용). 스냅샷 `[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.` 서버 전달 경로는 코드로 확인: 퍼널 `age` → `server.js:807` → `buildT1Prompt(attireDesc,{gender,age})`. 실생성은 호출하지 않았다.
- 결제 제출 없음, 고객 사진 사용 없음.

## 타 경로 폴백 (보고만)

- 정장 폴백은 `buildT1Prompt` 1곳뿐. 호출처도 `server.js:968` 1곳.
- `idphoto-kr`·`idphoto-jp` `server.js`: 기본값이 이미 옷 유지(`clothing` 없음/default). 동일 버그 없음. 단 `suit` 명시 분기에 나이 가드가 있는지는 보지 않았다.
- `studio/server.js:180`의 Formal business attire는 기업 헤드샷 프리셋 문구로 폴백이 아니다.

## 같은 취지 다른 키 (미변경)

- `ctaSub` ko·en 등: "AI가 배경·조명·피부를 …" / "AI retouches background, lighting & skin to studio quality" — 새 문구("표정·의상만")와 어긋난다. **정합이 필요하면 후속 지시 필요.**
- `t1Title`·`t1BuyBtn`·`creditSlotSub`·`howToStep3Name`: "AI 보정/리터칭" 상품명 계열.

## 💡 쌍아 판단 필요

1. `t1Desc1`은 나이 무관 공통인데 아기는 표정을 유지하고 옷은 색만 바꾼다. 아기 선택 시 문구와 실제가 약간 다르다. 지시서 문언대로 두었다.
2. 피커 기본 라벨·안내 문구는 id·vi 사전이 없어 en으로 표시된다(기존 구조). 지시 범위가 es까지라 추가하지 않았다.
3. `attire-presets.json`은 버전 쿼리 없이 `max-age=3600`이라 배포 후 최대 1시간 구 JSON이 남을 수 있다. 그동안 성인 칩이 구 라벨로 보일 뿐 기능 영향은 없다.

## prod 판정표

| 변경 | 표면 | 필요 배포 |
|---|---|---|
| `specs-i18n.js` | specs 정적본 | **엣지 재배포 필수**(`edge/deploy.sh`, 누락 시 무음 구본) + portal |
| `attire-picker.js`·`attire-presets.json` | 정적 컴포넌트 | portal. 엣지 경유 캐시 여부는 배포 시 실측 |
| `idphoto-generate.js` | 서버 프롬프트 | portal `deploy.sh prod` |

prod·엣지 미배포. 작가님 '배포 승인' 대기.

## 원격 대조

원격 SHA는 푸시 후 쌍아 보고 메시지에 기재한다. 브랜치: `makne6/idphoto-upsell-attire-baby`. 병합은 쌍아.
