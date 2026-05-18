---
type: README
date: 2026-02-27
from: 막내3
---

# demo (monk-cam)

> **소관**: 막내
> **성격**: 프로토타입/PoC
> **법적 근거**: ch4 2조

## 개요

monk-cam 데모 및 시그널링 서버. WebRTC 기반 카메라 캡처/미러링 데모 페이지와 시그널링 서버, Presenter 송수신 테스트 포함.

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| index.html | monk-cam 데모 메인 페이지 | 2026-02-07 |
| signaling_server.js | WebRTC 시그널링 서버 | 2026-02-19 |
| mirror_client.js | 미러 클라이언트 JS | 2026-02-19 |
| mirror_console.html | 미러 콘솔 페이지 (PC측 수신) | 2026-02-19 |
| mirror_launcher.html | 미러 런처 페이지 | 2026-02-19 |
| mirror_test.html | 미러 테스트 페이지 | 2026-02-19 |
| mirror_start.sh | 미러 시작 스크립트 | 2026-02-18 |
| mirror_icon_192.png | PWA 아이콘 192x192 | 2026-02-18 |
| mirror_icon_512.png | PWA 아이콘 512x512 | 2026-02-18 |
| manifest.json | PWA 매니페스트 | 2026-02-18 |
| sender.html | WebRTC 송신 테스트 | 2026-02-08 |
| receiver.html | WebRTC 수신 테스트 | 2026-02-08 |
| presenter_sender.html | Presenter 송신 페이지 | 2026-02-08 |
| presenter_receiver.html | Presenter 수신 페이지 | 2026-02-08 |
| presentation_server.js | Presenter 시그널링 서버 | 2026-02-08 |
| cert.pem | HTTPS 인증서 | 2026-02-18 |
| key.pem | HTTPS 개인키 | 2026-02-18 |
| package.json | Node.js 의존성 | 2026-02-21 |

## 관련 문서

- [상위 폴더](../README.md)
