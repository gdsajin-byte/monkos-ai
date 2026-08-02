// 측정치 + 관상 DB → 판정·리포트 조립 (순수 함수)
import { computeSaju, elementRelation } from './saju.js';

// bin 판정: min 내림차순 정렬 후 첫 매칭
function pickBin(bins, value) {
  const sorted = [...bins].sort((a, b) => b.min - a.min);
  return sorted.find(b => value >= b.min) ?? sorted[sorted.length - 1];
}

// 삼정 판정: baseline 편차 1·2위 격차(gap) 기반 상대 판정 — 오행형 mixed_gap 패턴 준용.
// 절대 임계로 균형을 먼저 판정하지 않는다. 항상 상대 순위를 먼저 보고,
// 순위 격차가 balanced_gap 미만일 때만 균형으로 떨어진다 (전원 균형 변별력 0 해소).
function classifySamjeong(sj, db) {
  const { s1, s2, s3 } = sj;
  const base = db.samjeong.baseline;
  const devs = [s1, s2, s3].map((v, i) => v - base[i]);
  const order = [0, 1, 2].sort((a, b) => devs[b] - devs[a]);
  const gap = devs[order[0]] - devs[order[1]];
  const key = gap < db.samjeong.balanced_gap
    ? 'balanced'
    : ['upper', 'middle', 'lower'][order[0]];
  return {
    key, ...db.samjeong.bins[key],
    ratios: [s1, s2, s3].map(v => Math.round(v * 100))
  };
}

// 오행형 판정: DB scoring 앵커 기반 연속 점수 최대값, 근접 시 혼합형
function classifyOhaeng(v, db) {
  const sc = db.ohaeng_face.scoring;
  const diff = v.fw_forehead - v.fw_jaw; // 이마-턱 폭 차 (역삼각 지표)
  const scores = {
    wood: (v.aspect - sc.wood.aspect_anchor) / sc.wood.aspect_scale,
    fire: (diff - sc.fire.diff_anchor) / sc.fire.diff_scale,
    metal: ((v.fw_jaw - sc.metal.jaw_anchor) / sc.metal.jaw_scale
      + (sc.metal.aspect_anchor - v.aspect) / sc.metal.aspect_scale) / 2,
    earth: ((sc.earth.aspect_anchor - v.aspect) / sc.earth.aspect_scale
      + 1 - Math.abs(diff) / sc.earth.diff_scale) / 2,
    water: ((sc.water.aspect_anchor - v.aspect) / sc.water.aspect_scale
      + (sc.water.jaw_anchor - v.fw_jaw) / sc.water.jaw_scale) / 2
  };
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [mainKey, mainScore] = ranked[0];
  const [subKey, subScore] = ranked[1];
  const mixed = mainScore - subScore < sc.mixed_gap;
  return {
    key: mainKey, ...db.ohaeng_face.types[mainKey],
    mixed, subKey: mixed ? subKey : null,
    subLabel: mixed ? db.ohaeng_face.types[subKey].label : null,
    scores
  };
}

// 측정치 표시 포맷
function fmtValue(metricId, values) {
  const v = values[metricId];
  if (metricId === 'symmetry') return `${v}점`;
  if (metricId.endsWith('_angle') || metricId === 'brow_angle') return `${v.toFixed(1)}°`;
  return v.toFixed(3);
}

// 메인: 전체 리포트 조립
export function buildReport(metrics, db, birthDate) {
  const v = metrics.values;

  const features = db.features.map(f => {
    const value = f.metric === 'symmetry' ? v.symmetry : v[f.metric];
    const bin = pickBin(f.bins, value);
    return {
      id: f.id, part: f.part, palace: f.palace, metric: f.metric,
      valueDisplay: fmtValue(f.metric, v),
      bin
    };
  });

  const samjeong = classifySamjeong(v.samjeong, db);
  const ohaeng = classifyOhaeng(v, db);

  // 사주 + 관상오행 궁합 (생일 입력 시)
  const saju = computeSaju(birthDate, db.saju);
  const relation = saju ? elementRelation(ohaeng.key, saju.dayElement, db.saju) : null;

  // 취업 인상 종합: 각 판정의 career 문장 중 상위 노출용 추림
  const careerTips = [
    samjeong.career,
    ohaeng.career,
    ...features.filter(f => ['forehead_w', 'eye_tail', 'lip_corner', 'symmetry'].includes(f.id)).map(f => f.bin.career)
  ];

  return { features, samjeong, ohaeng, saju, relation, careerTips, quality: metrics.quality, values: v };
}
