---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내2 (monkos Credentials 컨텍스트 보유)
portfolio: PF_SECURITY
status: 발행
order_class: 광역오더(Mission Order) #4 — 🔐보안(API 키)
---

# ORDER — Gemini API 키 4개 제한(unrestricted 해소) + Gemini 100% 오류 근원 진단

**[2026-06-02 12:47 KST] M1/쌍아 → 막내2**

> 작가님 GCP 콘솔에 **"unrestricted API keys (Gemini API)" 경고 배너** 며칠째 노출. 사무실 처리 지시가 있었으나 **미반영(쌍아 실측 확인)**. 무단 과금·유출 리스크(헌법 4조 1항) 제거.

---

## 1. 쌍아 1차 진단 (기준선 — 중복 조회 최소화)

**monkos(933456016842) API 키 4개 — 전부 `generativelanguage` API restriction만, application 제한(referrer/IP) 없음 = unrestricted:**

| 키 | Bound account | 생성 | 추정 호출처 |
|----|--------------|------|------------|
| MONKOS NEW API Key | — | 03-30 | idphoto 등 서버(확인) |
| monkos_key | **yong-a-orchestrator SA** | 01-12 | (확인) |
| monkosimagepro | — | 01-11 | image_pro PWA(브라우저) |
| monk-aistudio-consol | — | 01-05 | (용도 확인) |

- OAuth client는 mcp-google-docs(Desktop)·MONKOS AI(Web) 2개로 **이미 정리됨**(Desktop "MONKOS IMAGE PRO" 삭제 완료). **OAuth는 손대지 말 것.**
- 기준 문서: `reports/2026-04/REPORT_20260422_GCP_Firebase_인프라감사.md` (키 4개+구키 정비 권고).
- 생성코어 `gemini-3-pro-image-preview`는 **API Key 필수**(Vertex 미지원) — 키 제한 시 이게 깨지지 않도록 최우선 보호.

---

## 2. 목표 (Why)

API 키 4개의 **application 제한 부재를 해소**해 배너 경고 제거 + 무단 사용 차단. **단, 어떤 서비스 호출도 깨지지 않게.**

---

## 3. 단계

### 3-1. 키별 호출처 정밀 매핑
- 각 키(4개)가 **어느 서비스·코드·배포 환경변수에서 쓰이는지** 전수 매핑 (grep + Cloud Run env + .env). 키 **값은 조회/출력 금지**, 사용처만.
- 특히 idphoto-kr/jp 생성코어, image_pro, monk_imagen4가 각각 어느 키를 쓰는지 확정.

### 3-2. 제한 전략 권고안 (실행 전 작가님 승인)
- **PWA/브라우저 호출 키**(예: monkosimagepro) → **HTTP referrer 제한**(monkos 도메인).
- **서버 호출 키**(Cloud Run 동적 IP) → application 제한 까다로움. 다음 중 택해 **권고안 제시**:
  - (a) 서비스별 **키 분리** + API restriction 유지
  - (b) **Authorization(ADC/SA) 전환** 가능 경로 식별 (단 gemini-3-pro-image는 API Key 유지 필수)
- **미사용 키**(monk-aistudio-consol 등 호출처 0이면) → 삭제 권고.

### 3-3. 단계 적용 + 검증
- 승인된 제한을 **한 키씩** 적용 → **즉시 해당 서비스 실호출 검증**(idphoto 생성, image_pro, 챗봇 등). 깨지면 즉시 롤백·보고. **일괄 적용 금지.**

### 3-4. (묶음) Gemini API 100% 오류 근원 진단
- 콘솔 대시보드상 **Gemini API 오류율 100%(91건/1일)** 의 근원 규명: 어느 키·모델·메서드가 실패하나 (Cloud Logging + 메서드별 메트릭).
- **생성코어가 100% 오류면 🔥최우선 보고**(증명사진 생성 깨짐). 깨진 호출 루프(404 등 노이즈)면 원인만 보고.
- ⚠️ 이 진단으로 **수정까지 하지 말 것** — 원인 보고 후 별도 처리.

---

## 4. 범위 경계 (보안 민감 — 헌법 4조)

| 한다 ✅ | 안 한다 🚫 |
|--------|-----------|
| 키 호출처 매핑·제한 권고·승인 후 적용 | 키 **값 조회/출력/생성** |
| 한 키씩 적용 + 실호출 검증 | **일괄 적용**, 미검증 변경 |
| 100% 오류 **진단** | OAuth client 변경, 100% 오류 **수정** |
| 미사용 키 삭제 **권고** | 승인 없는 키 삭제·`.env` 수정 |

## 5. 자율 재량
- 매핑 수단(grep/gcloud/Cloud Run describe), 제한 전략 초안은 막내 판단. 단 적용은 §3-2 승인 게이트 후.

## 6. 가드레일
- 키 값 비노출·비생성(헌법 4조 1항). `.env`·`deploy.sh` 무단 수정 금지. 파괴적 명령 금지. 매 턴 `date` KST.

## 7. 체크포인트 (non-blocking)
1. **키별 호출처 매핑 결과** + 100% 오류 근원.
2. **제한 전략 권고안** → 작가님 승인 대기.
3. 승인 후 **한 키씩 적용 + 검증** → COMPLETION.
4. 에러 3회 → `/에스컬레이션`.

## 8. PF 갱신
- 완료 시 `PF_SECURITY/README.md` 히스토리 어펜드 + Phase 현황 갱신.

---

**끝. 최우선 보호 = idphoto 생성코어(API Key) 무중단. 일괄 적용 절대 금지, 한 키씩 검증하며 간다. 변경은 작가님 승인 게이트.**
