---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/민아
status: 대기
pf: PF_MONK_OS
track: H-7 선행 조사
priority: P1
---

# [지시서] claude.ai "Claude 맞춤설정" UI 전수 실측 조사 (PF_MONK_OS / H-7 선행)

> **[2026-04-23 13:50 KST] iMac/쌍아 → iMac/민아**
> 상위 PF: [PF_MONK_OS](../portfolios/PF_MONK_OS/README.md)
> 상위 로드맵: [ROADMAP_portable_agent_os.md §2.5 §H-7 §PoC-4](../portfolios/PF_MONK_OS/roadmap/ROADMAP_portable_agent_os.md)
> 목적: 2026-04-23 개편된 claude.ai UI(Connectors·Skills·Plugins)의 실제 동작·포맷·제약을 **Desktop App 환경**에서 실측하여 H-7 법률 신설 및 PoC-4 Plugin 패키지화의 기반 자료 확보

---

## 배경

- 작가님 관찰(2026-04-23): claude.ai "Claude 맞춤설정" UI가 3계층(Connectors/Skills/Plugins) 정식 개편
- Track A 문헌 조사: "cross-surface 자동 동기화 없음" → 정본 단일 원칙(헌법 3조 4항) 충돌 리스크
- **민아 = MONK OS 유일 Desktop App 에이전트** → 이 UI 직접 접근 가능한 유일 조사 주체
- H-7 법률 신설·PoC-4 Plugin 패키지화는 본 실측 없이 진행 불가

---

## 조사 범위 (8축 + 스크린샷 의무)

### 1. Connectors (앱 연결)
1. "앱 연결" 메뉴 진입 → **설치 가능한 커넥터 전수 목록** (이름·설명·공식/서드파티 구분)
2. 작가님 계정에서 **이미 연결된 커넥터** 목록
3. **커스텀 MCP 서버 추가 경로** 확인: URL 입력? OAuth? 로컬 stdio도 가능?
4. `.mcp.json`(Claude Code) ↔ claude.ai UI 간 **임포트/익스포트 가능 여부**
5. 권한 범위 조정 UI 존재 여부 (read/write 분리 등)

### 2. Skills (새 스킬 만들기)
1. "새 스킬 만들기" UI 진입 → **입력 필드 전수** 스크린샷
2. 필수 필드 vs 선택 필드 구분
3. **기존 MONK 스킬 1건 복붙 import 시도**: `/Users/jeong-kyushin/developer/monk_project/.claude/skills/session-start.md` 내용 전체를 UI에 붙여넣고 결과 기록 (에러? 파싱 성공?)
4. 저장 범위: 개인 / 팀 / 조직 구분 UI
5. 생성된 스킬의 **export·복사 가능 여부** (YAML/MD 원본 확인)
6. UI가 노출하는 frontmatter 확장 필드 (`trigger`·`version`·`allowed-tools`·`when_to_use` 등) 전수
7. 스킬 동작 미리보기·테스트 기능 존재 여부

### 3. Plugins (플러그인 탐색)
1. 마켓플레이스 UI 진입 → **카테고리·총 개수·검색 동작** 기록
2. **공개 플러그인 샘플 3건** 선택, 각각의:
   - 제작자·공식 여부
   - 포함 자산(Skills 몇 개? Connectors 몇 개?)
   - 설치 후 어디에 뭐가 추가되는가 (Connectors 탭 자동 추가? Skills 자동 추가?)
3. **Claude Code `/plugin` 명령 풀** vs **claude.ai UI 플러그인 풀**: 동일? 별개?
4. 플러그인 **제출·공개 경로** (개발자 문서 링크 등)
5. 플러그인 내부 파일 구조 (설치 후 로컬 저장 경로 확인 가능하면)

### 4. Surface 간 동기화 실측
1. claude.ai에서 **스킬 1건 생성** → Claude Code CLI(iTerm에서 `claude` 실행) 세션에서 자동 표시 여부
2. 역방향: `.claude/skills/session-end.md`가 claude.ai에 표시되는가
3. Connectors 동기화 실측
4. Plugins 동기화 실측
5. 동일 결과를 **스크린샷**으로 기록

### 5. 포맷 추출 및 공식 문서 대조
1. UI로 생성한 스킬의 실제 저장 포맷 (가능하면 추출)
2. Track A가 문서 [S1]·[S2]에서 확인한 frontmatter 필드와 실제 UI 필드의 **일치·차이 표** 작성
3. 누락 필드·신규 필드 모두 기록

### 6. 제약·권한·요금제
1. 작가님 현재 플랜(Pro/Max/Team) 기준 사용 가능 범위
2. 플랜별 차이 공지가 있다면 기록
3. 개인/프로젝트/조직 수준 설정 (Track A의 Enterprise > Personal > Project 우선순위 대조)

### 7. 스크린샷 의무 (민아 고유 권한)
- 각 UI 진입·동작 화면을 **반드시 스크린샷**으로 기록
- 저장 경로: `monkos-ops/ops/portfolios/PF_MONK_OS/research/assets/`
- 파일명: `SURFACE_YYYYMMDD_{section}_{n}.png` 예: `SURFACE_20260423_skills_01.png`
- 최소 15장 이상 권장

### 8. MONK OS 관점 결론 3문항 (민아 판단)
1. **현 MONK OS Skills 9건을 claude.ai UI로 올리면 동작 가능/번역 필요/불가** 중 어디?
2. **PoC-4 Plugin 패키지화** 최소 스펙은? (필수 파일·네이밍·마켓플레이스 제출 경로)
3. **H-7 Surface 정책** 작성 시 반드시 결정해야 할 포인트 3건?

---

## 조사 방법

1. **실측 우선** — 문헌 인용보다 UI 캡처·실제 동작 기록
2. 공식 문서 병기: claude.com/docs 또는 support.anthropic.com 링크 동반
3. 작가님 계정 상태 변경 최소화 — **테스트 스킬 1건·테스트 커넥터 연결은 허용**, 생성물에 `[TEST]` 프리픽스 후 조사 완료 시 제거
4. 유료 플러그인 설치 금지 (무료·공식만)
5. 불확실 시 `⚠️ 확인 필요` 표기

---

## 산출물

**메인 보고서**: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_SURFACE_claudeai_UI.md`

구조:
```
---
type: RESEARCH
track: H-7
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/민아
environment: claude.ai Desktop App
---
# RESEARCH — claude.ai Surface 실측
## 요약 (최상단 500자)
## 1. Connectors 실측
## 2. Skills 실측 (기존 MONK Skill import 시도 포함)
## 3. Plugins 실측
## 4. Surface 간 동기화 실측
## 5. 포맷 추출 및 Track A 대조
## 6. 제약·권한·요금제
## 7. 스크린샷 인덱스 (파일명 목록)
## 8. MONK OS 관점 결론 3문항 답
## 9. 공식 문서 URL 목록
```

**스크린샷**: `research/assets/SURFACE_20260423_*.png` (15장 이상 권장)

---

## 준수 조항

⚠️ 타임스탬프: 매 턴 `date` KST (헌법 3조 1항)
⚠️ 추정 금지 — `⚠️ 확인 필요` 플래그
⚠️ 스크린샷 필수 — 텍스트 묘사만으로는 불충분
⚠️ 작가님 계정 설정 **영구 변경 금지** — 테스트 자산은 조사 완료 시 정리
⚠️ 유료 플러그인·결제 발생 작업 금지
⚠️ 완료 시 PF_MONK_OS README 히스토리 append + ROADMAP §2.5 / H-7 / PoC-4 관련 섹션 업데이트 제안(민아 판단 포함)
⚠️ 세션 로그: `monkos-ops/ops/sessions/2026-04-23_iMac_민아.md`

---

## 완료 보고 형식

```
✅ H-7 실측 조사 완료 — RESEARCH_SURFACE_claudeai_UI.md
📁 [링크](monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_SURFACE_claudeai_UI.md)
📸 스크린샷 N장 (research/assets/)
💡 핵심 발견 3줄 (특히 surface 간 동기화 결과 + MONK Skill import 결과)
⚠️ 확인 필요 항목 N건
⏳ H-7 / PoC-4 설계 반영 제안
```
