---
type: sub-document
parent: PF_IDPHOTO
subject: "PhotoMonk — Apple Vision 온디바이스 코칭 PoC (Phase 5-A 파트)"
created: 2026-05-18
status: active
---

# PhotoMonk — Apple Vision 실시간 코칭 PoC

> PF_IDPHOTO Phase 5-A(독립 iOS 네이티브 증명사진 앱)의 **코칭 엔진 진화 테스트**.
> IDPASS(PF_CROP)와 별도 프로젝트. IDPASS 코드 참조만 하고 수정하지 않음.

## 위치

| 항목 | 값 |
|------|-----|
| 코드 | `apps/PhotoMonk/` |
| 번들 ID | `ai.monkos.photomonk` |
| 타겟 | iOS 17.0+ (SwiftUI + Package.swift) |
| TestFlight | 내부테스트 — 작가님 iPhone 설치 확인 |

## 왜 별도 PoC인가

기존 웹 증명앱(idphoto-kr/jp)의 촬영 코칭은 **Gemini Live**(API 비용 + 레이턴시 + 모델 shutdown 리스크).
PhotoMonk는 이를 **Apple Vision 온디바이스**로 대체하는 실험:

| | Gemini Live (현행 웹) | Apple Vision (PhotoMonk) |
|---|---|---|
| 비용 | API 과금 | 0 (시스템 내장) |
| 레이턴시 | 네트워크 왕복 | 즉시 |
| 오프라인 | 불가 | 가능 |
| 모델 리스크 | 6/1 shutdown 경험 | Apple 플랫폼 안정 |

## 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 05/18 | 쌍아 | **지시서 발행** — Apple Vision 실시간 코칭 PoC, `apps/PhotoMonk/` 프로젝트 생성 지시 | [ORDER](../../orders/2026-05/ORDER_20260518_iMac쌍아_막내_PhotoMonk_Vision코칭_PoC.md) | ✅ |
| 05/18 | 막내 | **PoC 완성** — Vision 실시간 코칭 + 촬영 시퀀스 + iPhone 실기기 구동 확인 | `apps/PhotoMonk/` | ✅ |
| 05/18 | 작가님 | **TestFlight 실기기 테스트** — iPhone에서 촬영 코칭 플로우 동작 확인 | — | ✅ |
| 06/15 | 작가님 | **TestFlight 재검증 진행 중** — iPhone 실기기 + 촬영실 새 버전 확인 | — | ⏳ |

## 향후

- PhotoMonk의 Vision 코칭 엔진이 검증되면 → Phase 5-A 독립 iOS 앱의 코칭 모듈로 편입
- IDPASS(PF_CROP)의 크롭 자산 + PhotoMonk의 코칭 엔진 = 독립 앱 두 축
