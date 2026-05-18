---
type: README
date: 2026-02-27
from: 막내3
---

# lib

> **소관**: 막내
> **성격**: 정본 (프로덕션 서비스)
> **법적 근거**: ch4 2조

## 개요

MONKOS.AI 포탈(Cloud Run) 서비스의 핵심 라이브러리. server.js에서 분리된 인증, 결제, 챗봇, 크레딧, 텔레그램 연동 등 모든 비즈니스 로직 모듈이 위치한다.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| auth.js | 인증 핸들러 — server.js에서 추출된 OAuth/토큰 인증 로직 | 2026-02-27 |
| chat-engine.js | 통합 챗봇 엔진 — chatWithMonkos() + 채널 설정 + 대화 히스토리 관리 | 2026-02-27 |
| coaching.js | AI 코칭 핸들러 — 촬영 가이드, QC 검증 연동 | 2026-02-27 |
| credits.js | 크레딧 관리 — 잔액 조회, 차감, Firestore 거래 기록 | 2026-02-27 |
| events.js | 이벤트 처리 — 쿠폰/프로모션, 텔레그램/카카오 채널 연동 | 2026-02-27 |
| kakao-chatbot.js | 카카오 챗봇 웹훅 핸들러 — chatWithMonkos 엔진 연동 | 2026-02-27 |
| payments.js | 결제 처리 — LemonSqueezy/토스페이먼츠 웹훅, HMAC 인증, 크레딧 지급 | 2026-02-27 |
| prompts.js | 챗봇 시스템 프롬프트 + 동적 빌더 — 코칭/QC 프롬프트 생성 | 2026-02-27 |
| rag.js | CS 지식 RAG — Firestore cs_knowledge 컬렉션 기반 검색 | 2026-02-27 |
| telegram-team.js | 팀 협업 텔레그램 봇 — @monkos_team_bot 웹훅 핸들러 | 2026-02-27 |
| telegram.js | CS 텔레그램 봇 — 고객 상담 + 이벤트 알림, chatWithMonkos 엔진 연동 | 2026-02-27 |

## 하위 폴더

| 폴더명 | 설명 |
|--------|------|
| shared/ | 공통 인프라 — 환경변수, 싱글톤(Firestore/GenAI), 유틸리티 함수 |

## 관련 문서

- [상위 폴더](../README.md)
