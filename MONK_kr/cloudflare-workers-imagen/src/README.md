---
type: README
date: 2026-02-27
from: 막내3
---

# src (cloudflare-workers-imagen)

> **소관**: 막내
> **성격**: 정본 (백엔드 Workers)
> **법적 근거**: ch4 2조

## 개요

MONK Imagen Proxy Cloudflare Worker 소스. Vertex AI Imagen 4.0(t2i) 및 Gemini 2.5 Flash Image(i2i) 프록시를 구현. GCP Service Account JWT 인증 기반.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| index.js | Imagen 프록시 메인 Worker (t2i + i2i) | 2026-01-26 |
| index-vertex.js | Vertex AI 전용 Worker 구현 | 2026-01-26 |
| index-hybrid.js.bak | 하이브리드 모드 백업 | 2026-01-26 |
| index-google-ai-studio.js.bak | Google AI Studio 모드 백업 | 2026-01-26 |

## 관련 문서

- [상위 폴더](../../README.md)
