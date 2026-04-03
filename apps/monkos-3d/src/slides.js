/**
 * 디딤돌 대면평가 슬라이드 12장 + TTS 대본 + 몽코스 액션 싱크
 *
 * 정본: monkos-ops/ops/drafts/DRAFT_20260403_디딤돌_대면평가_대본_슬라이드싱크.md
 *
 * 색상 가이드:
 *   배경 #0a0a0a, 텍스트 #fff, 강조 #a78bfa
 *   유형1(오독) #ef4444, 유형2(기술) #f59e0b, 유형3(범위) #3b82f6
 */

// 몽코스 액션 타입
export const ACTION = {
  NONE: 'none',
  BOUNCE: 'bounce',
  LOOK: 'look',       // 슬라이드 쪽 시선
  POINT: 'point',     // 슬라이드 쪽 가리키기
  FRONT: 'front',     // 정면 응시
  ROAM: 'roam',       // 좌우 이동 + 바운스
  PAUSE: 'pause',     // 잠깐 멈춤
};

const SLIDES = [
  // ────────────────────────────────────────────
  // S1. 표지
  // ────────────────────────────────────────────
  {
    html: `
      <div style="text-align:center; padding:40px 0;">
        <p style="color:#6d5faa; font-size:1.4rem; margin-bottom:8px;">이의신청 대면평가</p>
        <h2 style="color:#a78bfa; font-size:4rem; line-height:1.4; margin-bottom:24px;">
          K-뷰티 AI 기반<br>증명사진 토털 솔루션
        </h2>
        <div style="width:60px; height:2px; background:#a78bfa; margin:0 auto 24px;"></div>
        <p style="color:#c4b5fd; font-size:2rem;">몽크사진관</p>
        <p style="color:#8b7fbd; font-size:1.6rem; margin-top:4px;">연구책임자 신정규</p>
      </div>
    `,
    scripts: [
      "안녕하십니까. 몽크사진관 대표 신정규입니다.",
      "본 소명은 서면평가 의견 8건에 대한 이의입니다.",
      "재평가 보완이 아닌, 해석 오류의 지적임을 먼저 말씀드립니다.",
    ],
    actions: [ACTION.BOUNCE, ACTION.FRONT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S2. 3류 분류표
  // ────────────────────────────────────────────
  {
    html: `
      <h2 style="color:#a78bfa; font-size:3rem; margin-bottom:20px;">8건 지적 → 3개 오류 유형 분류</h2>
      <table style="width:100%; border-collapse:collapse; font-size:1.6rem;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="text-align:left; padding:10px; color:#888;">유형</th>
            <th style="text-align:left; padding:10px; color:#888;">내용</th>
            <th style="text-align:center; padding:10px; color:#888;">건수</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:12px; color:#ef4444; font-weight:700;">유형1</td>
            <td style="padding:12px; color:#fca5a5;">과제 자체 오독 (①③)</td>
            <td style="padding:12px; text-align:center; color:#ef4444; font-weight:700;">2건</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:12px; color:#f59e0b; font-weight:700;">유형2</td>
            <td style="padding:12px; color:#fcd34d;">기술 구조 오독 (②④⑥⑦)</td>
            <td style="padding:12px; text-align:center; color:#f59e0b; font-weight:700;">4건</td>
          </tr>
          <tr>
            <td style="padding:12px; color:#3b82f6; font-weight:700;">유형3</td>
            <td style="padding:12px; color:#93c5fd;">평가 범위 초과 (⑤⑧)</td>
            <td style="padding:12px; text-align:center; color:#3b82f6; font-weight:700;">2건</td>
          </tr>
        </tbody>
      </table>
    `,
    scripts: [
      "8건 지적을 분석한 결과, 세 가지 유형으로 분류됩니다.",
      "첫째, 제안서에 없는 내용을 지적한 경우가 2건.",
      "둘째, 기술 구조를 잘못 이해한 경우가 4건.",
      "셋째, R&D 평가 범위를 넘는 판단이 2건입니다.",
      "순서대로 말씀드리겠습니다.",
    ],
    actions: [ACTION.LOOK, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S3. "발색" 오독
  // ────────────────────────────────────────────
  {
    html: `
      <div style="border-left:3px solid #ef4444; padding-left:16px; margin-bottom:20px;">
        <span style="color:#ef4444; font-size:1.1rem; font-weight:700;">유형1 — 과제 오독 ①</span>
      </div>
      <h2 style="color:#fff; font-size:3rem; margin-bottom:20px;">"발색 수치 구현 정확성 미흡"</h2>
      <div style="display:flex; gap:20px; margin-bottom:20px;">
        <div style="flex:1; background:#1a1a2e; border-radius:8px; padding:16px;">
          <p style="color:#888; font-size:1.1rem; margin-bottom:8px;">평가 의견 원문</p>
          <p style="color:#fca5a5; font-size:1.4rem; line-height:1.6;">"발색 수치 구현의 정확성을 검증하는 구체적 방안이 미흡"</p>
        </div>
        <div style="flex:1; background:#1a1a2e; border-radius:8px; padding:16px;">
          <p style="color:#888; font-size:1.1rem; margin-bottom:8px;">제안서 1-1항</p>
          <p style="color:#a5f3a5; font-size:1.4rem; line-height:1.6;">"인물 정체성 유지율 90% 달성"이 핵심 과제</p>
        </div>
      </div>
      <div style="background:#1a1a2e; border-radius:8px; padding:12px 16px; text-align:center;">
        <span style="color:#ef4444; font-size:1.8rem; font-weight:700;">Ctrl+F "발색" → 0건</span>
      </div>
    `,
    scripts: [
      "지적 1번, '발색 수치 구현 정확성이 미흡하다.'",
      "제안서 1-1항입니다. '발색'이라는 단어가 한 번도 기재되지 않았습니다.",
      "핵심 연구과제는 '인물 정체성 유지율 90% 달성'입니다.",
      "K-뷰티를 화장품 발색으로 전제하신 것은 과제에 대한 오독입니다.",
    ],
    actions: [ACTION.LOOK, ACTION.POINT, ACTION.FRONT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S4. "편향" 오독
  // ────────────────────────────────────────────
  {
    html: `
      <div style="border-left:3px solid #ef4444; padding-left:16px; margin-bottom:20px;">
        <span style="color:#ef4444; font-size:1.1rem; font-weight:700;">유형1 — 과제 오독 ③</span>
      </div>
      <h2 style="color:#fff; font-size:3rem; margin-bottom:20px;">"전문가 편향 우려"</h2>
      <div style="background:#1a1a2e; border-radius:8px; padding:16px; margin-bottom:16px;">
        <p style="color:#888; font-size:1.1rem; margin-bottom:8px;">RLHF — 인간 피드백 강화학습</p>
        <p style="color:#c4b5fd; font-size:1.6rem; line-height:1.6;">
          GPT, Gemini, Claude 등 <span style="color:#a78bfa; font-weight:700;">글로벌 AI의 표준 방법론</span>
        </p>
      </div>
      <div style="background:#1a1a2e; border-radius:8px; padding:16px;">
        <p style="color:#fca5a5; font-size:1.4rem; line-height:1.6; margin-bottom:8px;">
          뷰티에 "절대적 정답"이 없으므로 → 편향 판단 기준 자체가 부재
        </p>
        <p style="color:#a78bfa; font-size:1.8rem; font-weight:700; margin-top:12px;">
          K-뷰티 = 서구 중심 AI의 편향을 한국적 감성으로 교정하는 연구
        </p>
      </div>
    `,
    scripts: [
      "지적 3번, '전문가 편향 우려'입니다.",
      "RLHF, 인간 피드백 강화학습은 GPT, Gemini 등 글로벌 AI의 표준 방법론입니다.",
      "뷰티에 절대적 정답이 없으므로 '편향'의 판단 기준 자체가 부재합니다.",
      "K-뷰티는 서구 중심 AI의 편향을 한국적 감성으로 교정하겠다는 연구 목적의 표현입니다.",
    ],
    actions: [ACTION.LOOK, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S5. GPU 오독
  // ────────────────────────────────────────────
  {
    html: `
      <div style="border-left:3px solid #f59e0b; padding-left:16px; margin-bottom:20px;">
        <span style="color:#f59e0b; font-size:1.1rem; font-weight:700;">유형2 — 기술 오독 ②</span>
      </div>
      <h2 style="color:#fff; font-size:3rem; margin-bottom:20px;">"GPU 처리 속도 방안 부족"</h2>
      <div style="display:flex; gap:16px;">
        <div style="flex:1; background:#0f2b1a; border:1px solid #22c55e44; border-radius:8px; padding:16px;">
          <p style="color:#22c55e; font-size:1.2rem; font-weight:700; margin-bottom:8px;">트랙 1: 클라우드 API</p>
          <p style="color:#a7f3d0; font-size:1.4rem;">프로덕션 서비스</p>
          <p style="color:#6ee7b7; font-size:1.1rem; margin-top:8px;">(사용자 요청 처리)</p>
        </div>
        <div style="flex:1; background:#0f1b2b; border:1px solid #3b82f644; border-radius:8px; padding:16px;">
          <p style="color:#3b82f6; font-size:1.2rem; font-weight:700; margin-bottom:8px;">트랙 2: 로컬 GPU</p>
          <p style="color:#93c5fd; font-size:1.4rem;">모델 적재 · 파인튜닝 · MLOps</p>
          <p style="color:#60a5fa; font-size:1.1rem; margin-top:8px;">(연구장비)</p>
        </div>
      </div>
      <p style="color:#f59e0b; font-size:1.6rem; font-weight:700; margin-top:20px; text-align:center;">
        클라우드 = 프로덕션, GPU = R&D → API 의존율 50% 목표의 핵심
      </p>
    `,
    scripts: [
      "지적 2번, 'GPU 처리 속도 방안 부족'입니다.",
      "평가자께서는 GPU를 서비스 서버로 전제하셨습니다.",
      "실제 GPU의 목적은 자체 모델 적재와 파인튜닝을 위한 연구장비입니다.",
      "클라우드는 프로덕션, GPU는 R&D. 이 병렬 구조가 API 의존율 50% 목표의 핵심입니다.",
      "연구장비를 서비스 서버로 오독하신 겁니다.",
    ],
    actions: [ACTION.LOOK, ACTION.FRONT, ACTION.POINT, ACTION.POINT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S6. 차별성 + 빅테크
  // ────────────────────────────────────────────
  {
    html: `
      <div style="border-left:3px solid #f59e0b; padding-left:16px; margin-bottom:20px;">
        <span style="color:#f59e0b; font-size:1.1rem; font-weight:700;">유형2 — 기술 오독 ④⑥</span>
      </div>
      <h2 style="color:#fff; font-size:2.5rem; margin-bottom:16px;">차별성 + 빅테크 경쟁력</h2>
      <table style="width:100%; border-collapse:collapse; font-size:1.4rem; margin-bottom:16px;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="text-align:left; padding:8px; color:#888;">평가자 경쟁사</th>
            <th style="text-align:left; padding:8px; color:#888;">실제 영역</th>
            <th style="text-align:center; padding:8px; color:#888;">비교</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#fcd34d;">Adobe Firefly</td>
            <td style="padding:10px; color:#999;">크리에이티브 도구</td>
            <td style="padding:10px; text-align:center; color:#ef4444;">&#10008;</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#fcd34d;">Runway</td>
            <td style="padding:10px; color:#999;">영상 생성</td>
            <td style="padding:10px; text-align:center; color:#ef4444;">&#10008;</td>
          </tr>
          <tr>
            <td style="padding:10px; color:#fcd34d;">Stitch Fix</td>
            <td style="padding:10px; color:#999;">의류 추천</td>
            <td style="padding:10px; text-align:center; color:#ef4444;">&#10008;</td>
          </tr>
        </tbody>
      </table>
      <p style="color:#f59e0b; font-size:1.4rem; font-weight:700;">시장·고객·가치제안 전부 불일치 → 범주 오류</p>
      <p style="color:#888; font-size:1.2rem; margin-top:12px;">빅테크 API로 서비스하는 것은 글로벌 표준</p>
    `,
    scripts: [
      "지적 4번과 6번은 같은 오해에서 파생됩니다.",
      "먼저, 자가 진화 파이프라인은 '차별점'이 아니라 모든 AI 서비스의 기본 동력입니다.",
      "그리고 경쟁사 비교입니다.",
      "Adobe Firefly는 크리에이티브 도구, Runway는 영상 생성, Stitch Fix는 의류 추천 서비스입니다.",
      "세 기업 모두 저희와 시장, 고객, 가치제안이 겹치지 않습니다. 범주 오류입니다.",
      "빅테크는 엔진 공급자이지 경쟁자가 아닙니다.",
      "이 논리대로라면, 빅테크가 못하는 것만 개발해야 디딤돌을 통과할 수 있습니다.",
    ],
    actions: [ACTION.FRONT, ACTION.FRONT, ACTION.LOOK, ACTION.POINT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S7. 비용 해소
  // ────────────────────────────────────────────
  {
    html: `
      <div style="border-left:3px solid #f59e0b; padding-left:16px; margin-bottom:20px;">
        <span style="color:#f59e0b; font-size:1.1rem; font-weight:700;">유형2 — 기술 오독 ⑦</span>
      </div>
      <h2 style="color:#fff; font-size:3rem; margin-bottom:20px;">"비용 모순 해소 안 됨"</h2>
      <div style="display:flex; gap:12px; margin-bottom:20px;">
        <div style="flex:1; background:#1a1a2e; border-radius:8px; padding:12px; text-align:center;">
          <p style="color:#888; font-size:1rem;">25.12</p>
          <p style="color:#999; font-size:1.4rem; margin-top:4px;">1024×1024</p>
          <p style="color:#666; font-size:1rem; margin-top:4px;">독자 업스케일 필요</p>
        </div>
        <div style="color:#a78bfa; font-size:3.5rem; display:flex; align-items:center;">→</div>
        <div style="flex:1; background:#1a2e1a; border:1px solid #22c55e44; border-radius:8px; padding:12px; text-align:center;">
          <p style="color:#22c55e; font-size:1rem;">26.03</p>
          <p style="color:#a7f3d0; font-size:1.4rem; margin-top:4px;">엔진 자체 해결</p>
          <p style="color:#6ee7b7; font-size:1rem; margin-top:4px;">멀티모듈 업스케일</p>
        </div>
      </div>
      <div style="display:flex; gap:20px; justify-content:center; margin-top:16px;">
        <div style="text-align:center;">
          <p style="color:#888; font-size:1.1rem;">1회 원가</p>
          <p style="color:#22c55e; font-size:5rem; font-weight:900;">$0.04</p>
        </div>
        <div style="text-align:center;">
          <p style="color:#888; font-size:1.1rem;">판매가</p>
          <p style="color:#a78bfa; font-size:5rem; font-weight:900;">$10</p>
        </div>
        <div style="text-align:center;">
          <p style="color:#888; font-size:1.1rem;">마진</p>
          <p style="color:#fcd34d; font-size:5rem; font-weight:900;">99.6%</p>
        </div>
      </div>
    `,
    scripts: [
      "지적 7번, 유일하게 '미흡함'을 받은 가장 부정적 평가입니다.",
      "제안서 작성 시점, AI 출력은 1024곱하기1024에 머물렀습니다.",
      "그래서 독자적 9그리드 프로세스를 연구 계획에 넣었습니다.",
      "3개월 후, AI 엔진 자체가 이 문제를 해결했습니다.",
      "현재 실측입니다.",
      "원가 4센트, 판매가 10달러. 모순이 아니라, 기술 진화가 문제를 해소한 사례입니다.",
    ],
    actions: [ACTION.FRONT, ACTION.LOOK, ACTION.LOOK, ACTION.FRONT, ACTION.POINT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S8. 범위 초과
  // ────────────────────────────────────────────
  {
    html: `
      <div style="border-left:3px solid #3b82f6; padding-left:16px; margin-bottom:20px;">
        <span style="color:#3b82f6; font-size:1.1rem; font-weight:700;">유형3 — 평가 범위 초과 ⑤⑧</span>
      </div>
      <div style="margin-bottom:24px;">
        <h2 style="color:#fff; font-size:2.5rem; margin-bottom:12px;">지적 ⑤ — 크롤링 저작권</h2>
        <div style="background:#1a1a2e; border-radius:8px; padding:16px;">
          <p style="color:#93c5fd; font-size:1.4rem; line-height:1.8;">
            크롤링 = 데이터 수집의 <span style="color:#fff; font-weight:700;">일반명사</span><br>
            서비스 이미지 = <span style="color:#22c55e; font-weight:700;">100% 사용자 본인 저작물</span><br>
            <span style="color:#888;">R&D 계획서에 수익 배분 요구 = 평가 범위 초과</span>
          </p>
        </div>
      </div>
      <div>
        <h2 style="color:#fff; font-size:2.5rem; margin-bottom:12px;">지적 ⑧ — 사업화 전략</h2>
        <div style="background:#0f1b2b; border:2px solid #3b82f6; border-radius:12px; padding:24px; text-align:center;">
          <p style="color:#3b82f6; font-size:3.5rem; font-weight:900; line-height:1.4;">
            디딤돌 = R&D 연구과제<br>
            <span style="color:#ef4444;">≠ 투자 심사</span>
          </p>
        </div>
      </div>
    `,
    scripts: [
      "지적 5번, 크롤링 저작권입니다.",
      "크롤링은 데이터 수집의 일반명사입니다. Google도 네이버도 크롤링 기업입니다.",
      "당사 서비스 이미지는 사용자 본인 사진 기반이므로 저작권 분쟁 구조 자체가 없습니다.",
      "R&D 연구계획서에 수익 배분까지 요구하시는 것은 평가 범위를 넘는 판단입니다.",
      "마지막, 지적 8번입니다.",
      "'디딤돌'의 문자적 의미 그대로, 연구의 발판이 목적입니다.",
      "투자 심사의 잣대로 R&D 과제를 평가하신 것은 적절하지 않습니다.",
    ],
    actions: [ACTION.LOOK, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT, ACTION.LOOK, ACTION.FRONT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S9. 반박 종합
  // ────────────────────────────────────────────
  {
    html: `
      <h2 style="color:#a78bfa; font-size:3rem; margin-bottom:20px;">반박 종합</h2>
      <table style="width:100%; border-collapse:collapse; font-size:1.4rem; margin-bottom:20px;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="text-align:left; padding:8px; color:#888;">유형</th>
            <th style="text-align:left; padding:8px; color:#888;">내용</th>
            <th style="text-align:center; padding:8px; color:#888;">건수</th>
            <th style="text-align:center; padding:8px; color:#888;">상태</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#ef4444; font-weight:700;">유형1</td>
            <td style="padding:10px; color:#fca5a5;">과제 자체 오독</td>
            <td style="padding:10px; text-align:center;">2건</td>
            <td style="padding:10px; text-align:center; color:#22c55e;">&#10003; 소명</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#f59e0b; font-weight:700;">유형2</td>
            <td style="padding:10px; color:#fcd34d;">기술 구조 오독</td>
            <td style="padding:10px; text-align:center;">4건</td>
            <td style="padding:10px; text-align:center; color:#22c55e;">&#10003; 소명</td>
          </tr>
          <tr>
            <td style="padding:10px; color:#3b82f6; font-weight:700;">유형3</td>
            <td style="padding:10px; color:#93c5fd;">평가 범위 초과</td>
            <td style="padding:10px; text-align:center;">2건</td>
            <td style="padding:10px; text-align:center; color:#22c55e;">&#10003; 소명</td>
          </tr>
        </tbody>
      </table>
      <p style="color:#888; font-size:1.4rem; margin-bottom:24px;">7건 해석 오류 + 1건 범위 초과</p>
      <div style="background:#1a1a2e; border:2px solid #a78bfa; border-radius:12px; padding:24px; text-align:center;">
        <p style="color:#a78bfa; font-size:3rem; font-weight:900;">
          그런데 — 한 가지 더 보여드릴 것이 있습니다.
        </p>
      </div>
    `,
    scripts: [
      "이상 8건 지적에 대한 소명을 마쳤습니다.",
      "정리하면, 7건은 과제 내용의 명백한 잘못 해석이며,",
      "1건은 R&D 평가 범위를 넘는 과잉 판단입니다.",
      "그런데, 한 가지 더 보여드릴 것이 있습니다.",
    ],
    actions: [ACTION.FRONT, ACTION.LOOK, ACTION.FRONT, ACTION.BOUNCE],
  },

  // ────────────────────────────────────────────
  // S10. 실적 비교
  // ────────────────────────────────────────────
  {
    html: `
      <h2 style="color:#a78bfa; font-size:3rem; margin-bottom:20px;">제안서 이후 — 실적 비교</h2>
      <table style="width:100%; border-collapse:collapse; font-size:1.4rem;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="text-align:left; padding:10px; color:#888;">항목</th>
            <th style="text-align:center; padding:10px; color:#ef4444;">25.12 (제안서)</th>
            <th style="text-align:center; padding:10px; color:#22c55e;">26.04 (현재)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#ccc;">서비스</td>
            <td style="padding:10px; text-align:center; color:#888;">프로토타입 1개</td>
            <td style="padding:10px; text-align:center; color:#22c55e; font-weight:700;">프로덕션 6개</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#ccc;">코드</td>
            <td style="padding:10px; text-align:center; color:#888;">0</td>
            <td style="padding:10px; text-align:center; color:#22c55e; font-weight:700;">1,421+ 커밋</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#ccc;">결제</td>
            <td style="padding:10px; text-align:center; color:#888;">미연동</td>
            <td style="padding:10px; text-align:center; color:#22c55e; font-weight:700;">토스 + Lemon</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:10px; color:#ccc;">인증</td>
            <td style="padding:10px; text-align:center; color:#888;">0</td>
            <td style="padding:10px; text-align:center; color:#22c55e; font-weight:700;">KOITA + OAuth 3종</td>
          </tr>
          <tr>
            <td style="padding:10px; color:#ccc;">언어</td>
            <td style="padding:10px; text-align:center; color:#888;">국내만</td>
            <td style="padding:10px; text-align:center; color:#22c55e; font-weight:700;">KR · JP · EN</td>
          </tr>
        </tbody>
      </table>
      <p style="color:#a78bfa; font-size:1.8rem; font-weight:700; text-align:center; margin-top:20px;">
        서류가 아닌 실행으로 증명하고 있습니다.
      </p>
    `,
    scripts: [
      "제안서 시점과 지금을 비교합니다.",
      "프로토타입 하나였던 것이 프로덕션 6개 서비스가 되었습니다.",
      "코드 1,421커밋.",
      "국내외 결제 연동 완료.",
      "KOITA 연구개발전담부서 인증.",
      "한국, 일본, 영어 3개국어 서비스.",
      "서류가 아닌 실행으로 증명하고 있습니다.",
    ],
    actions: [ACTION.LOOK, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S11. AX 매핑 ★ 킬링포인트
  // ────────────────────────────────────────────
  {
    html: `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="color:#fcd34d; font-size:2rem;">★</span>
        <h2 style="color:#a78bfa; font-size:2.5rem;">모두의 챌린지 AX — LLM 분야</h2>
      </div>
      <p style="color:#888; font-size:1.2rem; margin-bottom:16px;">중소벤처기업부 · 2026.04.01 공고 · 초격차 스타트업 프로젝트</p>
      <table style="width:100%; border-collapse:collapse; font-size:1.2rem;">
        <thead>
          <tr style="border-bottom:2px solid #a78bfa;">
            <th style="text-align:left; padding:8px; color:#f59e0b;">디딤돌 지적</th>
            <th style="text-align:center; padding:8px; color:#888;">→</th>
            <th style="text-align:left; padding:8px; color:#22c55e;">AX 필수 혁신 과제</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:8px; color:#fcd34d;">"차별성 미흡" (④)</td>
            <td style="padding:8px; text-align:center; color:#a78bfa;">→</td>
            <td style="padding:8px; color:#a7f3d0;">AI 상담 챗봇 통합</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:8px; color:#fcd34d;">"사업화 미흡" (⑧)</td>
            <td style="padding:8px; text-align:center; color:#a78bfa;">→</td>
            <td style="padding:8px; color:#a7f3d0;">마케팅 자동화 솔루션</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:8px; color:#fcd34d;">"크롤링 리스크" (⑤)</td>
            <td style="padding:8px; text-align:center; color:#a78bfa;">→</td>
            <td style="padding:8px; color:#a7f3d0;">RAG 지식검색 엔진</td>
          </tr>
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:8px; color:#fcd34d;">"빅테크 경쟁력" (⑥)</td>
            <td style="padding:8px; text-align:center; color:#a78bfa;">→</td>
            <td style="padding:8px; color:#a7f3d0;">B2B AI 솔루션</td>
          </tr>
          <tr>
            <td style="padding:8px; color:#ef4444; font-weight:700;">"다국어 처리"</td>
            <td style="padding:8px; text-align:center; color:#a78bfa;">→</td>
            <td style="padding:8px; color:#22c55e; font-weight:700;">이미 운영 중 ✓</td>
          </tr>
        </tbody>
      </table>
    `,
    scripts: [
      "이 화면은 같은 중소벤처기업부가 4월 1일에 공고한",
      "'모두의 챌린지 AX, LLM 분야'입니다.",
      "이 공고의 필수 혁신 과제 목록을 보시겠습니다.",
      "평가에서 '차별성 미흡'이라 하신 기술이,",
      "여기서는 필수 혁신 과제로 등록되어 있습니다.",
      "그리고 '다국어 AI 문서, 대화 처리'는 저희가 이미 운영 중입니다.",
      "미흡하다고 판단하신 바로 그것을,",
      "같은 부처가 지금 1억원씩 지원하며 스타트업에게 만들어달라고 하고 있습니다.",
    ],
    actions: [ACTION.FRONT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT],
  },

  // ────────────────────────────────────────────
  // S12. 시연 + 클로징
  // ────────────────────────────────────────────
  {
    html: `
      <div style="text-align:center; padding:20px 0;">
        <h2 style="color:#a78bfa; font-size:3.5rem; margin-bottom:24px;">라이브 시연</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px;">
          <div style="background:#1a1a2e; border-radius:8px; padding:16px;">
            <p style="color:#3b82f6; font-size:1.2rem; font-weight:700;">monkos.ai</p>
            <p style="color:#93c5fd; font-size:1.1rem; margin-top:4px;">KR → JP → EN 전환</p>
            <p style="color:#666; font-size:1rem; margin-top:4px;">"다국어 처리"</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px;">
            <p style="color:#22c55e; font-size:1.2rem; font-weight:700;">증명사진 생성</p>
            <p style="color:#a7f3d0; font-size:1.1rem; margin-top:4px;">업로드 → AI 생성</p>
            <p style="color:#666; font-size:1rem; margin-top:4px;">"비용 해소"</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px;">
            <p style="color:#f59e0b; font-size:1.2rem; font-weight:700;">RAG 챗봇</p>
            <p style="color:#fcd34d; font-size:1.1rem; margin-top:4px;">질문 → 즉시 응답</p>
            <p style="color:#666; font-size:1rem; margin-top:4px;">"지식검색 엔진"</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px;">
            <p style="color:#a78bfa; font-size:1.2rem; font-weight:700;">크롭앱</p>
            <p style="color:#c4b5fd; font-size:1.1rem; margin-top:4px;">FaceMesh 478포인트</p>
            <p style="color:#666; font-size:1rem; margin-top:4px;">"핵심 기술"</p>
          </div>
        </div>
        <div style="border-top:2px solid #a78bfa44; padding-top:24px;">
          <p style="color:#a78bfa; font-size:3rem; font-weight:900; line-height:1.5;">
            디딤돌은 이미 달리고 있는<br>연구의 발판입니다
          </p>
        </div>
      </div>
    `,
    scripts: [
      "서류로는 판단이 어려우실 것입니다. 직접 보여드리겠습니다.",
      "3개국어 실시간 전환입니다. 이것이 '다국어 처리'입니다.",
      "원가 4센트. 이것이 '비용 모순 해소'입니다.",
      "이것이 'RAG 지식검색 엔진'입니다.",
      "이것이 특허 출원 중인 핵심 기술입니다.",
      "디딤돌은 이미 달리고 있는 연구의 발판입니다.",
      "서면으로 전달하지 못한 것을 오늘 직접 보여드렸습니다.",
      "재평가 기회를 요청드립니다. 감사합니다.",
    ],
    actions: [ACTION.FRONT, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.FRONT, ACTION.FRONT, ACTION.ROAM],
  },
];


export class SlideManager {
  constructor(contentEl) {
    this.contentEl = contentEl;
    this.slides = SLIDES;
    this.currentIndex = 0;
    this.render();
  }

  render() {
    const slide = this.slides[this.currentIndex];
    this.contentEl.innerHTML = slide.html +
      `<div id="slide-counter" style="margin-top:24px; color:#6d5faa; font-size:1.4rem; text-align:center;">` +
      `${this.currentIndex + 1} / ${this.slides.length}</div>`;
  }

  next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.currentIndex++;
      this.render();
    }
    return this.currentIndex;
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
    return this.currentIndex;
  }

  getCurrentScripts() {
    return this.slides[this.currentIndex].scripts;
  }

  getCurrentActions() {
    return this.slides[this.currentIndex].actions;
  }

  get total() {
    return this.slides.length;
  }
}
