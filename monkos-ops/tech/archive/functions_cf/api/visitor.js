/**
 * MONK Visitor API
 * 방문자 정보 수집 및 관리
 * 
 * POST /api/visitor - 신규 방문자 등록
 * GET /api/visitor?id=xxx - 방문자 조회
 * PUT /api/visitor - 방문자 정보 업데이트
 */

export async function onRequestPost(context) {
    const { request, env } = context;
    
    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    try {
        const data = await request.json();
        
        // 필수 필드 검증
        if (!data.visitor_id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'visitor_id is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // IP 주소 (해시 처리 권장)
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || '';
        const referrer = request.headers.get('Referer') || '';
        
        // D1 INSERT (UPSERT)
        const result = await env.DB.prepare(`
            INSERT INTO shared_visitors (
                visitor_id, country, gender, age_group, job, purpose,
                name, phone, email, privacy_consent, marketing_consent,
                user_agent, ip_address, referrer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(visitor_id) DO UPDATE SET
                country = excluded.country,
                gender = excluded.gender,
                age_group = excluded.age_group,
                job = excluded.job,
                purpose = excluded.purpose,
                name = excluded.name,
                phone = excluded.phone,
                email = excluded.email,
                privacy_consent = excluded.privacy_consent,
                marketing_consent = excluded.marketing_consent,
                last_visit = CURRENT_TIMESTAMP
        `).bind(
            data.visitor_id,
            data.country || 'KR',
            data.gender || null,
            data.age_group || null,
            data.job || null,
            data.purpose || null,
            data.name || null,
            data.phone || null,
            data.email || null,
            data.privacy_consent ? 1 : 0,
            data.marketing_consent ? 1 : 0,
            userAgent,
            ip,
            referrer
        ).run();
        
        return new Response(JSON.stringify({
            success: true,
            visitor_id: data.visitor_id,
            message: 'Visitor registered successfully'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Visitor API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const visitorId = url.searchParams.get('id');
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    try {
        if (visitorId) {
            // 특정 방문자 조회
            const visitor = await env.DB.prepare(`
                SELECT * FROM shared_visitors WHERE visitor_id = ?
            `).bind(visitorId).first();
            
            return new Response(JSON.stringify({
                success: true,
                visitor
            }), { headers: corsHeaders });
        } else {
            // 통계 조회
            const stats = await env.DB.prepare(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN gender = 'M' THEN 1 END) as male,
                    COUNT(CASE WHEN gender = 'F' THEN 1 END) as female,
                    COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today
                FROM shared_visitors
            `).first();
            
            return new Response(JSON.stringify({
                success: true,
                stats
            }), { headers: corsHeaders });
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
