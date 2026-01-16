// MONK 텔레그램 봇 Webhook - @Monk_yonga_bot
// /start 명령 처리 및 chat_id 연동

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const botToken = env.TELEGRAM_BOT_TOKEN;
        const update = await request.json();
        
        console.log('Telegram Update:', JSON.stringify(update));
        
        // 메시지 확인
        const message = update.message;
        if (!message) {
            return new Response('OK');
        }
        
        const chatId = message.chat.id;
        const text = message.text || '';
        const userId = message.from.id;
        const userName = message.from.first_name || '고객';
        
        // /start 명령 처리
        if (text.startsWith('/start')) {
            const param = text.split(' ')[1] || '';
            
            // 환영 메시지
            const welcomeMsg = `
🎨 <b>MONK AI Photo에 오신 것을 환영합니다!</b>

안녕하세요, ${userName}님! 👋

저는 MONK AI 사진관의 봇 <b>용아</b>입니다.
AI로 생성된 사진을 이곳으로 전송해드릴게요.

📱 <b>사용 방법</b>
1. monk.kr/ai_lab 에서 사진 촬영
2. AI 사진 생성
3. "텔레그램으로 받기" 클릭
4. 여기서 이미지 수신!

🔗 <b>연동 코드</b>: <code>${chatId}</code>
(웹사이트에서 입력하세요)

문의: @monkstudio
            `.trim();
            
            await sendTelegramMessage(botToken, chatId, welcomeMsg);
            
            // visitor_id가 있으면 연동 정보 저장 (D1)
            if (param.startsWith('photo_') && env.DB) {
                const visitorId = param.replace('photo_', '');
                try {
                    await env.DB.prepare(`
                        UPDATE shared_visitors 
                        SET telegram_chat_id = ? 
                        WHERE visitor_id = ?
                    `).bind(chatId, visitorId).run();
                } catch (e) {
                    console.log('DB update skipped:', e.message);
                }
            }
        }
        
        // /help 명령
        else if (text === '/help') {
            const helpMsg = `
📖 <b>도움말</b>

<b>명령어</b>
/start - 봇 시작 및 연동
/help - 도움말
/myid - 내 Chat ID 확인

<b>기능</b>
• AI 증명사진 수신
• AI 프로필 사진 수신
• 인화 주문 알림

🌐 웹사이트: monk.kr
📱 문의: @monkstudio
            `.trim();
            
            await sendTelegramMessage(botToken, chatId, helpMsg);
        }
        
        // /myid 명령
        else if (text === '/myid') {
            await sendTelegramMessage(botToken, chatId, 
                `🆔 <b>Chat ID</b>: <code>${chatId}</code>\n\n웹사이트에서 이 코드를 입력하면 사진을 받을 수 있어요!`
            );
        }
        
        // 일반 메시지
        else if (text && !text.startsWith('/')) {
            await sendTelegramMessage(botToken, chatId,
                `안녕하세요! 저는 MONK AI 봇입니다. 🤖\n\n/help 를 입력하면 사용법을 알려드릴게요.`
            );
        }
        
        return new Response('OK');
        
    } catch (error) {
        console.error('Webhook Error:', error);
        return new Response('OK'); // 텔레그램은 항상 200 응답 필요
    }
}

// 텔레그램 메시지 전송
async function sendTelegramMessage(botToken, chatId, text) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    });
    return response.json();
}

// GET 요청 (Webhook 확인용)
export async function onRequestGet() {
    return new Response(JSON.stringify({
        status: 'ok',
        bot: '@Monk_yonga_bot',
        service: 'MONK AI Photo Telegram Bot'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
