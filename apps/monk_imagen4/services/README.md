---
type: README
date: 2026-02-27
from: 막내3
---

# services (monk_imagen4)

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

monk_imagen4 공유 서비스 계층. Gemini API 호출(안전 레벨 설정, 이미지 생성 요청) 및 스토리지 서비스(R2/D1 연동)를 제공.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| geminiService.ts | Gemini API 서비스 (안전 임계값 매핑, 이미지 생성 호출) | 2026-01-06 |
| storageService.ts | 스토리지 서비스 (이미지 업로드/메타데이터 관리) | 2026-01-07 |

## 관련 문서

- [상위 폴더](../README.md)
