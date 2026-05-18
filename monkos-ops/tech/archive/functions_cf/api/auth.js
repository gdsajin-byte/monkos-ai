// MONK 인증 API - 카카오/구글 OAuth
// Cloudflare Workers

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// 카카오 OAuth URLs
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

// 구글 OAuth URLs
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // 로그인 URL 생성
    if (action === 'login') {
        const provider = url.searchParams.get('provider');
        const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/api/auth?action=callback&provider=${provider}`;
        
        if (provider === 'kakao') {
            // 카카오 준비 중 체크
            if (!env.KAKAO_CLIENT_ID) {
                return redirectWithError(url.origin, '카카오 로그인은 준비 중입니다');
            }
            const authUrl = `${KAKAO_AUTH_URL}?client_id=${env.KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,account_email`;
            return Response.redirect(authUrl, 302);
        }
        
        if (provider === 'google') {
            // 구글 설정 체크
            if (!env.GOOGLE_CLIENT_ID) {
                return redirectWithError(url.origin, '구글 로그인 설정이 필요합니다');
            }
            const authUrl = `${GOOGLE_AUTH_URL}?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline`;
            return Response.redirect(authUrl, 302);
        }
        
        return new Response(JSON.stringify({ error: 'Invalid provider' }), { 
            status: 400, headers: CORS_HEADERS 
        });
    }

    // OAuth 콜백 처리
    if (action === 'callback') {
        const provider = url.searchParams.get('provider');
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
            return redirectWithError(url.origin, error);
        }
        
        if (!code) {
            return redirectWithError(url.origin, 'No authorization code');
        }

        try {
            let userInfo;
            
            if (provider === 'kakao') {
                userInfo = await handleKakaoCallback(code, url, env);
            } else if (provider === 'google') {
                userInfo = await handleGoogleCallback(code, url, env);
            } else {
                return redirectWithError(url.origin, 'Invalid provider');
            }

            // DB에 사용자 저장/업데이트
            const user = await saveUser(env.DB, userInfo);
            
            // 크레딧 초기화 (신규 회원이면)
            const isNewUser = await initCredits(env.DB, user.id);
            
            // GCS 백업 (비동기, 실패해도 가입 프로세스는 계속)
            if (env.GCS_BACKUP_ENABLED === 'true') {
                backupUserToGCS(user, isNewUser, env).catch(err => {
                    console.error('GCS backup failed:', err);
                });
            }
            
            // 세션 토큰 생성 (간단한 JWT 대체)
            const token = await generateToken(user, env);
            
            // 프론트엔드로 리다이렉트 (토큰 전달)
            const successUrl = `${url.origin}/ai_lab/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider
            }))}`;
            
            return Response.redirect(successUrl, 302);
            
        } catch (error) {
            console.error('Auth callback error:', error);
            return redirectWithError(url.origin, error.message);
        }
    }

    // 사용자 정보 조회
    if (action === 'me') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, headers: CORS_HEADERS 
            });
        }
        
        const token = authHeader.split(' ')[1];
        const user = await verifyToken(token, env);
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { 
                status: 401, headers: CORS_HEADERS 
            });
        }
        
        // 크레딧 잔액 조회
        const credits = await getCredits(env.DB, user.id);
        
        return new Response(JSON.stringify({ 
            success: true, 
            user: { ...user, credits } 
        }), { headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
        status: 400, headers: CORS_HEADERS 
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const { action } = body;

    // 로그아웃
    if (action === 'logout') {
        // 클라이언트에서 토큰 삭제하면 됨
        return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
    }

    // 크레딧 사용
    if (action === 'use_credits') {
        const authHeader = request.headers.get('Authorization');
        const user = await verifyTokenFromHeader(authHeader, env);
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, headers: CORS_HEADERS 
            });
        }
        
        const { amount, description, sector } = body;
        const result = await useCredits(env.DB, user.id, amount, description, sector);
        
        return new Response(JSON.stringify(result), { headers: CORS_HEADERS });
    }

    // 크레딧 충전 (결제 완료 후 호출)
    if (action === 'charge_credits') {
        const authHeader = request.headers.get('Authorization');
        const user = await verifyTokenFromHeader(authHeader, env);
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, headers: CORS_HEADERS 
            });
        }
        
        const { amount, paymentId } = body;
        const result = await chargeCredits(env.DB, user.id, amount, paymentId);
        
        return new Response(JSON.stringify(result), { headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
        status: 400, headers: CORS_HEADERS 
    });
}

export async function onRequestOptions() {
    return new Response(null, { headers: CORS_HEADERS });
}

// ==================== 카카오 OAuth ====================
async function handleKakaoCallback(code, url, env) {
    const redirectUri = `${url.origin}/api/auth?action=callback&provider=kakao`;
    
    // 토큰 교환
    const tokenRes = await fetch(KAKAO_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: env.KAKAO_CLIENT_ID,
            redirect_uri: redirectUri,
            code: code,
            ...(env.KAKAO_CLIENT_SECRET && { client_secret: env.KAKAO_CLIENT_SECRET })
        })
    });
    
    if (!tokenRes.ok) {
        const error = await tokenRes.text();
        throw new Error(`Kakao token error: ${error}`);
    }
    
    const tokenData = await tokenRes.json();
    
    // 사용자 정보 조회
    const userRes = await fetch(KAKAO_USER_URL, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    if (!userRes.ok) {
        throw new Error('Failed to get Kakao user info');
    }
    
    const userData = await userRes.json();
    
    return {
        provider: 'kakao',
        providerId: String(userData.id),
        email: userData.kakao_account?.email || null,
        name: userData.kakao_account?.profile?.nickname || userData.properties?.nickname || '카카오 사용자'
    };
}

// ==================== 구글 OAuth ====================
async function handleGoogleCallback(code, url, env) {
    const redirectUri = `${url.origin}/api/auth?action=callback&provider=google`;
    
    // 토큰 교환
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            code: code
        })
    });
    
    if (!tokenRes.ok) {
        const error = await tokenRes.text();
        throw new Error(`Google token error: ${error}`);
    }
    
    const tokenData = await tokenRes.json();
    
    // 사용자 정보 조회
    const userRes = await fetch(GOOGLE_USER_URL, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    if (!userRes.ok) {
        throw new Error('Failed to get Google user info');
    }
    
    const userData = await userRes.json();
    
    return {
        provider: 'google',
        providerId: userData.id,
        email: userData.email,
        name: userData.name || '구글 사용자'
    };
}

// ==================== DB 함수들 ====================
async function saveUser(db, userInfo) {
    const { provider, providerId, email, name } = userInfo;
    const id = `${provider}_${providerId}`;
    
    // 기존 사용자 확인
    const existing = await db.prepare(
        'SELECT * FROM shared_users WHERE id = ?'
    ).bind(id).first();
    
    if (existing) {
        // 업데이트
        await db.prepare(
            'UPDATE shared_users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(name, email, id).run();
        
        return { ...existing, name, email, isNew: false };
    }
    
    // 신규 생성
    await db.prepare(
        'INSERT INTO shared_users (id, email, name, provider, provider_id, tier) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, email, name, provider, providerId, 'free').run();
    
    return { id, email, name, provider, providerId, tier: 'free', isNew: true };
}

async function initCredits(db, userId) {
    const existing = await db.prepare(
        'SELECT * FROM shared_credits WHERE user_id = ?'
    ).bind(userId).first();
    
    if (!existing) {
        // 신규 회원 보너스 크레딧 (AI LAB 전용 200cr)
        const bonusCredits = 200;
        
        await db.prepare(
            'INSERT INTO shared_credits (user_id, balance) VALUES (?, ?)'
        ).bind(userId, bonusCredits).run();
        
        // 거래 내역 기록
        await db.prepare(
            'INSERT INTO shared_credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
        ).bind(userId, bonusCredits, 'bonus', '🎁 신규 회원 가입 보너스 (AI LAB 전체 메뉴 사용 가능)').run();
        
        return true; // 신규 회원
    }
    
    return false; // 기존 회원
}

async function getCredits(db, userId) {
    const result = await db.prepare(
        'SELECT balance FROM shared_credits WHERE user_id = ?'
    ).bind(userId).first();
    
    return result?.balance || 0;
}

async function useCredits(db, userId, amount, description, sector) {
    const current = await getCredits(db, userId);
    
    if (current < amount) {
        return { success: false, error: '크레딧이 부족합니다', balance: current };
    }
    
    const newBalance = current - amount;
    
    await db.prepare(
        'UPDATE shared_credits SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(newBalance, userId).run();
    
    await db.prepare(
        'INSERT INTO shared_credit_transactions (user_id, amount, type, sector, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, -amount, 'use', sector, description).run();
    
    return { success: true, balance: newBalance };
}

async function chargeCredits(db, userId, amount, paymentId) {
    const current = await getCredits(db, userId);
    const newBalance = current + amount;
    
    await db.prepare(
        'UPDATE shared_credits SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(newBalance, userId).run();
    
    await db.prepare(
        'INSERT INTO shared_credit_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, amount, 'charge', '크레딧 충전', paymentId).run();
    
    return { success: true, balance: newBalance };
}

// ==================== 토큰 관리 ====================
async function generateToken(user, env) {
    // 간단한 토큰 생성 (실제로는 JWT 사용 권장)
    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7일
    };
    
    const token = btoa(JSON.stringify(payload));
    return token;
}

async function verifyToken(token, env) {
    try {
        const payload = JSON.parse(atob(token));
        
        if (payload.exp < Date.now()) {
            return null; // 만료됨
        }
        
        return payload;
    } catch {
        return null;
    }
}

async function verifyTokenFromHeader(authHeader, env) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return verifyToken(authHeader.split(' ')[1], env);
}

// ==================== 유틸리티 ====================
function redirectWithError(origin, error) {
    return Response.redirect(
        `${origin}/ai_lab/auth-error.html?error=${encodeURIComponent(error)}`,
        302
    );
}

// ==================== GCS 백업 ====================
async function backupUserToGCS(user, isNewUser, env) {
    if (!env.GCP_PROJECT_ID || !env.GCS_BUCKET) {
        console.log('GCS backup disabled: missing config');
        return;
    }

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = new Date().toISOString();
    
    const backupData = {
        user_id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        tier: user.tier,
        is_new_user: isNewUser,
        created_at: timestamp,
        backup_source: 'cloudflare_workers'
    };

    const fileName = `shared/members/${date.substring(0,6)}/${date}_${user.id}.json`;
    const gcsUrl = `https://storage.googleapis.com/upload/storage/v1/b/${env.GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

    try {
        // GCP Service Account 키로 인증 (환경변수에서)
        const accessToken = await getGCPAccessToken(env);
        
        const response = await fetch(gcsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(backupData)
        });

        if (!response.ok) {
            throw new Error(`GCS upload failed: ${response.status}`);
        }

        console.log(`✅ GCS backup: ${fileName}`);
    } catch (error) {
        console.error('GCS backup error:', error);
        throw error;
    }
}

async function getGCPAccessToken(env) {
    // Service Account 키 파싱
    const serviceAccount = JSON.parse(env.GCP_SERVICE_ACCOUNT_KEY);
    
    // JWT 생성
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/devstorage.read_write',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    // JWT 서명 (Cloudflare Workers에서 Web Crypto API 사용)
    const jwtToken = await signJWT(header, payload, serviceAccount.private_key);
    
    // Access Token 요청
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwtToken
        })
    });

    const data = await response.json();
    return data.access_token;
}

async function signJWT(header, payload, privateKey) {
    // 간단한 JWT 서명 (실제로는 jose 라이브러리 사용 권장)
    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const data = `${headerB64}.${payloadB64}`;
    
    // RSA 서명 (간략화 - 실제 구현 필요)
    // Cloudflare Workers에서는 SubtleCrypto를 사용
    // 여기서는 placeholder
    return `${data}.signature`;
}
