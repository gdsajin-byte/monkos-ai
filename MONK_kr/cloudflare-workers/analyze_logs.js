/**
 * MONK.KR 주간 로그 분석 스크립트
 * D1 데이터베이스의 chat_logs를 분석하여 인사이트 생성
 * 
 * 사용법: node analyze_logs.js
 * 또는: wrangler tail --format pretty
 */

const ANALYSIS_PROMPT = `
당신은 MONK.KR의 AI 품질 분석가입니다. 
다음 대화 로그 데이터를 분석하여 다음 항목에 대한 인사이트를 제공하세요:

1. **자주 묻는 질문 TOP 5**: 어떤 질문이 가장 많았나요?
2. **답변 품질 이슈**: 어떤 답변에서 사용자가 불만족했나요?
3. **지식 공백**: AI가 답변하지 못한 부분은 무엇인가요?
4. **개선 제안**: 다음 주에 무엇을 보완해야 하나요?

분석은 간결하고 실행 가능하게 작성하세요.

--- 데이터 ---
`;

/**
 * Cloudflare Workers에서 주간 분석 실행
 */
export async function analyzeWeeklyLogs(env) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // D1에서 주간 데이터 조회
    const logs = await env.MONK_SERVICES_DB.prepare(`
        SELECT 
            user_message,
            ai_response,
            room_id,
            created_at,
            feedback
        FROM chat_logs
        WHERE created_at >= ?
        ORDER BY created_at DESC
        LIMIT 1000
    `).bind(oneWeekAgo).all();

    if (!logs.results || logs.results.length === 0) {
        return {
            status: 'no_data',
            message: '분석할 로그가 없습니다.'
        };
    }

    // 통계 계산
    const stats = calculateStats(logs.results);
    
    // Claude API를 사용한 인사이트 생성 (옵션)
    // const insights = await generateInsights(logs.results, env);

    // D1에 분석 결과 저장
    await saveAnalysis(env, stats);

    return {
        status: 'success',
        stats: stats,
        period: `${oneWeekAgo.split('T')[0]} ~ ${new Date().toISOString().split('T')[0]}`
    };
}

/**
 * 통계 계산
 */
function calculateStats(logs) {
    const totalMessages = logs.length;
    const roomStats = {};
    const questionFrequency = {};
    const feedbackStats = { like: 0, dislike: 0, neutral: 0 };

    logs.forEach(log => {
        // 룸별 통계
        if (!roomStats[log.room_id]) {
            roomStats[log.room_id] = 0;
        }
        roomStats[log.room_id]++;

        // 질문 빈도 (간단한 키워드 추출)
        const keywords = extractKeywords(log.user_message);
        keywords.forEach(keyword => {
            questionFrequency[keyword] = (questionFrequency[keyword] || 0) + 1;
        });

        // 피드백 통계
        if (log.feedback) {
            feedbackStats[log.feedback] = (feedbackStats[log.feedback] || 0) + 1;
        }
    });

    // TOP 5 질문 키워드
    const top5Questions = Object.entries(questionFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

    // 만족도 계산
    const totalFeedback = feedbackStats.like + feedbackStats.dislike;
    const satisfactionRate = totalFeedback > 0 
        ? Math.round((feedbackStats.like / totalFeedback) * 100) 
        : 0;

    return {
        totalMessages,
        roomStats,
        top5Questions,
        feedbackStats,
        satisfactionRate,
        timestamp: new Date().toISOString()
    };
}

/**
 * 키워드 추출 (간단한 버전)
 */
function extractKeywords(message) {
    const keywords = [];
    const text = message.toLowerCase();
    
    // MONK 관련 키워드
    const monkKeywords = {
        '증명사진': ['증명사진', '여권사진', 'id'],
        '프로필': ['프로필', '프사', '증명'],
        '가족사진': ['가족', '단체', '그룹'],
        '영업시간': ['영업', '시간', '언제', '몇시'],
        '예약': ['예약', '방문', '가능'],
        '가격': ['가격', '비용', '얼마'],
        'AI LAB': ['ai', 'lab', '인공지능'],
        '소소': ['소소', 'soso', '이미지'],
        '민아': ['민아', 'mina', '모델'],
        '용아': ['용아', 'yonga', '전략'],
        '쌍아': ['쌍아', 'ssanga', '챗봇']
    };

    for (const [category, patterns] of Object.entries(monkKeywords)) {
        if (patterns.some(pattern => text.includes(pattern))) {
            keywords.push(category);
        }
    }

    return keywords;
}

/**
 * 분석 결과 저장
 */
async function saveAnalysis(env, stats) {
    await env.MONK_SERVICES_DB.prepare(`
        INSERT INTO learning_insights (
            insight_type,
            insight_data,
            created_at
        ) VALUES (?, ?, ?)
    `).bind(
        'weekly_stats',
        JSON.stringify(stats),
        new Date().toISOString()
    ).run();
}

/**
 * Markdown 리포트 생성
 */
function generateMarkdownReport(stats, period) {
    return `# MONK.KR AI 주간 분석 리포트

**분석 기간**: ${period}
**생성 시간**: ${new Date().toISOString().replace('T', ' ').split('.')[0]}

---

## 📊 전체 통계

- **총 대화 수**: ${stats.totalMessages}건
- **만족도**: ${stats.satisfactionRate}% (👍 ${stats.feedbackStats.like} / 👎 ${stats.feedbackStats.dislike})

---

## 🏆 룸별 활동

${Object.entries(stats.roomStats)
    .sort((a, b) => b[1] - a[1])
    .map(([room, count]) => `- **${room}**: ${count}건`)
    .join('\n')}

---

## 🔥 TOP 5 질문 주제

${stats.top5Questions
    .map((item, index) => `${index + 1}. **${item.keyword}**: ${item.count}회`)
    .join('\n')}

---

## 💡 인사이트 및 개선 제안

### 긍정적인 점
- 사용자들이 활발히 대화에 참여하고 있습니다.
- 만족도가 ${stats.satisfactionRate >= 70 ? '양호' : '개선 필요'}합니다.

### 개선이 필요한 점
${stats.satisfactionRate < 70 
    ? '- 답변 품질 개선이 필요합니다. 특히 불만족 답변을 재검토하세요.'
    : '- 현재 수준을 유지하면서 더 많은 지식을 추가하세요.'
}

### 다음 주 액션 아이템
1. TOP 5 질문 주제에 대한 지식 보강
2. 낮은 만족도를 받은 답변 분석 및 개선
3. 새로운 FAQ 항목 추가 고려

---

**생성**: MONK.KR Analytics Engine
**문의**: gdsajin@gmail.com
`;
}

// CLI에서 직접 실행 시 (로컬 테스트용)
if (typeof module !== 'undefined' && require.main === module) {
    console.log('⚠️  이 스크립트는 Cloudflare Workers 환경에서 실행되어야 합니다.');
    console.log('💡 다음 명령어로 배포 후 실행하세요:');
    console.log('   npx wrangler publish');
    console.log('   curl -X POST https://monk-chatbot.gdsajin.workers.dev/analyze');
}

// Workers 환경에서 실행을 위한 Export
export default {
    async fetch(request, env) {
        // /analyze 엔드포인트 추가
        const url = new URL(request.url);
        
        if (url.pathname === '/analyze' && request.method === 'POST') {
            try {
                const result = await analyzeWeeklyLogs(env);
                const report = generateMarkdownReport(result.stats, result.period);
                
                // R2에 리포트 저장
                const reportKey = `weekly_reports/${new Date().toISOString().split('T')[0]}_report.md`;
                await env.MONK_CHAT_LOGS.put(reportKey, report);
                
                return new Response(JSON.stringify({
                    success: true,
                    report: report,
                    stats: result.stats,
                    report_url: `https://monk-chat-logs.r2.dev/${reportKey}`
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
                
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        return new Response('Use POST /analyze to generate weekly report', {
            status: 404
        });
    }
};
