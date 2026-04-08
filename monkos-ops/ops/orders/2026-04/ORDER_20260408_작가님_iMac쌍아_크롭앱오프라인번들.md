---
type: order
id: ORDER_20260408_작가님_iMac쌍아_크롭앱오프라인번들
date: 2026-04-08
from: 작가님
to: iMac/쌍아
status: 완료
protocol: 직접수정 (헌법 1조 2항 ② 준용)
---

# 사후 오더 — 크롭앱 오프라인 번들 제작

> **[2026-04-08 13:16 KST]** 작가님 구두 지시 → iMac/쌍아 직접 실행 → 완료

## 배경

- 디딤돌 대면평가 (4/9) USB 시연용
- 크롭앱 핵심 기능(MediaPipe FaceMesh 478포인트)이 CDN 의존 → 인터넷 없는 현장에서 동작 불가
- 오프라인 완전 자립 번들 필요

## 실행 내역

1. MediaPipe FaceMesh JS + WASM + 모델 파일 CDN에서 로컬 다운로드 (7파일, ~16MB)
2. `index.html` — CDN 참조 제거, 로컬 경로, GA 태그 제거, 폰트 시스템 폴백
3. `crop.js` — `locateFile` CDN → `mediapipe/` 로컬 경로 변경
4. `start.command` — 더블클릭 실행 스크립트 (python3 http.server + 자동 브라우저 오픈)
5. CDP 브라우저 테스트 — FaceMesh 로딩 성공, faceMeshReady=true 확인

## 산출물

```
Desktop/쌍아/crop-offline/     (16MB)
├── index.html                 오프라인 HTML
├── crop.css                   스타일 (원본 동일)
├── crop.js                    locateFile 로컬 변경
├── start.command              원클릭 실행 스크립트
├── monkos-icon.svg            로고
├── favicon-32.png             파비콘
├── apple-touch-icon.png       앱 아이콘
└── mediapipe/                 FaceMesh 로컬 번들
    ├── face_mesh.js
    ├── face_mesh_solution_packed_assets.data (3.8MB)
    ├── face_mesh_solution_packed_assets_loader.js
    ├── face_mesh_solution_simd_wasm_bin.js
    ├── face_mesh_solution_simd_wasm_bin.wasm (5.9MB)
    ├── face_mesh_solution_wasm_bin.js
    └── face_mesh_solution_wasm_bin.wasm (5.8MB)
```

## USB 시연 방법

1. `crop-offline/` 폴더를 USB에 복사
2. 현장 Mac에서 `start.command` 더블클릭
3. 브라우저 자동 열림 → 사진 업로드 → 478포인트 자동 감지 + ICAO 크롭

## 비고

- Python3 필수 (Mac 기본 탑재)
- file:// 프로토콜은 WASM CORS 제약 → start.command가 localhost:8888로 우회
- 쌍아 직접 실행 사유: D-1 긴급 + 단순 번들링 (설계 판단 불필요)
