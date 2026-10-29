---
type: order
date: 2026-10-29
from: iMac/쌍아
to: iMac/쌍아-막내1
subject: 소소(디자인 TF) 강화용 외부 하네스·디자인 도구·스킬 벤치마크 조사 — 조사 보고서 1건, 설치·코드 변경 없음
status: 대기
portfolio: PF_DESIGNLAB
---

# ORDER — 디자인 하네스·도구·스킬 벤치마크

**[2026-10-29 14:17 KST]** iMac/쌍아 → iMac/쌍아-막내1

출처: 작가님 14:16 채팅 원문 — "사실 소소 세션을 강화해야 디자인과 ui를 파워풀하게 할수 있을것 같은데.. 그 세팅이 만만치 않네 외부 하네스나 디자인 쪽 도구 스킬등 벤치마크할만한게 있을지 막내에게 찾아보라고 해". 범위 승인 = 본 문서 §2·§3(조사·보고서 작성까지).

## 1. 배경

- 소소 = 디자인 TF 리드 세션(시범). 정의 `.claude/agents/soso.md` + 팀원 `dsn-scout`·`dsn-maker`·`dsn-critic`, 기동 `scripts/mk-soso.sh`, 헌장 `monkos-ops/ops/proposals/PROPOSAL_20261002_iMac민아_디자인TF_소소세션_시범편성.md`.
- 10-28 첫 실가동(증명사진관 허브 시안 A·B, 산출 `monkos-ops/tech/designs/2026-10/idphoto_hub/`)에서 드러난 것:
  - 백그라운드 세션(`claude --bg`)에서는 에이전트 팀 기능이 뜨지 않아 팀원을 서브에이전트로 대체했다.
  - 토큰 553k(maker 230k+239k, critic 84k) — 시안 2안에 비해 무겁다.
  - 브라우저 포트 격리(CDP 포트별 크롬)와 Playwright MCP 포트 고정(`.mcp.json` 공유, `CDP_PORT` 환경변수로만 분리) 세팅이 번거롭다.
  - 작가님 판단(10-25): 디자인·UIUX는 노동집약 영역이고 시장과의 마지막 접점. 해법 방향은 "에이전트가 레퍼런스 UI를 라이브로 직접 체험 → 우리 것과 비교 → 개선점 도출".
- 이미 연결된 것(중복 추천 금지, 대신 "활용도" 평가는 할 것): Figma MCP, Canva MCP, Playwright MCP, CDP 스크립트(`scripts/tools/cdp.sh`·`cdp_utils.py`), Claude Artifact(`artifact-design` 스킬), Kling(영상·이미지), IMAGE PRO(Imagen 4·Gemini 3 Pro Image).

## 2. 할 일

1. 위 배경 파일 3개(soso.md·헌장·`idphoto_hub/` 산출 목록)를 먼저 읽고 현행 구성을 5줄로 요약한다.
2. 외부 벤치마크 후보를 조사한다. 범주:
   - **A. 에이전트 하네스·워크플로** — 디자인·프론트 작업용 Claude Code 플러그인·스킬·서브에이전트 구성, 다른 에이전트 도구(Codex·Cursor·Gemini CLI 등)의 디자인 모드, 공개된 "디자인 에이전트" 레포·사례
   - **B. 생성 도구** — UI 생성형 서비스(예: v0·Lovable·Bolt·Google Stitch 계열 등), 컴포넌트 레지스트리 MCP(예: shadcn·21st.dev 계열 등)
   - **C. 검증 도구** — 시각 회귀·캡처 비교·접근성 자동 점검(Storybook·Chromatic·Playwright 스냅샷 계열 등), 디자인 토큰 관리 도구
   - 예시 이름은 출발점일 뿐이다. 현재 존재·유지되는지 공식 출처로 확인하고, 없는 것은 빼라.
3. 후보마다 평가: ① 무엇을 해 주는가 ② 우리 구조(정적 HTML 시안·CDP 직접 체험·bg 세션·한국어 서비스)에 붙는가 ③ 비용(무료/구독/종량) ④ 설치·연결 방식(MCP·스킬·CLI·웹) ⑤ 10-28 병목(팀 미노출·토큰·포트 세팅) 중 무엇을 줄이는가 ⑥ 출처 URL·확인일.
4. 추천 3개 이내 + 각각 "도입 시 첫 시험 1건"(작은 단위)을 제안한다. 이미 연결된 도구를 더 잘 쓰는 방안이 외부 도입보다 낫다면 그것을 1순위로 적어도 된다.

## 3. 산출물·쓰기 범위

- 보고서 1건: `monkos-ops/ops/reports/2026-10/RESEARCH_20261029_iMac쌍아-막내1_DESIGNLAB_디자인하네스_벤치마크.md` (YAML: type research, date, device, agent, portfolio PF_DESIGNLAB)
- 첫 줄 결론 1줄 → 비교표 → 추천 3 → 미확인·한계.
- COMPLETION 1건(ch7): `monkos-ops/ops/reports/2026-10/COMPLETION_20261029_iMac쌍아-막내1_DESIGNLAB_디자인하네스_벤치마크.md`
- 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-29_iMac_쌍아-막내1.md`, PF_DESIGNLAB 히스토리 1행(`scripts/pf.sh append`).
- **쓰기는 위 4곳만.** 서비스 코드·`.claude/`·`.mcp.json`·설정 파일 수정 금지.

## 4. ⚠️ 준수 조항

- **패키지·CLI·MCP·플러그인 설치 금지, 외부 서비스 가입·로그인 금지**(ch1 7조 승인 게이트). 조사는 웹 문서·공식 레포 읽기로만. 써 봐야 알 것은 "미실증"으로 표기.
- 헌법 4조 1항 — API 키·토큰 생성·추측 금지. 가격·한도는 공식 페이지 원문 기준, 기억 기반 수치 금지(확인일 기재).
- 브라우저가 필요하면 **9222(쌍아)·9223(민아) 금지**. 웹 조사는 WebSearch·WebFetch로 충분하다.
- 헌법 3조 1·2항 — `date` 실측, 세션 로그, 완료 보고 `✅❌💡⏳📁🔀`.
- 판정(도입 여부)은 쌍아·작가님이 한다. 보고서는 사실과 추천까지.

## 5. 완료 기준

- [ ] 현행 구성 요약 5줄
- [ ] 후보 범주 A·B·C 각 1개 이상, 전부 출처 URL·확인일
- [ ] 추천 3개 이내 + 첫 시험 1건씩
- [ ] 작업 브랜치 커밋·푸시 + 원격 SHA 대조 후 완료 보고

## 6. 커밋 메시지

```
[research] 소소 강화용 디자인 하네스·도구·스킬 벤치마크
```
