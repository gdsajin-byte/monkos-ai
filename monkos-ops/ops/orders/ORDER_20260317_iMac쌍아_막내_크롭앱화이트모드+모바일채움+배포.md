---
type: ORDER
from: iMac/쌍아
to: iMac/막내1
date: 2026-03-17
priority: P1
scope: 코딩 + 배포
---

# 지시서: 크롭앱 화이트 모드 전환 + 모바일 edge-to-edge

## 배경

크롭앱을 포털(monkos.ai) 통합 서비스로 정식 등록 완료. 현재 다크 테마(idphoto-kr 파생)를 포털 톤에 맞는 화이트 베이스로 전환하고, 모바일 레이아웃을 꽉 채우도록 보정한다.

## 대상 파일

- `monkos_AI/portal/public/crop/crop.css` (메인 CSS)
- `monkos_AI/portal/public/crop/index.html` (필요 시 배경 관련 인라인 스타일)

## Task 1: 화이트 모드 전환

### 원칙
- **캔버스 영역(사진 크롭하는 곳)만 다크 유지** — 사진 식별 + 가이드라인 가시성
- **나머지 전부 화이트 베이스** — 포털 톤 통일

### 변경 항목

| 요소 | 현행 (다크) | 변경 (화이트) |
|------|-----------|-------------|
| `body` / `html` 배경 | `#06080D` 다크 | `#f5f5f5` (포털 `--bg`) |
| `.app-container` 배경 | 다크 | `#ffffff` (포털 `--surface`) |
| 헤더 (MONKOS Crop + 규격 텍스트) | 밝은 텍스트 on 다크 | 다크 텍스트 on 화이트 (`#334155`) |
| 여권/반명함 탭 버튼 | 다크 테마 보라 | 포털 `--accent` (#6d28d9) 유지, 배경 화이트 |
| 업로드 영역 | 다크 보더 | 밝은 보더 (`rgba(0,0,0,0.1)`) |
| 조작 가이드 범례 | 밝은 텍스트 on 다크 | `#64748b` on 화이트 |
| **캔버스 `.crop-area`** | **다크 유지** | **다크 유지** (`#0a0e17` 또는 `#1a1f2e`) |
| 하단 수치 카드 (상단/얼굴/하단/눈위치) | 다크 카드 | 화이트 카드 + 연한 보더 |
| 경고 메시지 (범위 초과 등) | 다크 배경 주황 텍스트 | 연주황 배경 + 다크 텍스트 |
| ICAO 슬라이더 | 다크 트랙 | 밝은 트랙 |
| 하단 버튼 (사진 선택/초기화/미리보기/다운로드) | 다크 스타일 | 포털 스타일 (보라 accent, 화이트 배경 보더) |
| 규격 정보 테이블 | 다크 | 밝은 배경 + 연한 보더 |
| 다운로드 모달 | 다크 모달 | 화이트 모달 + 포털 스타일 |

### 참조 색상 (포털 CSS 변수)
```css
--bg: #f5f5f5;
--surface: #ffffff;
--accent: #6d28d9;
--text: #334155;
--text-dim: #64748b;
--border: rgba(0, 0, 0, 0.1);
```

## Task 2: 모바일 edge-to-edge

### 현행
- `.app-container`에 padding/margin이 있어서 모바일에서 상단·좌우에 빈 공간 발생

### 변경
- 모바일(`@media (max-width: 700px)`):
  - `body` padding: 0
  - `.app-container` margin: 0, padding: 0 또는 최소 (좌우 8px 정도만)
  - 둥근 모서리 제거 (`border-radius: 0`)
  - 화면 전체를 채우도록

- 데스크탑:
  - 현행 센터 정렬 + max-width 유지 (나중에 2단 레이아웃으로 확장 예정)

## Task 3: 커밋 + 배포

```bash
git add monkos_AI/portal/public/crop/
git commit -m "[crop] 화이트 모드 전환 + 모바일 edge-to-edge"
git push origin main
cd monkos_AI/portal && bash deploy.sh prod
```

## 완료 보고

`✅❌💡⏳📁🔀` 형식. 배포 리비전 포함.

## ⚠️ 준수 조항

- 헌법 제1조 1항: 타임스탬프
- 헌법 제5조 2항: 정체성 보존 — 크롭 엔진 로직 변경 금지 (CSS만)
- **캔버스 영역은 반드시 다크 유지** — 사진 가이드라인 가시성
- 기존 크롭 기능 무결성 유지 (드래그, 스케일, FaceMesh, 다운로드)
