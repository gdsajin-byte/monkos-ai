# MONK 코인 이코노미 전략 문서

**작성일**: 2026-02-15
**작성자**: 막내 (Claude Code Opus 4.6)
**상태**: 기안 (작가님 검토 필요)

---

## 1. 개요

### 1.1 비전
MONK 코인을 플랫폼 전체의 통합 재화로 활용하여, 비즈니스 파트너(사진관, 유학원, 인력사무소 등)에게 리퍼럴 인센티브를 제공하고, 일정 금액 이상 적립 시 현금 환전이 가능한 어필리에이트 + 토큰 이코노미 모델 구축.

### 1.2 핵심 플로우
```
비즈니스 파트너 가입 → 리퍼럴 링크 배포 → 고객 결제 발생
    ↓
결제액의 10% 코인 적립 (비즈니스 계정)
    ↓
100코인 이상 시 현금 환전 신청 가능
    ↓
관리자 승인 → 계좌 송금
```

### 1.3 코인 가치
| 항목 | 값 |
|------|-----|
| 1코인 | ₩10 (또는 $0.01) |
| 최소 환전 단위 | 100코인 = ₩1,000 |
| 기본 커미션율 | 10% |

---

## 2. 법적 리스크 분석

### 2.1 선불전자지급수단 등록 여부

**현행 규정 (2024.09.15 시행 개정 전자금융거래법)**

| 조건 | 등록 면제 기준 |
|------|----------------|
| 발행잔액 | 30억원 미만 |
| 연간 총발행액 | 500억원 미만 |
| 가맹점 | 1개만 사용 시 면제 |

**MONK 현황 분석:**
- 현재 코인 발행 규모: 수백만 원 수준 (면제 대상)
- 사용처: MONK 플랫폼 내 서비스만 (단일 가맹점)
- **결론**: 현 단계에서는 등록 면제 대상

**주의점:**
- 발행 규모가 30억원 이상 성장 시 → 선불업 등록 필요
- 외부 가맹점 확대 시 → 등록 의무 발생 가능
- 모니터링 지표 설정 권장

**참고**: [금융위원회 선불업 등록 안내](https://www.fsc.go.kr/no010101/84178)

### 2.2 사업소득 원천징수

**리퍼럴 커미션 = 사업소득**

비즈니스 파트너에게 지급하는 코인 환전금은 **사업소득**으로 분류됨.

| 항목 | 내용 |
|------|------|
| 원천징수율 | 3.3% (소득세 3% + 지방소득세 0.3%) |
| 신고 의무 | 지급 다음달 10일까지 |
| 지급명세서 | 연 1회 제출 (다음해 2월) |

**구현 방안:**
```javascript
// 환전 지급 시
const grossAmount = 10000; // 환전 신청 금액
const withholdingTax = grossAmount * 0.033; // 330원
const netPayment = grossAmount - withholdingTax; // 9,670원
```

**필요 정보 수집:**
- 사업자등록번호 또는 주민등록번호
- 은행 계좌 정보
- 세금계산서 발행 여부

**참고**: [국세청 원천징수 안내](https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2289&cntntsId=7701)

### 2.3 환전 규제

현재 한국법상 자사 포인트의 현금 환전은 명시적으로 금지되지 않음.
단, 다음 사항 준수 필요:

1. **환전 조건 명시**: 이용약관에 환전 조건, 한도, 절차 명확히 기재
2. **소멸 정책**: 포인트 유효기간 설정 시 5년 이상 권장
3. **환전 수수료**: 수수료 부과 시 사전 고지 필수

---

## 3. 보안 리스크 & 대응 전략

### 3.1 이중 원장 (Dual Ledger) 시스템

**목적**: 단일 장애점 제거 + 변조 탐지

```
┌─────────────────┐     ┌─────────────────┐
│   Firestore     │     │      D1         │
│   (GCP)         │     │  (Cloudflare)   │
│                 │     │                 │
│  balance: 100   │ ←→  │  balance: 100   │
│  tx_hash: abc   │     │  tx_hash: abc   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────┬───────────────┘
                 ▼
          교차 검증 레이어
```

**검증 로직:**
```javascript
async function verifyAndExecute(userId, amount, operation) {
  // 1. 양쪽 잔액 조회
  const [fsBalance, d1Balance] = await Promise.all([
    getFirestoreBalance(userId),
    getD1Balance(userId)
  ]);

  // 2. 불일치 감지 → 즉시 차단
  if (fsBalance !== d1Balance) {
    await lockAccount(userId);
    await alertAdmin('BALANCE_MISMATCH', { userId, fsBalance, d1Balance });
    throw new SecurityError('잔액 불일치 감지');
  }

  // 3. 트랜잭션 해시 생성
  const txHash = crypto.createHash('sha256')
    .update(`${userId}:${amount}:${Date.now()}:${operation}`)
    .digest('hex');

  // 4. 양쪽 동시 업데이트
  await Promise.all([
    updateFirestore(userId, amount, txHash),
    updateD1(userId, amount, txHash, operation)
  ]);

  return { success: true, txHash };
}
```

### 3.2 해킹 시나리오 & 대응

| 시나리오 | 탐지 방법 | 대응 |
|----------|-----------|------|
| Firestore만 변조 | D1과 불일치 | 계정 락 + 관리자 알림 |
| D1만 변조 | Firestore와 불일치 | 계정 락 + 관리자 알림 |
| 양쪽 동시 변조 | tx_hash 체인 검증 | 전체 감사 모드 |
| API 우회 시도 | 서명 검증 실패 | 요청 차단 + 로그 |

### 3.3 추가 보안 조치

1. **트랜잭션 해시 체인**: 각 거래의 해시가 이전 거래 해시 포함
2. **일일 정합성 검사**: 배치로 전체 유저 잔액 대조
3. **이상 거래 탐지**: 단시간 대량 거래, 비정상 패턴 모니터링
4. **IP/디바이스 바인딩**: 비즈니스 계정은 등록된 IP/디바이스만 허용

---

## 4. Chargeback (신용취소) 방지 전략

### 4.1 문제 정의

고객이 결제 후 신용카드사에 이의제기 → 환불 발생 → 이미 지급된 커미션 회수 불가

### 4.2 커미션 지연 지급 정책

**핵심 전략: 커미션 즉시 적립하되, 환전은 지연 허용**

| 단계 | 상태 | 기간 | 설명 |
|------|------|------|------|
| 1 | `pending` | 결제 직후 | 커미션 계산, 표시만 됨 |
| 2 | `confirmed` | +14일 | 환불 기간 경과, 확정 |
| 3 | `withdrawable` | +30일 | 환전 신청 가능 |

```javascript
// 커미션 적립 시
const commission = {
  business_id: businessId,
  source_tx_id: paymentTxId,
  amount: paymentAmount * 0.10,
  status: 'pending',
  confirm_at: Date.now() + (14 * 24 * 60 * 60 * 1000), // +14일
  withdrawable_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // +30일
  created_at: Date.now()
};
```

### 4.3 환불/Chargeback 발생 시 처리

```javascript
// 환불 웹훅 수신 시
async function handleRefund(originalTxId, refundAmount) {
  // 1. 해당 결제로 적립된 커미션 조회
  const commission = await getCommissionBySourceTx(originalTxId);

  if (!commission) return;

  // 2. 상태별 처리
  if (commission.status === 'pending') {
    // 아직 확정 전 → 커미션 취소
    await updateCommission(commission.id, { status: 'cancelled' });
  } else if (commission.status === 'confirmed') {
    // 확정됐지만 환전 전 → 마이너스 처리
    await createCommission({
      business_id: commission.business_id,
      amount: -commission.amount,
      type: 'clawback',
      reason: `환불 (원거래: ${originalTxId})`
    });
  } else if (commission.status === 'withdrawn') {
    // 이미 환전됨 → 다음 환전에서 차감 또는 직접 회수
    await flagForRecovery(commission);
    await alertAdmin('COMMISSION_RECOVERY_NEEDED', commission);
  }
}
```

### 4.4 결제사별 Chargeback 기간

| 결제사 | Chargeback 기간 | 권장 대기 |
|--------|-----------------|-----------|
| 토스페이먼츠 | 120일 (해외카드) | 14일 |
| 레몬스퀴지 | 60일 | 30일 |

**참고**:
- [토스페이먼츠 환불 가이드](https://docs.tosspayments.com/guides/v2/cancel-payment)
- [레몬스퀴지 Refunds & Chargebacks](https://docs.lemonsqueezy.com/help/payments/refunds-chargebacks)

---

## 5. 토스/레몬스퀴지 연동 구조

### 5.1 현재 웹훅 구조 (기존)

```
결제 완료 → order_created 웹훅 → 크레딧 즉시 지급
환불 발생 → order_refunded 웹훅 → 크레딧 회수
```

### 5.2 확장 웹훅 구조 (비즈니스 계정 포함)

```
결제 완료 (order_created / toss confirm)
    │
    ├──→ 고객 크레딧 지급 (즉시)
    │
    └──→ 리퍼럴 확인 (referred_by 존재?)
            │
            └──→ 비즈니스 커미션 적립 (pending 상태)


환불 발생 (order_refunded / cancel webhook)
    │
    ├──→ 고객 크레딧 회수
    │
    └──→ 관련 커미션 처리 (취소/clawback)
```

### 5.3 리퍼럴 추적 구현

```javascript
// 1. 고객 가입 시 리퍼럴 코드 저장
app.post('/api/auth/signup', async (req, res) => {
  const { email, referralCode } = req.body;

  let referredBy = null;
  if (referralCode) {
    const business = await getBusinessByReferralCode(referralCode);
    if (business) {
      referredBy = business.id;
    }
  }

  const user = await createUser({
    email,
    referred_by: referredBy,
    created_at: Date.now()
  });

  // 리퍼럴 기록
  if (referredBy) {
    await createReferral({
      business_id: referredBy,
      referred_user_id: user.id,
      created_at: Date.now()
    });
  }
});

// 2. 결제 시 커미션 자동 적립
async function processPaymentWithCommission(paymentData) {
  const { userId, amount, txId } = paymentData;

  // 고객 크레딧 지급
  await addCredits(userId, calculateCredits(amount));

  // 리퍼럴 확인
  const user = await getUser(userId);
  if (user.referred_by) {
    const commissionRate = await getBusinessCommissionRate(user.referred_by);
    const commissionAmount = Math.floor(amount * commissionRate / 100);

    await createCommission({
      business_id: user.referred_by,
      source_tx_id: txId,
      amount: commissionAmount,
      status: 'pending',
      confirm_at: Date.now() + CONFIRM_DELAY,
      created_at: Date.now()
    });
  }
}
```

---

## 6. 환전 시스템 설계

### 6.1 환전 프로세스

```
비즈니스 계정 환전 신청 (100코인 이상)
    │
    ▼
자동 검증
├── 잔액 확인 (Firestore + D1 교차)
├── 최소 단위 확인 (100코인)
├── 확정 상태 코인만 환전 가능
└── 이상 거래 체크
    │
    ▼
관리자 승인 대기
├── 대시보드에 환전 신청 목록 표시
├── 수동 검토 후 승인/거부
└── 거부 시 사유 기록
    │
    ▼
송금 처리
├── 3.3% 원천징수
├── 계좌 이체
└── 환전 완료 상태 업데이트
    │
    ▼
세무 처리
├── 지급명세서 데이터 저장
└── 분기/연간 신고 자료
```

### 6.2 환전 API

```javascript
// 환전 신청
app.post('/api/business/withdraw', async (req, res) => {
  const { businessId, amount } = req.body;

  // 검증
  const balance = await getConfirmedBalance(businessId);
  if (balance < amount) {
    return res.status(400).json({ error: '환전 가능 잔액 부족' });
  }
  if (amount < 100 || amount % 100 !== 0) {
    return res.status(400).json({ error: '100코인 단위로 신청해주세요' });
  }

  // 잔액 차감 (pending 상태로)
  await deductBalance(businessId, amount, 'withdrawal_pending');

  // 환전 신청 생성
  const withdrawal = await createWithdrawal({
    business_id: businessId,
    coin_amount: amount,
    cash_amount: amount * 10, // 1코인 = ₩10
    tax_amount: Math.floor(amount * 10 * 0.033),
    net_amount: Math.floor(amount * 10 * 0.967),
    status: 'requested',
    requested_at: Date.now()
  });

  await notifyAdmin('NEW_WITHDRAWAL_REQUEST', withdrawal);

  res.json({ success: true, withdrawal });
});

// 관리자: 환전 승인
app.post('/api/admin/withdraw/approve', async (req, res) => {
  const { withdrawalId, adminNote } = req.body;

  await updateWithdrawal(withdrawalId, {
    status: 'approved',
    admin_note: adminNote,
    approved_at: Date.now()
  });

  // TODO: 실제 송금 처리 (수동 또는 API 연동)

  res.json({ success: true });
});
```

### 6.3 환전 한도 정책

| 구분 | 한도 | 비고 |
|------|------|------|
| 1회 최소 | 100코인 (₩1,000) | - |
| 1회 최대 | 10,000코인 (₩100,000) | 초과 시 분할 신청 |
| 월 최대 | 100,000코인 (₩1,000,000) | 초과 시 별도 심사 |

---

## 7. D1 스키마 설계

```sql
-- =============================================
-- MONK 코인 이코노미 D1 스키마
-- =============================================

-- 비즈니스 계정
CREATE TABLE business_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                    -- 기존 유저 연결
  business_name TEXT NOT NULL,
  business_type TEXT,                       -- 'photo_studio', 'agency', 'school'
  business_number TEXT,                     -- 사업자등록번호 (세금용)
  bank_name TEXT,
  bank_account TEXT,                        -- 암호화 저장
  account_holder TEXT,
  referral_code TEXT UNIQUE NOT NULL,       -- 고유 리퍼럴 코드
  commission_rate INTEGER DEFAULT 10,       -- 커미션율 (%)
  status TEXT DEFAULT 'pending',            -- 'pending', 'active', 'suspended'
  created_at INTEGER NOT NULL,
  approved_at INTEGER,
  UNIQUE(user_id)
);

-- 지갑 (이중 원장의 D1 측)
CREATE TABLE wallets (
  user_id TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  confirmed_balance INTEGER DEFAULT 0,      -- 환전 가능 잔액
  pending_balance INTEGER DEFAULT 0,        -- 대기 중 잔액
  last_tx_hash TEXT,
  updated_at INTEGER NOT NULL
);

-- 거래 내역
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                       -- 'charge', 'use', 'refund', 'commission', 'withdraw', 'clawback'
  amount INTEGER NOT NULL,                  -- +/- 값
  balance_after INTEGER NOT NULL,
  service TEXT,                             -- 'idphoto-kr', 'lookbook', 'photolab'
  description TEXT,
  tx_hash TEXT NOT NULL,
  prev_tx_hash TEXT,                        -- 해시 체인
  metadata TEXT,                            -- JSON (추가 정보)
  created_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES wallets(user_id)
);
CREATE INDEX idx_tx_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_tx_hash ON transactions(tx_hash);

-- 리퍼럴 관계
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,

  FOREIGN KEY (business_id) REFERENCES business_accounts(id),
  UNIQUE(referred_user_id)
);
CREATE INDEX idx_ref_business ON referrals(business_id);

-- 커미션 내역
CREATE TABLE commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  source_tx_id TEXT,                        -- 원본 결제 트랜잭션
  source_user_id TEXT,                      -- 결제한 유저
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',            -- 'pending', 'confirmed', 'withdrawn', 'cancelled', 'clawback'
  confirm_at INTEGER,                       -- 확정 예정 시간
  withdrawable_at INTEGER,                  -- 환전 가능 시간
  created_at INTEGER NOT NULL,
  updated_at INTEGER,

  FOREIGN KEY (business_id) REFERENCES business_accounts(id)
);
CREATE INDEX idx_comm_business ON commissions(business_id, status);
CREATE INDEX idx_comm_source ON commissions(source_tx_id);

-- 환전 신청
CREATE TABLE withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id TEXT NOT NULL,
  coin_amount INTEGER NOT NULL,             -- 환전 코인
  cash_amount INTEGER NOT NULL,             -- 총 금액 (원)
  tax_amount INTEGER NOT NULL,              -- 원천징수 (3.3%)
  net_amount INTEGER NOT NULL,              -- 실지급액
  bank_info TEXT,                           -- 송금 정보 (암호화)
  status TEXT DEFAULT 'requested',          -- 'requested', 'approved', 'completed', 'rejected', 'cancelled'
  admin_note TEXT,
  requested_at INTEGER NOT NULL,
  approved_at INTEGER,
  completed_at INTEGER,

  FOREIGN KEY (business_id) REFERENCES business_accounts(id)
);
CREATE INDEX idx_withdraw_business ON withdrawals(business_id, status);
CREATE INDEX idx_withdraw_status ON withdrawals(status, requested_at);

-- 일일 정합성 검사 로그
CREATE TABLE integrity_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_date TEXT NOT NULL,                 -- YYYY-MM-DD
  total_users INTEGER,
  matched INTEGER,
  mismatched INTEGER,
  mismatch_details TEXT,                    -- JSON
  created_at INTEGER NOT NULL
);
```

---

## 8. 구현 로드맵

### Phase 1: 기반 구축 (1-2주)

- [ ] D1 스키마 생성 및 마이그레이션
- [ ] 이중 원장 동기화 로직 구현
- [ ] 거래 내역 저장 로직 추가
- [ ] 일일 정합성 검사 배치

### Phase 2: 비즈니스 계정 (2-3주)

- [ ] 비즈니스 계정 가입 UI/API
- [ ] 리퍼럴 코드 생성 및 추적
- [ ] 비즈니스 대시보드 (잔액, 리퍼럴 현황)

### Phase 3: 커미션 시스템 (1-2주)

- [ ] 결제 시 커미션 자동 적립
- [ ] 커미션 확정 배치 작업
- [ ] 환불/Chargeback 처리 로직

### Phase 4: 환전 시스템 (2주)

- [ ] 환전 신청 API
- [ ] 관리자 승인 대시보드
- [ ] 원천징수 계산 및 기록
- [ ] 세무 자료 출력

### Phase 5: 모니터링 & 보안 (1주)

- [ ] 이상 거래 탐지 알림
- [ ] 관리자 대시보드 완성
- [ ] 보안 감사

---

## 9. 리스크 매트릭스

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 선불업 등록 미비 | 낮음 | 높음 | 발행액 모니터링, 30억 전 등록 준비 |
| Chargeback 남용 | 중간 | 중간 | 커미션 지연 지급, 확정 전 회수 |
| 이중 원장 불일치 | 낮음 | 높음 | 자동 탐지 + 계정 락 |
| 세무 리스크 | 중간 | 중간 | 3.3% 원천징수 철저, 지급명세서 관리 |
| 대량 환전 요청 | 낮음 | 중간 | 월 한도 설정, 수동 승인 |

---

## 10. 참고 자료

- [금융위원회 - 선불업 등록 안내](https://www.fsc.go.kr/no010101/84178)
- [국세청 - 원천징수 개요](https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2289&cntntsId=7701)
- [토스페이먼츠 - 결제 취소](https://docs.tosspayments.com/guides/v2/cancel-payment)
- [토스페이먼츠 - 웹훅 이벤트](https://docs.tosspayments.com/reference/using-api/webhook-events)
- [Lemon Squeezy - Refunds & Chargebacks](https://docs.lemonsqueezy.com/help/payments/refunds-chargebacks)
- [Lemon Squeezy - Webhooks Guide](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)

---

## 11. 결론

MONK 코인 이코노미는 현행법 범위 내에서 운영 가능하며, 이중 원장 시스템과 커미션 지연 지급 정책으로 보안 및 Chargeback 리스크를 효과적으로 관리할 수 있습니다.

**작가님 검토 요청 사항:**
1. 커미션율 10% 적정 여부
2. 환전 대기 기간 (14일 확정, 30일 환전) 적정 여부
3. 최소 환전 단위 100코인 적정 여부
4. Phase 1부터 순차 진행 승인 여부

---

*문서 끝*
