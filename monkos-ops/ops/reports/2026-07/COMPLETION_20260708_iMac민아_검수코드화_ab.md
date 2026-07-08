---
type: completion
date: 2026-07-08
device: iMac
agent: 민아
status: 마감
---

# COMPLETION: 검수 코드화 (a)+(b) — 게이트 수치 확장 + precheck Gemini 퇴출

**[2026-07-08 19:25 KST]** iMac/민아 → 작가님, M1/쌍아(검토)

> 근거: 작가님 지시 "a+b 돌려봐" (19:05) — 검수 전면 코드화 확정 (19:02)의 실행 1·2탄
> ⚠️ 준수: ch5 (deploy.sh 경유) · 관측 우선 원칙 (미실측 임계는 하드컷 금지 — 오늘 오탈락 교훈)

## (a) fit-spec 게이트 수치 확장

- `crop-engine/lib/face-detect.js` — FaceMesh 랜드마크에서 **mouthOpen**(입술 간격/입 폭)·**eyeOpenL/R**(눈꺼풀 간격/눈 폭)·**rollDeg**(눈선 기울기)·**yawRatio**(코의 중심선 이탈)·contourAsym 산출, `gate` 객체로 반환
- `crop-engine/server.js` — fit-spec 응답에 gate 포함 / `portal/server.js` — fit 응답·로그에 gate 계측
- **하드컷 없음** — 수치 노출+로그 관측만. 임계는 실측 축적 후 승격 (금일 2px 오탈락 교훈)
- 실증: 웃는 밤 사진 mouthOpen **0.203** (닫힘 ~0.05의 4배) — "치아 노출 완성본 통과" 문제를 잡을 수치 확보. 카우치(살짝 찡그림) 0.131 — 임계 캘리브레이션 데이터 축적 시작

## (b) precheck 코드 게이트 전환 — Gemini 프론트 퇴출

- `portal/server.js` precheck 전면 재작성: Gemini 비전 호출 제거 → **SCRFD 검출 + 5점 kps 각도 + sharp 픽셀 통계**
- 하드컷 4종 (안전 확실 항목만): `no_face` / `multiple_faces`(2순위 면적 30%↑·score 0.6↑) / `face_too_small`(정규화 프레임 100px 미만) / `side_angle`(|roll|>30° 또는 |yaw|>0.35) / `too_dark`(밝기<40). 그림자는 관측 로그만
- 응답 계약 유지 (measurable/rejectionReason/faceBox/faceRatio) + **checks:[] — 사후 8항목 나열 폐지** (작가님 지시)
- 웜업을 게이트 통과자로 한정 — 구경·불합격 트래픽의 RunPod 웜 비용 차단 ($0.57/2일 누수 봉합)
- HEIC 등 디코드 불가 → `DECODE_FAILED` 명시 응답 (설계 검토 권고 ① 일부 해소)

## 배포·검증

- crop-engine **00009** + portal **00433** (deploy.sh 경유, 100%)
- E2E 5/5: 카우치·밤·정장 **통과** (faceRatio 실측 0.17~0.31 — Gemini 오판 0.35 대체) / 40° 회전 얼굴 → **side_angle 차단** (roll 41.3° 정확 판독) / 무얼굴 풀숲 → **no_face 차단**
- 속도: Gemini 7~20s → **0.7~3s** (대용량 원본만 정규화 비용으로 11~12s — (c) 클라이언트 리사이즈가 해소 예정)
- fit 회귀: face 33mm·gate 포함 정상, detect=scrfd 유지

## 효과 (기준서 §4 무료 구조 강화)

- 무료 트랙의 Gemini 호출 **0회** (기하·검수 전체 결정론) — Gemini 잔여 역할 = 보정 티어 생성 엔진뿐
- 무료 1건 원가: Gemini 비전 2회분 소멸 → 매팅 수원 수준만 잔존

## 잔여 (다음)

1. 게이트 임계 캘리브레이션 — gate 로그 축적 후 mouthOpen·eyeOpen 하드컷 승격 (웃음·감은 눈 차단)
2. (c) render-specs 원페이지 개편 — 티어 분기·무료 완결·클라이언트 리사이즈 (설계서 경유 권장)
3. fit 내부 Gemini 심미 코멘트 제거 (정성 평가 폐지 지시 잔여분 — (c)와 함께 처리 권장: 현재 클라이언트가 vision 필드를 렌더 중)
4. 출고 게이트 코드화 (결과물 SCRFD 재실행 — 정립·1인·눈뜸)
