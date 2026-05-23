---
type: order
date: 2026-05-23
from: iMac/쌍아
to: M4/쌍아
subject: IDPASS 랜딩 푸터 몽코스 아이콘 수정 — git pull 후 실기기 확인
portfolio: PF_CROP
status: 대기
---

# IDPASS 랜딩 푸터 몽코스 아이콘 수정

> 커밋 `ca55a91d` 에 수정 포함. git pull 후 빌드→실기기에서 보라 몽키 아이콘 정상 표시 확인.

---

## 증상

- 랜딩 하단 "powered by MONKOS AI" 옆에 보라 몽키 아이콘이 아닌 **알 수 없는 초록 형체**가 표시
- 원인: `bundleImage()`가 `.aspectRatio(contentMode: .fill)` 모드 → 512×512 이미지를 20×20으로 가운데 크롭하면서 귀+머리만 잘려 보임

## 수정 내용

- `LandingView.swift` — `bundleImage("monkos-icon")` → `monkosIconView(size: 20)` 교체
- 신규 헬퍼 `monkosIconView(size:)`: `.fit` 모드로 전체 비율 유지, `#if canImport(UIKit/AppKit)` 분기 포함

## M4 작업

1. `git pull origin main`
2. Xcode에서 MonkosCrop.xcodeproj 열기
3. 빌드 → 실기기 실행
4. Landing 하단 푸터에서 **보라 몽키 아이콘** 정상 표시 확인
5. 확인되면 앱스토어 등록 지시서(ORDER_20260523_iMac쌍아_M4쌍아_IDPASS_앱스토어등록.md) Phase 0부터 이어서 진행

## 참고

- 리소스 바이너리(이미지 45개+앱 아이콘 14개)는 전부 git 추적 중 — 로컬 참조 없음
- macOS 전용 코드(`#if canImport(AppKit)`)에 Desktop 경로 참조 2건 있으나, iOS 빌드에는 컴파일되지 않음 — 공식 앱 무관
