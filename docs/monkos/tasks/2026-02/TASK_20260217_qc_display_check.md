---
type: task
from: 쌍아
to: 막내
date: 2026-02-17 15:44 KST
status: pending
tags: [idphoto-kr, qc, display, investigation]
---

# 막내 지시서: QC 결과 미표시 현상 조사

## 배경

프로덕션 00079에서 카메라, 라이브코치, 생성, 땡큐까지 **전체 플로우 정상 작동 확인됨**.
단, **QC 결과가 표시되지 않음** — "정체성 85% 통과" 같은 판정 메시지가 안 나옴.

## 질문

1. QC API(`/api/qc`)가 호출되고 있는가? (서버 로그)
2. 호출되지만 에러가 나는가? (Gemini 3 Flash / 2.0 Flash 폴백)
3. 호출+응답 정상인데 클라이언트 표시 로직이 문제인가?

## 조사 작업

### 1. 서버 로그 확인

```bash
# 최근 QC 관련 로그 확인
gcloud run services logs read monkos-idphoto-kr \
  --region us-central1 \
  --limit 100 \
  --format "value(textPayload)" 2>/dev/null | grep -i "qc\|QC"
```

또는 Cloud Logging:
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="monkos-idphoto-kr" AND textPayload=~"QC|qc"' \
  --limit 50 \
  --format "value(textPayload)" \
  --project monkos
```

**확인 포인트:**
- `[QC] 모델 시도: gemini-3-flash-preview` 로그가 있는가?
- `[QC][gemini-3-flash-preview] 응답:` 로그가 있는가?
- `[QC][gemini-3-flash-preview] 실패:` → 폴백 로그가 있는가?
- 아예 `[API][qc]` 로그 자체가 없는가?

### 2. 클라이언트 코드 분석 (00079 시점)

00079 배포 코드 = 커밋 `93581f3` 시점의 `public/index.html`.

QC 호출 플로우 (index.html 1833~1848):
```
생성 완료
→ qc-badge "QC 검증 중..."
→ apiPost('/api/qc', { original, generated, gender, age })
→ showQCResult(qcResult)
```

**확인 포인트:**
- `showQCResult()` 함수 (1865행): `result.identity === 'PASS'` 또는 `result.same_person === true` 체크
- QC API 응답 형식이 이 조건에 맞는가?
- `similarity` 필드가 응답에 포함되는가?

### 3. QC API 직접 테스트

실제 이미지 없이 서버 로그만으로 판단이 어려우면, 아래 명령으로 QC API 응답 형식 확인:

```bash
# 서버 QC 응답 파싱 로직 확인 (server.js 365~405행)
# runQC 함수가 반환하는 JSON 구조:
# - identity: 'PASS' | 'FAIL'
# - similarity: 숫자
# - same_person: boolean
# - note: 문자열
# - quality: 문자열
```

### 4. Gemini 3 Flash 모델 가용성 확인

00079 빌드 시점(2/16 09:35)과 현재(2/17 15:44) 사이에 `gemini-3-flash-preview` 모델이 변경/중단되었을 수 있음.

```bash
# 현재 health 응답에서 QC 모델 상태 확인
curl -s https://idphoto-kr.monkos.ai/health | python3 -m json.tool
```

health 응답에 `"qc":"active (gemini-3-flash-preview → 2.0-flash 폴백)"` 표시되는지 확인.

### 5. 가능한 원인 후보

| # | 가설 | 검증 방법 |
|---|------|-----------|
| A | QC API 호출 자체 안 됨 (클라이언트 JS 에러) | 브라우저 콘솔 에러 확인 |
| B | QC API 호출되나 Gemini 모델 에러 | 서버 로그 `[QC]` 확인 |
| C | QC API 응답 형식 변경 (Gemini 모델 업데이트) | 응답 JSON 구조 확인 |
| D | showQCResult()에서 DOM 참조 에러 | `step-label` 요소 존재 여부 |
| E | QC 호출은 성공하나 배지가 보이지 않는 CSS 문제 | qc-badge display 상태 |

### 6. 가설 D 상세 (유력)

showQCResult() 마지막 부분 (1886행):
```javascript
if (passed) {
    document.getElementById('step-label').textContent = t('resultDone');
}
```

**그런데 현재 코드(00079 이후)에서 `step-label` DOM 요소가 삭제됨.**
→ 00079 시점에는 있었을 수 있음. 확인 필요.

다만 프로덕션은 00079 이미지이므로 해당 요소가 존재해야 함.
이 가설은 00079 자체의 문제가 아닌 경우 배제.

## 보고 형식

```markdown
---
## 조사 보고 [막내] [HH:MM KST]

### QC 상태
- API 호출: ✅/❌
- 서버 처리: ✅/❌ (모델명, 에러 메시지)
- 클라이언트 표시: ✅/❌

### 근본 원인
🔴/🟡/🟢 {원인 설명}

### 즉시 수정 가능 여부
- 수정 필요: {예/아니오}
- 수정 범위: {서버/클라이언트/양쪽}
---
```

## 제약

- **코드 수정 금지** — 조사만
- **배포 금지**
- 서버 로그 조회는 가능 (gcloud logging read)
- 00079 소스 분석은 `git show 93581f3:` 명령으로
