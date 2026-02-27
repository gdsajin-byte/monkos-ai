---
type: README
date: 2026-02-27
from: 막내3
---

# workers

> **소관**: 전체
> **성격**: 아카이브
> **법적 근거**: ch4 1조 (프로젝트 문서 구조)

## 개요

야간 자동화 팩토리의 워커 스크립트를 보관하는 폴더. 콘텐츠 생성, 로깅, Imagen 배치 처리, 헤어스타일 I2I, SNS 자동화 등 개별 작업 단위의 PowerShell 스크립트가 포함된다. 현재 폐기(Archive) 상태.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| content_generator.ps1 | 콘텐츠 자동 생성 워커 | 2026-02-22 |
| factory_logger.ps1 | 팩토리 로거 워커 | 2026-02-22 |
| imagen_batch_generator.ps1 | Imagen 배치 이미지 생성 워커 | 2026-02-22 |
| imagen_i2i_hairstyle.ps1 | Imagen I2I 헤어스타일 변환 워커 | 2026-02-22 |
| social_media_automation.ps1 | SNS 자동 업로드 워커 | 2026-02-22 |

## 하위 폴더

| 폴더명 | 설명 |
|--------|------|
| (없음) | |

## 관련 문서

- [상위 폴더](../README.md)
