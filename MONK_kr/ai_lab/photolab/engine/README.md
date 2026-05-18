---
type: README
date: 2026-02-27
from: 막내3
---

# engine

> **소관**: 막내
> **성격**: 정본 (백엔드)
> **법적 근거**: ch4 2조

## 개요

photolab-engine MPA 포토랩 API 백엔드. AI 코칭(gemini-2.5-flash), 사전분석, Imagen I2I 생성, 품질검증 엔드포인트를 제공하며 Cloud Run 배포용으로 설계됨.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| server.js | Express 기반 API 서버 (코칭/프리체크/생성/QC/헬스체크) | 2026-02-21 |
| package.json | Node.js 의존성 정의 | 2026-02-21 |
| Dockerfile | Cloud Run 컨테이너 빌드 설정 | 2026-02-21 |
| .dockerignore | Docker 빌드 제외 목록 | 2026-02-21 |

## 관련 문서

- [상위 폴더](../README.md)
