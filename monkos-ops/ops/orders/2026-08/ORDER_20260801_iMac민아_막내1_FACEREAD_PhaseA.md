---
type: order
date: 2026-08-01
from: iMac/민아
to: iMac/막내1
subject: "FACEREAD Phase A — 관상×사주 리포트 포털 어드민 탑재 + 사주 4주 완성"
status: 대기
portfolio: PF_FACEREAD
---

# ORDER — FACEREAD Phase A: 어드민 탑재 + 사주 4주 완성

**[2026-08-01 15:48 KST]** iMac/민아 → iMac/막내1

> **[예외] 본 지시서는 민아 발신** — 작가님 직접 지시("승인한다 지시서 발급해", 15:48)에 따른 ch1 역할(지시서=쌍아) 예외. 쌍아 사후 추인 대상. 설계 정합 근거: [쌍아 설계방안서](../../proposals/PROPOSAL_20260801_iMac쌍아_관상POC_설계방안.md) + [PF_FACEREAD](../../portfolios/PF_FACEREAD/README.md) 확정 결정표.

## 1. 배경/목적

작가님 08-01 확정: 사주×관상 리포트를 **어드민 선탑재 → 테스트 → 서비스 승격** 경로로 올린다. 전략 정본은 PF_FACEREAD 참조("취업사진 유입엔 관상을, 관상 유입엔 좋은 관상의 사진을"). Phase A는 **어드민 비공개 표면 + 사주 엔진 완성**까지다. 원전 콘텐츠(Phase B)·공개/과금(Phase C)은 범위 밖.

**착수 전 필독**: [PF_FACEREAD/README.md](../../portfolios/PF_FACEREAD/README.md) (원칙 5항·확정 결정표) + [apps/gwansang-poc/README.md](../../../../apps/gwansang-poc/README.md) (POC 구조·검증 기록)

## 2. 산출물

| 파일 | 역할 |
|------|------|
| `monkos_AI/portal/lib/cms/gwansang-data.json` | 관상 룰 DB **정본** (POC json 이관 — specs-data.json 선례 위치) |
| `monkos_AI/portal/lib/gwansang/saju.js` | 사주 엔진 — POC saju.js 이식 + 월주·시주 확장 |
| `monkos_AI/portal/lib/gwansang/solar-terms.json` | 절기(입절) 테이블 1900~2030 — 월주 산출용 |
| `monkos_AI/portal/public/admin/gwansang.html` + `public/admin/js/gwansang/*` | 어드민 리포트 페이지 (POC index/app/metrics/engine 이식) |
| `apps/gwansang-poc/data/gwansang_db.json` | meta에 `canonical` 필드 추가 — 정본 이동 명기 (헌법 3조 4항 정본 단일) |

## 3. 상세 설계

### 3-1. 룰 DB 정본 이관
- POC `data/gwansang_db.json` → `portal/lib/cms/gwansang-data.json` 이동(내용 동일). 어드민 JS는 이 정본을 fetch.
- POC 쪽 파일은 샌드박스용으로 유지하되 `meta.canonical: "monkos_AI/portal/lib/cms/gwansang-data.json"` 필드 추가 + POC README 정본 이동 1줄 갱신.

### 3-2. 사주 4주 완성 (`lib/gwansang/saju.js`)
- POC `apps/gwansang-poc/js/saju.js` 이식. 검증된 앵커 유지 (1900-01-01=갑술일).
- **월주**: 절기 기준 월지(입춘~경칩=인월...) + 오호둔(년간→월간) 표. 절기 경계는 `solar-terms.json` 실데이터로 판정 — **날짜 근사 금지**.
- **시주**: 시간 입력 optional. 시지 12구간 + 오서둔(일간→시간) 표. 미입력 시 3주만 표기(무음 강등 금지 — "시주: 시간 미입력" 명시).
- **solar-terms.json**: 한국천문연구원 공개 자료 등 공신력 출처에서 취득, `meta.source`에 출처 기록. **값 임의 생성·추정 절대 금지** — 취득 불가 시 에스컬레이션.
- 자시(23시) 경계: v1은 날짜(00시) 기준 유지 + 캐비앗 문구 유지.
- **검증 스모크 (통과 전 출고 금지)**: 만세력 공표값 대조 **최소 10케이스** (연대 분산: 1950/70/90/2000년대/최근, 입춘·절기 경계일 2케이스 이상 포함). 대조 표(날짜·기대값·산출값·출처)를 COMPLETION에 첨부. **1건이라도 불일치 시 배포 중단 + 에스컬레이션.**

### 3-3. 어드민 페이지 (`/admin/gwansang`)
- 기존 어드민 페이지(dashboard.html 등)의 서빙·인증 패턴 실측 후 동일하게 준용 (requireAdmin 체계).
- POC UI 이식: 얼굴 지도(메시 점+삼정 경계+부위 하이라이트), 부위 카드, 사주 카드(4주 명식표로 확장), 궁합 카드.
- 백본: **FaceMesh 478 클라이언트 유지** (PF 결정 — 사진 서버 전송 없음). MediaPipe CDN 의존 명시.
- **14페이지 뼈대**: PF README 리포트 구성표(p1 표지~p14 성적서) 순서로 페이지네이션. Phase A는 T0/T1 게이트 없이 전량 노출. 종합 통변(p8)·조후(p10) 슬롯은 **"Phase B 콘텐츠 수급 예정" 명시 placeholder** (빈 화면 무음 금지). 퍼스널컬러(p12)는 "다음 페이즈" 표기.
- 디스클레이머·내부 POC 뱃지·noindex 유지.

### 3-4. 범위 밖 (하지 말 것)
- Firestore 저장·크레딧·결제 (Phase C)
- 원전 인용 텍스트 신규 작성 (Phase B — 임의 해석 추가 금지)
- 포털 메인 메뉴·취업사진 배너 노출 (Phase C)
- 웹캠 실시간 촬영

### 3-5. 배포
- `monkos_AI/portal/deploy.sh` 경유 dev 채널. 접속 URL + rev 보고.

## 4. ⚠️ 준수 조항

- 헌법 4조 1항: API 키·비밀정보 생성/추측 절대 금지
- 헌법 3조 1항: 매 턴 `date` 타임스탬프 / 3조 2항: 완료 보고 + 세션 로그
- 헌법 3조 4항: 정본 단일 — JSON 이관 시 canonical 표기 필수
- ch5: **deploy.sh 경유 필수**, gcloud 직접 배포 금지
- ch4 10조: Firestore 직접 접근 금지 (본 Phase는 Firestore 미접촉이 정상)
- PF_FACEREAD 원칙 1·5: LLM 자유생성 금지, 절기·만세력 값 임의 생성 금지, 부정 단정 톤 금지
- makne-guard: COMPLETION 파일 필수 + PF 히스토리 1행 어펜드, 에러 3회 시 에스컬레이션

## 5. 완료 기준

- [ ] `gwansang-data.json` 정본 이관 + POC canonical 표기
- [ ] 사주 4주: 만세력 10케이스 대조 **전부 일치** (대조 표 첨부)
- [ ] `/admin/gwansang` 인증 뒤 접근 + 데모 얼굴 E2E 분석 스크린샷
- [ ] 14p 뼈대 + Phase B 슬롯 명시 placeholder
- [ ] noindex·디스클레이머·뱃지 유지
- [ ] dev 배포 rev + URL 보고
- [ ] COMPLETION 파일 + PF_FACEREAD 히스토리 어펜드 + 커밋·푸시

## 6. 커밋 메시지

`[feat] FACEREAD Phase A — 관상 리포트 어드민 탑재 + 사주 4주 완성`
