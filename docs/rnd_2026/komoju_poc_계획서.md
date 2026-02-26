# KOMOJU 연동 PoC 계획서 (Sandbox)

> 작성자: 막내4 | 작성일: 2026-02-23
> 전제: KOMOJU 전수조사 보고서 (`komoju_조사보고서.md`) 기반
> 상태: 작가님 승인 대기

---

## 목적

idphoto-kr 서비스에 KOMOJU를 연동하여 일본 로컬 결제수단(편의점/PayPay)의 실동작을 검증한다. **Sandbox(Test Mode) 범위 내에서만 진행.**

---

## 사전 조건

| # | 조건 | 담당 | 상태 |
|---|------|------|------|
| 1 | KOMOJU 계정 생성 | 작가님 | 대기 |
| 2 | Test Mode API Key 확보 (Secret + Publishable) | 작가님 | 대기 |
| 3 | 디지털 상품 편의점 결제 가능 여부 공식 확인 | 작가님 (KOMOJU 문의) | 대기 |

> ⚠️ 헌법 제6조: API 키는 작가님이 직접 생성·제공. 막내는 추측/생성 절대 금지.

---

## PoC 범위

### In Scope

| # | 항목 | 검증 목표 |
|---|------|----------|
| 1 | Session 생성 API 호출 | Cloud Run → KOMOJU API 통신 정상 여부 |
| 2 | Hosted Page 리다이렉트 | 결제 페이지 정상 표시 + 한국어/영어 표시 여부 |
| 3 | 편의점 결제 시뮬레이션 | Konbini 선택 → 결제번호 발급 흐름 |
| 4 | PayPay 결제 시뮬레이션 | PayPay 선택 → QR/앱 연동 흐름 |
| 5 | 카드 결제 (테스트 카드) | 3D Secure 포함 결제 완료 흐름 |
| 6 | Webhook 수신 | `payment.captured` 이벤트 수신 + 서명 검증 |
| 7 | Return URL 처리 | 결제 완료 → 앱 복귀 + 세션 상태 확인 |

### Out of Scope

- Live Mode 전환 / 실결제
- 정산 테스트
- 프로덕션 배포
- UI/UX 최종 디자인

---

## 기술 설계

### 아키텍처

```
[idphoto-kr 앱]
    │
    ├─ 크레딧 구매 클릭
    │
    ▼
[Cloud Run Server] ─── POST /api/v1/sessions ──→ [KOMOJU API]
    │                                                  │
    │                                          session_url 반환
    │                                                  │
    ▼                                                  ▼
[클라이언트 리다이렉트] ──────────────────→ [KOMOJU Hosted Page]
                                                       │
                                               결제 완료/취소
                                                       │
                                                       ▼
[Return URL: /api/komoju/return] ←──────────── 리다이렉트 복귀
    │
    ├─ session_id로 상태 조회
    │
    ▼
[Webhook: /api/komoju/webhook] ←───────── payment.captured 이벤트
    │
    ├─ 서명 검증 (HMAC-SHA256)
    ├─ 크레딧 부여
    └─ 세션 로그 기록
```

### 신규 파일 (PoC)

| 파일 | 역할 |
|------|------|
| `server.js` 수정 | `/api/komoju/session`, `/api/komoju/return`, `/api/komoju/webhook` 3개 엔드포인트 추가 |
| `public/config.js` 수정 | `KOMOJU_PUBLISHABLE_KEY` 추가 |
| `public/index.html` 수정 | 결제 모달에 KOMOJU 결제수단 분기 추가 (일본 IP 감지 시) |

### 핵심 코드 스니펫 (PoC용)

**세션 생성 (서버)**:
```javascript
// /api/komoju/session
app.post('/api/komoju/session', async (req, res) => {
  const { amount, paymentTypes } = req.body;

  const response = await fetch('https://komoju.com/api/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(process.env.KOMOJU_SECRET_KEY + ':').toString('base64')}`
    },
    body: JSON.stringify({
      amount,
      currency: 'JPY',
      return_url: `${process.env.BASE_URL}/api/komoju/return`,
      payment_types: paymentTypes || ['credit_card', 'konbini', 'paypay'],
      external_order_num: `kr-${Date.now()}`
    })
  });

  const session = await response.json();
  res.json({ session_url: session.session_url, session_id: session.id });
});
```

**Webhook 수신 (서버)**:
```javascript
// /api/komoju/webhook
app.post('/api/komoju/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-komoju-signature'];
  const computed = crypto
    .createHmac('sha256', process.env.KOMOJU_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== computed) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  if (event.type === 'payment.captured') {
    // 크레딧 부여 로직
  }

  res.status(200).send('OK');
});
```

---

## 환경 변수 (작가님 제공 필요)

| 변수명 | 값 | Test Mode 예시 |
|--------|-----|---------------|
| `KOMOJU_SECRET_KEY` | Test Secret Key | `sk_test_xxxx` |
| `KOMOJU_PUBLISHABLE_KEY` | Test Publishable Key | `pk_test_xxxx` |
| `KOMOJU_WEBHOOK_SECRET` | Webhook 서명 검증용 | 대시보드에서 발급 |

> ⚠️ 전부 작가님이 KOMOJU 대시보드에서 직접 확인·제공

---

## 테스트 시나리오

| # | 시나리오 | 결제수단 | 입력 | 기대 결과 |
|---|---------|---------|------|----------|
| 1 | 카드 정상 결제 | credit_card | `4111111111111111` | status: captured |
| 2 | 카드 잔액 부족 | credit_card | `4123111111111000` | 에러: insufficient_funds |
| 3 | 카드 3DS | credit_card | `4100000000000100` | 3DS 인증 → captured |
| 4 | 편의점 선택 | konbini | (호스팅 페이지에서 선택) | status: authorized → 번호 발급 |
| 5 | PayPay 선택 | paypay | (호스팅 페이지에서 선택) | QR 표시 또는 앱 이동 |
| 6 | Webhook 수신 | — | — | 서버 로그에 이벤트 기록 |
| 7 | 결제 취소 | — | (호스팅 페이지에서 취소) | return_url에 session status: cancelled |

---

## 일정 (작가님 승인 후)

| 단계 | 작업 | 예상 소요 | 선행 조건 |
|------|------|----------|----------|
| 0 | KOMOJU 계정 생성 + API Key 확보 | 작가님 직접 | — |
| 1 | 서버 엔드포인트 3개 구현 | 2시간 | API Key 확보 |
| 2 | 클라이언트 결제 분기 구현 | 1시간 | 단계 1 |
| 3 | 테스트 시나리오 7건 실행 | 1시간 | 단계 2 |
| 4 | 결과 보고서 작성 | 30분 | 단계 3 |

**총 예상: 반나절** (API Key 확보 후)

---

## 리스크 및 주의사항

| # | 리스크 | 대응 |
|---|--------|------|
| 1 | 디지털 상품 편의점 결제 불가 판정 | PayPay + 카드로 대체 (편의점 제외) |
| 2 | 일본 IP가 아니면 PayPay 테스트 불가 | `Komoju-Scenario` 헤더로 시뮬레이션 |
| 3 | Webhook URL을 KOMOJU에 등록해야 함 | Cloud Run 배포 후 URL 등록 (Test Mode) |
| 4 | .env 수정 필요 | 작가님 직접 수정 또는 지시서에 [예외] 명시 |

---

## 완료 기준

- [ ] 7개 테스트 시나리오 전수 Pass
- [ ] Webhook 서명 검증 정상 동작
- [ ] 편의점 결제 흐름 화면 캡처 (3장)
- [ ] PayPay 결제 흐름 화면 캡처 (2장)
- [ ] PoC 결과 보고서 제출
