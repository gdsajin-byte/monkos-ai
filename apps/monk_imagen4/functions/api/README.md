---
type: README
date: 2026-02-27
from: 막내3
---

# api (monk_imagen4/functions)

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

monk_imagen4 API 엔드포인트. Cloudflare Pages Functions 기반으로, Gemini API 이미지 생성 프록시(Rate Limiting 포함)와 R2+D1 이미지 업로드 기능을 제공.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| generate.ts | 이미지 생성 API (Gemini 프록시 + Rate Limit 시간당 3회) | 2026-01-06 |
| upload.ts | 이미지 업로드 API (R2 저장 + D1 메타데이터) | 2026-01-07 |
| monk_imagen4.code-workspace | VSCode 워크스페이스 설정 | 2026-01-07 |

## 관련 문서

- [상위 폴더](../README.md)
