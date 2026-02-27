---
type: README
date: 2026-02-27
from: 막내3
---

# api

> **소관**: 막내
> **성격**: 정본 (프로덕션 CF Workers)
> **법적 근거**: ch4 2조

## 개요

Cloudflare Pages Functions로 배포되는 MONK.KR 프로덕션 API 엔드포인트 모음. monk.kr 도메인의 서버리스 백엔드 전체를 담당하며, 인증/결제/AI 생성/텔레그램 연동 등 핵심 비즈니스 로직이 집중되어 있다.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| ads.js | 광고 이미지 로테이션 — GCS manifest.json 기반 동적 로드 | 2026-02-21 |
| analyze.js | Gemini Vision 이미지 분석 (이미지 프로 전용) | 2026-02-21 |
| auth.js | 카카오/구글 OAuth 인증 API | 2026-02-21 |
| generate.js | Imagen 4.0 T2I 생성 — Cloud Run Vertex AI 프록시 (이미지 프로 전용) | 2026-02-21 |
| idgen.js | 증명사진 I2I 생성 — Gemini Pro 직접 호출, 9필드 퍼널 동적 프롬프트 | 2026-02-21 |
| idphoto-coaching.js | AI 코칭 — Gemini Flash 직접 호출, 촬영 자세/표정 가이드 | 2026-02-21 |
| idphoto-credit-use.js | 증명사진 다운로드 크레딧 차감 프록시 (monk.kr -> idphoto-kr -> portal) | 2026-02-21 |
| payment.js | 토스페이먼츠 결제 API (테스트 모드) | 2026-02-21 |
| photo.js | AI Photo I2I — gemini-3-pro-image-preview, 정체성 90% 보존 핵심 엔진 | 2026-02-21 |
| precheck.js | 촬영본 사전분석 — Gemini Flash 직접 호출 | 2026-02-21 |
| qc.js | QC 검증 — Gemini Flash 직접 호출, 생성 결과물 품질 검사 | 2026-02-21 |
| refine.js | Imagen 3 Pro I2I/Edit/Upscale (이미지 프로 전용) | 2026-02-21 |
| simple-signup.js | 간편 가입 API (Beta, DB 없이 로컬 저장) | 2026-02-21 |
| telegram-webhook.js | 텔레그램 봇 Webhook — @Monk_yonga_bot /start 명령 처리 | 2026-02-21 |
| telegram.js | 텔레그램 봇 API — 이미지 전송 및 알림 서비스 | 2026-02-21 |
| translate.js | Gemini Translation — 이미지 프로 분석 결과 번역 | 2026-02-21 |
| tx.js | D1 거래내역 원장 API — POST(기록)/GET(조회), X-API-Key 인증 | 2026-02-21 |
| visitor.js | 방문자 정보 수집 및 관리 — 등록/조회/업데이트 | 2026-02-21 |

## 관련 문서

- [상위 폴더](../README.md)
