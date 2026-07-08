// 106점 InsightFace 랜드마크 → detectFace() 호환 anatomy 변환
// 인덱스: 2026-07-09 교차검증 오버레이 실측 확정 (delta 0.0px)
const LMK = {
  CHIN: 0,
  LEFT_CONTOUR: 1,
  RIGHT_CONTOUR: 17,
  LEFT_EYE: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
  RIGHT_EYE: [87, 88, 89, 90, 91, 92, 93, 94, 95, 96],
  LEFT_EYE_INNER: 35,
  LEFT_EYE_OUTER: 39,
  LEFT_EYE_UPPER: [40, 41, 42],
  LEFT_EYE_LOWER: [33, 36, 37],
  RIGHT_EYE_INNER: 89,
  RIGHT_EYE_OUTER: 93,
  RIGHT_EYE_UPPER: [94, 95, 96],
  RIGHT_EYE_LOWER: [87, 90, 91],
  NOSE_TIP: 86,
  MOUTH_LEFT: 52,
  MOUTH_RIGHT: 61,
  MOUTH_UPPER_CENTER: [62, 71],
  MOUTH_LOWER_CENTER: [53, 56, 59],
  JAW_BOTTOM: [0, 8, 24, 7, 23, 6, 22],
};

export function insightToAnatomy(landmarks106, imageWidth, imageHeight) {
  const p = (i) => ({ x: landmarks106[i][0], y: landmarks106[i][1] });
  const avg = (indices) => {
    const pts = indices.map(p);
    return {
      x: pts.reduce((s, pt) => s + pt.x, 0) / pts.length,
      y: pts.reduce((s, pt) => s + pt.y, 0) / pts.length,
    };
  };

  const leftEye = avg(LMK.LEFT_EYE);
  const rightEye = avg(LMK.RIGHT_EYE);
  const noseTip = p(LMK.NOSE_TIP);

  let chin = p(LMK.CHIN);
  for (const i of LMK.JAW_BOTTOM) {
    const pt = p(i);
    if (pt.y > chin.y) chin = pt;
  }

  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const crownY = eyeCenterY - (chin.y - eyeCenterY);

  const gate = {};
  try {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const mouthW = dist(p(LMK.MOUTH_LEFT), p(LMK.MOUTH_RIGHT));
    const innerTop = avg(LMK.MOUTH_UPPER_CENTER);
    const innerBot = avg(LMK.MOUTH_LOWER_CENTER);
    gate.mouthOpen = +(Math.abs(innerBot.y - innerTop.y) / (mouthW || 1)).toFixed(3);
    const eyeUpperL = avg(LMK.LEFT_EYE_UPPER);
    const eyeLowerL = avg(LMK.LEFT_EYE_LOWER);
    const eyeW_L = dist(p(LMK.LEFT_EYE_INNER), p(LMK.LEFT_EYE_OUTER));
    gate.eyeOpenL = +(Math.abs(eyeLowerL.y - eyeUpperL.y) / (eyeW_L || 1)).toFixed(3);
    const eyeUpperR = avg(LMK.RIGHT_EYE_UPPER);
    const eyeLowerR = avg(LMK.RIGHT_EYE_LOWER);
    const eyeW_R = dist(p(LMK.RIGHT_EYE_INNER), p(LMK.RIGHT_EYE_OUTER));
    gate.eyeOpenR = +(Math.abs(eyeLowerR.y - eyeUpperR.y) / (eyeW_R || 1)).toFixed(3);
    gate.rollDeg = +((Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI).toFixed(1);
    const eyeSpan = dist(leftEye, rightEye) || 1;
    const midX = (leftEye.x + rightEye.x) / 2;
    gate.yawRatio = +((noseTip.x - midX) / eyeSpan).toFixed(3);
    const dL = noseTip.x - p(LMK.LEFT_CONTOUR).x;
    const dR = p(LMK.RIGHT_CONTOUR).x - noseTip.x;
    gate.contourAsym = +(((dR - dL) / ((dR + dL) || 1))).toFixed(3);
  } catch { /* 부분 결손 시 가용 값만 */ }

  return {
    crown:        { x: (leftEye.x + rightEye.x) / 2, y: crownY },
    chin,
    leftEye,
    rightEye,
    noseTip,
    leftContour:  p(LMK.LEFT_CONTOUR),
    rightContour: p(LMK.RIGHT_CONTOUR),
    gate,
    imageWidth,
    imageHeight,
  };
}
