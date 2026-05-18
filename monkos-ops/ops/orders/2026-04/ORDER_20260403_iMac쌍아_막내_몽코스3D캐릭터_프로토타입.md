---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-04-03 13:14 KST
priority: P0
subject: 몽코스 3D 캐릭터 프로토타입 — Three.js 모델링 + 애니메이션 + TTS 립싱크
tags: [몽코스, 3D, three.js, tts, lip-sync, 캐릭터, 프로토타입]
status: open
deadline: 2026-04-03 (오늘 중 시연 가능 수준)
ref_proposal: monkos-ops/ops/proposals/PROPOSAL_20260403_라이브PT앱_디딤돌대면평가.md
---

# 지시서: 몽코스 3D 캐릭터 프로토타입

**[2026-04-03 13:14 KST] iMac/쌍아 → iMac/막내**

---

## 목표

**몽코스 캐릭터를 Three.js로 3D 렌더링하고, TTS 립싱크 + 기본 액션을 시연 가능한 수준으로 구현한다.**

이건 PoC(프로토타입)다. 완성도보다 "되는 것 확인"이 우선.

---

## 1. 캐릭터 형태 — 기존 SVG 기반

정본 SVG: `monkos-ops/ops/assets/logo/monkos-icon.svg` (반드시 Read할 것)

### 몽코스 파츠 구성

| 파츠 | 형태 | 색상 | Three.js 기본 도형 |
|------|------|------|-------------------|
| **머리** | 둥근 구체 (r=118 비율) | #a78bfa | SphereGeometry |
| **눈 (2개)** | 흰자(r=28) + 홍채(r=18) + 동공(r=10) + 하이라이트(r=4) | #fff / #a78bfa(55%) / #0f0f23 / #fff | 중첩 CircleGeometry 또는 SphereGeometry |
| **코 (N자)** | V형 라인 | #fff | Line 또는 TubeGeometry |
| **입** | SVG에 없음 → **신규 추가** | #fff 또는 #e879f9 | 반원 메쉬, 열림/닫힘 모프 |
| **귀 (S/K)** | S자 곡선 / K자 직선+분기 | #a78bfa | TubeGeometry / CylinderGeometry |
| **몸체** | 다리 포함 M자 형태 | #a78bfa | 원기둥 또는 커스텀 형상 |
| **발 (6개 발가락)** | 작은 구 | #a78bfa | SphereGeometry ×6 |

> **핵심**: 사람이 아니라 동글동글한 캐릭터다. 기본 도형 조합으로 충분. 과도한 디테일 불필요.

---

## 2. 구현할 애니메이션 (테스트 항목)

오늘 시연할 것들. 각각 독립적으로 트리거 가능하게.

| # | 액션 | 구현 방식 |
|---|------|----------|
| A | **립싱크** | TTS 오디오 → AudioAnalyser → 볼륨 기반 입 열기/닫기 (morph target 또는 scale.y) |
| B | **가볍게 통통 뛰기** | position.y 사인파 바운스 (idle 애니메이션) |
| C | **손/발 액션** | 발 위치 좌우 흔들기, 걷기 모션 |
| D | **문서 쪽 쳐다보기** | 머리(또는 전체) rotation.y로 시선 회전 |
| E | **가리키기** | 한쪽 발(팔 역할)을 들어올려 방향 포인팅 |
| F | **눈 깜빡임** | 눈 scale.y 주기적 축소→복원 (blink) |

---

## 3. TTS 연동

### 음성 엔진 선택 (우선순위)

1. **Web Speech API** — 즉시 사용, 비용 0, 프로토타입에 적합
2. OpenAI TTS Mini — 자연스러운 음성 필요 시 (API 키: 작가님께 확인)

### 립싱크 구현

```
TTS 오디오 재생 → Web Audio API AudioContext
→ AnalyserNode.getByteFrequencyData()
→ 볼륨 레벨 추출 (0~255)
→ 입 메쉬 scale.y = map(volume, 0, 255, 0.1, 1.0)
→ requestAnimationFrame 루프
```

### 테스트 대사 (한국어)

```
"안녕하세요, 몽코스입니다. 오늘 이의신청 내용을 브리핑해 드리겠습니다."
"첫 번째, 평가위원님의 지적사항을 살펴보겠습니다."
"화면을 봐주세요. 이 부분이 핵심입니다."
```

---

## 4. 페이지 레이아웃 (슬라이드 + 캐릭터)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────────────┐   ┌────────────────┐   │
│   │                         │   │                │   │
│   │    슬라이드 영역          │   │   몽코스 3D    │   │
│   │    (이의신청서 원문 등)    │   │   캐릭터       │   │
│   │    페이지뷰 전환          │   │   (립싱크 중)   │   │
│   │                         │   │                │   │
│   │                         │   │                │   │
│   └─────────────────────────┘   └────────────────┘   │
│                                                      │
│   ▶ 재생  ⏸ 일시정지  ⏭ 다음 슬라이드               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- 좌측 70%: 슬라이드 (텍스트/이미지)
- 우측 30%: 3D 캐릭터 렌더링 (Three.js Canvas)
- 하단: 재생 컨트롤

---

## 5. 기술 스택

```
Vite + Vanilla JS (또는 React — 판단에 맡김)
Three.js (3D 렌더링)
Web Speech API (TTS)
Web Audio API (AudioAnalyser → 립싱크)
```

### 프로젝트 위치

```
apps/monkos-3d/
├── index.html
├── package.json       # three, vite
├── src/
│   ├── main.js
│   ├── character.js   # 몽코스 3D 모델 구성
│   ├── animations.js  # 립싱크, 바운스, 시선 등
│   ├── tts.js         # TTS + AudioAnalyser
│   └── slides.js      # 페이지뷰 전환
└── public/
    └── slides/        # 슬라이드 이미지/텍스트 (추후)
```

---

## 6. 산출물

1. **브라우저에서 실행 가능한 프로토타입** (`vite dev` → localhost)
2. 몽코스 3D 캐릭터가 화면에 렌더링됨
3. 버튼 클릭 → TTS 발화 + 립싱크 동작
4. 각 애니메이션(바운스, 시선, 가리키기) 개별 테스트 가능
5. 슬라이드 영역에 더미 텍스트 배치 + 전환

---

## ⚠️ 준수 조항

- 프로토타입이다. **완성도보다 동작 확인 우선.**
- SVG 정본(`monkos-ops/ops/assets/logo/monkos-icon.svg`)의 색상/비율을 존중하되, 3D 해석은 자유
- 세션 로그 기록 (헌법 3조 2항)
- 완료 보고 `✅❌💡⏳📁🔀` 형식
- 막히는 부분은 판단 후 진행, 보고서에 기록
