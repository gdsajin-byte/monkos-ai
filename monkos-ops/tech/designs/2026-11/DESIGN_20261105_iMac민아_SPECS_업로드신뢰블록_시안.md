---
type: design
date: 2026-11-05
device: iMac
agent: 민아
status: 진행
portfolio: PF_SPECS
subject: specs 업로드 버튼 옆 '신뢰 블록' 시안 — 누가 만드나·사진 처리(자리 표시)·공식 출처+결과 예시
---

# DESIGN — specs 업로드 신뢰 블록 시안

**[2026-11-05 05:14 KST]** iMac/민아 → iMac/쌍아 (작가님 05:09 "진행하고 시안 제출해" 범위)

출처: 쌍아 05:09 요청(GA4 W36~W44 해외 규격→업로드 14~19% · 작가님 05:07 "페이지에 우리 소개가 없어 출처가 불확실하고 사진 업로드가 꺼려진다").
시안 파일: `DESIGN_20261105_iMac민아_SPECS_업로드신뢰블록_시안.html` (같은 폴더, 데스크톱 760 + 모바일 375 동시 렌더, 상단 ko/en/ja/es 스위치). 서비스 코드 변경·배포 없음.

## 1. 배치

- 현행 업로드 단계(`lib/cms/components/spec-funnel-markup.js` `#v2-dropzone`) **바로 아래** `.v2-trust` 1블록. 업로드 존 안에 넣지 않는다(드롭·클릭 핸들러 영역, 07-11 "잡스러움" 교정 이력).
- 데스크톱 3열(1.25:1:1) / 모바일 세로 적층. 토큰은 specs 페이지 현행(`specs-base.css` 흰 배경·Pretendard·`#6c4fff`)을 기준점으로만 썼다.
- 제목 줄 오른쪽에 "MONKOS AI" 소표기 — 블록의 발화 주체(ch8 4조 monkos.ai 계열 표기).

## 2. 문안 (4언어)

| 키 | ko | en | ja | es |
|---|---|---|---|---|
| 블록 제목 | 누가 만든 도구인가요? | Who is behind this tool? | このツールは誰が作っているの？ | ¿Quién está detrás de esta herramienta? |
| ① 제목 | 한국에서 운영 중인 증명사진 스튜디오 | A real ID-photo studio in Korea | 韓国で営業中の証明写真スタジオ | Un estudio real de fotos de identificación, en Corea |
| ① 본문 | 경기 하남의 **몽크사진관**이 만들었습니다. 매장에서 매일 쓰는 규격 재단 기준을 이 도구에 그대로 적용합니다. | Built by **MONK STUDIO**, a walk-in ID-photo studio in Hanam, Korea. The same framing rules we use for customers in the studio run this tool. | 韓国・河南（ハナム）の**MONK STUDIO**が作りました。店舗で毎日使っている規格の切り抜き基準を、そのままこのツールに適用しています。 | Creado por **MONK STUDIO**, un estudio de fotografía de identificación en Hanam, Corea. Aplicamos aquí las mismas reglas de encuadre que usamos a diario con nuestros clientes. |
| ① 링크 | 사진관 보기 → | See the studio → | スタジオを見る → | Ver el estudio → |
| ② 제목 | 사진 처리 | Your photo | 写真の取り扱い | Su foto |
| ② 본문 | [보관 기간 N일 후 자동 삭제 — 확정 전] | [Kept for N days, then deleted automatically — pending] | [N日間保管後に自動削除 — 確定待ち] | [Se conserva N días y luego se elimina automáticamente — pendiente] |
| ③ 제목 | 공식 규정 출처 | Official requirements | 公式規定の出典 | Requisitos oficiales |
| ③ 캡션 | 결과 예시 · {size} | Sample result · {size} | 仕上がり例 · {size} | Ejemplo de resultado · {size} |

- "매장에서 매일 쓰는 규격 재단 기준을 그대로" — 사실 근거: crop-engine `resolvePlacement` 단일 산식이 무료·유료·레퍼런스 도안에 공통(REPORT_20261104 §2). 레퍼런스와 제품의 두상 정의가 갈려 있는 상태(동 보고)이므로 "동일 기준"은 A′ 정합 뒤에 더 정확해진다 — 문구는 "기준"이지 "결과 보장"이 아니라 ch8 5조 안.
- "20년"은 현행 허브 배지 `ctaBadge`("20 Years of Photography Expertise")를 받은 것. 근거 확인 전까지 괄호·확인 전 표기로 둠.
- ③ 링크 텍스트는 항목별 `officialSource`(403/429건)의 기관명. 없는 26건은 ③ 줄 비표시.

## 3. 자산

| 용도 | 경로 | 상태 |
|---|---|---|
| ① 사진관 실사진 | `https://monk.kr/monk_studio/images/storefront.jpg` | 라이브 200 · 88KB · monk.kr 공개 중 |
| ③ 결과 예시 | `https://monkos.ai/assets/idphoto-after.jpg` | monkos.ai 홈 `home.js:303` 노출 중 — **피사체 동의 여부 작가님 확인 필요** |

## 4. 작가님 결정·확인 항목

1. ② 사진 처리 문안 — privacy.html 3항("생성 즉시 삭제")과 `gcs-save.js` 실제(보관·수명주기 없음)가 어긋남(쌍아 05:09). 정책 확정 뒤 "N일 보관 후 자동 삭제"로 치환.
2. ③ 결과 예시 사진의 동의 여부. 동의 불명이면 작가님·꾸 본인 사진 또는 합성 샘플로 교체.
3. "20년 경력" 표기 유지 여부(현행 허브 배지와 동일 주장).
4. ch8 4조 해석 — monkos.ai 표면에 몽크사진관/MONK STUDIO를 **운영 주체 소개**로 쓰는 것은 표기 혼용이 아닌 관계 서술로 봄. 쌍아 판정 요청.
5. ① 링크 목적지 monk.kr은 한국어 사이트 — 해외 사용자에겐 사진·지도가 실재 증거로 충분한지, 아니면 en 소개 1단락 페이지가 필요한지.

## 5. 구현 메모(막내용, 시안 확정 뒤)

- 마크업은 `spec-funnel-markup.js` 업로드 단계 끝에 `.v2-trust` 삽입, 문안은 `specs-i18n.js` v2 블록에 키 추가(`trustHead`·`trust1Title`…), 스타일은 `specs-funnel.css`.
- 이미지 2장은 포털 `public/assets/`에 사본(외부 도메인 핫링크 금지, 엣지 캐시 대상).
- 측정: 블록 노출 후 규격→업로드 전환(GA4 `service`·`market` 차원) 4주 전후 대조.
