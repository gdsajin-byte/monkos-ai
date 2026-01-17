# MONKOS AI LAB 서비스 구조 (2026-01-18 개편)

## 브랜드 통일: MONKOS
현재 모든 사용자 노출 서비스는 'MONKOS' 브랜드로 통일

## 서비스 트리 (외부 - monk.kr)
사용자가 보는 기능 중심의 직관적 구조

/ai_lab/
├── ai_lab.html        - MONKOS AI LAB (메인)
├── photolab/          - MONKOS Photolab (증명사진, 프로필)
├── lookbook/          - MONKOS LookBook (패션/뷰티 룩북)
├── model_agency/      - MONKOS Model (AI 모델 에이전시)
└── business/          - MONKOS Business (B2B 솔루션)

## 기획 엔진 (내부 - 4 MUSE)
데이터, 로직, 비즈니스 레이어 (GCS, D1 네이밍 유지)
※ 차후 독립 도메인 분리 가능 (soso.com, mina.kr 등)

- 쌍아(ssang_a): AI Chatbot / 고객 응대 / 결제 시스템
- 소소(so_so): 이미지 생성 / Imagen API / 룩북
- 민아(min_a): K-뷰티 모델 에이전시 / AI 모델 자산
- 용아(yong_a): 전략 / Academy / B2B

## 네이밍 규칙
| 레이어 | 네이밍 | 예시 |
|--------|--------|------|
| 사용자 UI | MONKOS + 기능명 | MONKOS Photolab |
| GCS 버킷 | 4 MUSE 접두사 | soso/generated/ |
| D1 테이블 | 4 MUSE 접두사 | soso_orders |
