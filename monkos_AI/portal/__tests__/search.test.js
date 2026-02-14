/**
 * CS 지식 검색 로직 테스트
 * searchCsKnowledge 알고리즘 검증
 */

// 검색 함수 (server.js에서 추출)
function searchCsKnowledge(query, cache) {
  const q = query.toLowerCase();
  const scored = cache.map(doc => {
    let score = 0;
    const keywords = doc.keywords || [];
    for (const kw of keywords) {
      if (q.includes(kw.toLowerCase())) score += 10;
    }
    const title = (doc.title || '').toLowerCase();
    const content = (doc.content || '').toLowerCase();
    if (q.split(/\s+/).some(w => title.includes(w))) score += 5;
    if (q.split(/\s+/).some(w => content.includes(w))) score += 2;
    return { ...doc, score };
  });
  return scored.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

// 테스트용 목 데이터
const mockKnowledgeBase = [
  {
    id: 'refund-policy',
    title: '返金ポリシー',
    content: '購入後7日以内かつ未使用の場合、全額返金いたします。',
    keywords: ['返金', '払い戻し', 'refund', '환불']
  },
  {
    id: 'credit-system',
    title: 'クレジットシステム',
    content: '生成1回=1クレジット、ダウンロード=10クレジット消費',
    keywords: ['クレジット', 'credit', '크레딧', 'ポイント']
  },
  {
    id: 'photo-quality',
    title: '写真品質の改善',
    content: '正面を向いて、明るい照明の下で撮影してください。',
    keywords: ['品質', '画質', 'quality', '품질']
  },
  {
    id: 'login-issue',
    title: 'ログインできない場合',
    content: 'Googleアカウントでのログインのみ対応しています。',
    keywords: ['ログイン', 'login', '로그인', 'Google']
  }
];

describe('searchCsKnowledge', () => {
  test('키워드 매칭으로 검색', () => {
    const results = searchCsKnowledge('환불', mockKnowledgeBase);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('refund-policy');
    expect(results[0].score).toBeGreaterThanOrEqual(10); // 키워드 매칭 점수
  });

  test('제목 매칭으로 검색', () => {
    const results = searchCsKnowledge('返金', mockKnowledgeBase);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('refund-policy');
  });

  test('영어 키워드로 검색', () => {
    const results = searchCsKnowledge('refund policy', mockKnowledgeBase);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('refund-policy');
  });

  test('크레딧 관련 검색', () => {
    const results = searchCsKnowledge('크레딧 충전', mockKnowledgeBase);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('credit-system');
  });

  test('로그인 문제 검색', () => {
    const results = searchCsKnowledge('로그인이 안 돼요', mockKnowledgeBase);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('login-issue');
  });

  test('관련 없는 검색어 → 빈 결과', () => {
    const results = searchCsKnowledge('날씨가 좋네요', mockKnowledgeBase);

    expect(results.length).toBe(0);
  });

  test('최대 3개 결과 반환', () => {
    // 모든 문서에 매칭되는 검색어
    const results = searchCsKnowledge('credit 크레딧', mockKnowledgeBase);

    expect(results.length).toBeLessThanOrEqual(3);
  });

  test('점수 순 정렬', () => {
    const results = searchCsKnowledge('返金 refund 환불', mockKnowledgeBase);

    // 첫 번째 결과가 가장 높은 점수
    if (results.length > 1) {
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    }
  });

  test('대소문자 무시', () => {
    const resultsLower = searchCsKnowledge('refund', mockKnowledgeBase);
    const resultsUpper = searchCsKnowledge('REFUND', mockKnowledgeBase);

    expect(resultsLower[0]?.id).toBe(resultsUpper[0]?.id);
  });

  test('빈 캐시 → 빈 결과', () => {
    const results = searchCsKnowledge('환불', []);

    expect(results.length).toBe(0);
  });
});
