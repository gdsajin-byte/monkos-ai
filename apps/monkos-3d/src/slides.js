/**
 * 디딤돌 이의신청 — 8시퀀스 숏컷 영상용 슬라이드 + TTS 대본 + 몽코스 액션 싱크
 *
 * 전략: 8분 숏컷 편집 영상 + 작가님 7분 라이브 토크 = 15분 초집중 구조
 * 정본: monkos-ops/ops/orders/2026-04/ORDER_20260405_iMac민아_막내1_PT앱_슬라이드전면재설계.md
 *
 * 색상 가이드:
 *   배경 #0a0a0a ~ #0f0f23, 텍스트 #fff, 강조 #a78bfa
 *   지적(빨강) #ef4444, 반론(초록) #22c55e
 *
 * TTS 규칙: scripts 배열에는 발음 교정된 한국어 텍스트 사용
 *   (AI→에이아이, MCP→엠씨피, CDP→씨디피, RLHF→알엘에이치에프 등)
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
  // ════════════════════════════════════════════
  // S1. 오프닝 (0:00~0:30) — 기업 실체
  // ════════════════════════════════════════════
  {
    html: `
      <div style="text-align:center; padding:40px 0;">
        <div style="margin-bottom:24px;">
          <img src="/monkos-icon.svg" alt="MONKOS" style="width:80px; height:80px; margin-bottom:16px;" onerror="this.style.display='none'" />
        </div>
        <p style="color:#6d5faa; font-size:1.4rem; margin-bottom:8px;">이의신청 대면평가</p>
        <h2 style="color:#a78bfa; font-size:3.5rem; line-height:1.4; margin-bottom:16px;">
          몽크사진관 · MONKOS
        </h2>
        <div style="display:flex; justify-content:center; gap:24px; margin-bottom:24px;">
          <span style="color:#c4b5fd; font-size:1.6rem; padding:8px 16px; background:#1a1a2e; border-radius:8px;">monk.kr</span>
          <span style="color:#c4b5fd; font-size:1.6rem; padding:8px 16px; background:#1a1a2e; border-radius:8px;">monkos.ai</span>
        </div>
        <div style="width:60px; height:2px; background:#a78bfa; margin:0 auto 24px;"></div>
        <p style="color:#8b7fbd; font-size:1.4rem;">서면평가 의견 8건에 대한 이의 소명</p>
      </div>
    `,
    scripts: [
      "안녕하십니까. 몽크사진관, 몽코스입니다.",
      "서면평가 의견 8건에 대한 이의를 소명드리겠습니다.",
    ],
    actions: [ACTION.BOUNCE, ACTION.FRONT],
  },

  // ════════════════════════════════════════════
  // S2. 팀 소개 (0:30~1:30) — "이 팀은 진짜다"
  // ════════════════════════════════════════════
  {
    html: `
      <div style="padding:20px 0;">
        <h2 style="color:#a78bfa; font-size:2.5rem; margin-bottom:24px; text-align:center;">팀 소개</h2>
        <div style="display:flex; gap:20px; margin-bottom:24px;">
          <div style="flex:1; background:#1a1a2e; border-radius:12px; padding:24px; border-left:3px solid #a78bfa;">
            <p style="color:#a78bfa; font-size:1.8rem; font-weight:700; margin-bottom:8px;">신정규 대표</p>
            <p style="color:#c4b5fd; font-size:1.3rem; line-height:1.8;">
              사진작가 20년<br>
              뷰파인더로 수만 명 촬영<br>
              연구책임자
            </p>
          </div>
          <div style="flex:1; background:#1a1a2e; border-radius:12px; padding:24px; border-left:3px solid #e879f9;">
            <p style="color:#e879f9; font-size:1.8rem; font-weight:700; margin-bottom:8px;">한송이 연구원</p>
            <p style="color:#c4b5fd; font-size:1.3rem; line-height:1.8;">
              스튜디오 10년 · 헤어메이크업 7년<br>
              건국대 미용교육학 석사<br>
              향장생물학 박사과정<br>
              <span style="color:#22c55e;">전 과정 A+ (99점↑)</span>
            </p>
          </div>
        </div>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; background:#0f1b2b; border:1px solid #3b82f644; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#3b82f6; font-size:1.2rem; font-weight:700;">KOITA</p>
            <p style="color:#93c5fd; font-size:1.1rem;">연구개발 전담부서 인증</p>
          </div>
          <div style="flex:1; background:#0f2b1a; border:1px solid #22c55e44; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#22c55e; font-size:1.2rem; font-weight:700;">대면평가 동반 입실</p>
            <p style="color:#a7f3d0; font-size:1.1rem;">대전 → 서울 임시거처 마련 후 합류</p>
          </div>
        </div>
      </div>
    `,
    scripts: [
      "저희 팀을 소개드립니다.",
      "대표 신정규. 사진작가 20년, 뷰파인더로 수만 명의 인물사진을 촬영한 현장 전문가입니다.",
      "한송이 연구원. 스튜디오 10년 운영, 헤어메이크업 실무 7년.",
      "건국대 미용교육학 석사, 향장생물학 박사과정. 학부부터 박사과정까지 전 과정 에이플러스, 99점 이상의 성적을 단 한 차례도 놓치지 않은 수재입니다.",
      "대전에 거주 중인 두 초등학생의 엄마가, 이 연구에 함께하기 위해 가족과 협의하여 서울에 임시거처를 마련하고 합류했습니다.",
      "오늘 대면평가에 동반 입실하였습니다.",
    ],
    actions: [ACTION.LOOK, ACTION.POINT, ACTION.POINT, ACTION.FRONT, ACTION.FRONT, ACTION.FRONT],
  },

  // ════════════════════════════════════════════
  // S3. 근본 오해 (1:30~2:10) — "K-뷰티 ≠ 화장품"
  // ════════════════════════════════════════════
  {
    html: `
      <div style="padding:20px 0;">
        <div style="text-align:center; margin-bottom:32px;">
          <h2 style="color:#fff; font-size:4rem; font-weight:900; margin-bottom:16px;">
            K-뷰티 <span style="color:#ef4444;">≠</span> 화장품 산업
          </h2>
          <div style="width:80px; height:3px; background:#ef4444; margin:0 auto;"></div>
        </div>
        <div style="display:flex; gap:16px; margin-bottom:24px;">
          <div style="flex:1; background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#ef4444; font-size:3rem; font-weight:900;">0회</p>
            <p style="color:#888; font-size:1.2rem; margin-top:4px;">제안서 내 "화장품"</p>
          </div>
          <div style="flex:1; background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#ef4444; font-size:3rem; font-weight:900;">0회</p>
            <p style="color:#888; font-size:1.2rem; margin-top:4px;">제안서 내 "발색"</p>
          </div>
        </div>
        <div style="background:#1a1a2e; border-radius:8px; padding:16px; margin-bottom:16px;">
          <p style="color:#c4b5fd; font-size:1.4rem; line-height:1.8;">
            K-뷰티 = 패션 · 헤어 · 메이크업 등 <span style="color:#a78bfa; font-weight:700;">한국 뷰티 문화 통칭</span><br>
            서구 편향 AI 데이터에 대비되는 한국적·동양적 트렌드 전방위
          </p>
        </div>
        <div style="background:#0f0f23; border:1px solid #ef444466; border-radius:8px; padding:12px; text-align:center;">
          <p style="color:#ef4444; font-size:1.2rem;">이 오해 → ① 발색 오독, ③ 편향 오독, ⑥ 비교 대상 오류</p>
        </div>
      </div>
    `,
    scripts: [
      "소명에 앞서, 다수 오독의 출발점을 짚겠습니다.",
      "제안서에 화장품이라는 단어는 0회, 발색이라는 단어도 0회 등장합니다.",
      "케이뷰티는 화장품 산업이 아닌, 패션, 헤어, 메이크업 등 한국 뷰티 문화를 통칭하는 브랜딩 개념입니다.",
      "이 오해가 지적 1번, 3번, 6번의 연쇄 오독으로 이어졌습니다.",
    ],
    actions: [ACTION.FRONT, ACTION.POINT, ACTION.POINT, ACTION.LOOK],
  },

  // ════════════════════════════════════════════
  // S4. 전문성 선언 (2:10~2:50) — 킬링 포인트
  // ════════════════════════════════════════════
  {
    html: `
      <div style="text-align:center; padding:30px 0;">
        <h2 style="color:#a78bfa; font-size:3.5rem; font-weight:900; margin-bottom:32px;">
          현장 30년 + 학술 최상위
        </h2>
        <div style="display:flex; gap:16px; margin-bottom:32px;">
          <div style="flex:1; background:#1a1a2e; border-radius:12px; padding:20px;">
            <p style="color:#a78bfa; font-size:4rem; font-weight:900;">20년</p>
            <p style="color:#c4b5fd; font-size:1.2rem; margin-top:8px;">뷰파인더 촬영</p>
          </div>
          <div style="flex:1; background:#1a1a2e; border-radius:12px; padding:20px;">
            <p style="color:#e879f9; font-size:4rem; font-weight:900;">10년</p>
            <p style="color:#c4b5fd; font-size:1.2rem; margin-top:8px;">스튜디오 운영</p>
          </div>
          <div style="flex:1; background:#1a1a2e; border-radius:12px; padding:20px;">
            <p style="color:#22c55e; font-size:4rem; font-weight:900;">7년</p>
            <p style="color:#c4b5fd; font-size:1.2rem; margin-top:8px;">헤어메이크업</p>
          </div>
        </div>
        <div style="background:#1a1a2e; border-radius:12px; padding:20px; margin-bottom:24px;">
          <p style="color:#c4b5fd; font-size:1.4rem;">미용교육학 석사 + 향장생물학 박사과정</p>
        </div>
        <div style="background:#0f0f23; border:2px solid #a78bfa; border-radius:12px; padding:24px;">
          <p style="color:#a78bfa; font-size:1.8rem; font-weight:700; line-height:1.6;">
            "이 시각적 판단을 연구실 발색 수치로 환산하여<br>
            <span style="color:#ef4444;">'편향'</span>이라 부를 수 있습니까?"
          </p>
        </div>
      </div>
    `,
    scripts: [
      "뷰파인더로 20년간 수만 명을 촬영한 사진작가의 시각적 판단.",
      "스튜디오 10년, 헤어메이크업 7년, 미용교육학 석사, 향장생물학 박사과정의 도메인 전문성.",
      "이것을 연구실 발색 수치 기반 '편향'으로 격하할 수 있겠습니까.",
    ],
    actions: [ACTION.FRONT, ACTION.FRONT, ACTION.POINT],
  },

  // ════════════════════════════════════════════
  // S5. 8건 반론 숏컷 (2:50~4:50) — 빠르게 치고 빠짐
  // ════════════════════════════════════════════
  {
    html: `
      <div style="padding:10px 0;">
        <h2 style="color:#a78bfa; font-size:2.5rem; margin-bottom:16px;">8건 반론 — 숏컷</h2>
        <table style="width:100%; border-collapse:collapse; font-size:1.25rem;">
          <thead>
            <tr style="border-bottom:2px solid #333;">
              <th style="text-align:center; padding:6px 8px; color:#888; width:40px;">#</th>
              <th style="text-align:left; padding:6px 8px; color:#ef4444;">지적</th>
              <th style="text-align:left; padding:6px 8px; color:#22c55e;">반론</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:8px; text-align:center; color:#666;">①</td>
              <td style="padding:8px; color:#fca5a5;">"발색 수치 정확성 미흡"</td>
              <td style="padding:8px; color:#a7f3d0;">발색은 제안서에 0회 — 과제를 읽지 않은 오독</td>
            </tr>
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:8px; text-align:center; color:#666;">②</td>
              <td style="padding:8px; color:#fca5a5;">"GPU 처리 속도 방안 부족"</td>
              <td style="padding:8px; color:#a7f3d0;">GPU는 서버가 아닌 연구장비 — 파인튜닝용 VRAM</td>
            </tr>
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:8px; text-align:center; color:#666;">③</td>
              <td style="padding:8px; color:#fca5a5;">"전문가 편향 우려"</td>
              <td style="padding:8px; color:#a7f3d0;">RLHF는 OpenAI도 쓰는 글로벌 표준 학습 방식</td>
            </tr>
            <tr style="border-bottom:1px solid #222; background:#1a1a2e;">
              <td style="padding:8px; text-align:center; color:#a78bfa; font-weight:700;">④</td>
              <td style="padding:8px; color:#fca5a5;">"범용 GenAI 대비 차별성 미흡"</td>
              <td style="padding:8px; color:#a7f3d0;">빅테크 정책의 크랙을 파고드는 자체 엔진 개발 — 멀티에이전트 실가동</td>
            </tr>
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:8px; text-align:center; color:#666;">⑤</td>
              <td style="padding:8px; color:#fca5a5;">"크롤링 저작권 리스크"</td>
              <td style="padding:8px; color:#a7f3d0;">100% 사용자 본인 사진 — 저작권 분쟁 구조 자체 부재</td>
            </tr>
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:8px; text-align:center; color:#666;">⑥</td>
              <td style="padding:8px; color:#fca5a5;">"빅테크 대비 경쟁력 부족"</td>
              <td style="padding:8px; color:#a7f3d0;">Adobe·Runway는 증명사진 안 함 — 비교 대상 범주 오류</td>
            </tr>
            <tr style="border-bottom:1px solid #222;">
              <td style="padding:8px; text-align:center; color:#666;">⑦</td>
              <td style="padding:8px; color:#fca5a5;">"고해상도 vs 저비용 모순"</td>
              <td style="padding:8px; color:#a7f3d0;">서로 다른 연구과제(1-2항 vs 1-4항)를 합친 오독</td>
            </tr>
            <tr>
              <td style="padding:8px; text-align:center; color:#666;">⑧</td>
              <td style="padding:8px; color:#fca5a5;">"사업화 전략 미흡"</td>
              <td style="padding:8px; color:#a7f3d0;">6개 서비스 라이브 + 결제·인증·고용 — 실행으로 증명</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    scripts: [
      // ① 발색
      "지적 1번. 발색 수치 정확성 미흡.",
      "발색은 제안서에 0회 등장합니다. 과제를 읽지 않은 오독입니다.",
      // ② GPU
      "지적 2번. 지피유 처리 속도 방안 부족.",
      "지피유는 서버가 아닌 연구장비입니다. 파인튜닝용 브이램입니다.",
      // ③ 편향
      "지적 3번. 전문가 편향 우려.",
      "알엘에이치에프는 오픈에이아이도 쓰는 글로벌 표준 학습 방식입니다.",
      // ④ 차별성 (부연 포함)
      "지적 4번. 범용 젠에이아이 대비 차별성 미흡.",
      "빅테크 정책의 크랙을 파고드는 자체 엔진 개발. 멀티에이전트 실가동 중입니다.",
      "몽코스는 구글, 마이크로소프트, 앤스로픽, 오픈에이아이, 오픈소스를 실시간으로 벤치마크하고 크롤링합니다.",
      "대표적으로 엠씨피 자체 서버 구축과 씨디피 엔진 직접 개발로, 앤스로픽의 공식 도구를 오히려 뛰어넘는 기술을 보유하고 있습니다.",
      "멀티에이전트 오케스트레이션 시스템으로 에이아이 에이전트 4기에서 20기까지 동시 병렬 가동이 가능합니다.",
      // ⑤ 크롤링
      "지적 5번. 크롤링 저작권 리스크.",
      "100퍼센트 사용자 본인 사진 기반. 저작권 분쟁 구조 자체가 부재합니다.",
      // ⑥ 빅테크
      "지적 6번. 빅테크 대비 경쟁력 부족.",
      "어도비와 런웨이는 증명사진을 안 합니다. 비교 대상 자체가 범주 오류입니다.",
      // ⑦ 비용 모순
      "지적 7번. 고해상도 대 저비용 모순.",
      "서로 다른 연구과제를 하나로 합친 오독입니다.",
      // ⑧ 사업화
      "지적 8번. 사업화 전략 미흡.",
      "6개 서비스 라이브, 결제, 인증, 고용. 전부 실행으로 증명했습니다.",
    ],
    actions: [
      // ① LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
      // ② LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
      // ③ LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
      // ④ LOOK → POINT × 4 (부연 포함)
      ACTION.LOOK, ACTION.POINT, ACTION.POINT, ACTION.POINT, ACTION.POINT,
      // ⑤ LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
      // ⑥ LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
      // ⑦ LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
      // ⑧ LOOK → POINT
      ACTION.LOOK, ACTION.POINT,
    ],
  },

  // ════════════════════════════════════════════
  // S6. 서비스 실사 (4:50~5:50) — "서비스가 돌아간다"
  // ════════════════════════════════════════════
  {
    html: `
      <div style="padding:10px 0;">
        <h2 style="color:#a78bfa; font-size:2.5rem; margin-bottom:20px; text-align:center;">서비스 실사 — 가동 중인 6개 서비스</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px;">
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; text-align:center; border-top:3px solid #22c55e;">
            <p style="color:#22c55e; font-size:1.6rem; font-weight:700;">AI 증명사진</p>
            <p style="color:#a7f3d0; font-size:1.1rem; margin-top:8px;">정체성 보존 90%↑</p>
            <p style="color:#6ee7b7; font-size:1rem; margin-top:4px;">ICAO 규격 자동 검증</p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; text-align:center; border-top:3px solid #3b82f6;">
            <p style="color:#3b82f6; font-size:1.6rem; font-weight:700;">MONKOS 크롭</p>
            <p style="color:#93c5fd; font-size:1.1rem; margin-top:8px;">478포인트 얼굴 분석</p>
            <p style="color:#60a5fa; font-size:1rem; margin-top:4px;">자동 규격 크롭</p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; text-align:center; border-top:3px solid #f59e0b;">
            <p style="color:#f59e0b; font-size:1.6rem; font-weight:700;">RAG 챗봇</p>
            <p style="color:#fcd34d; font-size:1.1rem; margin-top:8px;">지식 검색 엔진</p>
            <p style="color:#fbbf24; font-size:1rem; margin-top:4px;">사용할수록 학습</p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; text-align:center; border-top:3px solid #a78bfa;">
            <p style="color:#a78bfa; font-size:1.6rem; font-weight:700;">블로그</p>
            <p style="color:#c4b5fd; font-size:1.1rem; margin-top:8px;">monkos.ai 포스팅</p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; text-align:center; border-top:3px solid #e879f9;">
            <p style="color:#e879f9; font-size:1.6rem; font-weight:700;">포털</p>
            <p style="color:#f0abfc; font-size:1.1rem; margin-top:8px;">monk.kr 메인</p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; text-align:center; border-top:3px solid #6d5faa;">
            <p style="color:#6d5faa; font-size:1.6rem; font-weight:700;">어드민</p>
            <p style="color:#8b7fbd; font-size:1.1rem; margin-top:8px;">관리 시스템</p>
          </div>
        </div>
        <div style="background:#0f2b1a; border:1px solid #22c55e44; border-radius:8px; padding:16px; text-align:center;">
          <p style="color:#22c55e; font-size:1.4rem; font-weight:700;">
            6개 전부 라이브 · 국내외 결제 정착 · 카카오 · Google · LINE OAuth 인증
          </p>
        </div>
      </div>
    `,
    scripts: [
      "현재 가동 중인 서비스입니다.",
      "에이아이 증명사진. 정체성 보존율 90퍼센트 이상, 아이카오 규격 자동 검증.",
      "몽코스 크롭. 478포인트 얼굴 분석 기반 자동 규격 크롭.",
      "래그 챗봇. 사용할수록 학습하는 지식 검색 엔진.",
      "6개 서비스 전부 라이브. 국내외 결제 시스템 정착. 카카오, 구글, 라인 오쓰 인증 획득.",
    ],
    actions: [ACTION.ROAM, ACTION.POINT, ACTION.POINT, ACTION.LOOK, ACTION.FRONT],
  },

  // ════════════════════════════════════════════
  // S7. 기술력 증명 (5:50~7:00) — MCP/CDP + 멀티에이전트
  // ════════════════════════════════════════════
  {
    html: `
      <div style="padding:10px 0;">
        <h2 style="color:#a78bfa; font-size:2.5rem; margin-bottom:20px; text-align:center;">기술 자립의 실체</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; border-left:3px solid #22c55e;">
            <p style="color:#22c55e; font-size:1.6rem; font-weight:700; margin-bottom:8px;">CDP 엔진</p>
            <p style="color:#a7f3d0; font-size:1.2rem; line-height:1.6;">
              Chrome DevTools Protocol<br>
              직접 개발한 브라우저 제어 엔진<br>
              AI가 브라우저를 보고 · 입력 · 검증
            </p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; border-left:3px solid #3b82f6;">
            <p style="color:#3b82f6; font-size:1.6rem; font-weight:700; margin-bottom:8px;">MCP 서버</p>
            <p style="color:#93c5fd; font-size:1.2rem; line-height:1.6;">
              자체 구축 MCP 서버<br>
              Anthropic 공식 도구를 초월<br>
              포트별 독립 인스턴스
            </p>
          </div>
          <div style="background:#1a1a2e; border-radius:12px; padding:20px; border-left:3px solid #e879f9; grid-column:1/-1;">
            <p style="color:#e879f9; font-size:1.6rem; font-weight:700; margin-bottom:8px;">멀티에이전트 오케스트레이션</p>
            <p style="color:#f0abfc; font-size:1.2rem; line-height:1.6;">
              AI 에이전트 동시 병렬 작업 · 역할 분담 · 자율 실행 · 완료 보고 체계
            </p>
          </div>
        </div>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; background:#0f2b1a; border:1px solid #22c55e44; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#22c55e; font-size:1.4rem; font-weight:700;">Google Cloud</p>
            <p style="color:#a7f3d0; font-size:1.1rem;">바우처 제공</p>
          </div>
          <div style="flex:1; background:#0f1b2b; border:1px solid #3b82f644; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#3b82f6; font-size:1.4rem; font-weight:700;">Anthropic</p>
            <p style="color:#93c5fd; font-size:1.1rem;">크레딧 제공</p>
          </div>
        </div>
      </div>
    `,
    scripts: [
      "기술 자립의 실체를 보여드리겠습니다.",
      "씨디피, 크롬 데브툴즈 프로토콜 엔진을 직접 개발했습니다.",
      "에이아이 에이전트가 브라우저를 직접 보고, 입력하고, 검증합니다.",
      "멀티에이전트가 동시에 병렬 작업을 수행하는 오케스트레이션 시스템입니다.",
      "이 시스템이 지금 이 순간에도 실가동 중이며, 글로벌 빅테크가 핵심 방향성으로 경쟁하고 있는 바로 그 기술입니다.",
    ],
    actions: [ACTION.BOUNCE, ACTION.POINT, ACTION.POINT, ACTION.LOOK, ACTION.FRONT],
  },

  // ════════════════════════════════════════════
  // S8. 성과 + 클로징 (7:00~8:00) — 마무리
  // ════════════════════════════════════════════
  {
    html: `
      <div style="padding:10px 0;">
        <h2 style="color:#a78bfa; font-size:2.5rem; margin-bottom:20px; text-align:center;">실적 요약</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px;">
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#22c55e; font-size:2.5rem; font-weight:900;">6개</p>
            <p style="color:#a7f3d0; font-size:1rem;">서비스 라이브</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#3b82f6; font-size:2.5rem; font-weight:900;">KOITA</p>
            <p style="color:#93c5fd; font-size:1rem;">연구전담부서 인증</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#f59e0b; font-size:2.5rem; font-weight:900;">결제</p>
            <p style="color:#fcd34d; font-size:1rem;">토스 + Lemon Squeezy</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#e879f9; font-size:2.5rem; font-weight:900;">OAuth</p>
            <p style="color:#f0abfc; font-size:1rem;">카카오 · Google · LINE</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#a78bfa; font-size:2.5rem; font-weight:900;">25개</p>
            <p style="color:#c4b5fd; font-size:1rem;">SNS 채널 운영 중</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#6d5faa; font-size:2.5rem; font-weight:900;">특허</p>
            <p style="color:#8b7fbd; font-size:1rem;">출원 진행 중</p>
          </div>
          <div style="background:#1a1a2e; border-radius:8px; padding:16px; text-align:center;">
            <p style="color:#38bdf8; font-size:2.5rem; font-weight:900;">벤처</p>
            <p style="color:#7dd3fc; font-size:1rem;">인증 진행 중</p>
          </div>
        </div>
        <div style="border-top:2px solid #a78bfa44; padding-top:24px; text-align:center;">
          <p style="color:#a78bfa; font-size:3rem; font-weight:900; line-height:1.5; margin-bottom:16px;">
            재평가의 기회를 요청드립니다
          </p>
          <p style="color:#c4b5fd; font-size:1.6rem;">감사합니다.</p>
        </div>
      </div>
    `,
    scripts: [
      "정리하겠습니다.",
      "제안서의 모든 타임라인을 실행으로 증명했습니다.",
      "6개 서비스 라이브, 연구전담부서 인증, 국내외 결제 정착, 오쓰 3사 인증, 25개 에스엔에스 채널 운영 중.",
      "구체성이 미흡한 것이 아닙니다. 이미 다 만들었습니다.",
      "재평가의 기회를 요청드립니다. 감사합니다.",
    ],
    actions: [ACTION.FRONT, ACTION.POINT, ACTION.LOOK, ACTION.FRONT, ACTION.ROAM],
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
