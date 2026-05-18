---
type: ORDER
date: 2026-05-04
from: iMac/쌍아
to: 막내(any)
subject: 체계 정비 — feedback 정리 + MEMORY 다이어트 + settings 정리
priority: 높음
---

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내N → iMac/쌍아` 형식

## 배경

4월 이후 에이전트 품질 하락 원인 분석 결과, 시스템 측 이슈(Claude Code 버전 구형 — 별도 대응) 외에 프로젝트 측 위생 정비가 필요하다.

1. feedback 메모리 파일 20개가 실제 행동에 영향을 주지 못하면서 존재만 하고 있음
2. MEMORY.md가 194줄로 200줄 캡 직전
3. global settings.json allow 목록에 일회성 허용이 90줄 이상 누적

## 실행 내용

### 작업 1: feedback 파일 전수 삭제

경로: `~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/`

아래 20개 파일을 **전부 삭제**한다:
```
feedback_cdp_autotranslate_artifact.md
feedback_cdp_is_universal_tool.md
feedback_check_pf_when_stuck.md
feedback_concise_briefing.md
feedback_constitution_overextension.md
feedback_deploy_first.md
feedback_diagnose_with_resource_first.md
feedback_engine_first_design_later.md
feedback_full_authority_principle.md
feedback_japan_is_first_market_not_only.md
feedback_mcp_over_cdp_for_docs.md
feedback_mina_role_recognition.md
feedback_no_agent_spawn.md
feedback_no_full_replace_obsession.md
feedback_no_range_auto_mapping.md
feedback_no_recycled_analysis.md
feedback_no_worktree.md
feedback_quality_decline_pattern.md
feedback_verify_before_propose.md
feedback_worktree_path.md
```

### 작업 2: MEMORY.md 다이어트

MEMORY.md에서 아래 변경:

1. **"피드백 메모리" 섹션 전체 삭제** — 작업 1에서 파일을 삭제했으므로 인덱스도 제거
2. **"외장 메모리" 인덱스 정리** — 아래 기준으로 축소:
   - 유지: 4MUSE 기원, 미결 어젠다, CDP 관련(역할융합/에코시스템), 자비스 비전, 엔드게임, 광고=오가닉 부스터, AI 철학, 품질하락패턴 경고
   - 삭제: 소넷이 아카이브, TTS/Voice 아키텍처, 블록에디터 기안서, 블로그에디터 기술명세서, 민아 도입 입법예고, 3D 아바타 비전, 보안 관리 체계화, 결제 게이트웨이 제약, LS API 우회, 글로벌 결제 탈옥, MONKOS 조직 구성, ElevenLabs TTS 구독, Claude 4.7 운용관찰, Claude 4.7 산업분석, 인문기술 비구분 철학, 민아 역할 인식, 크리에이터 에이전트, 컨텍스트 아키텍처
   - (외장 .md 파일 자체는 삭제하지 않음 — 인덱스에서만 제거)
3. **works 상세 운용 규정** 압축: 현재 ~20줄 → 핵심 5줄로
4. **목표: 155줄 이하**

### 작업 3: global settings.json allow 정리

경로: `~/.claude/settings.json`

`permissions.allow` 배열에서:
- **유지**: 반복 사용하는 패턴만 (git, gcloud run, scripts/, curl -s http://localhost, python3, Read 경로 등)
- **삭제**: 일회성 curl 다운로드 (mediapipe 7개), sshpass 4060 관련 (세션 특화), 특정 git -C 명령 (일회성), pkill 명령, 특정 파일 open 명령, 기타 한 번 쓰고 안 쓸 것들
- 정리 후 **30줄 이내** 목표

## 검증

1. feedback 파일 삭제 후 memory 폴더에 feedback_*.md가 0개인지 확인
2. MEMORY.md가 155줄 이하인지 `wc -l`로 확인
3. global settings.json이 valid JSON인지 `python3 -c "import json; json.load(open(...))"` 확인
4. allow 목록이 30줄 이내인지 확인

## ⚠️ 준수 조항

- 헌법 3조 1항: 매 턴 `date` 명령으로 KST 타임스탬프 취득
- 헌법 4조 2항: `rm -rf` 사용 금지. 파일 삭제는 `rm` 개별 파일 지정
- 헌법 3조 2항: 완료 보고 필수
- MEMORY.md 변경 시: `monkos-ops/ops/MEMORY_CHANGELOG_iMac.md` 기록

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | 커밋+push |
| 산출물 | MEMORY.md (갱신), settings.json (갱신) |
| 문서 유형 | 해당 없음 |
| 세션 로그 | `[ops] 체계 정비` 태그 커밋 |
