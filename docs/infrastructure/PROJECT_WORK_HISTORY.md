# MONKOS 프로젝트 작업 이력

**작성일:** 2026-02-13
**분석 대상:** 33개 세션 (2026-01-08 ~ 2026-02-13)
**위치:** `docs/corpus/sessions/`

---

## 1. 인프라/DevOps

### 1.1 Git 히스토리 최적화
- **날짜**: 2026-01-14
- **WHY**: 프로젝트 2.6GB 누적, GitHub 1GB 제한 초과 위험
- **WHAT**: Git 히스토리에서 대용량 바이너리 파일 제거
- **HOW**:
  - `git filter-branch` + gc로 15,851개 파일 제거
  - 로컬 백업 2.8GB 선행
- **RESULT**: ✅ 성공
  - 용량 2.6GB → 114MB (**-96%**)
  - 전체 3.0GB → 554MB (**-82%**)

### 1.2 Cloudflare 프록시 전환
- **날짜**: 2026-02-13
- **WHY**: 갤럭시폰 접속 거부 문제 (DNS Only 상태)
- **WHAT**: Cloudflare CDN 프록시 + 보안 헤더 강화
- **HOW**:
  - DNS Only → Proxied (주황 구름) 전환
  - SSL/TLS Full (Strict)
  - 3개 서비스에 HSTS, X-Frame-Options 추가
- **RESULT**: ✅ 완료
  - portal: 00031-hk4
  - idphoto-jp: 00054-ck5
  - idphoto-kr: 00050-6gk

### 1.3 Tailscale VPN 메시 네트워크
- **날짜**: 2026-02-01 ~ 2026-02-07
- **WHY**: 4대 기기 간 원격 접속 + 보안
- **WHAT**: P2P VPN 네트워크 구축
- **HOW**: WireGuard 기반, NAT traversal
- **RESULT**: ✅ 완료
  - 4대 연결: Windows(4060), iMac, 맥미니, iPhone
  - Ping: 3-4ms (로컬), 16-83ms (iPhone)

---

## 2. 인증/보안

### 2.1 Google OAuth 2.0 + One Tap
- **날짜**: 2026-02-11 (구현), 2026-02-13 (개선)
- **WHY**: 회원 기반 크레딧 시스템 필요
- **WHAT**: Google/카카오/LINE OAuth 연동
- **HOW**:
  - Google One Tap 구현
  - 삼성 브라우저 호환성 설정 개선
  ```javascript
  auto_select: false,
  cancel_on_tap_outside: false,
  itp_support: true
  ```
- **RESULT**: ✅ 완료
  - 구글 로그인 정상 작동
  - 카카오/LINE: 구현 완료, 테스트 중

### 2.2 CORS 화이트리스트
- **날짜**: 2026-02-13
- **WHY**: CORS `*` 전체 허용 보안 취약점
- **WHAT**: 허용 도메인 제한
- **HOW**:
  ```javascript
  const ALLOWED_ORIGINS = [
    'https://monkos.ai',
    'https://idphoto-jp.monkos.ai',
    'https://idphoto-kr.monkos.ai',
    'http://localhost:8080',
    'http://localhost:3000',
  ];
  ```
- **RESULT**: ✅ 로컬 적용 (다음 배포 시 반영)

### 2.3 보안 점검 보고서
- **날짜**: 2026-02-13
- **WHY**: 포털 서비스 확장 전 보안 점검 필요
- **WHAT**: 취약점 분석 및 조치 계획
- **HOW**: 코드 리뷰 + 공격 시나리오 분석
- **RESULT**: ✅ 보고서 작성
  - 심각 2건, 높음 3건, 중간 4건, 낮음 2건
  - 현재 보안 수준: 40%
  - 문서: `docs/infrastructure/SECURITY_AUDIT_REPORT.md`

---

## 3. AI/이미지 생성 엔진

### 3.1 MONKOS Image Pro (핵심 엔진)
- **날짜**: 2026-01-13 (발견), 2026-01-22 (배포)
- **WHY**: Imagen T2I 대비 I2I 정체성 유지 필요
- **WHAT**: Imagen 3 Pro I2I + 정체성 보존 프롬프트
- **HOW**:
  ```javascript
  SDK: @google/genai
  Model: gemini-3-pro-image-preview
  IDENTITY_PRESERVATION: 90:10 비율
  ```
- **RESULT**: ✅ 성공
  - Blackbox 배포 완료
  - R&D 자산 보호

### 3.2 K뷰티 데이터 수집
- **날짜**: 2026-01-13 ~ 2026-01-23
- **WHY**: 모델 학습용 대규모 데이터 축적
- **WHAT**: 네이버 API 크롤링 + Gemini Vision 태깅
- **HOW**:
  - kbeauty_crawler.py: 5개 카테고리
  - BWYA_SCHEMA: 53개 태그
- **RESULT**: ✅ 완료
  - 수집량: **7,897장 (2.8GB)**
  - Bucket: gs://monk-ai-images/raw_data/

### 3.3 실시간 AI 코칭
- **날짜**: 2026-02-09 ~ 현재
- **WHY**: 셀카 품질 향상 가이드 필요
- **WHAT**: Gemini Live 기반 실시간 코칭
- **HOW**:
  - WebRTC 카메라 스트림
  - 코칭 프롬프트 스타일별 분기 (여권/이력서)
- **RESULT**: ✅ 배포 완료
  - idphoto-jp, idphoto-kr 적용

---

## 4. 증명사진 서비스 (ID Photo)

### 4.1 일본 증명사진 서비스
- **날짜**: 2026-02-09 ~ 2026-02-13
- **WHY**: 일본 시장 진출 (LINE 미니앱 연동)
- **WHAT**: Cloud Run 기반 증명사진 생성
- **HOW**:
  - 일본 취활(就活) 규칙 적용
  - 스츠: 검정 무지 90%+
  - 여성: 흰색 블라우스 (프릴 NG)
  - 남성: 블루 레지멘탈 넥타이
- **RESULT**: ✅ 배포 완료
  - https://idphoto-jp.monkos.ai
  - 리비전: 00054-ck5

### 4.2 한국 증명사진 서비스
- **날짜**: 2026-02-10 ~ 2026-02-13
- **WHY**: 홈마켓 서비스 기반 확보
- **WHAT**: idphoto-jp 동일 구조 한국어판
- **HOW**: i18n 시스템 60개+ 키
- **RESULT**: ✅ 배포 완료
  - https://idphoto-kr.monkos.ai
  - 리비전: 00050-6gk

### 4.3 다운로드 UX 개선
- **날짜**: 2026-02-13
- **WHY**: 2단계 다운로드 → 1단계 필요
- **WHAT**: 롱프레스 네이티브 저장 + SNS 이벤트
- **HOW**:
  - 이미지 롱프레스 → 네이티브 "사진에 저장"
  - contextmenu 이벤트 감지 → 완료 표시
  - SNS 공유 (+10c) 텔레그램 이벤트
- **RESULT**: ✅ 완료
  - 모든 브라우저 통일 UX (삼성/iOS/Chrome)

---

## 5. 결제/크레딧

### 5.1 글로벌 결제 (Lemon Squeezy)
- **날짜**: 2026-02-11
- **WHY**: 글로벌 결제 수단 필요
- **WHAT**: Lemon Squeezy 연동 (JP/글로벌)
- **HOW**:
  - Webhook 연동
  - Variant ID → 크레딧 매핑
- **RESULT**: ✅ 완료
  - 10c/$10, 30c/$25, 50c/$40

### 5.2 한국 결제 (토스페이먼츠)
- **날짜**: 2026-02-11
- **WHY**: 한국 원화 결제 필요
- **WHAT**: 토스페이먼츠 연동
- **HOW**: 금액(KRW) → 크레딧 매핑
- **RESULT**: ✅ 완료
  - 10c/₩12,900, 30c/₩29,900, 50c/₩45,900

### 5.3 크레딧 NFT화 검토
- **날짜**: 2026-02-13
- **WHY**: 크레딧 양도/거래 가능성 검토
- **WHAT**: 법적 리스크 + 기술 난이도 분석
- **HOW**: 한국/일본 규제 분석
- **RESULT**: ❌ 비권장 (4.25/10)
  - VASP 등록 필수 (한국 5억+, 일본 3억엔+)
  - 대안: 멤버십 NFT 또는 크레딧 선물 기능
  - 문서: `docs/infrastructure/CREDIT_NFT_FEASIBILITY_REPORT.md`

---

## 6. 텔레그램 통합

### 6.1 텔레그램 CS봇
- **날짜**: 2026-02-13
- **WHY**: 카카오 알림톡 과금 vs 텔레그램 무료
- **WHAT**: @monkos_support_bot 연동
- **HOW**:
  - `/start {userId}` 딥링크
  - chatId↔userId 매핑 (telegram_links)
- **RESULT**: ✅ 완료

### 6.2 이벤트 보너스 시스템
- **날짜**: 2026-02-13
- **WHY**: SNS 공유 유도 + 텔레그램 락인
- **WHAT**: 이미지 공유 → 10c 자동 지급
- **HOW**:
  - 웹훅: 이미지 메시지 감지
  - shareBonusClaimed 체크 → 중복 방지
- **RESULT**: ✅ 완료

### 6.3 원격 1:1 리터칭 앱 기획
- **날짜**: 2026-02-13
- **WHY**: 프리미엄 수작업 리터칭 서비스
- **WHAT**: "아프리카TV 별풍선 + 실시간 포토샵"
- **HOW**:
  - Screen Capture API (창 공유)
  - WebRTC 스트리밍
  - 실시간 번역 채팅 (JP↔KR↔EN)
  - 시간제 크레딧 과금
- **RESULT**: ⏸️ 기획 완료
  - 문서: `docs/infrastructure/REMOTE_RETOUCH_APP_PROPOSAL.md`

---

## 7. 브랜딩/UI

### 7.1 MONKOS 브랜드 통일
- **날짜**: 2026-01-18, 2026-02-11
- **WHY**: 내부(4뮤즈) vs 외부(MONKOS) 구분 필요
- **WHAT**: 외부는 MONKOS.AI로 통일
- **HOW**:
  - 내부: 쌍아/소소/민아/용아 (기획 엔진)
  - 외부: MONKOS AI (공식 서비스)
  - meta/hero/tag 전체 전환
- **RESULT**: ✅ 완료

### 7.2 다국어 i18n 시스템
- **날짜**: 2026-02-10
- **WHY**: 일본어/한국어 동시 지원
- **WHAT**: TRANSLATIONS 객체 기반 동적 전환
- **HOW**:
  - data-i18n 속성
  - localStorage 선택 유지
  - Noto Sans KR/JP 웹폰트
- **RESULT**: ✅ 완료
  - 60개+ 키 번역

### 7.3 팀 전용 언어 전환
- **날짜**: 2026-02-13
- **WHY**: 작가님/팀원 일본 버전 확인 필요
- **WHAT**: `?team=1` URL 파라미터로 스위치 노출
- **HOW**: 네비바/앱 화면 우상단에 토글 버튼
- **RESULT**: ✅ 완료

---

## 8. R&D/정책자금

### 8.1 디딤돌 첫걸음 R&D
- **날짜**: 2026-01-15 ~ 2026-01-23
- **WHY**: 정부 정책자금 확보
- **WHAT**: IRIS 시스템 제출
- **HOW**:
  - 기술개발목표 4가지
  - 예산 2.67억원 (정부 75% + 민간 25%)
  - 팀: 신정규(총괄) + 한송이(연구) + 구정희(운영)
- **RESULT**: ✅ 제출 완료 (2026-01-23 18:00)

### 8.2 KOITA 현장조사 대응
- **날짜**: 2026-02-12 ~ 2026-02-13
- **WHY**: R&D 활동 증빙 필요
- **WHAT**: 연구활동보고서 + 활동증빙
- **HOW**: 세션 로그 기반 2개월 증빙
- **RESULT**: ✅ 완료
  - 문서: `docs/rnd_2026/`

---

## 9. 아키텍처/시스템 설계

### 9.1 2-Tier 아키텍처
- **날짜**: 2026-01-12
- **WHY**: Cloudflare Worker 외부 통신 제약
- **WHAT**: 내부(Cloud Run) + 외부(Cloudflare) 분리
- **HOW**:
  ```
  [Tier 1 - 내부]
  └── GCP Cloud Run + Vertex AI (ADC)

  [Tier 2 - 외부]
  └── Cloudflare Pages/R2/D1
  ```
- **RESULT**: ✅ 배포 완료

### 9.2 데이터 아키텍처 (5버킷)
- **날짜**: 2026-01-13
- **WHY**: 4뮤즈 기반 데이터 관리
- **WHAT**: D1 단일 DB + 5개 버킷
- **HOW**:
  ```
  shared_  ← 공유 (회원, 크레딧)
  ssanga_  ← 쌍아 (B2B, 챗봇)
  soso_    ← 소소 (이미지 생성)
  mina_    ← 민아 (AI 모델)
  yonga_   ← 용아 (교육)
  ```
- **RESULT**: ✅ 설계 완료

### 9.3 멀티 AI 에이전트 시스템
- **날짜**: 2026-02-08
- **WHY**: AI 역할 분담
- **WHAT**: 5인 팀장급 체제
- **HOW**:
  | 인격 | 채널 | 역할 |
  |------|------|------|
  | 쌍아 | VSCode Opus | 코딩 메인 |
  | 막내 | CLI Opus | 자동화/CLI |
  | 철창이 | 웹 Claude | 전략/브레인스토밍 |
  | 코웍 | 코웍 모드 | 자율 자동화 |
  | 용아 | Gemini | 전략가/아키텍처 |
- **RESULT**: ✅ 완료

---

## 10. 기획/전략

### 10.1 일본 시장 진출
- **날짜**: 2026-01-17 ~ 현재
- **WHY**: K뷰티 + AI 조합 블루오션
- **WHAT**: LINE 미니앱 + idphoto-jp
- **HOW**:
  - 일본어 네이티브 UX
  - 일본 취활 규칙 적용
  - Instagram + X + LINE 마케팅
- **RESULT**: ✅ 진행 중
  - idphoto-jp 배포 완료
  - LINE 미니앱 연동 예정

### 10.2 경쟁사 분석
- **날짜**: 2026-02-12
- **WHY**: 시장 포지셔닝
- **WHAT**: 일본/한국/글로벌 경쟁사 분석
- **HOW**:
  - PhotoAiD (폴란드): $10M 매출, $6.95~$9.95
  - MONKOS 차별점: "실시간 AI 코칭 + I2I 재생성"
- **RESULT**: ✅ 분석 완료

---

## 핵심 성과 요약

| 분야 | 성과 | 상태 |
|------|------|------|
| R&D 자금 | 디딤돌 2.67억원 신청 | ✅ 제출 완료 |
| 핵심 엔진 | MONKOS Image Pro (I2I) | ✅ 배포 완료 |
| 일본 서비스 | idphoto-jp | ✅ 배포 완료 |
| 한국 서비스 | idphoto-kr | ✅ 배포 완료 |
| 데이터 수집 | K뷰티 7,897장 | ✅ 완료 |
| 인프라 | Cloud Run + Cloudflare CDN | ✅ 완료 |
| 인증 | Google/카카오/LINE OAuth | ✅ 완료 |
| 브랜딩 | MONKOS 통일 | ✅ 완료 |
| AI 팀 | 5인 팀장급 체제 | ✅ 완료 |

---

## 다음 우선순위

1. **LINE 미니앱**: idphoto-jp 연동
2. **보안 강화**: 크레딧 API 인증 (유료 고객 증가 시)
3. **모델 DB**: 7,897장 전체 태깅 + Vertex AI Corpus
4. **벤처인증**: 추가 정책자금 공고

---

**문서 끝**
