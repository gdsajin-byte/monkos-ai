---
type: order
date: 2026-06-05
device: iMac
agent: 쌍아
to: 막내2
status: 발행
portfolio: PF_IDPHOTO
priority: P0 (긴급 — 매출 직결 라이브 장애)
---

# ORDER — [INCIDENT] Gemini 키 긴급 진단 + 복구

**발신**: iMac/쌍아 → **수신**: 막내2
**우선순위**: 🔴 **P0** — 라이브 매출 서비스(증명사진 생성) 장애. 최우선.

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내2 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내2 → 작가님` 형식

---

## 배경 (작가님 신고 — 2026-06-05)

라이브 서비스의 이미지 생성·보정·번역 기능이 깨졌다. 서버 자체는 살아있다(헬스체크 6개 전부 200). **깨진 것은 `GEMINI_API_KEY` 의존 기능뿐이다.**

**유력 가설**: 06-02에 "키 1개만 남기고 삭제"를 진행하면서, **실사용 중이던 키를 "유출 프로빙용·무관"으로 잘못 분류해 삭제**했을 가능성. 06-02 M1 세션로그에 "Gemini 100% 오류 = monkosimagepro 유출 프로빙(생성코어 무관) → 키 3개 삭제, MONKOS NEW만 남음"이라 기록돼 있으나, **그 "무관" 판정이 틀렸을 수 있다.** 모든 서비스가 `GEMINI_API_KEY` 하나를 공유하기 때문이다.

> ⚠️ **너의 임무는 가설 검증이 아니라 정확한 재진단이다.** 위 가설에 끌려가지 말고, 1차 자료를 직접 읽고 GCP를 실측해 사실을 확정하라.

## 1단계 — 최근 보안·키 이슈 정확히 파악 (자료 정독)

아래를 **모두 읽고** 현재 키 상황의 전체 맥락을 스스로 재구성하라:
- `monkos-ops/ops/orders/2026-06/ORDER_20260602_M1쌍아_막내2_API키삭제_OAuth게시검증.md` (삭제 대상/유지 대상)
- `monkos-ops/ops/orders/2026-06/ORDER_20260602_M1쌍아_막내2_GeminiAPI키제한_100오류진단.md` (키 제한 진단)
- `monkos-ops/ops/session-logs/2026-06/2026-06-02_M1_쌍아.md` (삭제 실행 서술)
- `monkos-ops/ops/SECRET_INVENTORY.md` (키 인벤토리)
- `monkos-ops/ops/reports/2026-04/REPORT_20260422_GCP_Firebase_인프라감사.md` (유출 배경)
- `monkos-ops/ops/reports/2026-06/COMPLETION_20260603_*env시크릿하이브리드*.md` (06-03 GCP 등록 작업)
- 각 서비스 키 참조: `monkos_AI/idphoto-kr/server.js`, `monkos_AI/idphoto-jp/server.js`, `apps/monk_imagen4/backend/server.js`, `functions/api/translate.js` (또는 `monkos_AI/portal/lib/cms/translate.js`)

## 2단계 — GCP 실측 진단

> 키 **값**은 절대 출력하지 마라. 키 **이름·상태**만.

1. **활성 키 목록**: `gcloud api-keys list` 로 현재 살아있는 키 확인. (a)MONKOS NEW 살아있나 (b)monkosimagepro/monkos_key/monk-aistudio-consol이 실제로 삭제됐나.
2. **GEMINI_API_KEY가 가리키는 값**: Secret Manager `GEMINI_API_KEY:latest`가 **어느 키에 해당하는지** — 살아있는 키인가, 삭제된 죽은 키인가. (값 노출 없이 fingerprint/길이/연동 키 식별)
3. **삭제키 복원 가능성**: 삭제됐다면 `gcloud api-keys undelete` 30일 복원 창이 유효한가.
4. **실제 장애 재현**: 깨진 엔드포인트를 직접 호출해 **에러 코드 확정** (`API_KEY_INVALID` / expired / quota / 403 등). 대상: image_pro `/refine`·`/analyze`, idphoto-kr/jp 생성, 블로그 translate.
5. **영향 범위 확정**: 4개 기능 중 실제로 무엇이 죽고 무엇이 사는지 실측표.

## 3단계 — 진단 보고 → 승인 대기 (게이트)

- 위 결과를 **진단 보고서**로 작성하고 **작가님 승인을 기다려라.**
- ⚠️ **헌법 4조**: 키 교체·삭제·생성·복원·재배포는 **작가님 승인 후에만** 실행. 진단까지는 자유, 변경은 게이트.

## 4단계 — 복구 (승인 후)

승인되면 가장 안전한 경로로:
1. `GEMINI_API_KEY`를 **유효한 키(MONKOS NEW 등)로 통일** → Secret Manager 새 버전 등록.
2. 영향 서비스 **재배포** (반드시 `deploy.sh` 경유 — idphoto-kr/jp/image_pro). 블로그 translate는 CF Pages 환경변수.
3. **한 서비스씩 복구 → 즉시 생성 실측 200 확인 → 다음** (일괄 금지).
4. 코드 수정이 필요하면(키 참조 일원화, ADC 전환 가능 엔드포인트 식별) 최소 변경으로. 단 `gemini-3-pro-image-preview`는 API 키 필수(Vertex 미지원)임을 전제.
5. 삭제키 복원이 더 안전하면 `undelete` 우선 고려(파괴적 재생성 회피).

## ⚠️ 준수 조항

- **헌법 4조**: 키 값 생성·추측·노출 절대 금지. placeholder도 금지. 변경은 작가님 승인 후.
- `.env`·`secrets/`·`deploy.sh` 수정 전 작가님 승인. 배포는 `deploy.sh` 경유 필수(직접 gcloud run deploy 금지).
- **비파괴 우선**: 삭제·재생성보다 교체·복원(undelete)을 우선 검토.
- 헌법 1조 1항: 매 턴 `date` 타임스탬프.
- 막힘 시 가설 전 자료 선참조 (ch7 6조). 에러 3회 반복 시 `/에스컬레이션`.
- 진단/복구 매 단계 실측 — "됐을 것"이라는 추정 금지(이번 사태의 근본 원인이 추정 진단이었다).

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | 3단계까지: 진단 보고 + 승인 대기 / 4단계: 복구 후 커밋+push |
| 산출물 | `monkos-ops/ops/reports/2026-06/REPORT_20260605_막내2_GeminiKEY진단복구.md` |
| 문서 유형 | INCIDENT → REPORT |
| 세션 로그 | `2026-06-05_{디바이스}_막내2.md` 어펜드 + PF_IDPHOTO 히스토리 1행 |

## 검증 (완료 기준)
- [ ] 1차 자료 정독 → 키 맥락 재구성
- [ ] GCP 활성 키 목록 + 삭제 실행 사실 확정
- [ ] GEMINI_API_KEY가 가리키는 값의 유효성 판정
- [ ] 깨진 엔드포인트 에러 코드 + 영향 범위 실측표
- [ ] 진단 보고 → 작가님 승인
- [ ] (승인 후) 서비스별 복구 + 생성 실측 200 확인
- [ ] 키 값 무노출 확인
