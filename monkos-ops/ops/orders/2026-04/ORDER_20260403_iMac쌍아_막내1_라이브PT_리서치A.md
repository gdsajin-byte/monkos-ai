---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-03 12:36 KST
priority: P0
subject: 라이브 PT 앱 리서치 A — 기존 프로토타입 파악 + iPhone 리모컨 연동
tags: [라이브PT, 디딤돌, 리서치, prototype, iphone-remote]
status: open
deadline: 2026-04-04
ref: monkos-ops/ops/proposals/PROPOSAL_20260403_라이브PT앱_디딤돌대면평가.md
---

# 지시서: 라이브 PT 앱 리서치 A — 기존 프로토타입 + iPhone 리모컨

**[2026-04-03 12:36 KST] iMac/쌍아 → iMac/막내1**

---

## 배경

4/9(목) 디딤돌 이의신청 대면평가용 라이브 PT 앱을 만든다.
2/8에 구축한 monk-cam/demo 프로토타입이 핵심 자산. 이걸 먼저 완전히 파악해야 실행계획이 나온다.

**제안서 정독 필수**: `monkos-ops/ops/proposals/PROPOSAL_20260403_라이브PT앱_디딤돌대면평가.md`

---

## 리서치 1: 기존 프로토타입 파악

### 읽어야 할 것

1. **코드 전체 리딩**
   - `apps/monk-cam/demo/` — presentation_server.js, presenter_sender.html, presenter_receiver.html 전문
   - `apps/photo-coach/` — 구조 파악 (PT와 연관 여부 판단)

2. **과거 세션 로그 정독**
   - `monkos-ops/ops/sessions/2026-02/20260208_session.md` (238~387줄 집중, 전체도 훑기)
   - 2/13, 2/19 세션 로그에서 프레젠테이션 관련 논의 추출

### 산출물

- 기존 코드의 아키텍처 요약 (어떤 기술 스택, 어떤 흐름)
- WebRTC/WSS 연결 구조도
- Gemini Live API 통합 방식
- 실측 성능 수치 재확인
- **재활용 가능한 부분 vs 새로 만들어야 할 부분** 명확 구분

---

## 리서치 4: iPhone 리모컨 연동

### 조사 항목

1. 기존 `presenter_sender.html`의 WebSocket 구조 분석
   - 현재 송신 프로토콜 (메시지 타입, 페이로드)
   - 리모컨 기능 추가 시 변경 범위

2. 슬라이드 제어 요구사항
   - 이전/다음 슬라이드 전환 명령
   - 발표자 노트 표시 (현재 슬라이드에 대응하는 대본)
   - 타이머 표시 (15분 카운트다운)

3. Tailscale P2P 통신
   - iPhone ↔ iMac 간 Tailscale 네트워크 내 WebSocket 연결 가능 여부
   - 현장(TIPA) 네트워크 독립성 확보 방안

### 산출물

- 리모컨 WebSocket 프로토콜 설계안 (메시지 스키마)
- presenter_sender.html 확장 방안 vs 별도 /remote 라우트 신규 구현 — 장단점 비교
- Tailscale 환경 테스트 필요 사항 목록

---

## 보고 형식

```
REPORT_20260403_iMac막내1_라이브PT_리서치A.md
위치: monkos-ops/ops/reports/
```

리서치 1, 4 결과를 하나의 보고서에 통합. 코드 인용은 파일:줄번호로.

---

## ⚠️ 준수 조항

- 코드 수정 없음. 읽기 + 분석 + 보고만.
- 세션 로그 기록 (분산 기록 의무, 헌법 3조 2항)
- 완료 보고 `✅❌💡⏳📁🔀` 형식
