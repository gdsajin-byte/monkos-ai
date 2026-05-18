---
type: README
date: 2026-02-27
from: 막내3
---

# photo-coach

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

MONKOS Photo Coach 서비스. Gemini Live 실시간 코칭(촬영 전 가이드), Imagen 3.0 증명사진 생성 프록시, Gemini QC(원본 vs 생성물 유사도 검증)의 3가지 역할을 수행하는 HTTPS+WSS 서버.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| index.html | Photo Coach 프론트엔드 (촬영 코칭 UI) | 2026-02-08 |
| server.js | 서버 (Gemini Live 코칭 + Imagen 프록시 + QC, 포트 8443) | 2026-02-08 |
| package.json | Node.js 의존성 | 2026-02-08 |
| cert.pem | HTTPS 인증서 (monk-cam/demo 심링크) | 2026-02-08 |
| key.pem | HTTPS 개인키 (monk-cam/demo 심링크) | 2026-02-08 |

## 관련 문서

- [상위 폴더](../README.md)
