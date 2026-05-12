---
type: completion
date: 2026-05-12
device: iMac
agent: 막내1
portfolio: PF_CROP
status: 완료
---

# COMPLETION — iOS vs Android 네이티브 API 비교 분석

> **[2026-05-12 18:55 KST] iMac/막내1 → 작가님**

## 결과

- ✅ 20개 영역 × 7개 비교 항목 데이터표 완성
- ✅ 종합 분석 (iOS 우위/Android 우위/동등/웹 충분 영역 분류)
- ✅ MonkosCrop 관점 결론 + Android 병행 시 주의점 + 전략 제언
- ✅ PF_CROP 히스토리 어펜드
- ✅ 세션 로그 작성

## 산출물

- 📁 `monkos-ops/ops/reports/2026-05/REPORT_20260512_막내_iOS안드로이드_네이티브API비교분석.md`

## 핵심 발견

- 💡 크롭앱 핵심 4기능 전부 iOS 압도적 우위 — 얼굴인식(10배↑), 배경제거(80배↑), 이미지처리(빌트인 200+), ML추론(Neural Engine 35 TOPS)
- 💡 번들 사이즈 혁신 — 웹 56MB(FaceMesh+@imgly) → iOS 시스템 내장 0MB
- 💡 Android NNAPI deprecated (Android 15) — 신규 코드에서 사용 금지, TFLite GPU Delegate 필수
- 💡 Android 착수는 iOS 출시 후 권장 — SoC 파편화 + 시스템 내장 API 부재로 개발 공수 iOS 대비 1.5~2배

## 리서치 출처

- Apple Developer Documentation, Android Developers
- Photoroom Core ML Benchmark (2023 Edition)
- Qualcomm Snapdragon 8 Elite Product Brief
- Google ML Kit / MediaPipe Documentation
- hollance/neural-engine GitHub
