/**
 * GitHub Issues 자동 게시 — SPREAD 배포 인프라
 * 블로그 발행 시 EN 번역본을 GitHub Issue로 자동 생성/갱신
 *
 * 환경변수:
 *   GITHUB_TOKEN — GitHub PAT (repo, issues 권한)
 *   GITHUB_REPO  — owner/repo (기본: gdsajin-byte/monkos-ai)
 */
import { firestore, log, GITHUB_TOKEN, GITHUB_REPO } from '../shared/config.js';

const GITHUB_API = 'https://api.github.com';
const GITHUB_HEADERS = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
};

function buildIssueBody(enPost, canonicalUrl) {
  return `${enPost.content}

---

> Originally published on [MONKOS AI Blog](${canonicalUrl})
>
> *Auto-published via SPREAD — Strategic Publishing, Reach, Engagement, And Distribution*`;
}

async function findEnTranslation(originalSlug) {
  const blogCollection = firestore.collection('blog_posts');
  const baseSlug = originalSlug.replace(/-(kr|ja|en)$/, '');

  // 1) originalSlug 필드로 검색 (new schema: baseSlug, legacy: full slug)
  for (const query of [baseSlug, originalSlug]) {
    const snapshot = await blogCollection
      .where('originalSlug', '==', query)
      .where('lang', '==', 'en')
      .limit(1)
      .get();
    if (!snapshot.empty) return snapshot.docs[0].data();
  }

  // 2) {base}-en 직접 조회
  const directDoc = await blogCollection.doc(`${baseSlug}-en`).get();
  if (directDoc.exists) return directDoc.data();

  return null;
}

async function createIssue(owner, repo, title, body, labels) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: GITHUB_HEADERS,
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function updateIssue(owner, repo, issueNumber, title, body, labels) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`, {
    method: 'PATCH',
    headers: GITHUB_HEADERS,
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * 블로그 EN 번역본을 GitHub Issue로 게시
 * translateAndSaveBlogPost() 완료 후 호출 (체이닝)
 */
export async function publishBlogToGitHub(originalSlug) {
  if (!GITHUB_TOKEN) {
    log('[SPREAD] GitHub Issues 비활성 — GITHUB_TOKEN 미설정', 'WARN');
    return null;
  }

  try {
    // 카테고리 필터: AI 카테고리만 GitHub Issue 등록
    let originalDoc = await firestore.collection('blog_posts').doc(originalSlug).get();
    if (!originalDoc.exists) {
      const baseSlug = originalSlug.replace(/-(kr|ja|en)$/, '');
      originalDoc = await firestore.collection('blog_posts').doc(`${baseSlug}-kr`).get();
    }
    const originalData = originalDoc.exists ? originalDoc.data() : {};
    const category = (originalData.category || '').toLowerCase();
    if (category !== 'ai') {
      log(`[SPREAD] GitHub Issue 스킵 — AI 카테고리 아님: ${originalSlug} (${category || '미설정'})`, 'INFO');
      return null;
    }

    const enPost = await findEnTranslation(originalSlug);
    if (!enPost) {
      log(`[SPREAD] GitHub Issue 스킵 — EN 번역본 없음: ${originalSlug}`, 'WARN');
      return null;
    }

    const [owner, repo] = GITHUB_REPO.split('/');
    const canonicalUrl = `https://monkos.ai/en/blog/${enPost.slug}`;
    const issueBody = buildIssueBody(enPost, canonicalUrl);
    const labels = ['blog', ...(enPost.tags || []).slice(0, 5)];

    const blogCollection = firestore.collection('blog_posts');
    let issue;

    if (enPost.githubIssueNumber) {
      // 기존 Issue 업데이트
      issue = await updateIssue(owner, repo, enPost.githubIssueNumber, enPost.title, issueBody, labels);
      log(`[SPREAD] GitHub Issue 갱신: #${issue.number} — ${enPost.title}`);
    } else {
      // 신규 Issue 생성
      issue = await createIssue(owner, repo, enPost.title, issueBody, labels);

      // Firestore에 게시 기록
      await blogCollection.doc(enPost.slug).update({
        githubIssueUrl: issue.html_url,
        githubIssueNumber: issue.number,
        spreadPublishedAt: new Date().toISOString(),
      });
      log(`[SPREAD] GitHub Issue 생성: #${issue.number} — ${enPost.title}`);
    }

    return issue;
  } catch (err) {
    log(`[SPREAD] GitHub Issue 게시 실패: ${err.message}`, 'ERROR');
    return null;
  }
}
