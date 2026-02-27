---
type: README
date: 2026-02-27
from: 막내3
---

# shared

> **소관**: 막내
> **성격**: 정본 (프로덕션 서비스)
> **법적 근거**: ch4 2조

## 개요

MONKOS.AI 포탈 서비스의 공통 인프라 모듈. 환경변수 로딩, Firestore/GenAI 싱글톤 초기화, 유틸리티 함수(로깅, JSON 파싱, HMAC 인증 등)를 모든 lib/ 모듈에 제공한다.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| config.js | 공통 인프라 — 환경변수 + Firestore/GenAI 싱글톤 + 유틸리티(log, parseJsonBody, sendTelegramMessage 등) | 2026-02-27 |

## 관련 문서

- [상위 폴더](../README.md)
