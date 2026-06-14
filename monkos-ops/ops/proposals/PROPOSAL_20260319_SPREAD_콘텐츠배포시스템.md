---
type: PROPOSAL
id: PROPOSAL_20260319_SPREAD
project: SPREAD
date: 2026-03-19
from: iMac/쌍아
to: 작가님
status: 기안
portfolio: PF_SPREAD
priority: 전략
supersedes: PROPOSAL_20260316_콘텐츠자동배포파이프라인 (n8n 방식 → 코웍이 방식으로 전환)
ref: GEO 전략 (PROPOSAL_20260316), MINA PROJECT, 2026-03-19 작가님 전략 전환 선언
---

# SPREAD — 콘텐츠 배포 시스템

> **SPREAD** = Strategic Publishing, Reach, Engagement, And Distribution
> "한 번 쓰면 전방위로 퍼진다"

---

## 1. 정체성

**정식 명칭**: SPREAD (스프레드)
**성격**: MONKOS 콘텐츠의 전방위 배포 시스템
**핵심 철학**: 코드 파이프라인이 아닌 **에이전트가 수행**하는 콘텐츠 배포

### 왜 SPREAD인가

| 기존 설계 (n8n) | SPREAD (코웍이) |
|-----------------|----------------|
| 코드가 포맷 변환 | AI가 채널별 맞춤 가공 |
| API 장애 = 전체 중단 | 코웍이가 브라우저로 직접 게시 가능 |
| 톤/뉘앙스 획일화 | 채널별 톤 최적화 (트윗 ≠ 기술문서 ≠ 블로그) |
| 세팅/유지보수 비용 높음 | 에이전트 이미 세팅 완료 |
| note.com API 미제공 → 막힘 | 코웍이가 브라우저에서 직접 작성 |

---

## 2. 아키텍처

```
[원본 발행] monk.kr / monkos.ai 블로그
     │
     │ ── 자동 번역 (기존 동작 중) ──
     ├─→ Gemini API → EN 번역 (Firestore)
     ├─→ Gemini API → JA 번역 (Firestore)
     │
     │ ── OG 공유 버튼 (Phase 1) ──
     ├─→ X 공유 (Intent URL) → 즉시 공유
     ├─→ LINE 공유 (URL Scheme) → 즉시 공유
     │
     │ ── 코웍이 배포 (Phase 2) ──
     ├─→ 코웍이가 원문 읽기 (git MCP or works/)
     ├─→ 채널별 포맷 가공 + SEO/GEO 최적화
     ├─→ works/spread/ 에 적립 (산출물 추적)
     └─→ 코웍이가 직접 게시 (브라우저 / git push)
```

### 핵심 원칙

1. **원본은 하나** — monk.kr/monkos.ai 블로그가 정본
2. **번역은 자동** — Gemini API (기존 동작)
3. **배포는 채널별 최적 방식** — n8n 자동 / OG 직접공유 / 코웍이 가공, 혼용
4. **추적은 works/** — 모든 배포물 산출물로 적립
5. **삭제 금지** — 쌓기만 하는 구조

---

## 3. 배포 방식 3가지와 채널별 최적 전략

SPREAD는 단일 방식이 아니다. **채널 특성에 따라 3가지 방식을 혼용**한다.

### 3-0. 방식 비교

| 방식 | 강점 | 약점 | 최적 채널 |
|------|------|------|----------|
| **A. OG 직접공유** | 즉시, 코드 최소, 사용자가 터치 | 맞춤 가공 불가, 수동 | X, LINE, 카카오, 일반 공유 |
| **B. n8n 자동화** | 발행 즉시 자동, 반복 무비용, 정확한 포맷 보장 | 채널별 톤 획일화, API 필요, 세팅 비용 | GitHub Issues, 티스토리, RSS 연동 |
| **C. 코웍이 가공** | 채널별 톤/뉘앙스 최적화, API 없는 채널도 가능, 콘텐츠 품질 최상 | 수동 트리거, 시간 소요 | note.com, Medium, 인스타, 유튜브, 릴스 |

### 3-1. 채널별 최적 방식 매트릭스

#### 텍스트 콘텐츠 채널

| 채널 | 언어 | 최적 방식 | 이유 | GEO/SEO |
|------|------|----------|------|---------|
| **X (Twitter)** | KO/EN/JA | **A** OG 직접공유 + **C** 코웍이 스레드 | 단발 공유는 버튼, 스레드형 심화는 코웍이 가공 | ★★ 바이럴 |
| **LINE** | JA | **A** OG 직접공유 | Intent URL로 충분, JA OG가 미리보기 결정 | ★ JA 도달 |
| **카카오톡** | KO | **A** OG 직접공유 | Kakao SDK 버튼, KR 사용자 도달 | ★ KR 도달 |
| **GitHub Issues** | EN | **B** n8n 자동 | 포맷이 정형(마크다운+라벨), API 안정, 반복 발행 | ★★★ GEO 최상 |
| **note.com** | JA | **C** 코웍이 가공 | API 미제공, 경어체 톤 맞춤 필수, 아이캐치 구성 | ★★ JA SEO |
| **Medium** | EN | **C** 코웍이 가공 | 기술블로그 톤 가공 + canonicalUrl 설정 | ★★ EN SEO |
| **티스토리** | KO | **B** n8n 자동 | 공식 API, 네이버 SEO 키워드 자동 삽입 가능 | ★★ KR SEO |
| **네이버 블로그** | KO | **C** 코웍이 가공 | API 제한적, 네이버 SEO 최적화 세밀 조정 필요. 에이징 자산 활용 | ★★★ KR 네이버 최상 |

#### 비주얼/영상 콘텐츠 채널

| 채널 | 언어 | 최적 방식 | 이유 | 효과 |
|------|------|----------|------|------|
| **Instagram 피드** | KO/EN/JA | **C** 코웍이 가공 | 카드뉴스 이미지+캡션+해시태그 맞춤 필수 | ★★ 비주얼 브랜딩 |
| **Instagram 릴스** | KO/EN/JA | **C** 코웍이 가공 | 쇼트폼 대본+해시태그+커버, 영상 편집은 별도 | ★★★ 도달률 최상 |
| **YouTube** | KO/EN/JA | **C** 코웍이 가공 | 제목/설명란/태그/챕터/자막 맞춤, 영상은 별도 제작 | ★★★ 검색+체류 |
| **YouTube Shorts** | KO/EN/JA | **C** 코웍이 가공 | 릴스와 동일 소스, 플랫폼별 해시태그/설명 차이 | ★★★ 도달률 |
| **TikTok** | KO/EN/JA | **C** 코웍이 가공 | 릴스/숏츠와 동일 소스, 트렌드 해시태그 별도 | ★★ Z세대 도달 |
| **Pinterest** | EN/JA | **C** 코웍이 가공 | 핀 설명+보드 분류+ALT 태그, 뷰티/증명사진 비주얼 | ★★ 이미지 SEO |

#### 메신저/커뮤니티 채널

| 채널 | 언어 | 최적 방식 | 이유 | 효과 |
|------|------|----------|------|------|
| **텔레그램 채널** | KO | **B** n8n 자동 | Bot API 안정, 정형 메시지, 팀 내부 공유에도 활용 | ★ 내부+외부 |
| **Reddit** | EN | **C** 코웍이 가공 | 서브레딧별 톤/규칙 다름, 자연스러운 글 필수 | ★★ EN 커뮤니티 |
| **ProductHunt** | EN | **C** 코웍이 가공 | 런치/업데이트 시 한정, 고품질 피치 필수 | ★★★ 초기 트래픽 |

### 3-2. 방식별 정리

#### A. OG 직접공유 — 포털 블로그 공유 버튼

```
블로그 페이지 하단/상단에 공유 버튼 배치
사용자(작가님/꾸/한) 클릭 → 해당 앱에서 공유 확인 → 게시
```

| 채널 | 구현 | 비용 |
|------|------|------|
| X | `twitter.com/intent/tweet?text=&url=` | 무료 |
| LINE | `line://msg/text/` | 무료 |
| 카카오 | Kakao Share SDK | 무료 (앱 등록) |
| Web Share | `navigator.share()` | 무료 |

**전제**: OG 메타태그 완비 (✅ 이미 적용됨)

#### B. n8n 자동화 — API 정형 채널

```
블로그 발행 (Firestore 트리거 or Webhook)
    → n8n 워크플로 감지
    → 채널별 API 자동 호출
    → 게시 완료 로그 Firestore 기록
```

| 채널 | API | 토큰 | 난이도 |
|------|-----|------|--------|
| GitHub Issues | REST API v3 | PAT (repo, issues) | 낮음 |
| 티스토리 | Open API | OAuth2 | 중 |
| 텔레그램 | Bot API | Bot Token | 낮음 |

**n8n 유리 조건**: 포맷이 정형적, API가 안정적, 반복 발행, 톤 맞춤 불필요

#### C. 코웍이 가공 — 맞춤 채널

```
작가님 지시 ("스프레드") or 코웍이 자율 감지
    → 원문 읽기 (git MCP)
    → 채널별 톤/포맷/언어 가공
    → works/spread/ 적립
    → 코웍이 브라우저 직접 게시
```

**코웍이 유리 조건**: API 미제공, 톤/뉘앙스 맞춤 필수, 비주얼 구성, 커뮤니티 예절

### 3-3. 콘텐츠 유형별 배포 매핑

블로그 글뿐 아니라 **다양한 콘텐츠 유형**이 각기 다른 채널에 매핑된다.

| 콘텐츠 유형 | 원본 | 배포 채널 | 방식 |
|------------|------|----------|------|
| **기술 블로그** | monkos.ai/blog | GitHub Issues(EN), Medium(EN), 티스토리(KO), note.com(JA) | B+C |
| **서비스 업데이트** | monkos.ai/blog | X(다국어), 텔레그램, LINE | A+B |
| **비포/애프터 사례** | Studio 결과물 | 인스타 피드, Pinterest | C |
| **기술 데모 영상** | 별도 촬영 | YouTube, 릴스, Shorts, TikTok | C |
| **쇼트폼 (15~60초)** | 별도 촬영/편집 | 릴스, Shorts, TikTok | C |
| **에피소드 카탈로그** | 에피소드 보고서 | GitHub Issues(EN), 블로그(KO) | B+C |
| **크롭앱 튜토리얼** | 별도 기획 | YouTube, 블로그, 인스타 | C |

### 3-4. SEO/GEO 파일 체계

| 파일 | 용도 | 위치 |
|------|------|------|
| `og:*` 메타태그 | SNS 미리보기 + 공유 품질 | 블로그 HTML head |
| `og:video` | 영상 공유 시 미리보기 | 영상 포함 페이지 |
| `JSON-LD Article` | 구조화 데이터 (검색엔진) | 블로그 HTML |
| `JSON-LD VideoObject` | 영상 구조화 데이터 | 영상 포함 페이지 |
| `llms.txt` | AI 크롤러 출입증 | monkos.ai 루트 (✅ 완료) |
| `robots.txt` | 크롤링 허용 | monkos.ai 루트 (✅ 완료) |
| `sitemap.xml` | 검색엔진 색인 | monkos.ai 루트 (✅ 완료) |
| `video-sitemap.xml` | 영상 검색 색인 | monkos.ai 루트 (신규) |
| `hreflang` | 다국어 연결 | 블로그 HTML (✅ 완료) |
| `canonicalUrl` | 원본 지정 | 각 채널 게시 시 monkos.ai 원본 링크 |

---

## 4. SPREAD 실행 프로토콜

### 4-1. 트리거

**블로그/텍스트 콘텐츠:**
```
작가님: "스프레드 돌려" / "SPREAD" / "배포해"
    → A(직접공유): 작가님/한/꾸가 버튼 클릭
    → B(n8n): 자동 실행 (Firestore 트리거)
    → C(코웍이): 코웍이가 원문 읽기 → 가공 → 적립 → 게시
```

**비주얼/영상 콘텐츠:**
```
작가님: 영상 소스 제공 + "스프레드"
    → C(코웍이): 제목/설명/태그/자막 가공 → 적립
    → 작가님/한: 각 플랫폼에 업로드 (영상은 직접)
```

### 4-2. 블로그 발행 시 SPREAD 흐름 (전체)

```
[블로그 발행]
     │
     ├─ [자동] 번역 (Gemini → EN/JA Firestore)
     │
     ├─ [자동] n8n 워크플로 (방식 B)
     │   ├─→ GitHub Issue 자동 생성 (EN, 라벨+GEO키워드)
     │   ├─→ 티스토리 자동 게시 (KO, 네이버 SEO)
     │   └─→ 텔레그램 채널 알림
     │
     ├─ [수동] OG 직접공유 (방식 A)
     │   ├─→ 작가님/한: X 공유 버튼 클릭
     │   ├─→ 꾸: LINE/카카오 공유 버튼 클릭
     │   └─→ 모바일: Web Share → 앱 선택
     │
     └─ [지시] 코웍이 가공 (방식 C)
         ├─→ note.com: JA 경어체 + 아이캐치 → 브라우저 게시
         ├─→ Medium: EN 기술블로그 톤 + canonicalUrl → 브라우저 게시
         ├─→ X 스레드: 심화 버전 (단발 공유와 별도)
         ├─→ 인스타: 카드뉴스 이미지 기획 + 캡션 + 해시태그
         └─→ works/spread/ 전체 적립

```

### 4-3. 영상 콘텐츠 SPREAD 흐름

```
[영상 소스 제작] 작가님/한 촬영·편집
     │
     └─ [지시] 코웍이 가공 (방식 C)
         ├─→ YouTube: 제목(KO/EN/JA) + 설명란 + 태그 + 챕터 + 자막파일
         ├─→ YouTube Shorts: 60초 컷 대본 + 해시태그
         ├─→ 인스타 릴스: 캡션 + 해시태그 (플랫폼별 차이)
         ├─→ TikTok: 트렌드 해시태그 + 캡션
         ├─→ Pinterest: 핀 설명 + 보드 분류
         └─→ works/spread/ 전체 적립
```

### 4-4. 산출물 적립 구조

```
works/spread/
├── SPREAD_20260319_{slug}/          # 텍스트 콘텐츠
│   ├── github_issue_en.md           # n8n 자동 or 코웍이
│   ├── note_ja.md                   # 코웍이
│   ├── medium_en.md                 # 코웍이
│   ├── tistory_ko.md                # n8n 자동
│   ├── tweet_ko.md / _en / _ja      # 코웍이 (스레드용)
│   ├── instagram_caption.md         # 코웍이
│   └── PUBLISH_LOG.md               # 게시 URL + 시각 + 방식(A/B/C)
│
├── SPREAD_20260320_{video_title}/   # 영상 콘텐츠
│   ├── youtube_meta.md              # 제목/설명/태그/챕터
│   ├── youtube_subtitle_ko.srt      # 자막
│   ├── youtube_subtitle_en.srt
│   ├── shorts_caption.md
│   ├── reels_caption.md
│   ├── tiktok_caption.md
│   ├── pinterest_pin.md
│   └── PUBLISH_LOG.md
└── ...
```

### 4-5. canonicalUrl 전략

모든 채널에서 원본 링크를 명시:
- GitHub Issue: `Originally published on [monkos.ai](https://monkos.ai/blog/{slug})`
- Medium: `canonicalUrl` 필드 설정
- note.com: 본문 말미 원본 링크
- 티스토리: 본문 말미 원본 링크
- YouTube 설명란: 블로그 원문 링크 포함
- 인스타/릴스: 프로필 링크트리에 monkos.ai

→ 검색엔진이 monkos.ai를 정본으로 인식 = SEO 중복 방지 + DA 집중

---

## 5. works/ 폴더 구조 확장

```
works/
├── spread/                        # SPREAD 산출물 (신규)
│   ├── SPREAD_20260319_{slug}/    # 블로그 글별 폴더
│   │   ├── github_issue.md
│   │   ├── note_ja.md
│   │   ├── tweet_ko.md
│   │   ├── medium_en.md
│   │   ├── tistory_ko.md
│   │   └── PUBLISH_LOG.md         # 게시 완료 URL + 시각
│   └── ...
├── ops/
├── han/
├── kku/
└── ...
```

---

## 6. Phase 로드맵

| Phase | 내용 | 방식 | 실행 주체 |
|-------|------|------|----------|
| **1** | 블로그 공유 버튼 추가 (X, LINE, 카카오, Web Share) | A | 막내 |
| **2** | works/spread/ 구조 + 코웍이 SPREAD 프로토콜 확정 | - | 쌍아 |
| **3** | 코웍이 첫 SPREAD 실행 (기존 블로그 1건 테스트) | C | 코웍이 |
| **4** | n8n 세팅 (GitHub Issues + 티스토리 + 텔레그램) | B | 막내 |
| **5** | GitHub Issues GEO 7건 게시 | B+C | n8n + 코웍이 |
| **6** | note.com + Medium 코웍이 배포 루틴화 | C | 코웍이 |
| **7** | 인스타/릴스/Shorts 비주얼 배포 체계 구축 | C | 코웍이+한 |
| **8** | YouTube 본격 운용 + 자막/챕터 체계 | C | 코웍이+작가님 |
| **9** | 정기 운용 — 블로그 발행 → 자동(B) + 수동(A) + 코웍이(C) 동시 | A+B+C | 전체 |

---

## 7. 결정 필요 사항

1. **프로젝트명 SPREAD 승인**
2. **Phase 1 즉시 착수 여부** — 블로그 공유 버튼 (막내 지시서 1건)
3. **n8n 세팅 범위** — GitHub Issues + 티스토리 + 텔레그램 자동화 착수 시기
4. **코웍이 배포 우선 채널** — note.com, Medium, 인스타 중 어디부터?
5. **계정 현황** — 철창이 채널 리포트 (2026-03-19) 기반 전수 확인 완료
   - 출처: `works/ops/reports/REPORT_20260319_철창이_채널현황_SNS_SEO점검.md`

   **텍스트/블로그 채널:**
   | 채널 | 계정 | 상태 | 방식 |
   |------|------|------|------|
   | monkos.ai 블로그 | 자체 CMS | ✅ 운영 중 (정본) | 원본 |
   | 네이버 블로그 | blog.naver.com/monkos_ai | ✅ 운영 중 (에이징 자산) | C 코웍이 |
   | 티스토리 | monkos.tistory.com | ✅ 1포스트, 블로그명/카테고리 미설정 | B n8n |
   | Medium | medium.com/@gdsajin | ✅ 계정만, 포스트 0건 | C 코웍이 |
   | note.com | note.com/monkos_ai | ✅ 활발 (JA), 팔로워 0 | C 코웍이 |
   | GitHub Issues | gdsajin-byte/monkos-ai | ✅ PUBLIC, 이슈 2건 | B n8n |

   **SNS 채널:**
   | 채널 | 계정 | 상태 | 방식 |
   |------|------|------|------|
   | X (메인) | @MONKOS_AI | ✅ 운영 중 (작가님), note→X 자동 배포 | A+C |
   | X (서브) | @Photo_monkos | ✅ 운영 중 (한), ⚠️ JA 오타 다수 | C 코웍이 |
   | 인스타 (JP) | @monkos.ai | ✅ 25게시물, 팔로워 2, ⚠️ 소개문 오타 | C 코웍이 |
   | 인스타 (KR) | @monk_photo | ✅ 40게시물, 팔로워 27, ❌ monkos.ai 연결 없음 | C 코웍이 |

   **영상 채널:**
   | 채널 | 계정 | 상태 | 방식 |
   |------|------|------|------|
   | YouTube (몽크사진관) | @몽크사진관 | 거의 미운영, 구독 4 | C 코웍이 |
   | YouTube (미사한울TV) | @TV-Misa_Hanwool | ✅ 운영 중, **구독 700** (로컬KR) | C 코웍이 |
   | YouTube (MONKOS AI) | monkosailab@gmail.com | ✅ 비즈니스 계정 — 채널 개설 예정. 복수 관리자(한/꾸) 가능 | C 코웍이 |
   | TikTok | - | ❌ 미개설 | 신규 필요 |

   **메신저 채널:**
   | 채널 | 계정 | 상태 | 방식 |
   |------|------|------|------|
   | 카카오톡 | MONKOS AI 증명사진 | ✅ 인증완료, 유료(월14,900원) | A 직접공유 |
   | LINE | @208xpvko (몬코스) | 미활성, 친구 2명 | A 직접공유 |

   **즉시 보완 필요 (철창이 지적):**
   - 티스토리: 블로그명/소개/카테고리 설정
   - 인스타 @monkos.ai: 소개문 JA 오타 교정
   - 인스타 @monk_photo: monkos.ai 온라인 서비스 연결 CTA 추가
   - X @Photo_monkos: JA 게시물 오타/혼재 교정 프로세스
   - note.com: 매거진에 포스트 귀속, 제목 한국어 혼재 정리
   - GSC: http/https 정규화, privacy.html noindex 처리
6. **카카오톡 공유** — Kakao SDK 앱 등록 필요. 포함할지?
7. **영상 제작 체계** — 촬영/편집 주체 (한? 작가님? 외주?), 편집 도구
8. **쇼트폼 전략** — 릴스/Shorts/TikTok 동시 운용할지, 채널 선별할지

---

## 8. 기존 기안서와의 관계

| 기존 기안서 | 상태 | SPREAD 관계 |
|------------|------|------------|
| `PROPOSAL_20260316_콘텐츠자동배포파이프라인` | **대체** | n8n/코드 방식 → 코웍이 방식으로 전환 |
| `PROPOSAL_20260316_GEO_GitHub공개레포_전략` | **흡수** | Phase 4에서 GitHub Issues 7건 게시로 통합 |

---

### 변경 이력

| 일자 | 내용 |
|------|------|
| 2026-03-19 | 초안 작성 (iMac/쌍아). 작가님 전략 전환 선언 — n8n → 코웍이. note.com 공유 로직 조사 반영 |
| 2026-03-19 | 1차 수정 — 채널별 최적 방식 혼용 체계 (A직접공유/B-n8n/C코웍이). 영상채널(YouTube/릴스/Shorts/TikTok/Pinterest) 추가. 콘텐츠 유형별 매핑. 작가님 피드백 반영 |
