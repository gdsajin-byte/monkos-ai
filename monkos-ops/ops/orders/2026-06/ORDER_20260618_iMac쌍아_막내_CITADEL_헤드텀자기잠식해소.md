---
type: order
date: 2026-06-18
from: iMac/쌍아
to: iMac/막내
portfolio: PF_CITADEL
status: 대기
---

# 지시서: 헤드텀 자기잠식 해소 — canonical 통일 + title 교정

> **[2026-06-18 11:51 KST]** iMac/쌍아 → 막내
> 근거: [제안서](../../proposals/PROPOSAL_20260618_iMac쌍아_헤드텀거버넌스_블로그축전환.md) + [웹민아 교차검증](../../reports/2026-06/REPORT_20260618_웹민아_헤드텀제안_교차검증.md)
> 작가님 승인: 2026-06-18 11:51 KST

---

## 목적

"AI 증명사진" 키워드에서 idphoto-kr 루트(/)와 /app이 중복 경쟁하고, 포털 블로그 2개가 같은 키워드를 물고 있는 자기잠식 구조를 해소한다. 대표 페이지를 **루트(/)**로 확정하고 모든 SEO 신호를 루트에 집중시킨다.

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: 시크릿/API키 생성·추측 금지
- **ch5 2조**: 배포는 deploy.sh 경유
- **절대 건드리지 말 것**: `guide/ai-photo` 페이지 (순위 11위, 보호 대상)
- **절대 건드리지 말 것**: SPA 라우팅 (`_legacy_spa`, `history.replaceState`, server.js `/app` 라우트, apple-touch-icon) — SEO 무관, 기능 파괴 위험

---

## 작업 항목

### A. idphoto-kr canonical + hreflang 통일 (3줄)

**파일**: `monkos_AI/public/index.html` (idphoto-kr)

| 행 | 현재 | → 변경 |
|----|------|--------|
| 34 `rel=canonical` | `https://idphoto-kr.monkos.ai/app` | `https://idphoto-kr.monkos.ai/` |
| 35 `hreflang ko` | `https://idphoto-kr.monkos.ai/app` | `https://idphoto-kr.monkos.ai/` |
| 36 `hreflang ja` | `https://idphoto-jp.monkos.ai/app` | `https://idphoto-jp.monkos.ai/` |

### B. idphoto-jp canonical + hreflang 통일 (3줄)

**파일**: idphoto-jp의 `public/index.html` (JP 서비스)

KR↔JP hreflang은 한 쌍이므로 JP도 반드시 동시 변경. 미변경 시 hreflang 클러스터 붕괴.

| 행 | 현재 | → 변경 |
|----|------|--------|
| 33 `rel=canonical` | `https://idphoto-jp.monkos.ai/app` | `https://idphoto-jp.monkos.ai/` |
| 34 `hreflang ja` | `https://idphoto-jp.monkos.ai/app` | `https://idphoto-jp.monkos.ai/` |
| 35 `hreflang ko` | `https://idphoto-kr.monkos.ai/app` | `https://idphoto-kr.monkos.ai/` |

> ⚠️ 행 번호는 웹/민아 실측 기준. 실제 파일에서 `canonical`, `hreflang`을 grep하여 확인 후 변경할 것.

### C. 포털 내부링크/CTA — 루트로 통일

idphoto-kr/app 또는 idphoto-jp/app으로 링크된 곳을 루트(/)로 변경. 동일 index.html이라 기능 영향 없음, SEO 권위 결집 목적.

| 파일 | 행(참고) | 내용 |
|------|---------|------|
| `MONK_kr/lib/cms/render-static.js` | ~481 | CTA 버튼 URL (전 포털 페이지 렌더, 최대 영향) |
| `MONK_kr/public/js/i18n.js` | ~138 | 다국어 링크 |
| `MONK_kr/scripts/seed-layout.js` | ~43 | 레이아웃 시드 |
| `MONK_kr/lib/prompts.js` | ~71, 92 | RAG 프롬프트 내 URL |
| `MONK_kr/seed_cs_knowledge.js` | ~93 | 챗봇 지식 베이스 |

> 행 번호는 참고용. `grep -rn "idphoto-kr.monkos.ai/app\|idphoto-jp.monkos.ai/app"` 으로 전수 탐색 후 변경할 것. `/app/` (슬래시 뒤 하위경로)이 아닌 `/app` (맨끝) 패턴만 대상.

### D. 블로그 title/H1 교정 (2개만)

포털 블로그에서 "AI 증명사진" 헤드텀이 title/H1에 포함된 **약체 페이지 2개만** 교정. 본문은 건드리지 않는다.

| 페이지 | 현재 title | 조치 |
|--------|-----------|------|
| `monkos.ai/blog/vol38-ai-kr` | "AI증명사진 — 셀카로 증명사진 찍을 때 꼭 알아야 할 것" | title/H1에서 "AI증명사진" 제거. "셀카로 증명사진 찍을 때 꼭 알아야 할 것" 등 고유 롱테일로 교체 |
| `monkos.ai/blog/ai-kr` | "사진관에서 만든 AI 증명사진 플랫폼?" | title/H1에서 "AI 증명사진" 제거. "사진관이 만든 AI 플랫폼, MONKOS의 시작" 등으로 교체 |

> 교체 title은 예시. 해당 글의 실제 내용에 맞게 자연스러운 롱테일로 선정할 것.
> **guide/ai-photo는 절대 건드리지 않는다** (11위, 최강 자산).

블로그 콘텐츠 위치: `MONK_kr/lib/cms/` 또는 `MONK_kr/content/blog/` 내 해당 슬러그의 데이터 파일. `grep -rn "vol38-ai-kr\|ai-kr"` 으로 탐색.

각 블로그 본문에 `idphoto-kr.monkos.ai/` (루트)로의 내부링크 1개를 자연스럽게 삽입 (예: "AI 증명사진을 체험해보세요 →").

---

## 배포

- A+B 변경 후: `./deploy.sh prod` (idphoto-kr, idphoto-jp 각각)
- C+D 변경 후: monk.kr 배포 (CF Pages — git push로 자동)

---

## 검증

- [ ] `curl -s https://idphoto-kr.monkos.ai/ | grep canonical` → 루트(/) 확인
- [ ] `curl -s https://idphoto-kr.monkos.ai/ | grep hreflang` → ko=루트, ja=루트 확인
- [ ] `curl -s https://idphoto-jp.monkos.ai/ | grep canonical` → 루트(/) 확인
- [ ] idphoto-kr 서비스 정상 작동 확인 (촬영 플로우 → 결과 → thankyou)
- [ ] 포털 CTA 클릭 → idphoto-kr 루트로 이동 확인
- [ ] blog vol38, ai-kr 페이지 title 변경 확인

---

## 완료 보고

- 수발신 헤더 필수
- COMPLETION 보고서 생성 → `monkos-ops/ops/reports/2026-06/`
- PF_CITADEL 히스토리 1행 어펜드
- 세션 로그 어펜드
