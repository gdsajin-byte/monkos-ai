---
type: ORDER
date: 2026-04-05
from: iMac/민아 → to: iMac/막내2
status: 대기
priority: 긴급 (D-4, 4/9 대면평가)
target: PT 영상용 CDP/MCP/멀티에이전트 동작 화면 캡처
---

# 지시서: CDP 동작 화면 캡처 + 에이전트 짤 촬영

> **배경**: PT 영상 S7(기술력 증명) 시퀀스에 삽입할 시각 자료가 없음.
> **목적**: 에이전트가 브라우저를 직접 제어하는 장면을 캡처/GIF로 촬영.
> **외부 노출 자료이므로 내부 기밀(에이전트 호칭 등) 노출 금지.**

---

## 1. 촬영 항목

### 캡처 1: CDP 브라우저 제어 (스크린샷 3장 + GIF 1개)

**시나리오**: CDP로 monkos.ai 접속 → 페이지 탐색 → 스크린샷 촬영

```bash
# 디버그 크롬 시작
scripts/tools/cdp_setup.sh start 9222

# 탭 목록 확인
scripts/tools/cdp.sh tabs

# monkos.ai 이동
scripts/tools/cdp.sh navigate "https://monkos.ai" 0

# 스크린샷
scripts/tools/cdp.sh screenshot /tmp/cdp_demo_1.png 0

# JS 실행 (제목 취득)
scripts/tools/cdp.sh eval "document.title" 0

# 다른 페이지로 이동
scripts/tools/cdp.sh navigate "https://monkos.ai/crop" 0
scripts/tools/cdp.sh screenshot /tmp/cdp_demo_2.png 0

# 어드민 에디터
scripts/tools/cdp.sh navigate "https://monkos.ai/admin/blog-edit.html" 0
scripts/tools/cdp.sh screenshot /tmp/cdp_demo_3.png 0
```

**캡처 포인트**: 터미널 명령어 + 브라우저 화면이 동시에 보이는 구도

**GIF**: 위 시나리오를 연속 실행하면서 화면 녹화 → GIF 변환 (약 10초)

### 캡처 2: Playwright MCP 접근성 트리 (스크린샷 2장)

```bash
# Playwright MCP로 접근성 트리 조회
# Claude Code 터미널에서 Playwright 도구 호출 장면
# → 접근성 트리 출력 화면 캡처
# → ref ID로 요소 클릭하는 장면 캡처
```

### 캡처 3: 멀티에이전트 병렬 가동 (스크린샷 1장)

**구도**: 터미널 4분할 (또는 탭 4개 노출)
- 각 터미널에서 서로 다른 작업 수행 중인 장면
- **호칭 마스킹**: 터미널 프롬프트에 "쌍아/민아/막내" 노출 시 블러 처리 또는 크롭
- 외부용 표기: "Agent 1", "Agent 2" 등

### ~~캡처 4: 삭제~~ (바우쳐 캡처 불필요 — 작가님 지시 04/05)

---

## 2. 출력 경로

모든 캡처를 아래에 저장:

```
apps/monkos-3d/public/assets/demo/
├── cdp_demo_1.png
├── cdp_demo_2.png
├── cdp_demo_3.png
├── cdp_demo.gif         (선택)
├── playwright_tree.png
├── playwright_click.png
├── multi_agent.png
├── (바우쳐 캡처 삭제)
└── README.md            (각 파일 설명)
```

---

## 3. 이미지 사양

- **해상도**: 최소 1920×1080 (Full HD)
- **포맷**: PNG (스크린샷), GIF (동작 시연, 10초 이내)
- **파일 크기**: 개당 5MB 이하
- **마스킹**: 민감정보는 검정 박스 또는 블러 처리

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 프로젝트 ID 등 민감정보 노출 금지. 캡처 후 반드시 마스킹 확인
- **헌법 4조 3항**: 내부 기밀 보호. 에이전트 호칭(쌍아/민아/막내), 내부 프로토콜 명칭 외부 노출 금지
- **파괴적 명령 금지**: 촬영 시나리오 실행만. 서비스 데이터 변경 금지

---

## 4. 완료 기준

1. `apps/monkos-3d/public/assets/demo/` 에 캡처 8장 이상 저장
2. 민감정보 마스킹 완료 확인
3. 내부 호칭 노출 없음 확인
4. 완료 보고 (✅❌💡⏳📁🔀 형식)
