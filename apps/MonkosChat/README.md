---
type: README
date: 2026-02-27
from: 막내3
---

# MonkosChat

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

Firebase 기반 채팅 앱 프로토타입. Vertex AI 연동 대화 기능 + 텔레그램 봇 알림 + Firestore 데이터 저장. Firebase Hosting/Functions/Firestore/Storage 활용.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| firebase.json | Firebase 프로젝트 설정 (Hosting + Functions + Firestore) | 2026-01-30 |
| firestore.rules | Firestore 보안 규칙 | 2026-01-30 |
| firestore.indexes.json | Firestore 인덱스 설정 | 2026-01-30 |
| storage.rules | Firebase Storage 보안 규칙 | 2026-01-30 |
| test_vertex_ai.py | Vertex AI 연동 테스트 스크립트 (Python) | 2026-01-30 |
| .firebaserc | Firebase 프로젝트 alias 설정 | 2026-01-30 |

## 하위 폴더

| 폴더명 | 설명 |
|--------|------|
| functions/ | Firebase Cloud Functions (Vertex AI + 텔레그램 봇) |
| public/ | Firebase Hosting 정적 파일 |
| .firebase/ | Firebase 캐시/배포 상태 |

## 관련 문서

- [상위 폴더](../README.md)
