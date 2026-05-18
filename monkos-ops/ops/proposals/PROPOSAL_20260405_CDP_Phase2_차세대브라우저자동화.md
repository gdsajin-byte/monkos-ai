---
type: proposal
date: 2026-04-05
author: M1/민아
to: M1/쌍아
portfolio: PF_CDP
subject: PF_CDP Phase 2~3 보정 — 차세대 브라우저 자동화 통합
status: 작가님 승인 완료 → 쌍아 설계 요청
---

# PF_CDP Phase 2~3 보정 제안서

**[2026-04-05 07:25 KST] M1/민아 → M1/쌍아**

> 근거: 2026-04-05 트래픽 종합 분석 + CDP 병목 진단 + 차세대 기술 리서치
> 작가님 방향 확인: "에이전트가 스케줄에 의해 자동으로 배포라인을 타야 한다"
> 작가님 승인: PF_CDP 내 통합 (별도 PF 불필요)

---

## 1. 배경: 왜 지금인가

### 트래픽 분석에서 드러난 구조적 문제
- 자연검색 3개월 클릭 27회 — SEO 사실상 제로
- **리페럴(SNS) 참여율 60%, 체류 2분 2초** — 콘텐츠 경유 유입이 최고 품질
- 한송이가 40일간 100개 콘텐츠를 4채널 수동 배포 중 — 이미 검증된 파이프라인
- **병목은 콘텐츠 양이 아니라 배포 자동화** — 수동 루틴의 한계

### CDP 현재 병목
| 병목 | 현상 | 영향 |
|------|------|------|
| **좌표 기반 클릭 깨짐** | 해상도/레이아웃 변경 시 좌표 무효화 | 자동화 워크플로우 전체 중단 |
| **채널별 에디터 파편화** | 12채널 × 각각 다른 입력 방식 하드코딩 | 유지보수 비용 폭증 |
| **Naver SmartEditor** | 서식/링크 입력 불가 (텍스트만) | KR SEO 핵심 채널 절반만 활용 |
| **Instagram** | 웹 게시 자체 차단 | 채널 누락 |
| **GA4/GSC 등 SPA** | 내부 네비게이션 클릭 실패 (오늘 직접 경험) | 모니터링 자동화 불가 |

---

## 2. 차세대 기술 조사 결과

### 핵심 3개 기술

#### Playwright MCP (Microsoft) — 접근성 트리 기반
- **무엇**: 브라우저의 접근성 트리(accessibility tree)로 요소를 식별. 좌표/셀렉터 불필요
- **클릭 문제 해결**: ref ID 기반 → 해상도·레이아웃 무관
- **CDP 연결**: `PLAYWRIGHT_MCP_CDP_ENDPOINT=ws://localhost:9222` 환경변수 하나로 기존 디버그 크롬에 직접 연결
- **비용**: 무료 오픈소스 (MS 공식)
- **적합 용도**: 기존 CDP 보강. 안정적 반복 작업
- **한계**: 자연어 이해 없음 (구조적 참조만)

#### Stagehand v3 (Browserbase) — 자연어 하이브리드
- **무엇**: `act("발행 버튼 클릭")`, `observe("로그인 폼 찾기")` 형태의 자연어 브라우저 제어
- **클릭 문제 해결**: LLM이 의미로 요소 탐색 → DOM 변경에도 적응
- **핵심 장점**: **캐싱** — 같은 사이트 반복 시 LLM 호출 생략 (비용 30%↓, 속도 2배↑)
- **CDP 연결**: 내부적으로 CDP 사용. 기존 포트(9222~9225) 연결 가능
- **비용**: 오픈소스. act() 1회 ~₩4~15 (GPT-4o 기준)
- **적합 용도**: note.com, Naver 등 복잡한 SPA. 스케줄 배포
- **언어**: TypeScript(메인), Python, Go, Java, Ruby, Rust

#### Browser Use — 완전 자율 에이전트
- **무엇**: 자연어 태스크 하나로 LLM이 전 과정을 자율 판단·실행
- **클릭 문제 해결**: DOM 인덱싱 + 스크린샷 비전 이중 확인 → 가장 강건
- **비용**: 매 스텝 LLM 호출 ($0.01~0.05/스텝). 반복 작업엔 비쌈
- **적합 용도**: 구조가 복잡하고 자주 변하는 난제 사이트 전용
- **언어**: Python 네이티브
- **한계**: 속도·비용 면에서 루틴 작업엔 과도

### 비교 매트릭스

| 항목 | Playwright MCP | Stagehand v3 | Browser Use |
|------|---------------|-------------|-------------|
| 클릭 정확도 | ★★★★★ | ★★★★☆ | ★★★★★ |
| 동적 SPA 대응 | ★★★★☆ | ★★★★★ | ★★★★★ |
| 속도 | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| LLM 비용/액션 | ₩0 | ₩4~15 | ₩15~75 |
| 반복 작업 효율 | ★★★★★ | ★★★★★ (캐싱) | ★★☆☆☆ |
| CDP 통합 난이도 | 환경변수 1줄 | 낮음~중간 | 중간 |
| 자체 호스팅 | 완전 | 가능 | 완전 |
| 헤드리스/스케줄링 | ✅ | ✅ | ✅ |

### 비추천 기술
- **Computer Use (Anthropic)**: 매번 스크린샷 루프 → 배포 자동화에 너무 느림
- **OpenAI Operator**: 자체 호스팅 불가, 생태계 종속
- **AgentQL**: 클라우드 API 종속, 단독 자동화 불가
- **Puppeteer 단독**: 좌표/셀렉터 의존 → 현재 CDP와 같은 문제 반복

---

## 3. PF_CDP Phase 보정안

### 기존 Phase 구조

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | CDP 프로토콜 검증 | ✅ 완료 (3/26) |
| 1 | cdp_utils.py 패키징 (530→767줄) | ✅ 완료 (3/27) |
| 2 | MCP 배포 + 멀티탭 | ⏳ 미착수 |
| 3 | 실시간 대화 + 역할 융합 | ⏳ 미착수 |

### 보정 Phase 구조

| Phase | 내용 | 핵심 산출물 | 예상 기간 |
|-------|------|-----------|----------|
| 0 | ✅ CDP 프로토콜 검증 | 8/8 함수 검증 | 완료 |
| 1 | ✅ cdp_utils.py 패키징 | 767줄, 35 메서드 | 완료 |
| **2** | **Playwright MCP 통합 + 접근성 트리 전환** | 좌표 의존 탈피, 기존 CDP 보강 | **1주** |
| **2.5** | **Stagehand v3 난제 사이트 적용** | note.com/Naver 자동 배포 파일럿 | **1~2주** |
| **3** | **스케줄 자동 배포 파이프라인** | cron + 채널별 에이전트 + 모니터링 | **2~3주** |
| 3.5 | Browser Use 자율 에이전트 (선택) | 난제 사이트 폴백 | 필요 시 |
| 4 | 실시간 대화 + 역할 융합 | 에이전트간 협조 | 장기 |

---

## 4. Phase 2 상세 설계 요청

### Phase 2: Playwright MCP 통합

**목표**: 좌표 기반 클릭을 접근성 트리 기반으로 전환. 기존 cdp_utils.py와 병존.

**작업 항목**:

1. **Playwright MCP 서버 설치 및 연결**
   - `npx @playwright/mcp@latest --cdp-endpoint ws://localhost:9222`
   - 또는 `.mcp.json`에 등록하여 Claude Code에서 직접 사용
   - Docker 이미지도 가용: `mcr.microsoft.com/playwright/mcp`

2. **cdp_utils.py 보강 — 접근성 트리 강화**
   - 현재 `read_page()`, `click_accessible()` 메서드 존재하나 활용 미미
   - Playwright MCP의 접근성 트리 접근 패턴을 cdp_utils.py에 반영
   - `click_element(selector)` → `click_accessible(role, name)` 전환 가이드

3. **GA4/GSC SPA 네비게이션 검증**
   - 오늘 실패한 GA4 인구통계 드롭다운, GSC 탭 전환 등을 Playwright MCP로 재시도
   - 성공 패턴을 모니터링 매크로로 정형화

4. **검증 기준**
   - 기존 7/12 채널 에디터가 접근성 트리 기반으로 동작 확인
   - GA4/GSC 리포트 자동 추출 성공
   - 좌표 하드코딩 0건

### Phase 2.5: Stagehand v3 적용

**목표**: 자연어 기반으로 note.com, Naver Blog 자동 배포 파일럿.

**작업 항목**:

1. **Stagehand Python SDK 설치**
   ```bash
   pip install stagehand
   ```

2. **note.com 자동 배포 워크플로우 구현**
   ```python
   # 의사 코드
   page.act("새 노트 작성 버튼 클릭")
   page.act("제목 입력란에 '{title}' 입력")
   page.act("본문 에디터에 '{content}' 붙여넣기")
   page.act("공개 설정을 전체공개로 변경")
   page.act("발행 버튼 클릭")
   ```

3. **캐싱 검증**
   - 동일 워크플로우 2회 차 실행 시 LLM 호출 생략 확인
   - 비용/속도 측정

4. **Naver Blog SmartEditor 돌파 시도**
   - Stagehand observe()로 에디터 구조 탐색
   - 서식/링크 입력 가능 여부 재검증

5. **검증 기준**
   - note.com 자동 발행 성공률 90%+
   - Naver Blog 서식 포함 발행 가능 여부 판정
   - 1건 배포당 소요 시간 측정 (목표: 2분 이내)

### Phase 3: 스케줄 자동 배포 파이프라인

**목표**: 콘텐츠 1건 입력 → 4채널 자동 배포 (cron 스케줄)

**아키텍처**:
```
[콘텐츠 DB / MONKOS Admin]
        ↓ (스케줄 트리거)
[배포 오케스트레이터]
        ↓
  ┌─────┼─────┬──────┐
  ↓     ↓     ↓      ↓
MONKOS  X   note   Naver
(CDP)  (CDP) (Stage) (Stage/BU)
9222   9223  9224   9225
```

**작업 항목**:
1. 배포 오케스트레이터 스크립트 (Python)
2. 채널별 배포 모듈 (도구 선택: CDP / Playwright / Stagehand)
3. cron 또는 Claude Scheduled Tasks 연동
4. 실패 알림 + 재시도 로직
5. 배포 로그 자동 기록

---

## 5. 채널별 최적 도구 매핑 (제안)

| 채널 | 현재 도구 | 보정 후 도구 | 이유 |
|------|---------|------------|------|
| **MONKOS Admin** | CDP (MonkosEditor) | 유지 | 자체 서비스, 완전 통제 |
| **X** | CDP (data-testid) | CDP + Playwright MCP | 안정적이나 DOM 변경 대비 |
| **GitHub** | CDP | CDP + Playwright MCP | 단순 구조 |
| **Tistory** | CDP (iframe) | Playwright MCP | iframe 처리 개선 |
| **note.com** | CDP (ClipboardEvent) | **Stagehand** | SPA + 에디터 복잡성 |
| **Naver Blog** | CDP (텍스트만) | **Stagehand → 실패 시 Browser Use** | SmartEditor 난제 |
| **Instagram** | 불가 | **공식 API 또는 SaaS (Buffer/SocialPilot)** | 브라우저 자동화 비현실적 |
| **Medium** | CDP (backendNodeId) | Playwright MCP | 파일 업로드 안정화 |
| **LinkedIn** | 미구현 | Stagehand | SPA 복잡성 |
| **YouTube** | 미구현 | Stagehand + Browser Use | 업로드 워크플로우 |
| **GA4/GSC** | CDP (불안정) | **Playwright MCP** | SPA 네비게이션 해결 |

---

## 6. 비용 시뮬레이션

### 월간 100건 콘텐츠 × 4채널 배포 기준

| 항목 | 비용 |
|------|------|
| Playwright MCP | ₩0 (무료) |
| Stagehand LLM (note.com + Naver, 캐싱 적용) | ~₩5,000/월 |
| Browser Use (폴백, 월 10건) | ~₩5,000/월 |
| CDP 인프라 (기존) | ₩0 |
| **합계** | **~₩10,000/월** |

vs 현재: 한송이 매일 1~2시간 수동 배포 = 월 30~60시간 인력

---

## 7. 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Stagehand 캐싱이 사이트 변경 시 무효화 | 중 | 중 | 캐시 TTL 설정 + 실패 시 재학습 |
| Naver SmartEditor 돌파 실패 | 높음 | 중 | API 직접 호출 또는 Naver 블로그 API 조사 |
| 봇 탐지 강화 (X, Instagram) | 중 | 높 | 인간 속도 시뮬레이션 + 공식 API 병행 |
| LLM 비용 예상 초과 | 낮 | 낮 | 캐싱 + 배포 빈도 조절 |

---

## 8. 쌍아에게 요청하는 것

1. **Phase 2~3 보정안 설계 검토** — 위 구조가 기존 PF_CDP 아키텍처와 충돌 없는지 확인
2. **Phase 2 지시서 작성** — Playwright MCP 통합 작업을 막내에게 하달할 지시서
3. **Phase 2.5 Stagehand 파일럿 설계** — note.com 자동 배포를 첫 검증 대상으로
4. **PF_CDP.md Phase 구조 갱신** — 보정된 Phase를 PF에 반영
5. **PF_SPREAD와의 인터페이스 정의** — 배포 오케스트레이터가 SPREAD의 어느 지점과 물리는지

---

## 9. 전략적 위치: 빅테크 정책 사이를 가르는 구조

### 빅테크의 구조적 한계

각 빅테크는 자사 생태계에 사용자를 가두는 것이 비즈니스 모델이다. 이로 인해 브라우저 자동화 영역에서도 배타적 선택을 강요한다:

| 빅테크 | 자사 도구 | 배타성 |
|--------|---------|--------|
| **Google** | Puppeteer, Chrome Extension API | Playwright 미지원, 자사 확장 생태계 종속 |
| **Microsoft** | Playwright, Edge WebView | Puppeteer와 경쟁, 자사 MCP 생태계 구축 |
| **Anthropic** | Claude in Chrome (확장) | 1세션 독점, 타사 브라우저 제어 도구 미통합 |
| **OpenAI** | Operator (CUA) | 자체 호스팅 불가, OpenAI 클라우드 종속 |
| **Browserbase** | Stagehand | 클라우드 최적화, 완전 로컬 시 일부 제한 |

이들은 각각 훌륭한 기술을 보유하고 있으나, **서로의 기술을 조합하는 것은 정책적으로 불가능하거나 의도적으로 어렵게** 만들어져 있다.

### MONKOS의 전략적 위치

MONKOS는 빅테크가 아니기 때문에 이 배타성의 제약을 받지 않는다. **프로토콜 레벨(CDP)을 기반으로 각 기술의 최강점만 조합**하는 것이 가능하다:

```
[Chrome DevTools Protocol — 개방 표준, Chrome 존재하는 한 영속]
        ↑
   하나의 디버그 크롬 인스턴스 (포트 9222)
        ↑
  ┌─────┼──────┬──────┬──────┐
  ↓     ↓      ↓      ↓      ↓
자체    MS     오픈소스  Browserbase  Anthropic
cdp_   Play-  Browser  Stagehand   Claude
utils  wright  Use     v3          (필요시)
.py    MCP
```

- **안정 반복 작업** → Playwright MCP (MS)
- **복잡한 SPA** → Stagehand (Browserbase)
- **난제 사이트** → Browser Use (오픈소스)
- **자체 서비스** → cdp_utils.py (자체)
- **새 기술 등장** → 레이어 하나 추가하면 됨. 안 맞으면 빼면 됨

### 이것이 차별성인 이유

1. **도구를 계속 생성하면서 갈 수 있는 열린 구조**: Claude in Chrome은 Anthropic이 업데이트 안 하면 끝. CDP 프로토콜은 Chrome이 존재하는 한 사라지지 않음
2. **빅테크 정책 변경에 면역**: 어느 한 회사의 정책 변경이 전체 파이프라인을 무력화하지 않음. 대체재가 항상 존재
3. **비용 최적화**: 무료(Playwright) + 저비용(Stagehand ₩4/액션) + 고비용(Browser Use)을 용도별로 배분. 빅테크 종속 시 단일 과금 구조에 갇힘
4. **멀티 에이전트 동시 운용**: 포트별 독립 인스턴스로 쌍아/막내/민아/한이 동시에 각자 브라우저 제어. 확장 시 Claude in Chrome과 달리 포트만 추가하면 됨

### 이의신청 평가 맥락

이 구조는 단순한 기술 선택이 아니라 **비즈니스 전략**이다:

- 빅테크는 **"우리 생태계 안에서 써라"** → 종속 비용 발생
- MONKOS는 **"각 빅테크의 최강점만 프로토콜 레벨에서 조합"** → 종속 비용 제로
- 이것이 가능한 이유: 20년 사진 전문가(도메인) + AI 기술 통합 역량(엔지니어링) + 빅테크 정책 분석(전략)

**"빅테크와 싸우는 게 아니라, 빅테크들 사이의 빈 공간을 정확히 점유한다"** — 이것이 MONKOS의 기술 차별성이자 지속 가능한 경쟁 우위.

---

## 부록: 참조 소스

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Stagehand v3 GitHub](https://github.com/browserbase/stagehand)
- [Stagehand v3 Blog — 캐싱/성능](https://www.browserbase.com/blog/stagehand-v3)
- [Browser Use GitHub](https://github.com/browser-use/browser-use)
- [Stagehand Python SDK](https://docs.stagehand.dev/v3/basics/act)

---

**[2026-04-05 07:25 KST] M1/민아 보고 완료**
**[2026-04-05 07:30 KST] 추가: 전략적 위치 섹션 (작가님 지시)** ✅
