---
type: ORDER
date: 2026-03-05
from: iMac/쌍아
to: 막내1 (CLI 배정)
subject: camera.html v2 가격 잔재 즉시 수정
priority: HIGH
scope: monkos_AI/idphoto-kr/public/camera.html L136,142,147
---

# camera.html v2 가격 잔재 수정

## 지시

네가 KB 수정 중 발견한 camera.html v2 가격 잔재 3건을 즉시 수정하라.

### 수정 대상

| 위치 | 현행 (v2) | 정본 기준 |
|------|----------|----------|
| L136 | ₩13,050 | config.js PRODUCTS 현행값 기준 |
| L142 | ₩34,800 | config.js PRODUCTS 현행값 기준 |
| L147 | ₩50,750 | config.js PRODUCTS 현행값 기준 |

### 정본
- `monkos_AI/idphoto-kr/public/config.js` PRODUCTS

### 추가 확인
- camera.html 내 "생성" 카피 잔재도 있으면 "리터칭"으로 전환
- 수정 후 grep으로 v2 가격 잔재 없음 확인
- 커밋+push 일괄 실행

## ⚠️ 준수 조항
- **헌법 1조**: 타임스탬프 시스템 명령 취득
- **헌법 2조**: 완료 보고 형식 준수
