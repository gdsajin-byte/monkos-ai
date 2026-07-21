---
type: order
date: 2026-07-21
device: M1
agent: 쌍아
target: 막내3
portfolio: PF_INFRA
status: 발행
---

# 지시서 — specs SSG PoC: kr-passport 정적 HTML을 monk.kr에서 서빙

**[2026-07-21 15:28 KST]** M1/쌍아 → 막내3

> 목표: render-specs.js로 kr-passport HTML 1장을 정적 파일로 생성 → monk.kr에 배포 → CR SSR 버전과 비교.
> 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md` §4
> 검증: SSG 전환이 기술적으로 가능한지 + 출력 차이가 있는지 실증.

---

## ⚠️ 준수 조항

- **render-specs.js 원본 무변경**: 기존 파일을 수정하지 않는다. 별도 래퍼 스크립트를 작성.
- **portal 코드 무변경**: server.js 등 기존 서빙 코드 건드리지 않음.
- **원본 포팅, 재해석 금지**: render-specs.js의 렌더 로직을 재구현하지 않는다. import해서 호출만.
- **monk.kr 기존 페이지 무변경**: 신규 디렉토리에만 작업.

---

## §1 래퍼 스크립트 작성

### 위치

```
scripts/build-specs-poc.js
```

### 동작

1. `render-specs.js`를 import
2. kr-passport 슬러그 + ko 언어로 렌더 함수 호출
3. 반환된 HTML을 `MONK_kr/specs-test/kr-passport/index.html`에 저장

### 핵심 구현

render-specs.js가 `res.send(html)`로 응답하는 구조일 경우:
- mock `req`/`res` 객체를 만들어서 `res.send`를 가로채 HTML 캡처
- 또는 render 함수가 HTML 문자열을 반환하는 내부 함수가 있으면 그것을 직접 호출

**render-specs.js 내부를 먼저 Read하고**, HTML 생성 지점을 찾아서 최소 개입으로 캡처할 것. 래퍼 코드는 최대한 짧게 (50줄 이내).

---

## §2 정적 파일 배치

```
MONK_kr/
  specs-test/
    kr-passport/
      index.html       ← 빌드 출력
```

---

## §3 배포 및 비교

1. `wrangler pages deploy MONK_kr/` (기존 배포)
2. 두 URL 비교:
   - **SSR**: `https://monkos.ai/specs/kr-passport` (현재 CR 서빙)
   - **SSG**: `https://monk.kr/specs-test/kr-passport/` (CF 정적 서빙)

### 비교 항목

| 항목 | 확인 방법 |
|------|----------|
| HTML 구조 일치 | diff (태그 구조, 클래스, 콘텐츠) |
| 동적 요소 (T1 버튼, 가격) | SSG에서 빈 슬롯 vs SSR에서 값 채움 — **차이가 나는 것이 정상** |
| CSS/JS 로딩 | 정적 자산 경로가 monk.kr에서 작동하는지 |
| 이미지 (도해) | GCS 절대 URL이면 무관, 상대 경로면 깨짐 확인 |
| SEO 메타 (title, description, JSON-LD) | 일치 여부 |
| PSI 점수 | monk.kr SSG 버전의 모바일 점수 측정 |

---

## §4 PSI 측정

SSG 배포 후:
- `https://monk.kr/specs-test/kr-passport/` 를 pagespeed.web.dev에서 모바일+데스크톱 측정
- CR SSR 55점(모바일) / 84점(데스크톱)과 비교

---

## §5 완료 기준

- [ ] `scripts/build-specs-poc.js` 래퍼 작성 (render-specs.js 무변경)
- [ ] kr-passport HTML 정적 생성 성공
- [ ] monk.kr 배포 + 페이지 접속 확인
- [ ] SSR vs SSG diff 보고 (일치/차이 항목)
- [ ] PSI 모바일+데스크톱 점수 보고
- [ ] COMPLETION 보고서
- [ ] PF_INFRA 히스토리 1행 어펜드
