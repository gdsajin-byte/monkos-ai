# 결제 시스템 테스트 시나리오

## 준비사항
- Cloudflare Workers 배포 완료
- D1 데이터베이스 테이블 생성 완료
- 테스트 계정 로그인 상태

## 시나리오 1: 신규 회원 가입 → 보너스 크레딧 확인
1. 로그아웃 상태에서 시작
2. "로그인" 클릭 → 카카오/구글 로그인
3. 회원가입 완료 후 **크레딧 표시 확인**
   - ✅ 예상: 100cr 표시
   - ❌ 0cr이면 문제!

## 시나리오 2: 크레딧 구매 (테스트 모드)
1. 로그인 상태 확인
2. 크레딧 아이콘 클릭 → 충전 모달
3. "100cr + 0 보너스" 선택 (₩10,000)
4. 테스트 카드 입력:
   ```
   카드번호: 4330-0000-0000-0002
   유효기간: 12/25
   CVC: 123
   생년월일: 920101
   비밀번호 앞 2자리: 00
   ```
5. 결제 완료
6. **크레딧 충전 확인**:
   - ✅ 알림: "100 크레딧이 충전되었습니다!"
   - ✅ 헤더 크레딧 숫자 증가 (100 → 200)
   - ✅ 새로고침 후에도 유지

## 시나리오 3: DB 확인 (Cloudflare Dashboard)
1. Cloudflare Dashboard → D1 → `monk_db`
2. Query 실행:
   ```sql
   SELECT * FROM shared_credits WHERE user_id = '방금_가입한_사용자_ID';
   ```
3. ✅ `balance` 컬럼 확인: 200 (보너스 100 + 구매 100)
4. 거래 내역 확인:
   ```sql
   SELECT * FROM shared_credit_transactions WHERE user_id = '사용자_ID' ORDER BY created_at DESC;
   ```
5. ✅ 2개 레코드:
   - type: 'bonus', amount: 100, description: '회원가입 보너스'
   - type: 'purchase', amount: 100, description: '크레딧 구매 (100cr / ₩10000)'

## 문제 발생 시 체크리스트

### ❌ 신규 회원 보너스 안 받음
- [ ] `auth.js` `initCredits()` 실행 확인
- [ ] D1 테이블 `shared_credits` 존재 확인
- [ ] Cloudflare Workers 로그 확인

### ❌ 결제 후 크레딧 충전 안 됨
- [ ] `payment.js` 배포 확인
- [ ] `/api/payment` 엔드포인트 응답 확인 (Network 탭)
- [ ] `addCredits()` 함수 실행 로그 확인
- [ ] DB 연결 (env.DB) 확인

### ❌ 로컬 크레딧만 증가, DB는 그대로
- [ ] `handlePaymentCallback()` 내 `/api/payment` 호출 확인
- [ ] `userId` 파라미터 전달 확인
- [ ] 서버 응답 `result.success` 확인

## 성공 기준
- ✅ 신규 회원: 100cr 자동 지급
- ✅ 결제 후: DB + 로컬 모두 충전
- ✅ 새로고침 후: 크레딧 유지
- ✅ D1 DB: 거래 내역 기록
