// MONK 토스페이먼츠 결제 API
// 테스트 모드: 실제 결제 X, 결제 플로우 테스트만

// TODO: env.TOSS_SECRET_KEY로 전환 예정 (monkos 정식 연동 시)
const TOSS_TEST_CLIENT_KEY = '';
const TOSS_TEST_SECRET_KEY = '';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { action, paymentKey, orderId, amount, userId, credits } = await request.json();

        switch (action) {
            case 'confirm':
                // 결제 승인 요청
                return await confirmPayment(paymentKey, orderId, amount, userId, credits, env.DB, corsHeaders);
            
            case 'cancel':
                // 결제 취소
                return await cancelPayment(paymentKey, corsHeaders);
            
            default:
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Unknown action'
                }), { headers: corsHeaders });
        }

    } catch (error) {
        console.error('Payment API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers: corsHeaders });
    }
}

// 결제 승인
async function confirmPayment(paymentKey, orderId, amount, userId, credits, db, corsHeaders) {
    const secretKey = TOSS_TEST_SECRET_KEY;
    const encryptedSecretKey = btoa(secretKey + ':');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encryptedSecretKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentKey,
            orderId,
            amount
        })
    });

    const data = await response.json();

    if (response.ok) {
        // 결제 성공 → DB 크레딧 충전
        if (userId && credits && db) {
            try {
                await addCredits(db, userId, credits, `크레딧 구매 (${credits}cr / ₩${amount})`);
            } catch (dbError) {
                console.error('크레딧 충전 실패:', dbError);
                // 결제는 성공했으므로 경고만 표시
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            payment: data,
            credits: credits || 0,
            message: '결제가 완료되었습니다'
        }), { headers: corsHeaders });
    } else {
        return new Response(JSON.stringify({
            success: false,
            error: data.message || '결제 승인 실패',
            code: data.code
        }), { status: 400, headers: corsHeaders });
    }
}

// 결제 취소
async function cancelPayment(paymentKey, corsHeaders) {
    const secretKey = TOSS_TEST_SECRET_KEY;
    const encryptedSecretKey = btoa(secretKey + ':');

    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encryptedSecretKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cancelReason: '고객 요청'
        })
    });

    const data = await response.json();

    return new Response(JSON.stringify({
        success: response.ok,
        data
    }), { headers: corsHeaders });
}

// OPTIONS 요청 처리 (CORS)
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// ==================== DB 크레딧 관리 ====================

async function addCredits(db, userId, amount, description) {
    // 현재 잔액 조회
    const current = await db.prepare(
        'SELECT balance FROM shared_credits WHERE user_id = ?'
    ).bind(userId).first();
    
    const currentBalance = current?.balance || 0;
    const newBalance = currentBalance + amount;
    
    // 잔액 업데이트
    if (current) {
        await db.prepare(
            'UPDATE shared_credits SET balance = ?, updated_at = datetime("now") WHERE user_id = ?'
        ).bind(newBalance, userId).run();
    } else {
        // 신규 사용자 (이론상 여기 올 일 없음)
        await db.prepare(
            'INSERT INTO shared_credits (user_id, balance) VALUES (?, ?)'
        ).bind(userId, newBalance).run();
    }
    
    // 거래 내역 기록
    await db.prepare(
        'INSERT INTO shared_credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
    ).bind(userId, amount, 'purchase', description).run();
    
    return newBalance;
}
