// MONK 간편 가입 API (Beta Testing)
// Cloudflare Workers - MVP 버전 (DB 없이 로컬 저장)

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, name } = await request.json();

        // 유효성 검사
        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({
                success: false,
                error: '유효한 이메일 주소를 입력해주세요'
            }), { status: 400, headers: CORS_HEADERS });
        }

        // 사용자 ID 생성 (이메일 해시)
        const userId = 'beta_' + await hashEmail(email);
        const userName = name || '사용자';
        const bonusCredits = 200;

        // DB 저장 시도 (실패해도 계속 진행)
        let dbSaved = false;
        if (env.DB) {
            try {
                // 이메일 중복 확인
                const existing = await env.DB.prepare(
                    'SELECT * FROM shared_users WHERE email = ?'
                ).bind(email).first();

                if (existing) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: '이미 가입된 이메일입니다. 로그인해주세요.'
                    }), { status: 400, headers: CORS_HEADERS });
                }

                // DB에 사용자 저장
                await env.DB.prepare(
                    'INSERT INTO shared_users (id, email, name, provider, provider_id, tier) VALUES (?, ?, ?, ?, ?, ?)'
                ).bind(userId, email, userName, 'email', email, 'beta').run();

                // 베타 참여자 200cr 지급
                await env.DB.prepare(
                    'INSERT INTO shared_credits (user_id, balance) VALUES (?, ?)'
                ).bind(userId, bonusCredits).run();

                // 거래 내역 기록
                await env.DB.prepare(
                    'INSERT INTO shared_credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
                ).bind(userId, bonusCredits, 'bonus', '🎁 베타 참여자 보너스').run();

                dbSaved = true;
            } catch (dbError) {
                console.error('DB save failed, continuing with local:', dbError);
            }
        }

        // 토큰 생성
        const token = await generateToken({
            id: userId,
            email: email,
            name: userName,
            provider: 'email',
            tier: 'beta'
        });

        return new Response(JSON.stringify({
            success: true,
            token: token,
            user: {
                id: userId,
                email: email,
                name: userName,
                provider: 'email',
                tier: 'beta'
            },
            credits: bonusCredits,
            dbSaved: dbSaved,
            message: '베타 참여를 환영합니다! 200 크레딧이 지급되었습니다.'
        }), { headers: CORS_HEADERS });

    } catch (error) {
        console.error('Simple signup error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || '가입 처리 중 오류가 발생했습니다'
        }), { status: 500, headers: CORS_HEADERS });
    }
}

export async function onRequestOptions() {
    return new Response(null, { headers: CORS_HEADERS });
}

// ==================== 유틸리티 ====================

async function hashEmail(email) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 12); // 12자리
}

async function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        tier: user.tier,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7일
    };
    
    // 간단한 토큰 (MVP)
    // TODO: jose 라이브러리로 HS256 서명 추가 (Phase 2)
    const token = btoa(JSON.stringify(payload));
    return token;
}

async function backupBetaUser(userData, env) {
    if (!env.GCS_BUCKET) {
        console.log('GCS backup disabled');
        return;
    }

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `shared/members/${date.substring(0,6)}/${date}_${userData.user_id}.json`;
    const gcsUrl = `https://storage.googleapis.com/upload/storage/v1/b/${env.GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

    try {
        const accessToken = await getGCPAccessToken(env);
        
        const response = await fetch(gcsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...userData,
                backup_source: 'beta_signup',
                backup_time: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`GCS upload failed: ${response.status}`);
        }

        console.log(`✅ Beta user backed up: ${fileName}`);
    } catch (error) {
        console.error('GCS backup error:', error);
        throw error;
    }
}

async function getGCPAccessToken(env) {
    // Placeholder - Phase 2에서 jose로 구현
    // 현재는 GCS 백업 비활성화 상태로 운영
    return 'placeholder_token';
}
