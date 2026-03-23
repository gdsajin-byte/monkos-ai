# works/crop — 크롭앱

> 클라이언트 완결형 증명사진 규격 크롭 서비스. 서버 비용 제로, 프라이버시 완전 보호.

## 개요

- **서비스**: 증명사진 규격 크롭 (여권 3.5×4.5cm, 반명함 3×4cm)
- **핵심 원리**: MediaPipe FaceMesh 478 랜드마크 → 자동 배치 → 사용자 미세 조정 → Canvas 2D 크롭
- **아키텍처**: 완전 클라이언트 (서버 호출 제로)
- **언어**: KR + JP

## 아키텍처 (현행 v2)

```
사용자 (모바일/웹)
    │
    ▼
crop/index.html + crop.js + crop.css (Vanilla JS)
    │  MediaPipe FaceMesh (CDN) → 478 랜드마크
    │  자동 배치 (눈 앵커 43%) + 정수리 추산 (눈~턱 1:1 반전)
    │  3단계 ICAO 색상 판정 (녹색/노랑/레드)
    │  Canvas 2D → JPEG 다운로드 (원본 해상도, 300dpi)
    │
    ▼
크롭 사진 (MONKOS_crop_passport_413x531.jpg)
※ 서버 전송 없음. 사진은 디바이스에서만 처리.
```

## 코드 경로

| 구분 | 경로 | 비고 |
|------|------|------|
| **포털 (정본)** | `monkos_AI/portal/public/crop/` | monkos.ai/crop |
| KR 프론트 (원본) | `monkos_AI/idphoto-kr/public/crop.*` | 이식 원본 |
| JP 프론트 (클론) | `monkos_AI/idphoto-jp/public/crop.*` | 일본어 |

## 기술 스택

| 레이어 | 스택 |
|--------|------|
| 얼굴 감지 | MediaPipe Face Mesh (CDN) |
| 크롭 엔진 | Canvas 2D API (원본 해상도 유지, 300dpi) |
| UI | Vanilla HTML + JS + CSS (빌드 도구 없음) |
| 규격 판정 | ICAO 기반 3단계 색상 체계 |
| 호스팅 | Cloudflare Pages (포털 내 /crop) |

## 아키텍처 진화

| 버전 | 시기 | 방식 | 결과 |
|------|------|------|------|
| v0 | 03-10 | 서버 Gemini LLM 좌표 추출 | 픽셀 정밀도 부족, 턱 잘림 |
| v1 | 03-11 | 서버 tfjs FaceMesh | 동작 확인, 서버 의존 문제 |
| **v2** | **03-12** | **클라이언트 MediaPipe + Canvas** | **서버 제로, 프라이버시 완전** |

## 로드맵

| 단계 | 내용 | 기술 |
|------|------|------|
| ✅ Tier 1 | 규격 크롭 + ICAO 검증 | MediaPipe FaceMesh + Canvas 2D |
| ⏳ Tier 2 | 누끼 따기 (배경 제거) | Transformers.js + RMBG-1.4 |
| ⏳ Tier 3 | 배경 교체 | Canvas 합성 |
| ⏳ 특허 | 출원 준비 | 기초 자료 SPEC_20260318 참조 |

## 문서

| 문서 | 파일 | 용도 |
|------|------|------|
| 개발기 명세서 | `SPEC_20260318_MONKOS_크롭앱개발기.md` | 기술 블로그 + 특허/실용신안 기초 자료 |

## 출납 로그

| 일시 | 문서 | 비고 |
|------|------|------|
| 2026-03-12 | (세션 로그) 크롭앱 설계 확정 | M1/쌍아 — vanilla JS, FaceMesh, 정수리 핀 |
| 2026-03-14 | README 초안 작성 | 기술명세 초기 적립 |
| 2026-03-17 | 포털 /crop 정식 등록 | 화이트 모드 + edge-to-edge |
| 2026-03-18 | SPEC_20260318_MONKOS_크롭앱개발기.md | 기술 블로그 + 특허 기초 자료 |

---

> 최종 갱신: 2026-03-18 iMac/쌍아
