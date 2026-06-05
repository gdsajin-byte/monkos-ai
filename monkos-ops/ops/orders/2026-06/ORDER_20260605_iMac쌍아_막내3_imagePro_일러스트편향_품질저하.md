---
type: order
date: 2026-06-05
device: iMac
agent: 쌍아
to: 막내3
status: 발행
portfolio: PF_IDPHOTO
priority: P0 (라이브 품질 장애 — 생성물 일러스트체로 망가짐)
---

# ORDER — [INCIDENT] image_pro 생성 품질 저하(일러스트체) 원인 추적

**발신**: iMac/쌍아 → **수신**: 막내3
**우선순위**: 🔴 **P0** — image_pro Premium(ultra) 생성물이 사실적 사진이 아닌 **일러스트/만화체**로 나옴. 200이지만 품질 완전 불량.

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내3 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내3 → 작가님` 형식

---

## 배경 (작가님 실측 — 2026-06-05)

image_pro에서 `한국여성 41세` 프롬프트 + Premium 엔진(ultra) 생성 결과가 **공원 배경의 일러스트/애니메이션체 인물**로 나왔다. 증명사진용 사실적 인물이 아니다. ultra 타임아웃은 직전 복구됐으나(200), **생성물 품질이 망가진 별개 장애**다.

> ⚠️ **이 INCIDENT에서 추론이 7회 빗나갔다. 단정 금지. git·세션·보고서 raw 인용만.**

## 확인할 3대 가설 (전부 git+세션 raw로 검증, 우열 없이)

### 가설 A — enhancePrompt 리그레션 (우리 기록의 유력 단서)
- `monkos-ops/ops/reports/2026-03/REPORT_20260331_막내2_Imagen4_커뮤니티+실전테스트.md`: **"fast/ultra 일러스트 편향 → 원인 `enhancePrompt` 기본값(true) → 해결 `enhancePrompt: false`"** 기록 존재.
- **현재 `apps/monk_imagen4/backend/server.js`의 `/generate` parameters에 `enhancePrompt` 설정이 없음**(기본 true 추정).
- 확인: enhancePrompt가 **언제 코드에 있었다가 빠졌는지** `git log -L`/`git log -S "enhancePrompt"`/`blame`로 추적. 과거 false였던 적이 있나, 어느 커밋이 제거했나. 3/31 해결이 코드에 반영됐었는지.

### 가설 B — Google 모델 의도적 저하 (작가님 제기)
- 작가님 추론: "구글이 신모델 공개 전(나노바나나처럼) 기존 개발자 오픈 모델을 일부러 저하시키는 패턴."
- 확인: Vertex AI release note / 우리 기록(`VERTEX_AI_CONNECTION_GUIDE.md`, 세션로그, Gmail 통보)에서 imagen-4.0 품질 저하·deprecation·모델 변경 언급. Imagen 4 6/30 셧다운과의 연관. **단 우리가 통제 불가 영역이면 그 사실만 적시.**

### 가설 C — monkosimagepro 삭제 연관 (작가님 제기)
- 작가님 추론: "며칠 전 삭제한 monkosimagepro(내부자 OSS) 삭제 + 최근 공격으로 잘못된 호출 → 가이드라인/세이프티 대폭 강화 → 의심 쿼리로 처리(일러스트 폴백)."
- 확인: monkosimagepro 삭제(6/2)·유출 공격이 image_pro 생성 경로/세이프티/프로젝트 설정에 영향을 줬는지 git+세션. safetyFilterLevel·personGeneration 등 세이프티 파라미터가 최근 바뀌었는지.

## 작업

1. **현재 생성 파라미터 전수 확인**: `server.js` `/generate`의 모든 파라미터(enhancePrompt 유무, safetyFilterLevel, personGeneration, guidanceScale, sampleImageStyle 등) + 모델 ID. 일러스트가 나올 수 있는 파라미터 raw로.
2. **가설 A·B·C 각각 git+세션+보고서 raw 검증** (위 §). 추론 말고 인용.
3. **실측 재현**: 가능하면 동일 프롬프트로 ultra 생성 1회 + 파라미터 조합 비교(enhancePrompt false vs 미설정 등)로 일러스트 원인 격리. (CDP/API 호출, 키값 무노출)
4. **원인 단정 + 해결 권고**: "X가 일러스트를 유발한다(raw 근거)" + 처방(enhancePrompt: false 복원 등). ⚠️ 코드 수정·배포는 작가님 승인 후(헌법 4조, deploy.sh 경유).

## ⚠️ 준수 조항

- **추론 금지**: git diff·로그·보고서·실측 raw만. 3대 가설을 데이터로 가리되 "~일 것" 단정 금지.
- **헌법 4조**: 키 값 무노출. `.env`·deploy.sh 수정 전 승인. 배포 deploy.sh 경유.
- 정체성 보존(헌법 1조 3항) — 증명사진은 사실적 인물이 핵심.
- 막힘 시 가설 전 자료 선참조(ch7 6조). 에러 3회 시 `/에스컬레이션`.
- 본 단계는 추적·진단 + 권고. 수정 집행은 승인 후.

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | 3대 가설 raw 검증 + 원인 단정 + 해결 권고 → 커밋+push |
| 산출물 | `monkos-ops/ops/reports/2026-06/REPORT_20260605_막내3_imagePro_일러스트편향.md` |
| 문서 유형 | INCIDENT → REPORT |
| 세션 로그 | `2026-06-05_{디바이스}_막내3.md` 어펜드 + PF_IDPHOTO 히스토리 1행 |

## 검증 (완료 기준)
- [ ] 현재 /generate 파라미터 전수 (enhancePrompt·safety 등)
- [ ] 가설 A — enhancePrompt git 이력 (있었다 빠짐? 언제? 3/31 해결 반영 여부)
- [ ] 가설 B — Google 모델 저하/deprecation 우리 기록 적시
- [ ] 가설 C — monkosimagepro 삭제·공격↔세이프티 강화 연관 git+세션
- [ ] 일러스트 원인 단정 (raw 근거) + 해결 권고
- [ ] 추론 배제·키값 무노출 확인
