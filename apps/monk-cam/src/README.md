---
type: README
date: 2026-02-27
from: 막내3
---

# src (monk-cam)

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

@monkos/cam 카메라 모듈 TypeScript 소스. 캡처(증명사진/AI분석), 스트리밍 송신(폰->PC), 수신(PC->디스플레이) 3가지 모드를 지원하는 WebRTC 기반 카메라 라이브러리.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| index.ts | 모듈 엔트리 (CamCapture/CamStream/CamReceiver 내보내기) | 2026-02-07 |
| CamCapture.ts | 카메라 캡처 클래스 (증명사진, AI 분석용) | 2026-02-07 |
| CamStream.ts | 스트리밍 송신 클래스 (폰 -> PC) | 2026-02-07 |
| CamReceiver.ts | 스트리밍 수신 클래스 (PC -> 디스플레이) | 2026-02-07 |

## 관련 문서

- [상위 폴더](../README.md)
