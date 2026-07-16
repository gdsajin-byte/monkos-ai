---
type: order
date: 2026-07-16
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: 피커 — 남성복 타이 토글(B안) + idpass 흰색 상의 발급거부 주의 표시
status: 대기
portfolio: PF_SPECS
---

# 지시서: 피커 타이 토글 + 흰 상의 경고 (①/② 중 선행)

**[2026-07-16 13:50 KST]** iMac/민아 → 막내(번호 작가님 지정)

> 작가님 방향 확정(07-16): "타이는 토글 옵션" + "idpass 피커엔 흰색 상의는 발급 거부 사유입니다 주의 표시".
> 후속 지시서(연령 확장)와 같은 프리셋 파일을 다루므로 **본 건 완료 후** ②에 착수한다.

## 1. 배경 (실측 기반)

- 카탈로그 15/15 완결·prod 00489 라이브. 전 아이템 `attire_desc`에 "no tie" 명시, `tags.accessory.tie`는 전부 null(확장 슬롯 선탑재 상태).
- 타이 "아이템 방식" 파일럿 2종 잔존: `m_shirt_white_tie_navy_15`(active)·`m_shirt_white_tie_charcoal_16`(inactive) — 토글 체계로 흡수·정리 대상.
- 서버 계약: 클라가 `attireDesc` 전송 → `buildT1Prompt(attireDesc, {gender, age})`(lib/idphoto-generate.js:136) 조합. 치환은 클라에서 해도 계약 내이나 **자유 문자열 조립 금지** 원칙 준수(아래 3-A-4).
- 흰/밝은 상의: `AttirePicker.mount(..., warnLightTop: true)` 옵션이 이미 존재(specs-funnel.js proceedToPay) — 문구·노출 강도가 미흡.

## 2. 산출물

| 파일 | 작업 |
|------|------|
| `public/components/attire-picker/attire-picker.js` | 타이 토글 UI + desc 치환 + 흰상의 경고 강화 + UI_TEXT 4언어 |
| `public/components/attire-picker/attire-presets.json` | 정장·셔츠 아이템에 `accessory.tie` 옵션 데이터 + 타이 아이템 2종 정리 |
| `public/components/attire-picker/README.md` | 토글 계약 명문화 |
| `public/components/attire-picker/demo.html` | (필요시) 페이로드 표시 확인용 미세 수정 |

## 3. 상세 설계

### A. 타이 토글 (B안)
1. **노출 조건**: `category ∈ {suit, shirt}` 아이템 선택 시에만 토글 행 노출. 기본 **off**(노타이 디폴트 — 규정 무방 + 썸네일과 일치).
2. **타이 색**: 솔리드 2종 — 네이비·차콜. 색 칩으로 선택(스와치, 썸네일 재생성 없음). 매듭·패턴 계열은 아티팩트 리스크로 금지(작가님 안전 방침).
3. **데이터**: 프리셋에 토글 정의를 데이터로 — 예: 최상위 `tieOptions: [{id:'navy', hex:'#1F3A5F', labels:{ko:'네이비 타이',ja:'ネイビータイ',en:'Navy tie',es:'Corbata azul marino'}}, {id:'charcoal', ...}]`. 아이템별 허용은 `tags.accessory.tie` 활용(예: `"tie": "toggle"` 마커 또는 카테고리 규칙 — 구현 간단한 쪽, README에 확정 기록).
4. **desc 치환**: 선택 시 `attire_desc`의 `"no tie"` → `"with a solid ${color} tie"` 치환. **치환 소스는 프리셋 tieOptions의 고정 문자열만** — 유저 입력·자유 조립 절대 금지(프롬프트 인젝션 표면 차단). "no tie" 부재 아이템(치환 실패)은 토글 미노출.
5. **페이로드**: generate body에 `attireTie: 'navy'|'charcoal'|null` 추가(관측·어드민용) — 서버는 attireDesc를 이미 신뢰하므로 필수 아님, 로깅 가치용.
6. **기존 타이 아이템 정리**: 15·16번 `active:false` 강등(에셋·GCS 원본은 보존 — 삭제 금지). README에 "타이는 토글 체계" 명기.
7. **선택 UI 상태**: 토글 on 시 카드에 작은 타이 뱃지 표시(썸네일 편집 금지 — 오버레이만).

### B. 흰색 상의 주의 표시 (idpass)
1. `warnLightTop` 경고를 **문구 강화 + 상시 노출**로: idpass 서비스에서 피커 하단 고정 안내 — ko 기준 **"⚠️ 흰색·밝은 상의는 발급 거부 사유가 될 수 있어요"** 톤. "지금 옷 그대로" 선택 상태에서도 보여야 한다(원본 상의가 흰색인 경우가 실제 리스크).
2. UI_TEXT 4언어(ko/ja/en/es) — 기존 warnLight 키 확장 또는 신설. es는 usted 톤 유지.
3. 흰 상의 단독 아이템의 idpass 비노출(use_case 필터)은 현행 유지 — 회귀 금지.

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: 시크릿 생성/추측 금지.
- **헌법 3조 1항**: 타임스탬프 `date` 취득. / **3조 2항**: COMPLETION 보고서 + 세션로그 + PF_SPECS 히스토리 1행.
- **ch5**: 배포는 `./deploy.sh` 경유, **dev까지만** — prod는 민아 검증 후.
- **컴포넌트 계약(README)**: mount 단독 완결·self-contained 유지. specs 외 소비처(headshot·styler) 회귀 금지.
- **프롬프트 안전**: desc 치환은 프리셋 고정 문자열만(3-A-4). 자유 문자열 조립 금지.

## 5. 완료 기준

- [ ] 데모: 정장 선택→토글 노출(기본 off)→네이비 on→payload의 attireDesc에 "with a solid navy tie" 확인, 블라우스 선택 시 토글 미노출
- [ ] dev 생성 1회 실측: 타이 on 결과물에 타이 렌더 확인(솔리드·자연스러움) — 실패 시 프롬프트 재조정 최대 2회 후 보고
- [ ] 흰상의 경고: idpass 데모·specs dev 페이지에서 4언어 문구 상시 노출, "지금 옷 그대로"에서도 표시
- [ ] ko/ja/en/es 회귀 0 (기존 카드·선택 동작)
- [ ] dev 배포 + COMPLETION 보고

## 6. 커밋 메시지

```
[feat] 피커 타이 토글(B안) + idpass 흰상의 발급거부 경고 4언어 (PF_SPECS)
```
