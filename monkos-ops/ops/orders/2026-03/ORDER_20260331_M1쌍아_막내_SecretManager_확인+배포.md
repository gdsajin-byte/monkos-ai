---
type: order
from: M1/쌍아
to: 막내
date: 2026-03-31
priority: 🔴 P0
subject: GEMINI_API_KEY Secret Manager 반영 확인 + 미반영 시 즉시 업데이트 + Cloud Run 재배포
---

# 지시서: Secret Manager 키 반영 확인 + 재배포

**[2026-03-31 07:55 KST] M1/쌍아 → 막내**

---

## 상황

작가님이 새 GEMINI_API_KEY를 터미널에서 전달함.
로컬에만 반영되고 **프로덕션(Secret Manager → Cloud Run)에 미반영** 가능성 있음.

---

## 작업 순서

### 1. Secret Manager 현재 상태 확인

```bash
# 버전 목록 — 새 버전이 추가됐는지 확인
gcloud secrets versions list --secret=GEMINI_API_KEY

# 최신 버전 끝4자리 확인
gcloud secrets versions access latest --secret=GEMINI_API_KEY 2>/dev/null | tail -c 4
```

**판정 기준:**
- 버전이 1개(`HDow`)뿐이면 → **미반영. 작업 2로 진행**
- 새 버전이 있고 끝4자리가 `HDow`가 아니면 → **반영 완료. 작업 3으로 건너뛰기**

### 2. (미반영 시) Secret Manager 업데이트

작가님이 준 새 키를 Secret Manager에 추가:

```bash
# 새 키를 Secret Manager에 새 버전으로 추가
echo -n "새_키_값" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 만료된 기존 버전 비활성화
gcloud secrets versions disable 1 --secret=GEMINI_API_KEY

# 확인
gcloud secrets versions access latest --secret=GEMINI_API_KEY | tail -c 4
```

### 3. Cloud Run 재배포

Secret Manager가 갱신되어도 **Cloud Run은 기존 리비전이 캐싱**하고 있으므로 재배포 필수:

```bash
cd /Users/developer/monk_project/apps/monk_imagen4/backend && bash deploy.sh production
```

### 4. 프로덕션 키 유효성 검증

```bash
# /translate로 키 유효성 즉시 확인 (가장 가벼운 Gemini API 호출)
curl -s -X POST https://image.monkos.ai/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","targetLang":"KO"}' \
  | jq '{success, error}'
```

**검증 기준:**
- `"API key expired"` → 키 갱신 실패
- `{"success": true, "translated": "안녕하세요"}` → 키 갱신 성공

---

## 완료 기준

- [ ] Secret Manager 상태 확인 (반영 여부 판정)
- [ ] (미반영 시) Secret Manager 업데이트
- [ ] Cloud Run 재배포
- [ ] 프로덕션 키 유효성 검증
- [ ] 완료 보고 — 새 키 끝4자리 + 검증 결과

## 준수 조항

- 헌법 제4조 1항: 키 값 보고서 기재 금지 (끝4자리 마스킹만)
- 완료 보고 형식: `✅❌💡⏳📁🔀`
