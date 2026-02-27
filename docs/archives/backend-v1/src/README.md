---
type: README
date: 2026-02-27
from: 막내3
---

# src

> **소관**: 전체
> **성격**: 아카이브
> **법적 근거**: ch4 1조 (프로젝트 문서 구조)

## 개요

백엔드 v1의 TypeScript 소스코드를 보관하는 폴더. Vertex AI Imagen 4.0 연동 Cloud Run 백엔드의 엔트리포인트, 라우트, 서비스 레이어가 포함된다. 현재 폐기(Archive) 상태.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| index.ts | Cloud Run 엔트리포인트 -- Vertex AI Imagen 4.0 연동 | 2026-02-22 |

## 하위 폴더

| 폴더명 | 설명 |
|--------|------|
| routes/ | API 라우트 (lookbook, model, photo) |
| services/ | 서비스 레이어 (imagen, storage) |

## 관련 문서

- [상위 폴더](../README.md)
