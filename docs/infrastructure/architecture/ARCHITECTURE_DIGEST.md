---
type: DIGEST
date: 2026-02-27
from: 막내4
category: architecture
source_count: 8
---

# 아키텍처 자산 통합 요약 (ARCHITECTURE DIGEST)

> architecture/ 폴더 8건의 핵심 내용을 하나로 통합.

## 시스템 전체 아키텍처

MONK OS는 3-Track 체제로 운영된다. **Track 1**(Mac 디바이스 5대 — M1/iMac/M2/M4/iPhone)이 AI 에이전트 6인(쌍아/막내/소넷이/철창이/용아)의 대화 코딩 및 실시간 파이프라인(WebRTC P2P, Gemini Live 코칭)을 수행하고, **Track 2**(RTX 4060 GPU 서버)가 Imagen 이미지 생성 및 배치 워크로드를 처리하며, **Track 3**(GCS 코퍼스 `gs://monk-project/corpus/`)이 세션/공장 로그를 지식 자산화한다. 디바이스 간 통신은 Tailscale VPN Mesh(RTT 3~7ms) + Git 비동기 동기화로 연결되며, Cloudflare(monk.kr 정적 프론트엔드) + GCP Cloud Run(monkos.ai 백엔드 API, us-central1) 이중 인프라 위에 10개 통신 채널(수발신 헤더/완료 보고/지시서/세션 로그/git commit/텔레그램 등)이 가동된다. 사용자 플로우는 모바일 브라우저 진입 -> 데스크톱/인앱 차단 -> 준비 화면(용도/성별/연령 선택) -> AI 코칭 촬영(Gemini Live WS 1fps) -> 사전분석(Gemini 3 Flash) -> Imagen NB3 Pro I2I 생성 -> QC 검증 -> 규격 크롭 -> 다운로드/인화 순서로 진행된다.

## 서비스별 아키텍처

### MONK Photo Studio

몽크사진관은 포털의 하위 카드가 아닌 **독립 버티컬**로 재정의되었으며, 8단계 공정(촬영 -> 코칭 -> 생성 -> QC -> 규격크롭 -> 리터칭 -> 인화 -> 배송) 중 현재 5단계(촬영~규격크롭)가 구현되어 있다. 4개 서비스 카드로 설계되었다: Card 1(AI 촬영+생성, Gemini Live + Imagen I2I + Gemini Flash QC, 생성 1c), Card 2(규격 크롭, 순수 Canvas 300dpi, 무료 SEO 집객), Card 3(AI 리터칭, Imagen I2I 2차 호출, 크레딧), Card 4(인화 주문, 외부 프린트 연동, 향후). 국가(KR/JP), 용도(여권/이력서/비자 등), 연령, 성별, 규격에 따른 분기 변수를 처리하며, Card 2 무료 크롭 -> Card 1 AI 촬영 -> Card 3 리터칭 -> Card 4 인화의 자연스러운 과금 퍼널을 형성한다. Cloud Run 단일 서비스 내에서 `/app`(Card 1), `/crop`(Card 2), `/retouch`(Card 3) 라우팅으로 분리 예정이다.

### MONKOS AI

인프라 스택은 monk.kr(Cloudflare Pages, 정적 프론트엔드 + CF Functions API) + monkos.ai(GCP Cloud Run us-central1, 4개 서비스: portal/idphoto-kr/idphoto-jp/image-engine)로 구성된다. AI 모델은 Gemini 2.0 Flash Live(Vertex AI ADC, 실시간 WS 코칭) + Gemini 3 Flash(Vertex AI ADC, QC/사전분석 REST) + Imagen NB3 Pro(Google AI Studio API Key, I2I 증명사진 ~$0.134/장)을 사용하며, Imagen 4는 T2I 전용(I2I 미지원)으로 라인업 분리되었다. 데이터베이스는 Firestore(monkos, 유저/크레딧)와 Cloudflare D1(monk-db, 포털용) 이중 구조이다. 배포는 CF Pages 수동(`wrangler pages deploy`, 자동빌드 OFF) + Cloud Run(`deploy.sh dev/prod`) 체계이며, idphoto-kr 프로덕션은 리비전 00079-tpk에 동결 상태이다. CF Function의 Gemini API 호출 시 엣지 PoP IP에 따른 지역 제한(LG U+ 셀룰러 등)이 존재하며, Cloud Run 이전 시 자연소멸 예정이다.

## 설계 원칙

용아(Gemini)가 설계한 Cloud-Native 전환 명세서에 따라, **CF Workers -> GCP Cloud Run 중심 독립 API 서버** 전환을 추진한다. 핵심 원칙은 (1) ADC(Application Default Credentials) 인증으로 API 키 노출 및 유령 ID 원천 차단, (2) 모듈화(검수 노드 Gemini Flash / 생성 노드 Imagen / 릴레이 노드 GCS->R2), (3) 이벤트 기반 아키텍처(GCS 업로드 -> Eventarc -> Pub/Sub -> Cloud Run 검수 트리거)이다. 기술 스택은 Node.js 20 + Docker + @google-cloud/vertexai + @google-cloud/storage + Cloudflare D1(메타데이터) + S3-Compatible SDK(R2 CDN)으로 확정되었으며, GCS 원본/결과물 저장 -> R2 CDN 배포로 전송 비용 제로화를 지향한다.

## 분리/마이그레이션 계획

KR/JP 공유 코어 분리는 "하나의 코드베이스, 두 개의 배포" 원칙에 따라 설계되었다. 현재 idphoto-kr(3,202줄) + idphoto-jp(3,101줄) = 6,303줄에서 ~70%(4,400줄) 중복이 존재하며, 통합 시 `monkos_AI/idphoto/` 단일 코드베이스 ~2,420줄(62% 감소, 중복 0%)로 압축된다. 구조는 `server.js`(코어) + `config/{kr,jp}.js`(리전 설정 주입) + `core/`(ai/coaching/imagen/qc/pre_check/credit/logger 7모듈) + `public/shared/`(공유 CSS+JS) + `public/{kr,jp}/`(i18n/payment/index.html 엔트리포인트)이다. 마이그레이션은 3 Phase로 진행된다: Phase 1(서버 분리 + sharp 제거 + 1024px 클라이언트 캡처), Phase 2(클라이언트 모듈 분리, 카메라 크래시 주의), Phase 3(obfuscate.mjs v2 외부 JS 대응 + Dockerfile REGION ARG 통합 + 배포 스크립트). 이미지 파이프라인은 getUserMedia 512px 캡처 / JPEG 60% / 0.5fps 코칭 / 서버 sharp 제거 / base64 2MB 검증으로 최종 확정되었다.

## 아키텍처 문서 상호 참조

| 문서 | 핵심 주제 | 연관 문서 |
|------|----------|----------|
| 3TRACK_SYSTEM_ARCHITECTURE | 3-Track 시스템(Mac/GPU/GCS), 6인 에이전트 체계, Tailscale 네트워크, 실시간 파이프라인(Photo Coach/Presentation Assistant), 세션 로그 구조 | OPERATIONS_OVERVIEW, ARCHITECTURE_FLOWCHART |
| ARCHITECTURE_FLOWCHART | idphoto 모놀리스 플로우차트(6화면 전환, 서버 데이터 흐름, 인증/결제 시퀀스, KR/JP 리전 분기 맵, 빌드/배포 파이프라인, 전역 상태 관리) | MONKOS_AI_TECHNICAL_SPEC, SHARED_CORE_SEPARATION_PLAN, MONK_PHOTO_STUDIO_ARCHITECTURE |
| ARCHITECTURE_GUIDE_FROM_YONGA | Cloud-Native 전환 명세(CF Workers -> Cloud Run), ADC 인증, 이벤트 기반 아키텍처(GCS -> Eventarc -> Pub/Sub), 기술 스택 확정, 4인 사령탑 체제 | MONKOS_AI_TECHNICAL_SPEC, 3TRACK_SYSTEM_ARCHITECTURE |
| MONKOS_AI_TECHNICAL_SPEC | 총괄 기술명세(서비스 구조, 인프라 스택, AI 모델, 배포 체계, REST/WS API, 크레딧, 장애 이력 6건, 프로덕션 현황, 미해결 과제) | ARCHITECTURE_FLOWCHART, MONK_PHOTO_STUDIO_ARCHITECTURE, SHARED_CORE_SEPARATION_PLAN, 3TRACK_SYSTEM_ARCHITECTURE |
| MONK_PHOTO_STUDIO_ARCHITECTURE | 몽크사진관 독립 버티컬 재정의, 4카드 서비스 설계(AI촬영/크롭/리터칭/인화), 8단계 공정 파이프라인, 수익 구조, 4 Sprint 구현 계획 | SHARED_CORE_SEPARATION_PLAN, ARCHITECTURE_FLOWCHART |
| OPERATIONS_OVERVIEW_20260220 | 5디바이스 인벤토리, Tailscale VPN, 에이전트 배치도(5인), tmux/데몬 체계, 10채널 통신, 텔레그램 인프라, 팀 우체통, 배포 체계, Claude Max 멀티티어 운용 | 3TRACK_SYSTEM_ARCHITECTURE, MONKOS_AI_TECHNICAL_SPEC |
| SHARED_CORE_SEPARATION_PLAN | KR/JP 공유 코어 분리 B안(6,303줄 -> 2,420줄), config 주입 패턴, 클라이언트 모듈 분리, i18n/payment 설계, 이미지 파이프라인 확정, 3-Phase 마이그레이션, Dockerfile/배포 통합 | MONK_PHOTO_STUDIO_ARCHITECTURE, ARCHITECTURE_FLOWCHART, MONKOS_AI_TECHNICAL_SPEC |
| TECHNICAL_SPEC_20260220 | 2/20 인프라 변경(CF Pages 수동배포, photolab MPA 6페이지, functions/ 정본 구조, image_pro 모델 정상화), Gemini API 지역 제한(CF PoP IP), 캡처 파이프라인 512px 최적화, iOS Safari TTS 제한 | MONKOS_AI_TECHNICAL_SPEC, OPERATIONS_OVERVIEW_20260220 |
