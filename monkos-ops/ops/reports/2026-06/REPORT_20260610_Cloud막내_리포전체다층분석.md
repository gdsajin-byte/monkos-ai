---
type: report
date: 2026-06-10
device: Cloud
agent: 막내
status: 마감
---

# 리포 전체 다층 분석 보고서 (보안 · 아키텍처 · 마케팅 · 거버넌스)

**[2026-06-10 14:55 KST] Cloud/막내 → 작가님**

> 작가님 직접 지시(헌법 1조 2항 ②경로)로 monk_project 모노레포 전체를 4개 영역으로 병렬 분석한 결과 보고. 쌍아 사후 추인 요청.
> ⚠️ 본 보고서의 비밀정보는 전부 마스킹 처리함. 원문 위치는 파일 경로로만 인용.

---

## 총평

핵심 라이브 서비스(포털 · 증명사진 KR/JP)의 코드 구조와 전략 문서의 완성도는 높다. 그러나 다음 4가지가 확인됨:

1. **보안 Critical 4건** — 즉시 조치 필요 (크레딧 위조, 세션 위조, 키 노출)
2. **데드 코드 약 160MB** — 리포 419MB의 38%
3. **마케팅 전략↔실행 괴리** — 비브랜드 검색 유입 3개월간 0건
4. **거버넌스 드리프트** — MEMORY.md 부재, 정본 이중화 실증

---

## 1. 보안 감사 (최우선)

### Critical — 막내가 파일 직접 열어 교차 검증 완료

| # | 내용 | 위치 | 위험 |
|---|------|------|------|
| C-1 | Google API 키 평문 커밋 (`AIzaSy...HDow`, 마스킹). git 히스토리에도 잔존. MonkosChat Expo 웹 번들에 별도 키 1개 추가 노출 | `docs/corpus/legacy/20260111_REBOOT_BACKUP.md:22,45`, `apps/MonkosChat/public/_expo/static/js/web/index-f2f0...js` | 키 도용 → 과금 폭탄 |
| C-2 | 크레딧 환불/차감/조회 API 무인증 — body의 userId만 신뢰. 누구나 임의 계정에 무한 충전 가능 | `monkos_AI/portal/lib/credits.js:8,42,100` (idphoto-kr `server.js:652,664`가 프록시) | 크레딧 위조 = 매출 직결 |
| C-3 | AUTH_SECRET 폴백 하드코딩 — 환경변수 누락 시 세션 토큰 위조 가능 | `monkos_AI/portal/lib/shared/config.js:31` | 전 계정 탈취 |
| C-4 | ADMIN_UIDS 비어 있으면 전원 관리자 허용 (페일오픈) | `monkos_AI/portal/lib/cms/admin-auth.js:14` 외 `auth.js:460,597,793` | CMS·회원 PII 전체 노출 |

### High

- **H-1**: AI 생성 엔드포인트 무인증·무레이트리밋. idphoto-kr `/api/idgen`은 userId 없으면 무료 생성(`server.js:512,541`), studio `/api/idgen`은 인증·크레딧 전무(`server.js:435`). 전 생성 호출 `safetySettings: BLOCK_NONE` — 공개 범용 생성(`functions/api/generate.js`)은 상향 필요.
- **H-2**: Cloudflare Functions CORS 와일드카드 `*` (generate/analyze/translate/refine/debate). `chat.js:7-12`만 화이트리스트로 모범 — 동일 패턴 이식 필요.
- **H-3**: idphoto-kr Express 전역 `app.use(cors())` (`server.js:450`).
- **H-4**: 카카오 OAuth client_secret·access_token이 Cloud Logging에 평문 출력(`portal/lib/auth.js:49`), access_token Firestore 평문 저장(`auth.js:96,107`).
- **H-5**: 증명사진(생체정보) GCS 버킷 `monk-ai-images`의 IAM·보존기간(TTL) 정책 코드상 미확인 — PIPA 리스크. studio는 익명 생성 원본을 무기한 저장(`server.js:489`).

### Medium 요점

- 토스 direct 결제 멱등성 부재(`payments.js:297` — confirm 경로는 있음)
- LemonSqueezy 웹훅 서명 검증이 시크릿 없으면 통과(`payments.js:80`) → 페일클로즈 필요
- 에이전트 API 키 단순 문자열 비교(타이밍 세이프 아님, `admin-auth.js:21-60`)
- OAuth CSRF state·다운로드 토큰이 인메모리(`auth.js:182`) — Cloud Run 다중 인스턴스(MAX 5)에서 불안정

### 모범 사례 (유지)

SECRET_INVENTORY 체계, 실제 `.env` 미커밋(.gitignore 양호), 포털 메인 CORS 화이트리스트·보안 헤더, 토스 confirm 멱등성·금액 검증, 게시판 SSR 이스케이프, 챗봇 D1 파라미터 바인딩, deploy.sh 토스 라이브키 가드.

---

## 2. 아키텍처 / 코드 품질

### 라이브 서비스 (건실)

| 서비스 | 위치 | 평가 |
|--------|------|------|
| 포털 v4 | `monkos_AI/portal/` | server.js 446줄 + lib 74모듈, Jest 일부 — 모범 |
| 증명사진 KR/JP | `monkos_AI/idphoto-kr|jp/` | 구조 양호하나 사실상 코드 복제 쌍둥이 |
| Studio / Crop | `monkos_AI/studio|crop-engine|crop-app/` | 활성 |

### 데드 코드 (~160MB, 제거 대상)

| 경로 | 크기 | 사유 |
|------|------|------|
| `apps/MonkosCrop/` | 131M | 초기 실험 + 바이너리 테스트 데이터 |
| `apps/MonkosChat/` | 1.7M | portal chat 모듈로 통합 완료. **C-1 키 노출원** |
| `apps/idphoto-jp-v079/` | 320K | monkos_AI/idphoto-jp로 통합 완료 |
| `apps/photolab-monkkr-legacy/`, `apps/photolab-monkkr-mpa-0219/` | 0.9M | 중단된 재설계 |
| `apps/crop-app/` | 17M | **monkos_AI/crop-app과 분기 중복** — 정본 단일 원칙 위반 |
| `apps/idpass-android/` | 4.1M | 미활용 프로토타입 → 아카이브 |

### 인프라 부채

- CI/CD 부재 (배포 전부 수동 deploy.sh). `.github/workflows/`에는 브리핑·스캔류만 존재.
- 테스트 2개 (커버리지 1% 미만), ESLint 부재.
- 의존성 버전 산재: @google/genai 1.34~1.41, Express 4.18~4.21 — workspace 정책 필요.
- idphoto-kr Dockerfile의 난독화 스테이지 주석 처리 상태(사유 미기록).

---

## 3. 마케팅 / 브랜딩 / SEO

### 핵심 진단: 전략은 정교, 실행 공백

- 비브랜드 Google 검색 클릭 **3개월간 0건**, "AI 증명사진" 미노출 (경쟁사 증명한컷 등이 1페이지 점유)
- Naver 검색 "몽코스 AI" 결과 0건 — 네이버 블로그 440건 축적과 미연계
- monkos.ai 원본 블로그 콘텐츠 0건 (마스터 전략과 괴리), 마케팅 outbox 사실상 빈 상태
- GA4: Paid Search 참여율 18.8%/체류 25초(최악) vs Organic 48.2%(잠재력) → 예산 재배분 신호

### 기술 SEO는 우수

JSON-LD 6종(포털), hreflang 양방향(ko↔ja), AI 크롤러 명시 허용 robots.txt, GA4+AI 레퍼럴 추적 완비. 발목: 블로그 HTML의 **H1 중복, H2/H3 부재, 리스트 메타 영문** — 구조 수정만으로 개선 여지 큼.

### 브랜딩 준수율 97%

위반 1건: `MONK_kr/index.html:343` "Gemini Chat Panel" 주석 (사용자 미노출, 삭제 권장). 엔진명·내부 호칭의 사용자 대면 유출 없음.

### 즉효 처방 (1주)

① 블로그 HTML 구조 수정(H1 단일화, H2/H3 마크업, 한국어 메타) ② 검색의도 기반 콘텐츠 5편("AI 증명사진 만들기", "여권사진 규격" 등) ③ note.com/Blogger → monkos.ai 역수입 시드.

---

## 4. 거버넌스 / 운영 문서 (건강도 75점)

- **MEMORY.md 부재 (Critical)**: 헌법 5조 1항·references.md가 "매 세션 자동 로딩"으로 참조하나 루트에 없음. memory/ 폴더에 단편 2개뿐.
- **정본 이중화 실증**: `20260209_monkos_japan_idphoto_strategy.md`가 `docs/corpus/claude_sessions/strategy/`와 `monkos-ops/tech/rnd/`에 MD5 동일 존재 — 헌법 3조 4항 위반.
- **규칙 드리프트**: ch1·ch2·ch8 법률이 `.claude/rules/` 미반영 (8장 중 5장만 규칙화).
- **PF 비대화**: PF_CROP 692줄, PF_SPREAD 513줄 — 500줄 아카이브 트리거 초과 방치 (ch4 9조).
- **세션 로그**: 월별 폴더 밖 파일 4건 (2026-05-25, 06-05, 06-08, 06-09).
- **문서 밀도**: 문서 2,775개 vs 코드 289개 (9.6:1), 운영 문서 월 100건+ 누적 — 컨텍스트 과부하 위험.

---

## 통합 우선순위 로드맵

| 순위 | 조치 | 기간 | 영역 | 비고 |
|------|------|------|------|------|
| 1 | 노출 API 키 2개 폐기·회전 (GCP 콘솔) | 즉시 | 보안 | **작가님 직접 실행 필요** |
| 2 | C-2/C-3/C-4 페일클로즈 코드 수정 | 2~3일 | 보안 | |
| 3 | 생성 API 레이트리밋 + CORS 화이트리스트 통일 | 1주 | 보안 | |
| 4 | 블로그 HTML 구조 수정 + 검색의도 콘텐츠 5편 | 1주 | 마케팅 | |
| 5 | MEMORY.md 복구 + 정본 이중화 정리 | 1주 | 거버넌스 | |
| 6 | 데드 코드 160MB 정리 (MonkosChat 포함) | 1~2주 | 아키텍처 | rm 작업 — 작가님 승인 필요 (헌법 4조 2항) |
| 7 | GCS 증명사진 보존정책(TTL)·IAM 점검 | 2주 | 보안/법무 | PIPA |
| 8 | GitHub Actions CI + 테스트 커버리지 | 1개월 | 아키텍처 | |
| 9 | 일본 3채널 운영 + n8n 파이프라인 가동 | 1개월 | 마케팅 | |
| 10 | 의존성 workspace 정책 + TS 검토 | 1~2개월 | 아키텍처 | |

git 히스토리의 키 제거는 `git filter-repo`(파괴적 명령)로 헌법 4조 2항상 작가님 명시 승인 사항. 단 **키 회전이 선행**이며 회전 완료 시 히스토리 정리의 긴급도는 낮아짐.

---

## 완료 보고

- ✅ 4개 영역 병렬 분석 완료 (보안 / 아키텍처 / 마케팅 / 거버넌스)
- ✅ 보안 Critical 4건 파일 직접 교차 검증
- ❌ 미해결: 키 회전·GCS IAM 점검은 GCP 콘솔 권한 필요 (작가님 영역)
- 💡 제안: 순위 2(보안 페일클로즈)는 코드 수정 범위가 작아 즉시 착수 가능
- 📁 산출물: 본 보고서
- 🔀 브랜치: claude/festive-hawking-gmxmuh
