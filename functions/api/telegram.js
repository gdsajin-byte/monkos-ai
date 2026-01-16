// MONK 텔레그램 봇 API - @Monk_yonga_bot
// 이미지 전송 및 알림 서비스

const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const botToken = env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            throw new Error('텔레그램 봇 토큰이 설정되지 않았습니다');
        }

        const { action, chat_id, phone, images, product, visitor_id, message, address } = await request.json();

        // 액션별 처리
        switch (action) {
            case 'send_images':
                return await sendImages(botToken, chat_id, images, product, corsHeaders);
            
            case 'send_message':
                return await sendMessage(botToken, chat_id, message, corsHeaders);
            
            case 'print_order':
                return await notifyPrintOrder(botToken, { images, product, visitor_id, phone, address }, corsHeaders);
            
            default:
                // 기본: 이미지 전송 (chat_id 필요)
                if (images && images.length > 0) {
                    // chat_id가 없으면 관리자에게 알림
                    const targetChatId = chat_id || env.ADMIN_CHAT_ID;
                    if (targetChatId) {
                        return await sendImages(botToken, targetChatId, images, product, corsHeaders);
                    }
                }
                
                return new Response(JSON.stringify({
                    success: false,
                    error: 'chat_id가 필요합니다. 텔레그램 @Monk_yonga_bot 에서 /start 를 먼저 실행하세요.',
                    bot_link: 'https://t.me/Monk_yonga_bot'
                }), { headers: corsHeaders });
        }

    } catch (error) {
        console.error('Telegram API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers: corsHeaders });
    }
}

// 이미지 전송
async function sendImages(botToken, chatId, images, product, corsHeaders) {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
        const imageData = images[i];
        
        // Base64 이미지를 파일로 전송
        if (imageData.startsWith('data:')) {
            const base64Data = imageData.split(',')[1];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // FormData로 파일 전송
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('photo', new Blob([binaryData], { type: 'image/png' }), `monk_${product}_${i + 1}.png`);
            formData.append('caption', `🎨 MONK AI Photo\n${product} - ${i + 1}번`);
            
            const response = await fetch(`${TELEGRAM_API}${botToken}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            results.push(result);
        }
    }
    
    return new Response(JSON.stringify({
        success: true,
        message: `${results.length}장의 이미지를 전송했습니다`,
        results
    }), { headers: corsHeaders });
}

// 메시지 전송
async function sendMessage(botToken, chatId, message, corsHeaders) {
    const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
    
    const result = await response.json();
    
    return new Response(JSON.stringify({
        success: result.ok,
        result
    }), { headers: corsHeaders });
}

// 인화 주문 알림 (관리자에게)
async function notifyPrintOrder(botToken, orderData, corsHeaders) {
    const { images, product, visitor_id, phone, address } = orderData;
    
    // 관리자 chat_id (환경변수로 설정 필요)
    const adminChatId = '1234567890'; // TODO: 실제 관리자 chat_id로 변경
    
    const message = `
🖨 <b>인화 주문 접수</b>

📦 상품: ${product}
🆔 방문자: ${visitor_id || '미등록'}
📱 연락처: ${phone || '미입력'}
📍 주소: ${address || '미입력'}
🖼 이미지: ${images?.length || 0}장

<i>확인 후 처리해주세요.</i>
    `.trim();
    
    const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: adminChatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
    
    return new Response(JSON.stringify({
        success: true,
        message: '주문이 접수되었습니다'
    }), { headers: corsHeaders });
}

// OPTIONS 요청 처리 (CORS preflight)
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
