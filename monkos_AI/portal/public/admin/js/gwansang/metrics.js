// 478 랜드마크 → 관상 측정치 (순수 함수)
// 좌표계: 픽셀 (x 오른쪽+, y 아래+). 각도는 "위쪽 = +" 로 통일.
// 롤(기울기)은 동공 축 기준으로 사전 보정하므로 모든 측정치는 수평 정렬 상태에서 계산된다.

const IDX = {
  faceTop: 10, chinBottom: 152, glabella: 8, subnasale: 2, nasion: 168,
  cheekL: 234, cheekR: 454, foreheadL: 54, foreheadR: 284, jawL: 58, jawR: 288,
  browInL: 107, browInR: 336, browOutL: 70, browOutR: 300, browMidL: 105, browMidR: 334,
  eyeOutL: 33, eyeInL: 133, eyeInR: 362, eyeOutR: 263,
  eyeTopL: 159, eyeBotL: 145, eyeTopR: 386, eyeBotR: 374,
  irisL: 468, irisR: 473,
  lipTop: 0, lipInnerTop: 13, lipBottom: 17, mouthL: 61, mouthR: 291,
  noseTip: 1, alarL: 129, alarR: 358
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
const deg = (rad) => rad * 180 / Math.PI;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 정규화 좌표(0~1) → 픽셀 좌표
export function toPixels(landmarks, width, height) {
  return landmarks.map(lm => ({ x: lm.x * width, y: lm.y * height, z: lm.z }));
}

// 동공 축이 수평이 되도록 전체 랜드마크 회전 (롤 보정)
export function rollCorrect(pts) {
  const l = pts[IDX.irisL], r = pts[IDX.irisR];
  const roll = Math.atan2(r.y - l.y, r.x - l.x);
  const cx = (l.x + r.x) / 2, cy = (l.y + r.y) / 2;
  const cos = Math.cos(-roll), sin = Math.sin(-roll);
  const rotated = pts.map(p => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
    z: p.z
  }));
  return { pts: rotated, rollDeg: deg(roll) };
}

// 눈꼬리·눈썹 공용: 안쪽→바깥쪽으로 갈 때 위로 오르면 +각도
function outwardAngle(inner, outer) {
  return deg(Math.atan2(inner.y - outer.y, Math.abs(outer.x - inner.x)));
}

// 측정치 일괄 계산. 반환: { 값들, 품질 플래그 }
export function computeMetrics(rawPts) {
  const { pts: P, rollDeg } = rollCorrect(rawPts);
  const g = (name) => P[IDX[name]];

  const ipd = dist(g('irisL'), g('irisR'));
  const faceH = dist(g('faceTop'), g('chinBottom'));
  const faceW = dist(g('cheekL'), g('cheekR'));
  const fwForehead = dist(g('foreheadL'), g('foreheadR')) / faceW;
  const fwJaw = dist(g('jawL'), g('jawR')) / faceW;

  // 삼정 (상정은 이마 최상단 근사 — 헤어라인 미검출)
  const s1 = g('glabella').y - g('faceTop').y;
  const s2 = g('subnasale').y - g('glabella').y;
  const s3 = g('chinBottom').y - g('subnasale').y;
  const sTotal = s1 + s2 + s3;

  const eyeLenL = dist(g('eyeOutL'), g('eyeInL'));
  const eyeLenR = dist(g('eyeInR'), g('eyeOutR'));
  const eyeOpenL = dist(g('eyeTopL'), g('eyeBotL'));
  const eyeOpenR = dist(g('eyeTopR'), g('eyeBotR'));
  const eyeLen = mean([eyeLenL, eyeLenR]);

  const browAngleL = outwardAngle(g('browInL'), g('browOutL'));
  const browAngleR = outwardAngle(g('browInR'), g('browOutR'));
  const tailAngleL = outwardAngle(g('eyeInL'), g('eyeOutL'));
  const tailAngleR = outwardAngle(g('eyeInR'), g('eyeOutR'));

  const browEyeL = dist(g('browMidL'), g('eyeTopL'));
  const browEyeR = dist(g('browMidR'), g('eyeTopR'));

  // 입꼬리: 입 중심(13) 대비 양 꼬리 평균 높이
  const mouthW = dist(g('mouthL'), g('mouthR'));
  const cornerY = (g('mouthL').y + g('mouthR').y) / 2;
  const lipCornerAngle = deg(Math.atan2(g('lipInnerTop').y - cornerY + (g('lipBottom').y - g('lipInnerTop').y) * 0.35, mouthW / 2));

  // 좌우 균형: 대응 측정치 편차 합성 (0~100)
  const devs = [
    Math.abs(eyeLenL - eyeLenR) / eyeLen,
    Math.abs(eyeOpenL - eyeOpenR) / mean([eyeOpenL, eyeOpenR]),
    Math.abs(browAngleL - browAngleR) / 20,
    Math.abs(tailAngleL - tailAngleR) / 20,
    Math.abs(browEyeL - browEyeR) / mean([browEyeL, browEyeR])
  ];
  const symmetry = Math.round(100 * (1 - clamp(mean(devs), 0, 1)));

  // 요(yaw) 근사: 코끝의 좌우 치우침 → 정면성 게이트
  const midX = (g('cheekL').x + g('cheekR').x) / 2;
  const yawOffset = (g('noseTip').x - midX) / faceW;

  return {
    values: {
      ipd, face_h: faceH,
      aspect: faceH / faceW,
      fw_forehead: fwForehead,
      fw_jaw: fwJaw,
      samjeong: { s1: s1 / sTotal, s2: s2 / sTotal, s3: s3 / sTotal },
      brow_gap: dist(g('browInL'), g('browInR')) / ipd,
      brow_angle: mean([browAngleL, browAngleR]),
      brow_eye_gap: mean([browEyeL, browEyeR]) / ipd,
      eye_open: mean([eyeOpenL, eyeOpenR]) / eyeLen,
      eye_gap: dist(g('eyeInL'), g('eyeInR')) / eyeLen,
      eye_tail_angle: mean([tailAngleL, tailAngleR]),
      nose_len: (g('subnasale').y - g('nasion').y) / faceH,
      nose_w: dist(g('alarL'), g('alarR')) / ipd,
      injung_len: (g('lipTop').y - g('subnasale').y) / faceH,
      mouth_w: mouthW / ipd,
      lip_corner_angle: lipCornerAngle,
      chin_len: (g('chinBottom').y - g('lipBottom').y) / faceH,
      cheek_ratio: faceW / mean([dist(g('foreheadL'), g('foreheadR')), dist(g('jawL'), g('jawR'))]),
      symmetry
    },
    quality: {
      rollDeg: Math.round(rollDeg * 10) / 10,
      yawOffset: Math.round(yawOffset * 1000) / 1000,
      frontal: Math.abs(yawOffset) < 0.06,
      levelled: Math.abs(rollDeg) < 8
    }
  };
}

export { IDX };
