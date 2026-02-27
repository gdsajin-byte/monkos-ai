---
type: README
date: 2026-02-27
from: 막내3
---

# scripts-legacy

> **소관**: 전체
> **성격**: 아카이브
> **법적 근거**: ch4 1조 (프로젝트 문서 구조)

## 개요

프로젝트 초기에 사용된 레거시 스크립트를 보관하는 폴더. Gemini 세션 파싱, K-Beauty 크롤링/파이프라인, 야간 자동화 팩토리, DB 스키마, GCS 동기화, 테스트 스크립트 등이 포함된다. 현재 폐기(Archive) 상태.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| check_image_size.ps1 | 이미지 사이즈 체크 (PowerShell) | 2026-02-22 |
| gemini_batch_processor.py | Gemini 배치 프로세서 (Python) | 2026-02-22 |
| gemini_full_processor.py | Gemini 풀 프로세서 (Python) | 2026-02-22 |
| gemini_legacy_processor.py | Gemini 레거시 프로세서 (Python) | 2026-02-22 |
| gemini_session_parser.py | Gemini 세션 파서 (Python) | 2026-02-22 |
| kbeauty_crawler.py | K-Beauty 크롤러 (Python) | 2026-02-22 |
| kbeauty_pipeline.py | K-Beauty 파이프라인 (Python) | 2026-02-22 |
| kbeauty_snapshot.py | K-Beauty 스냅샷 (Python) | 2026-02-22 |
| log_checkpoint.sh | 로그 체크포인트 (Shell) | 2026-02-22 |
| migration_tx_v2.sql | DB 마이그레이션 트랜잭션 v2 (SQL) | 2026-02-22 |
| monk_ai_kit_install.sh | MONK AI Kit 설치 스크립트 (Shell) | 2026-02-22 |
| personal_model_manager.py | 개인 모델 매니저 (Python) | 2026-02-22 |
| schema.sql | MONK PROJECT 5버킷 DB 스키마 (D1/SQLite) | 2026-02-22 |
| setup_factory.ps1 | 팩토리 셋업 (PowerShell) | 2026-02-22 |
| sync_to_gcs.sh | GCS 동기화 스크립트 (Shell) | 2026-02-22 |
| sync_visitors_to_gcs.sh | 방문자 데이터 GCS 동기화 (Shell) | 2026-02-22 |
| test_photo_api.ps1 | 사진 API 테스트 (PowerShell) | 2026-02-22 |
| test_real_image.ps1 | 실제 이미지 테스트 (PowerShell) | 2026-02-22 |

## 하위 폴더

| 폴더명 | 설명 |
|--------|------|
| factory/ | 야간 자동화 팩토리 (오케스트레이터 + 워커) |

## 관련 문서

- [상위 폴더](../README.md)
