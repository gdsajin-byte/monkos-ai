---
type: ORDER
date: 2026-04-26
from: iMac/쌍아
to: iMac/막내1
status: 대기
priority: A
---

# AI 영상 모델 리서치 A — 립싱크 / Talking Head

> **목적**: CivitAI, HuggingFace 등에서 립싱크·Talking Head 분야 모델을 조사하고, MONK 디바이스별 구동 가능 여부를 테이블링한다.

## 배경

- 4060에서 LivePortrait PoC 완료 (13초 드라이빙 영상 립싱크 확인, 쓸만함)
- 더 좋은 모델/체크포인트가 있을 수 있음 — 체계적 리서치 필요
- PT앱 나레이터 영상 파이프라인의 최적 모델 선정이 목표

## 조사 범위

### 립싱크 / Talking Head / Face Animation
- **Audio-driven**: 오디오만으로 립싱크 생성 (SadTalker, MuseTalk, Hallo2, AniPortrait, V-Express, EchoMimic 등)
- **Video-driven**: 드라이빙 영상 기반 모션 트랜스퍼 (LivePortrait, DaGAN, FOMM 등)
- **CivitAI 인기 모델**: talking head / lip sync / face animation 카테고리 인기순
- **HuggingFace Spaces**: 데모 가능한 모델 중 고퀄 평가된 것

## 디바이스 스펙

| 디바이스 | GPU/칩 | VRAM/메모리 | OS |
|----------|--------|------------|-----|
| **4060** | RTX 4060 | 8GB VRAM | Windows |
| **M1** | Apple M1 | 16GB 통합 | macOS |
| **M2** | Apple M2 | 8GB 통합 | macOS |
| **M4** | Apple M4 Pro | 24GB 통합 | macOS |

## 보고 형식

각 모델별 아래 항목을 테이블로 정리:

| 항목 | 내용 |
|------|------|
| 모델명 | |
| 소스 | CivitAI / HuggingFace / GitHub |
| 방식 | Audio-driven / Video-driven |
| 입력 | 사진+오디오 / 사진+영상 / 전신+오디오 등 |
| 라이선스 | MIT / Apache / 상용 제한 등 |
| VRAM 요구 | |
| 4060 구동 | ✅/⚠️/❌ |
| M1 구동 | ✅/⚠️/❌ |
| M2 구동 | ✅/⚠️/❌ |
| M4 구동 | ✅/⚠️/❌ |
| 퀄리티 평가 | 커뮤니티 평점, 샘플 영상 기준 |
| 특이사항 | 전신 지원, 실시간 가능, 한국어 TTS 호환 등 |

## ⚠️ 준수 조항

- 실측 불필요 — 공개 정보(README, 커뮤니티 리뷰, 벤치마크) 기반 리서치
- 최소 10개 모델 이상 비교
- 추천 Top 3 + 근거 포함
