// MONK 토스페이먼츠 결제 API
// 테스트 모드: 실제 결제 X, 결제 플로우 테스트만

// 토스페이먼츠 테스트 키 (공개 가능)
const TOSS_TEST_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const TOSS_TEST_SECRET_KEY = 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { action, paymentKey, orderId, amount } = await request.json();

        switch (action) {
            case 'confirm':
                // 결제 승인 요청
                return await confirmPayment(paymentKey, orderId, amount, corsHeaders);
            
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
async function confirmPayment(paymentKey, orderId, amount, corsHeaders) {
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
        return new Response(JSON.stringify({
            success: true,
            payment: data,
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
