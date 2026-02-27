---
type: README
date: 2026-02-27
from: 막내3
---

# core (monk_imagen4)

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

AI 이미지 생성 모듈의 코어 인터페이스 및 동적 모듈 로더. Imagen 4, Imagen 3 Pro, Lumina, Stable Diffusion 등 다중 AI 프로바이더를 지원하는 플러그인 아키텍처의 기반 계층.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| EngineInterface.ts | 코어 엔진 인터페이스 (EngineConfig, GenerationParams, IImageEngine 등) | 2026-01-06 |
| ModuleLoader.ts | 동적 모듈 로더 (지연 로딩 + 라이프사이클 관리) | 2026-01-06 |

## 관련 문서

- [상위 폴더](../README.md)
