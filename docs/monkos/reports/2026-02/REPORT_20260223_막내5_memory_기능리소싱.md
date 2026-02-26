---
type: report
id: REPORT_20260223_막내5_memory_기능리소싱
date: "2026-02-23 11:23 KST"
status: completed
from: 막내5
to: 쌍아
task_id: TASK_20260223_막내5_memory_기능리소싱_리서치
result: success
tags: [memory, 규격화, 어젠다5]
---

# MEMORY.md 기능적 역할/리소싱 리서치 보고서

> [2026-02-23 11:23 KST] iMac/막내5 → iMac/쌍아

---

## 1. 현행 MEMORY.md 내용 전수 분류

**총 199줄** (빈 줄 ~30줄 포함, 실질 콘텐츠 ~169줄)

### 분류 결과 요약

| 분류 | 줄 수 | 비율 | 비고 |
|------|-------|------|------|
| **즉시 참조** | ~54줄 | 27% | 매 세션 부트에 필수 |
| **작업 시 참조** | ~108줄 | 54% | 해당 작업 수행 시만 필요 |
| **아카이브** | ~8줄 | 4% | 과거 이력, 현재 불필요 |
| **이중화** | ~30줄 | 15% | 정본이 다른 곳에 존재 (중복 집계) |
| **무효화** | 0줄 | 0% | 2026-02-22 정리 직후라 정합 |
| 빈 줄/구조 | ~30줄 | — | 헤더, 구분선 등 |

> **핵심 발견: 콘텐츠의 54%가 "작업 시 참조"로, 매 세션 시스템 프롬프트에 주입될 필요 없음.**

### 섹션별 상세 분류

| 섹션 (줄 범위) | 줄 수 | 분류 | 비고 |
|---------------|-------|------|------|
| 상세 기술명세 링크 (L2-9) | 8 | 즉시 참조 | 토픽 파일 네비게이션 |
| 팀 인적 인프라 (L11-16) | 6 | **즉시 참조** | MEMORY 유일 정본 |
| 팀 우체통 시스템 (L18-25) | 8 | 작업 시 참조 | L21 와이프 IP = L16과 **이중화** |
| Gemini Live API (L27-37) | 11 | 작업 시 참조 | 코드에도 존재 |
| Imagen I2I 생성 (L39-47) | 9 | 작업 시 참조 | docs/infrastructure/에도 존재 |
| monkos_AI 서비스 체계 (L49-66) | 18 | 작업 시 참조 | prod rev = **이중화** (Cloud Run 콘솔) |
| LINE Official Account (L68-73) | 6 | 작업 시 참조 | LINE 연동 시에만 |
| 인프라 (L75-85) | 11 | 혼합 | Tailscale IP=즉시, SSH 상세=작업 시 |
| 에이전트 간 통신 (L87-89) | 3 | 작업 시 참조 | |
| Claude Max 운용 (L91-98) | 8 | **즉시 참조** | 쿼터 운영 판단 |
| CF+Gemini 지역차단 (L100-106) | 7 | 작업 시 + 아카이브 | Cloud Run 이전 시 자연소멸 |
| 캡처 파이프라인 (L108-113) | 6 | 작업 시 참조 | 코칭/캡처 작업 시 |
| 빅테크 정책 우회 (L115-117) | 3 | 작업 시 참조 | 전략 영역 |
| 로컬 LLM R&D (L119-122) | 4 | 작업 시 참조 | R&D 시 |
| 인앱 브라우저 (L124-126) | 3 | 작업 시 참조 | |
| 사업 구조 (L128-129) | 2 | **즉시 참조** | 핵심 사업 지도 |
| 프로젝트 폴더 위상 (L131-150) | 20 | 즉시 + **이중화** + 아카이브 | 테이블=ch4 1조 이중화, 삭제이력 7줄=아카이브 |
| 운영 철학 (L152-154) | 3 | **즉시 참조** | |
| monkos-ops/ 원칙 (L156-158) | 3 | 즉시 + **이중화** | ops/README에도 존재 |
| 앱 구조 (L160-165) | 6 | 즉시 + **이중화** | 서비스 체계(L49~)와 중복 |
| 챗봇 아키텍처 (L167-169) | 3 | 작업 시 참조 | |
| 연락처 (L171) | 1 | **즉시 참조** | MEMORY 유일 정본 |
| CF Pages 배포 (L173-176) | 4 | 작업 시 참조 | |
| 광고/Image Pro/CF캐시 (L178-180) | 3 | 작업 시 참조 | |
| 작가님 금언 (L182-184) | 3 | 즉시 + **이중화** | governance/philosophy/PHILOSOPHY.md 정본 존재 |
| 디버깅 교훈 (L186-193) | 8 | 작업 시 참조 | |
| 지시서 운용 원칙 (L195-199) | 5 | 즉시 + **이중화** | ch7 + CLAUDE.md에 완전 포함 |

### 이중화 상세 (정본 소재)

| MEMORY 항목 | 정본 위치 | 이중화 유형 |
|-------------|----------|-----------|
| 와이프 맥미니 IP (L21) | 같은 파일 L16 | 파일 내 중복 |
| 프로젝트 폴더 위상 테이블 | ch4 1조 (더 상세) | 법률이 정본 |
| 앱 구조 5줄 | 서비스 체계 섹션 (L49~) | 파일 내 중복 |
| 작가님 금언 | governance/philosophy/PHILOSOPHY.md | 레지스트리가 정본 |
| 지시서 운용 원칙 5줄 | ch7 1조~3조 + CLAUDE.md 본문 | 법률+헌법이 정본 |
| monkos-ops/ 원칙 | monkos-ops/README.md | README가 정본 |
| prod rev 번호 | Cloud Run 콘솔 / deploy 로그 | 외부 시스템이 정본 |

---

## 2. 토픽 파일 분리 기준 설계

### 현행 토픽 파일 평가

| 파일 | 크기 | 평가 |
|------|------|------|
| `tts_voice_architecture.md` | ~4KB | 적절. 단일 기술 영역 집중 |
| `sonnet/` (5파일+하위) | 디렉토리 | 적절. 소넷이 전용 독립 체계 |

### 쌍아 6파일 제안 vs 신체계 반영 분석

쌍아 PM2 세션 제안:

| 제안 파일 | 대상 콘텐츠 | 신체계 반영 후 판단 |
|-----------|-----------|-------------------|
| `gemini_api.md` | Live API + I2I | **유지**. 기존 tts_voice 통합 검토 |
| `services.md` | 서비스 체계 + LINE | **유지**. ch4 5조와 보완 관계 |
| `infrastructure.md` | SSH/WSL/SSL/배포 | **유지**. MEMORY 유일 정본 다수 |
| `capture_pipeline.md` | 캡처 + 코칭 | **기존 tts_voice와 병합** 권장 |
| `debugging.md` | 디버깅 교훈 | **유지**. CF 지역차단도 포함 |
| `strategy.md` | 사업/정책/R&D | **유지**. 빅테크 우회 + LLM R&D + 인앱 이슈 |

### 신체계 반영 권장안: 5개 토픽 파일

| # | 파일명 | 대상 | 추정 줄 수 | 이유 |
|---|--------|------|-----------|------|
| 1 | `gemini_api.md` | Gemini Live + Imagen I2I + TTS 발음 | ~35줄 | AI API 명세 집중 |
| 2 | `services.md` | 서비스 체계 + LINE + 챗봇 + 배포 rev + 무료조건/LP | ~40줄 | 서비스 운영 일체 |
| 3 | `infrastructure.md` | SSH/WSL/SSL/배포/광고/캐시 + 우체통 상세 | ~35줄 | 인프라 운영 |
| 4 | `capture_coaching.md` | 캡처 파이프라인 + iOS TTS + 기존 tts_voice 통합 | ~40줄 | 촬영 앱 기술 스택 |
| 5 | `debugging_strategy.md` | 디버깅 교훈 + CF 지역차단 + 빅테크 우회 + LLM R&D + 인앱 이슈 | ~30줄 | 트러블슈팅 + 중장기 전략 |

> `tts_voice_architecture.md` → `capture_coaching.md`로 리네임+통합을 권장.
> `sonnet/` 디렉토리는 현행 유지 (독립 체계).

### 질문에 대한 답

**Q1. 토픽 파일 적정 크기?**
- **30~60줄 권장, 100줄 상한**
- 근거: Claude Code Read 1회에 전체 파일 로드. 60줄이면 ~3KB로 컨텍스트 부담 경미. 100줄 초과 시 MEMORY 자체와 동일한 비대화 문제 재발

**Q2. 인덱스에 남길 항목 기준?**
- **"세션 부트로더"** — 에이전트가 세션 시작 시 방향을 잡는 최소 정보
  - 팀 구성 (누구와 일하는가)
  - 폴더 지도 (어디에 뭐가 있는가)
  - 서비스 지도 (무엇을 운영하는가)
  - 토픽 파일 인덱스 (상세를 어디서 찾는가)
- **"3줄 테스트"**: 해당 항목을 3줄 이하로 압축할 수 없으면 토픽 파일이 적합

**Q3. 토픽 파일 적정 개수?**
- **5~7개** (현행 2개 + 제안 5개 = 7개 토픽, sonnet/ 포함)
- 근거: 에이전트가 파일명만 보고 "이 작업에 관련 있는가?" 판단해야 함. 10개 초과 시 인덱스 자체가 비대. 3개 미만 시 파일 내용이 산만

**Q4. 에이전트 역할별 토픽이 달라야 하는가?**
- **아니오.** MEMORY는 프로젝트 레벨 공유 자원 (모든 에이전트 동일 시스템 프롬프트)
- 소넷이 전용 → 이미 `sonnet/` 분리로 해결
- 에이전트별 차이는 **CLAUDE.md의 역할 선언** + **ch1 에이전트 테이블**이 담당
- 토픽 파일을 분리하면 오히려 정합성 관리 비용 증가

---

## 3. "무엇을 담고 무엇을 빼는가" 원칙

### MEMORY.md의 기능적 역할 정의

> **MEMORY.md = 에이전트의 작업 메모리 부트로더**
>
> 매 세션 시스템 프롬프트에 자동 주입되는 200줄.
> 읽지 않으면 세션이 방향을 못 잡는 정보만 담는다.
> Read로 열어볼 수 있는 정보는 토픽 파일로 분리한다.

### 3대 원칙

| 원칙 | 설명 | 적용 |
|------|------|------|
| **부트로더 원칙** | "이것 없이 세션이 시작될 수 있는가?" | Yes → 토픽/제거 |
| **단일 정본 원칙** | "이 정보의 정본이 다른 곳에 있는가?" | Yes → 링크만 남기거나 제거 |
| **변동성 원칙** | "이 정보는 자주 변경되는가?" | Yes → 토픽 또는 외부 참조 (CLI 확인) |

### 항목별 판단 테이블

| 항목 | MEMORY | 다른 정본 | 판단 | 이유 |
|------|--------|----------|------|------|
| API 모델명/인증 방식 | ✅ | docs/infrastructure/, 코드 | **토픽 이동** | 작업 시만 필요. 코드에도 하드코딩 |
| 인프라 IP/SSH 경로 | ✅ | 없음 (MEMORY 유일) | **인덱스 유지 (축약)** | Tailscale IP=즉시 필요. SSH 상세=토픽 |
| 서비스 배포 rev | ✅ | Cloud Run 콘솔 | **제거** | 배포마다 변경. `gcloud run revisions list` |
| 작가님 금언 | ✅ | governance/philosophy/ | **인덱스 유지 (1줄 링크)** | 매 세션 상기 가치 + 정본 참조 |
| 디버깅 교훈 | ✅ | 없음 | **토픽 이동** | 해당 작업 시만 필요 |
| 프로젝트 폴더 위상 | ✅ | ch4 1조 | **인덱스 유지 (축약)** | 방향 설정용 약도. 상세=ch4 |
| 지시서 운용 원칙 | ✅ | ch7 + CLAUDE.md | **제거** | 완전 이중화. CLAUDE.md 자동 로드 |
| prod rev 번호 | ✅ | 배포 로그 | **제거** | 변동성 높고 CLI 확인 가능 |
| 팀 인적 인프라 | ✅ | 없음 | **인덱스 유지** | MEMORY 유일 정본 |
| 운영 철학 | ✅ | 없음 | **인덱스 유지** | 운영 방향 핵심 |
| 연락처 | ✅ | 없음 | **인덱스 유지** | MEMORY 유일 정본 |
| Claude Max 운용 | ✅ | 없음 | **인덱스 유지 (축약)** | 쿼터 판단에 필수 |
| 앱 구조 | ✅ | 서비스 체계 + ch4 | **제거 (서비스 지도로 통합)** | 파일 내 이중화 |
| 삭제 이력 | ✅ | git log | **제거** | 아카이브. git log에 영구 기록 |

---

## 4. 200줄 인덱스 → ~80줄 설계안

### 이동/제거 매핑

| 현행 섹션 | 줄 수 | 처분 | 행선지 |
|----------|-------|------|--------|
| Gemini Live API | 11 | 토픽 이동 | `gemini_api.md` |
| Imagen I2I | 9 | 토픽 이동 | `gemini_api.md` |
| monkos_AI 서비스 체계 | 18 | 축약+토픽 | 인덱스 6줄 + `services.md` |
| LINE Official Account | 6 | 토픽 이동 | `services.md` |
| 인프라 (SSH/WSL 상세) | 8 | 토픽 이동 | `infrastructure.md` |
| 우체통 시스템 | 8 | 축약+토픽 | 인덱스 1줄 + `infrastructure.md` |
| CF+Gemini 지역차단 | 7 | 토픽 이동 | `debugging_strategy.md` |
| 캡처 파이프라인 | 6 | 토픽 이동 | `capture_coaching.md` |
| 빅테크 우회 | 3 | 토픽 이동 | `debugging_strategy.md` |
| 로컬 LLM R&D | 4 | 토픽 이동 | `debugging_strategy.md` |
| 인앱 브라우저 | 3 | 토픽 이동 | `debugging_strategy.md` |
| 챗봇 아키텍처 | 3 | 토픽 이동 | `services.md` |
| CF Pages 배포 | 4 | 토픽 이동 | `infrastructure.md` |
| 광고/Image Pro/CF캐시 | 3 | 토픽 이동 | `infrastructure.md` |
| 에이전트 간 통신 | 3 | 토픽 이동 | `infrastructure.md` |
| 디버깅 교훈 | 8 | 토픽 이동 | `debugging_strategy.md` |
| 프로젝트 폴더 위상 (삭제이력) | 7 | **제거** | git log |
| 지시서 운용 원칙 | 5 | **제거** | ch7 + CLAUDE.md (완전 이중화) |
| 앱 구조 | 6 | **제거** | 서비스 지도로 통합 (파일 내 이중화) |
| monkos-ops/ 원칙 | 3 | **제거** | ops/README (이중화) |
| 와이프 IP 중복 (L21) | 1 | **제거** | L16에 이미 존재 |
| prod rev 3건 | ~3 | **제거** | CLI 확인 |

**이동 합계**: ~106줄 → 5개 토픽 파일
**제거 합계**: ~25줄 → 이중화/아카이브 해소

### 인덱스 목차안 (~72줄)

```markdown
# MONKOS 프로젝트 메모리                                    # L1

## 토픽 파일 인덱스                                          # L3-12 (10줄)
- [gemini_api.md](gemini_api.md) — Live API + Imagen I2I + TTS 발음
- [services.md](services.md) — 서비스 체계 + LINE + 챗봇 + 배포
- [infrastructure.md](infrastructure.md) — SSH/WSL/SSL/배포/광고/캐시/우체통
- [capture_coaching.md](capture_coaching.md) — 캡처 + 코칭 + iOS TTS
- [debugging_strategy.md](debugging_strategy.md) — 디버깅 + CF 지역차단 + 전략
- [sonnet/README.md](sonnet/README.md) — 소넷이 아카이브 (73과제)
  - [경량 인덱스](sonnet/LIGHT_INDEX.md) — 소넷이 전용
  - [전체 명세서](sonnet/FULL_REGISTRY.md) — 쌍아/철창이 참조용
- 법률 정본: governance/laws/ | 철학 정본: governance/philosophy/

## 팀 인적 인프라                                            # L14-19 (6줄)
- **한송이**: MacBook Pro M4 13" — SNS/마케팅, 텔레그램 소통
- **꾸(와이프)**: 맥미니 M2 — `100.93.220.17`, 계정 `mac`, `sshm2`

## 인프라 핵심                                               # L21-28 (8줄)
- **Tailscale**: iMac=100.97.103.10, 4060=100.118.31.62, iPhone=100.115.57.53, 맥미니=100.76.80.99
- **4060 WSL**: Ubuntu 24.04, Node 18, `/mnt/c/Users/smuse73/developer/monk_project`
- **에이전트 통신**: Git push/pull 기반 (텔레그램 연동 개선 예정)
- **상세**: → infrastructure.md

## Claude Max 멀티티어 운용                                  # L30-34 (5줄)
- **Opus** → 워크스테이션, **Sonnet** → 소넷이 + 팀원, **온디맨드 $50** → 안전망
- 실측: Opus 3대 병렬 → 주간 10%, Sonnet 2대 → 주간 1%
- 소넷이 경량화: 94% 컨텍스트 절감 (50KB→3KB)

## 사업 구조                                                 # L36-37 (2줄)
- **monk.kr**(본진 데스크톱) → **monkos.ai**(모바일 AI 분기, 자회사급)

## 서비스 지도                                               # L39-46 (8줄)
- **포털**: `monkos_AI/portal/` → monkos.ai (Cloud Run: monkos-portal)
- **KR**: `monkos_AI/idphoto-kr/` → idphoto-kr.monkos.ai (Cloud Run)
- **JP**: `monkos_AI/idphoto-jp/` → idphoto-jp.monkos.ai (Cloud Run)
- **photolab**: `MONK_kr/ai_lab/photolab/` (CF Pages: monk-kr)
- **image-engine**: image.monkos.ai (Cloud Run: monk-image-engine)
- **인증**: Vertex AI ADC (코칭/QC/챗봇) + API Key (Imagen I2I)
- **상세**: → services.md

## 프로젝트 폴더 위상                                        # L48-59 (12줄)
| 폴더 | 위상 | 설명 |
|------|------|------|
| `governance/` | **법체계** | 헌법+법률+철학+개정절차 |
| `MONK_kr/` | **본진** | monk.kr (CF Pages) |
| `monkos_AI/` | **모바일 AI** | monkos.ai (Cloud Run) |
| `monkos-ops/` | **운영체제** | 4부서: ops/tech/contents/marketing |
| `docs/` | **참고문헌** | 지시서+보고서+스펙+아카이브 |
| `functions/` | CF Workers | Pages Functions 정본 |
| `commands/` | 지시서 큐 | 라이브 디스패치 |
| `scripts/` | 범용 유틸 | 귀속 미확정 |

## 운영 철학                                                 # L61-64 (4줄)
- 작가님=AI대화, 팀원=텔레그램+GDrive(접점2개), AI에이전트=뒷단자동화
- 텔레그램=신경계, GDrive=창고(2TB)
- 우체통: monkos-ops/05_공유/ (kku/han) — 상세 → infrastructure.md

## 작가님 인사이트                                           # L66-69 (4줄)
- **"쥐가 드러낸 것이지, 만든 것이 아니다"** — 버그를 탓하지 말고 구조를 고쳐라
- **"법은 달리는 열차의 레일이지 벽이 아니다"** — 예외 적용과 효율적 검토는 다름
- 전체 레지스트리: governance/philosophy/PHILOSOPHY.md

## 연락처                                                    # L71 (1줄)
info@monkos.ai / 010-7217-2060(텔레그램) / @monkos(카카오 예정)
```

**총 추정: ~72줄** (현행 199줄 대비 **64% 감소**)

### 절감 효과 요약

| 항목 | 줄 수 |
|------|-------|
| 현행 MEMORY.md | 199줄 |
| 인덱스 (축소 후) | ~72줄 |
| 토픽 파일 5개 | ~180줄 (분리+재정리) |
| 제거 (이중화/아카이브) | ~25줄 |
| **시스템 프롬프트 절감** | **127줄 (64%)** |
| **컨텍스트 절감 추정** | ~6KB → ~2.5KB |

---

## 부록: 토픽 파일 콘텐츠 배분안

### gemini_api.md (~35줄)
- Gemini Live API 핵심 11줄 (현행 그대로)
- Imagen I2I 생성 9줄 (현행 그대로)
- TTS 발음 규칙 (tts_voice에서 이관)
- Vertex AI QC `role: 'user'` 주의사항

### services.md (~40줄)
- monkos_AI 서비스 체계 (URL, 인증, 도메인) — prod rev 제외
- LINE Official Account 6줄
- 챗봇 아키텍처 3줄
- 무료 조건, LP 구조 (JP 특화 정보)

### infrastructure.md (~35줄)
- SSH/WSL 상세 (4060 ACL 주의 포함)
- SSL 인증서 경로
- 우체통 시스템 상세 (워처, 로그, alias)
- CF Pages Functions 배포 4줄
- 광고/Image Pro/CF 캐시 3줄
- 에이전트 간 통신 3줄
- 백그라운드 프로세스 로깅 팁

### capture_coaching.md (~40줄)
- 캡처 파이프라인 6줄 (현행 그대로)
- iOS TTS user gesture 제약
- tts_voice_architecture.md 핵심 내용 통합 (TTS 시장 비교, 눈+입 분리)
- 코칭 fps, MAX_CAPTURE_SIZE 등 수치

### debugging_strategy.md (~30줄)
- 디버깅 교훈 8줄 (현행 그대로)
- CF Function + Gemini 지역차단 7줄
- 빅테크 정책 우회 3줄
- 로컬 LLM R&D 4줄
- 인앱 브라우저 이슈 3줄

---

## 완료 보고

✅ **리서치 4개 항목 전수 분석 완료**
✅ **현행 199줄 전수 분류**: 즉시참조 27% / 작업시참조 54% / 아카이브 4% / 이중화 15%
✅ **토픽 파일 5개 구조안 제시**: gemini_api / services / infrastructure / capture_coaching / debugging_strategy
✅ **인덱스 ~72줄 목차안 제시** (64% 감소)
✅ **핵심 발견**: 시스템 프롬프트의 54%가 매 세션에 불필요한 "작업 시 참조" 정보
💡 **제안**: `tts_voice_architecture.md` → `capture_coaching.md`로 리네임+통합 권장
📁 **산출물**: `docs/monkos/reports/2026-02/REPORT_20260223_막내5_memory_기능리소싱.md`
