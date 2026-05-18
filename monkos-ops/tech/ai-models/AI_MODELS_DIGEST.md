---
type: DIGEST
date: 2026-02-27
from: 막내4
category: ai-models
source_count: 11
---

# AI/모델 자산 통합 요약 (AI MODELS DIGEST)

> ai-models/ 폴더 11건의 핵심 내용을 하나로 통합.

## 모델 연결 현황

Vertex AI 연동은 크게 세 축으로 구성된다. (1) **Gemini Live API**(`gemini-2.0-flash-live-preview-04-09`)는 us-central1 리전에서 Vertex AI ADC 인증으로 실시간 촬영 코칭에 사용되며, 2026-02 기준 이미지 프레임을 받을 수 있는 유일한 Live 모델이다. (2) **Imagen/I2I**(`gemini-3-pro-image-preview`)는 AI Studio API Key로 증명사진 생성을, (3) **Gemini Flash**(`gemini-2.0-flash`)는 QC 검증과 챗봇에 사용된다. 용아(yong_a_test)는 Vertex AI Agent Builder 기반 RAG 챗봇으로, Discovery Engine API를 통해 `data_pipe` 데이터 스토어(15.16MB, CS Q&A 83건)에 연결되며, CF Workers 프록시 경유 또는 직접 호출이 가능하다. 기존 Llama 3.2 3B(Workers) 대비 컨텍스트 이해도가 높아 A/B 테스트 후 점진적 전환이 권장 전략이다.

## 데이터 스키마

BWYA 스키마는 4개 테이블로 설계된다: `soso_prompt_dictionary`(학문/카테고리/태그/가중치/거장 레퍼런스), `mina_model_instances`(모델 코드 MINA-YYYYMMDD-XXXX, 스타일/패션/헤어 태그 JSON, 얼굴 512D 벡터 임베딩, 품질 점수), `mina_model_variants`(의상/포즈/조명/배경 변형, identity_score), `soso_generation_logs`(작업 로그, 토큰 사용량, 처리 시간). K-Beauty 스키마는 5개 테이블로 확장되어 `soso_kbeauty_sources`(원천 이미지, image_hash 중복 방지), `soso_face_tags`(헤어/메이크업/표정 44개 필드), `soso_body_tags`(이너웨어/패션/K뷰티 에스테틱/포즈), `soso_reverse_prompts`(Gemini Vision 분석 -> Imagen 프롬프트 역생성), `mina_generated_models`(최종 AI 모델)을 포함한다. `bwya_prompt_seed.sql`에는 photography(lighting/composition/master), fashion(texture/style), pose, directing(mood) 분야 52건의 초기 시드 데이터가 가중치(0.60~2.00)와 함께 정의되어 있으며, Irving Penn/Peter Lindbergh/Dan Winters 거장 레퍼런스가 포함된다.

## BWYA 아카데미

BWYA(Beauty With Your Art) Academy는 6대 학문 체계로 구성된다: 사진학(조명/구도/색감, Irving Penn-Peter Lindbergh 거장 연구), 패션학(소재/텍스처/9-Grid, 문서 22개로 최대 규모), 헤어조형학(볼륨/컬러/스타일링), 신체구조학(해부학 기반 포즈/콘트라포스토/S-curve), AI 디렉팅학(Imagen/Midjourney/Veo 활용), 언어의 철학(프롬프트 엔지니어링). 총 코퍼스 2,347문단/206,131글자/34개+ 문서/53개+ 프롬프트 태그 보유. GCS 경로 `gs://monk-project/assets/yonga/bwya/`에 커리큘럼/강의/프롬프트 사전/레퍼런스가 저장되며, 용아쌤 AI 튜터(RAG 기반 맞춤 답변/프롬프트 제안/피드백)를 통해 교육 콘텐츠 자동 생성(TTS+Veo -> YouTube) 파이프라인을 계획 중이다. 로드맵: Phase 1 기초 구축(2026 Q2) -> Phase 2 콘텐츠 제작(Q3-Q4) -> Phase 3 서비스 런칭(2027 Q1).

## 코칭 모델

현행 코칭은 `gemini-2.0-flash-live-preview-04-09`로 카메라 JPEG을 WebSocket 경유 서버에서 Gemini로 전송하는 구조이나, 이미지 토큰 고비용/모델 고정/네트워크 이중 hop 문제가 있다. Phase 1에서 `gemini-2.5-flash-native-audio-latest`로 전환을 시도했으나 음성 전용 모델이라 이미지 입력 불가(WebSocket 1007 에러)로 실패, 즉시 롤백했다. Phase 2 설계는 **MediaPipe Face Landmarker**(WASM, 클라이언트 실행)를 도입해 468개 3D 랜드마크 + 52개 Blendshape를 추출한 뒤, ~50bytes JSON(yaw/pitch/roll/eyeOpen/mouthGap/faceCenter/brightness)만 서버로 전송하여 아무 텍스트 모델(2.5 Flash 등)로 코칭하는 벡터 중개 방식이다. 이미지 해석 제거로 모델 종속성 탈피, 비용 절감, 수치 기반 일관성 확보가 핵심 이점이다.

## 룩북/배경 전략

모델과 배경을 분리하여 조합 가능한 **레이어드 룩북 시스템** 구축이 목표다. 배경은 4개 카테고리(스트릿/인테리어/카페/스튜디오)로 분류하고 `soso_backgrounds` 테이블에 조명 분석(type/direction/temperature/intensity), 공간 분석(depth/perspective/focal_point), 색상 팔레트(dominant_colors HEX), 무드/스타일 태그, 512D 스타일/조명 벡터 임베딩을 저장한다. Gemini Vision으로 배경 이미지를 자동 분석하고, Unsplash 크롤링 키워드(카테고리별 8개씩)로 총 1,000장 수집을 목표로 한다. 활용 시나리오로 모델 속성 기반 자동 배경 추천, 스타일 매칭, 조명 방향 일치도 분석이 설계되어 있다.

## QC 컨설턴트

현행 QC v1.0은 Imagen 생성물에 대해 Gemini가 PASS/FAIL 단발성 판정(동일 인물/유사도/성별/연령/과보정 감지/구도)만 수행하며, 실패 원인 설명이 없다. v2.0 **포토 컨설턴트** 아키텍처는 Gemini 3 Flash를 규격 전문가/상담사/프롬프트 엔지니어/품질 관리자 4역할로 확장한다. QC FAIL 시 멀티턴 대화로 문제점 안내 -> Imagen 프롬프트 자동 튜닝(IDENTITY_PRESERVATION 85:15~95:5, 헤어/조명/표정/의상 보정 지시) -> 재생성 -> 재QC 루프를 수행한다. 구현은 Phase 1(관리자용 `/api/qc/consult` API) -> Phase 2(사용자 앱 채팅 UI) -> Phase 3(자동 재생성 루프, 최대 3회)으로 계획되며, QC 상담 자체는 무료, 재생성은 1c 추가이다.

## 크레딧/비용 전략

Vertex AI 260만원 크레딧을 보유하고 있으며, 보수적 운용 시 1년 이상 사용 가능하다. VM `e2-standard-4`(4 vCPU, 16GB, 100GB SSD, us-west1) 기준 월 ~$120으로 17개월 수명이며, 세션 연속성(24시간 VM 가동/자동 백업/GCS 스냅샷)과 멀티 세션(코딩/전략/테스트 VM 분리)이 핵심 메리트이다. 마이그레이션은 Phase 1 병행 운영(2주, Cursor 실무 유지 + Vertex 학습) -> Phase 2 점진적 전환(2주) -> Phase 3 완전 전환(1개월 후)으로 설계되었다. Gemini Live API는 프레임당 ~258 토큰 소비, Imagen 3.0은 AI Studio 무료 티어 활용, GCS 스토리지는 월 ~$0.10(5GB 기준)이다.

## AI 모델 문서 상호 참조

| 문서 | 핵심 주제 | 연관 문서 |
|------|----------|----------|
| VERTEX_AI_CONNECTION_GUIDE | Gemini Live/Imagen/QC 연동 코드, SDK, 인증 방식 | COACHING_MODEL_UPGRADE_SPEC, YONGA_CONNECTION_GUIDE |
| YONGA_CONNECTION_GUIDE | yong_a_test RAG 챗봇을 index.html에 연결, CF Workers 프록시 | YONGA_TEST_SWITCH, VERTEX_AI_CONNECTION_GUIDE |
| YONGA_TEST_SWITCH | Llama vs 용아 A/B 테스트, URL 파라미터 전환 | YONGA_CONNECTION_GUIDE |
| COACHING_MODEL_UPGRADE_SPEC | Gemini 2.5 Live 전환 실패, MediaPipe Phase 2 설계 | VERTEX_AI_CONNECTION_GUIDE, VERTEX_CREDIT_STRATEGY |
| BWYA_SCHEMA_DESIGN | 프롬프트 사전/모델 인스턴스/변형/로그 DB 스키마 | BWYA_ACADEMY_INDEX, bwya_prompt_seed.sql, KBEAUTY_DATA_SCHEMA |
| KBEAUTY_DATA_SCHEMA | K-Beauty 원천/태깅/리버스 프롬프트/생성 모델 스키마 | BWYA_SCHEMA_DESIGN, LOOKBOOK_BACKGROUND_STRATEGY |
| bwya_prompt_seed.sql | 52건 초기 프롬프트 태그 시드 (6개 분야, 가중치 포함) | BWYA_SCHEMA_DESIGN, BWYA_ACADEMY_INDEX |
| BWYA_ACADEMY_INDEX | 6대 학문 커리큘럼, 코퍼스 통계, 학습 경로, 용아쌤 AI 튜터 | BWYA_SCHEMA_DESIGN, bwya_prompt_seed.sql |
| LOOKBOOK_BACKGROUND_STRATEGY | 배경 4카테고리 크롤링, soso_backgrounds 스키마, 자동 추천 | KBEAUTY_DATA_SCHEMA, BWYA_SCHEMA_DESIGN |
| QC_CONSULTANT_ARCHITECTURE | QC v2.0 포토 컨설턴트, 멀티턴 상담, 프롬프트 자동 튜닝 | VERTEX_AI_CONNECTION_GUIDE, COACHING_MODEL_UPGRADE_SPEC |
| VERTEX_CREDIT_STRATEGY | 260만원 크레딧 활용, VM 구성, 마이그레이션 3단계 | VERTEX_AI_CONNECTION_GUIDE, COACHING_MODEL_UPGRADE_SPEC |
