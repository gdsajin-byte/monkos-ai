---
type: research
date: 2026-04-03
subject: 몽코스 3D 아바타 비전 — MONK OS 전체의 "얼굴"
author: 작가님
pf: PF_MONK_OS
origin: memory/project_monkos_3d_avatar.md
---

# 몽코스 3D 아바타 비전

몽코스 3D 캐릭터 = MONK OS 전체의 "얼굴" 역할.

같은 메시지도 사람이 읽는 것보다 몽코스가 브리핑하는 것이 크리티컬하게 다르다. 겉보기에는 귀여운 캐릭터 하나지만, 백엔드에는 멀티에이전트 + 프로젝트 데이터 + 멀티모달 + 구글 인프라가 응축되어 있다.

## 구현

- 프론트: Three.js 3D 캐릭터 + TTS 립싱크 + 액션 애니메이션
- 백엔드: Gemini Live 실시간 Q&A 수신 → md로 전달 → 에이전트 해석 → TTS 응답
- 활용처: 디딤돌 PT, 강한소상공인 오디션, 유튜브/릴스/틱톡
- 2026-04-03 프로토타입 착수 (apps/monkos-3d/)
- 핵심 원칙: "한 가지 타겟을 다양한 비전으로 키운다"
