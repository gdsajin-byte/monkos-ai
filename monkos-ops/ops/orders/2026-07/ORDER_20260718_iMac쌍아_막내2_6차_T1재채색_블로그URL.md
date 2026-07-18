---
type: order
date: 2026-07-18
device: iMac
agent: 쌍아
target: 막내2
portfolio: PF_SPECS
status: 대기
priority: P1
---

# 지시서: T1 비백색국 배경 재채색 + 블로그 URL 정본화

**[2026-07-18 19:12 KST]** iMac/쌍아 → 막내2

## ⚠️ 준수 조항

- 전 지시서와 동일. jest 녹색 후 배포. deploy.sh 경유.
- **민아 교정 반영**: matteSpecPipeline이 아니라 `runMatteChain` 단독 사용 (이중 크롭 방지). matte.js에서 export 추가 필요.

## 작업 A: T1 비백색국 배경 재채색

### 배경

T1(나노)은 흰 배경 고정 생성. 회색·파랑·빨강 배경국에서 T1 산출물이 규정 위반. T0는 matte가 이미 배경색 합성하고 있으므로, T1에도 동일 로직 적용.

### 수정

**1. matte.js — runMatteChain export 추가**

```javascript
// 기존 내부 함수를 export
export async function runMatteChain(cropB64, bgColor, slug) { ... }
```

**2. portal/server.js — T1 경로에 재채색 분기 추가**

T1 재크롭 완료 후, 배경이 흰색이 아닌 슬러그에서만 매트+배경색 합성:

```javascript
import { runMatteChain } from './lib/matte.js';  // 추가 import
import { getSpecBgColor } from './lib/matte.js';  // 기존 import 확인

// T1 재크롭 성공 후 (cropRes.image가 있을 때)
const bgColor = getSpecBgColor(slug);
if (bgColor !== '#FFFFFF' && cropRes.image) {
  try {
    const matteResult = await runMatteChain(cropRes.image, bgColor, slug);
    if (matteResult && matteResult.image) {
      cropRes.image = matteResult.image;
    }
    // 매트 실패 시: 흰배경 출고 (작가님 승인 잠정 폴백)
  } catch (e) {
    log(`[IDPhoto] T1 배경 재채색 실패 (${slug}) — 흰배경 유지: ${e.message}`);
  }
}
```

**핵심**: 매트 실패 시 흰배경 그대로 출고 (에러가 아님 — 잠정 폴백으로 작가님 승인 상태).

### 영향 범위

- gray 국가 (KZ·CH·AT·DK·GR·DE·NZ): T1 산출물 → #D5D5D5 or #CCCCCC 배경
- light-gray (UK·FR·FI·AU·RU): T1 산출물 → #F0F0F0 배경
- 흰색 국가: 변경 없음 (bgColor === '#FFFFFF' → 스킵)
- 파랑·빨강 (KW·OM·ID): 현재 T1 비노출이라 도달 안 함 (향후 열리면 자동 처리)

### 추가: gray T1 비노출 해제

재채색이 들어가면 gray국도 T1 노출 가능:

```javascript
// render-specs.js L411-412
// 삭제: const grayBg = /^회색$/.test(...)
// 삭제: const t1RetouchOn = t1RetouchOnEnv && !grayBg;
// 변경:
const t1RetouchOn = t1RetouchOnEnv;  // 배경 무관 — 재채색이 보장
```

---

## 작업 B: 블로그 URL 정본화

### 배경

GSC 실측: 변형 URL 19건(-kr 17 + -en 1 + 오염 1)이 색인·노출 중(노출 253·클릭 6). 정본과 경합.

**민아 제안서 정본**: `monkos-ops/ops/proposals/PROPOSAL_20260718_민아_블로그URL정본화.md` — 반드시 Read 후 착수.

### 수정 (portal/lib/cms/render-blog.js)

**1. 변형 슬러그 301 리다이렉트**

ko 경로에서 슬러그가 `-kr`, `-en`, `-ja` 접미형이면:
- 클린 베이스 슬러그(접미사 제거) 레코드 존재 확인
- 존재 시: `-kr` → 정본 ko 경로 301 / `-en` → `/en/blog/...` 301 / `-ja` → `/ja/blog/...` 301
- 미존재 시: 기존 로직 (raw 키 서빙)

```javascript
// 접미형 변형 301
const suffixMatch = slug.match(/^(.+)-(kr|en|ja)$/);
if (suffixMatch) {
  const baseSlug = suffixMatch[1];
  const suffixLang = suffixMatch[2] === 'kr' ? 'ko' : suffixMatch[2];
  if (BLOG_DATA[baseSlug]) {
    const target = suffixLang === 'ko'
      ? `/blog/${baseSlug}`
      : `/${suffixLang}/blog/${baseSlug}`;
    res.writeHead(301, { Location: target });
    return res.end();
  }
}
```

**2. SEO_TITLE_OVERRIDES 키 정정**

변형 슬러그를 키로 쓰고 있는 오버라이드 → 클린 슬러그로 변경.

**3. canonical 태그 정본화**

canonical URL이 현재 요청 URL 그대로가 아니라, 항상 클린 정본 URL을 가리키도록.

### 검증

- 변형 19건 전수 curl → 301 확인
- 정본 URL → 200 무회귀
- 언어별 경로 정상 작동

---

## 배포

```
1. jest 녹색 확인
2. portal 배포: cd monkos_AI/portal && ./deploy.sh prod
3. 라이브 확인:
   - KZ T1 생성 → 배경 #D5D5D5 (흰색 아님)
   - UK T1 생성 → 배경 #F0F0F0
   - KR T1 → 배경 흰색 (변경 없음)
   - 블로그 변형 URL → 301 리다이렉트
```

## 완료 조건

1. A+B 수정 + jest 녹색
2. portal 재배포
3. 라이브 확인 4건 이상
4. COMPLETION 보고서: `monkos-ops/ops/reports/2026-07/COMPLETION_20260718_iMac막내2_6차_T1재채색_블로그URL.md`
5. 커밋 → 푸시
