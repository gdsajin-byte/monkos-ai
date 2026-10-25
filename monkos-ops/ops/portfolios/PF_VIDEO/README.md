---
type: portfolio
id: PF_VIDEO
name: VIDEO
subject: AI 영상 생성 엔진 — video.monkos.ai. 오픈소스+API 조합 → 자체 엔진화. 멀티모달 에이전트 파이프라인의 영상 축
domain: video, tts, lip-sync, veo, content-pipeline
created: 2026-04-27
owner: 작가님
leads: 쌍아(설계), 막내(구현)
status: active
---

# PF_VIDEO — AI 영상 생성 엔진

> **video.monkos.ai** — 텍스트/이미지/대본으로 영상을 만드는 워크벤치.
> 팀원이 디바이스를 돌아다니지 않고 MONKOS UI 안에서 영상 콘텐츠를 생산하는 통합 콘솔.
> 궁극적으로 멀티모달 에이전트 생태계의 영상 축.

---

## 1. 비전

**"이미지프로가 모델을 만들고, 비디오가 영상 렌더링하고, 스프레드가 셀럽으로 키운다"**
— 2025-12 작가님 세계관 구상

### 왜 이것을 하는가

- 팀원(한송이)이 이미 숏츠/틱톡/릴스 콘텐츠를 수동 제작·배포 중 — 도입 시기 도래
- 현재 영상 작업: 구글 콘솔(Veo) + 4060 SSH(SadTalker) + 별도 TTS + ffmpeg → 디바이스 산재
- 이미지프로/스튜디오가 구글 콘솔 대신 팀원 워크벤치로 자리잡은 선례 — video도 같은 경로
- 단위 엔진들이 API로 연결되면 멀티모달 에이전트 생태계 실현

### MONKOS 멀티 서비스 구도에서의 위치

```
monkos.ai (포털)
  ├ idphoto-kr/jp     ← 증명사진 엔진 (프로덕션)
  ├ studio            ← 이미지 프로/스튜디오 (팀원 워크벤치)
  ├ video (본 PF)     ← 영상 엔진 (신설)
  ├ pt                ← 프레젠테이션 엔진
  ├ models (미래)     ← 모델스
  └ lookbook (미래)   ← 룩북

상호 API 연동:
  이미지프로 → (모델 이미지) → video → (영상) → SPREAD → (채널 배포)
  video → (나레이터 클립) → pt → (발표 슬라이드)
  models → (자체 모델 유니) → lookbook → (스타일 태그 + 스토어 연결)
```

### 엔진 진화 경로

```
Phase 0: 오픈소스(SadTalker/LivePortrait) + 외부 API(Veo/ElevenLabs) 조합
Phase 1: 자체 UI(video.monkos.ai)에서 통합 워크벤치
Phase 2: 파이프라인 자동화 (대본→TTS→립싱크→합성 원클릭)
Phase 3: 자체 엔진 내재화 (외부 API 의존도 축소)
```

### 성공 지표

| 지표 | 시작점 (4/27) | 4주 | 12주 |
|------|-------------|-----|------|
| 팀원 영상 제작 시간 | 수동 3~5시간/건 | 1시간/건 | 30분/건 |
| 월간 영상 생산량 | 4~8건 (수동) | 15건 | 30건 |
| 사용 도구 수 | 5+ (구글콘솔/SSH/TTS/ffmpeg/편집기) | 2 (video.monkos.ai + 편집기) | 1 (video.monkos.ai) |
| 자체 엔진 비율 | 0% | 20% (립싱크) | 50% |

---

## 2. 히스토리

> append only. 신규 항목은 하단에 추가.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 12/25 | 작가님 | **세계관 구상** — 이미지프로→비디오→스프레드→모델스→룩북 멀티모달 에이전트 생태계 | — | 💡 비전 |
| 4/26 | 막내1~3 | **AI 영상 리서치 3건** — 립싱크 13모델/전신모션 17모델/TTS 15모델 비교 | REPORT×3 | ✅ |
| 4/26 | 4060/막내 | **SadTalker PoC 성공** — 사진+오디오→립싱크 영상 (256px, 3.5GB VRAM) | mp4 | ✅ |
| 4/26 | 4060/막내 | **LivePortrait PoC** — 비디오 드리븐 모션 (1024px) | mp4 | ✅ |
| 4/26 | iMac/쌍아 | **edge-tts 3개국어 검증** — ko/ja/en TTS 0원 대체 확인 | wav×3 | ✅ |
| 4/26 | iMac/쌍아 | **Kokoro TTS 테스트** — 영어/일본어 OK, 한국어 미지원 → 탈락 | — | ✅ |
| 4/27 | 4060/쌍아 | **립싱크 4종 실사 비교 리뷰** — SadTalker 256/512+GFPGAN, MuseTalk V15, LivePortrait | [REPORT](../reports/REPORT_20260427_4060쌍아_립싱크모델_실사비교리뷰.md) | ✅ |
| 4/27 | 4060/쌍아 | **MuseTalk 실사 판정** — "입만 움직여 어색" (작가님). 정식 빌드 우선순위 하향 | — | ✅ |
| 4/27 | 쌍아 | **콘텐츠→영상 통합 파이프라인 기안서** | [PROPOSAL](../proposals/PROPOSAL_20260427_쌍아_콘텐츠투영상_통합파이프라인.md) | ✅ |
| 4/27 | 작가님 | **video.monkos.ai 서브도메인 서빙 방향 확정** — 고객 서비스가 아닌 내부 워크벤치. 4060 GPU를 어드민 API로 연결. Veo 3.1 Lite 통합 | — | 💡 방향 확정 |
| 5/17 | 작가님 | **SwiftUI 코드 애니메이션 → 영상/PT 자동화 인사이트** — IDPASS Landing 데모(상태머신+타이머+SwiftUI 실시간 렌더)가 영상 파일 없이 모션그래픽 구현. macOS에서 ImageRenderer 프레임 캡처→AVAssetWriter로 mp4 자동 출력 가능. 데이터만 교체하면 동일 템플릿에서 영상 N개 자동 생산(숏츠/릴��� 공장). PT 프레젠테이션에도 동일 패턴 적용 가능(코드=슬라이드, KeyNote 대체) | — | 💡 인사이트 |
| 10/25 | iMac/쌍아 | **실측 비교** 말하는 캐릭터 영상(유니, 9:16 720p) — Kling 4.0 Omni-Ref(MCP 자동화): 자체 음성 주입 성공(포락선 상관 0.85·립싱크), 선명도 107, 초당 10크레딧(Standard 월 660), 지시문은 한국어 필수(중국어 지시→중국어 대사 사고). Google Flow Omni 1.1 Flash(웹 전용·CDP 조작): 음성 MP4 참조 2회 실패(환불), 이미지+대사만 성공, 선명도 66·2.1Mbps, 15크레딧/10초, 목소리 자체 생성(침착·세련, 유니 설정과 결 다름). 공식 Flow MCP 없음 | — | 🔄 |
| 10/25 | iMac/쌍아 | **필터 실측** 자사 이너웨어 모델(MUSE_C SUB_101) → 란제리 광고 씬: Kling 4.0 image_to_video 통과(5초 720p 50크레딧, 품질은 작가님 불만족) / Google Flow Omni 1.1 Flash 업로드·에이전트 제안은 통과, 생성 단계 차단(환불). 이너웨어 광고 영상화 경로 = Kling(Veo 계열 불가) | — | ✅ |

---

## 3. PF_PRESENTATION과의 관계

### 현재 PF_PRESENTATION

- 목적: 대면평가 발표용 브리핑 시스템 (pt.monkos.ai)
- 산출물: HTML 슬라이드 + 몽코스 3D 캐릭터 TTS 브리핑
- Phase 1.7까지 완료 (디딤돌 대면평가 성공)

### 관계 옵션

**옵션 A: PF_VIDEO에 PT 흡수**

```
PF_VIDEO = 영상 엔진 전체
  ├ 숏폼 (릴스/틱톡/숏츠) — 신규 핵심
  ├ 롱폼 (유튜브) — 신규
  └ PT 브리핑 영상 — 기존 pt.monkos.ai 흡수
```

- 장점: 영상 관련 전체를 한 PF에서 추적. 나레이터 클립/TTS/슬라이드 자산 공유
- 단점: PT는 "발표" 특화인데 영상 생산과 성격이 다름

**옵션 B: PF 분리 유지 + API 연동**

```
PF_VIDEO = 영상 생산 엔진 (비디오 클립/렌더링)
PF_PRESENTATION = 발표 시스템 (슬라이드+브리핑)

연동: video → (나레이터 클립) → pt (슬라이드 합성)
      pt → (발표 녹화) → video (편집/배포)
```

- 장점: 각 PF가 독립적, 역할 명확
- 단점: 공유 자산(TTS/캐릭터/립싱크) 중복 관리

**옵션 C: PF_VIDEO 신설 + PT Phase 4 연결**

```
PF_PRESENTATION Phase 4 (자동 PT 파이프라인)
  = PF_VIDEO의 PT 전용 출력 모드
  
PF_VIDEO가 엔진, PF_PRESENTATION이 특화 UI
```

- 장점: 엔진과 응용을 분리. PT는 video 엔진의 소비자
- 단점: 의존 관계 관리 필요

### 쌍아 의견

**옵션 C 추천.** PF_VIDEO가 영상 엔진(립싱크/TTS/Veo/합성), PF_PRESENTATION이 그 엔진을 "발표" 맥락으로 쓰는 특화 UI. PF_PRESENTATION Phase 4(자동 PT 파이프라인)가 PF_VIDEO API를 호출하는 구조. 둘 다 살리되 의존 관계를 명확히.

**결정 필요**: 작가님 확정 후 PF_PRESENTATION에 연동 항목 추가.

---

## 4. 기술 자산 현황

### 검증 완료

| 기술 | 용도 | 환경 | 상태 |
|------|------|------|------|
| SadTalker | Audio-driven 립싱크 | 4060 (3.5GB VRAM) | ✅ PoC 성공 |
| LivePortrait | Video-driven 모션 | 4060 (4.2GB VRAM) | ✅ PoC 성공 |
| edge-tts | TTS 3개국어 (무료) | 전 디바이스 | ✅ 검증 완료 |
| ElevenLabs | TTS 고품질 (구독) | 클라우드 | ✅ 구독 중 |
| Veo 3.1 Lite | Text-to-video | GCP (바우처) | ✅ 콘솔 접근 가능 |
| ffmpeg | 영상 합성 | 전 디바이스 | ✅ |

### 미검증 / 차후

| 기술 | 용도 | 상태 |
|------|------|------|
| EchoMimic | Audio-driven + 랜드마크 제어 | 미검증 (4060 8GB 가속 모드) |
| CosyVoice 3 | TTS 오픈소스 (Apache 2.0) | WSL2/Linux 전용 |
| Veo API (프로그래매틱) | 코드에서 직접 호출 | 미검증 |
| Cloudflare Tunnel | 4060→monkos.ai 내부 API 연결 | 미검증 |

---

## 5. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| SadTalker 256px 품질 한계 | 높음 | 512+비얼굴 업스케일러 or Veo 실사 확장 |
| 4060 단일 장비 안정성 | 중간 | 내부 워크벤치 전용 (고객 미노출), GPU 오프라인 표시 |
| Veo 바우처 소진 | 중간 | 소진 시 edge-tts+SadTalker 무료 조합으로 fallback |
| 영상 품질 기대 미달 | 중간 | Phase 0에서 수동 PoC로 품질 기준 확정 후 자동화 |
| PF 간 의존 관계 복잡화 | 낮음 | API 인터페이스 명확 정의 |

---

## 6. 관련 문서

| 문서 | 내용 |
|------|------|
| [콘텐츠→영상 통합 파이프라인 기안서](../proposals/PROPOSAL_20260427_쌍아_콘텐츠투영상_통합파이프라인.md) | 일반 영상 제작 vs MONKOS 파이프라인 비교, 상세 플로우, 구현 단계 |
| [립싱크 4종 실사 비교 리뷰](../reports/REPORT_20260427_4060쌍아_립싱크모델_실사비교리뷰.md) | SadTalker/MuseTalk/LivePortrait 실사 평가 |
| [AI 영상 리서치 A — 립싱크](../reports/REPORT_20260426_막내1_AI영상모델_리서치A_립싱크토킹헤드.md) | 13모델 벤치마크 비교 |
| [AI 영상 리서치 B — 전신모션](../reports/REPORT_20260426_막내2_AI영상모델_리서치B_전신모션숏폼.md) | 17모델 비교 |
| [AI 영상 리서치 C — TTS](../reports/REPORT_20260426_막내3_TTS음성합성_오픈소스리서치.md) | 15모델 비교 |
| PF_PRESENTATION | PT 브리핑 시스템 — Phase 4에서 PF_VIDEO API 소비자 |
| PF_SPREAD | 채널 배포 — PF_VIDEO 산출물 유통 |
