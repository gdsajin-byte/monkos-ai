#!/usr/bin/env node
// paid_crop_sim.mjs — 유료 T1 출고 크롭(crop-engine resolvePlacement) 200건 오프라인 시뮬 (ORDER_20261104 유료크롭_눈45정합)
//
// 입력: fov_compare_v1.jsonl 의 수치 기하(geom: lines·frame0·hairTopRatio·rowPx). 픽셀을 읽지 않는다.
// 무료 = 포털 정본 resolveHeadPlacement(headPlacementSpec 'kr-passport') — 재계산해 레코드 form과 대조.
// 유료 = crop-engine 정본 resolvePlacement. 전 = spec 그대로(기본 0.43), 후 = spec + eyeAnchor(포털 cropSpecRequest와 같은 합성).
//        hairTop = 매팅 덩어리 머리끝(순백 생성물에서 subjectTopRow가 잡을 머리끝의 근사), 포즈 0.
// 대조: --old <구 crop.js> 를 주면 eyeAnchor 생략 결과가 구 엔진과 같은지(하위호환) 전 건 비교한다.
// 한계: 실제 유료 경로는 생성물(나노2)을 재단한다 — 생성물의 머리·얼굴 비율이 원본과 다르면 수치가 달라진다.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const { resolveHeadPlacement, headPlacementSpec, HAIR_MARGIN_SLACK_ROWS, EYE_RATIO_MAX } = await import(path.join(ROOT, 'monkos_AI/portal/lib/hair-measure.js'));
const crop = await import(path.join(ROOT, 'monkos_AI/crop-engine/lib/crop.js'));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const INP = opt('--inp', path.join(os.homedir(), '.monkos/photo_judge/fov_compare_v1.jsonl'));
const OLD = opt('--old', null);
const old = OLD ? await import(path.resolve(OLD)) : null;

const SLUG = 'kr-passport';
// getSpecCropParams('kr-passport') — fov_formula.mjs와 같은 고정 입력(spec-crop.js는 config.js PROJECT_ID 필수라 import 불가)
const SPEC = { frameW: 413, frameH: 531, frameHmm: 45, faceTargetMm: 33, faceMinMm: 32, hairMarginMm: 2, headHeightMinMm: 32, headHeightMaxMm: 36 };
const { HEAD_PLACEMENT_EYE_ANCHOR } = await import(path.join(ROOT, 'monkos_AI/portal/lib/hair-measure.js'));
const SPEC_AFTER = { ...SPEC, eyeAnchor: HEAD_PLACEMENT_EYE_ANCHOR[SLUG] };
const FH = SPEC.frameHmm;

const metrics = (F, L, hair) => {
  const mm = FH / F.h;
  return { head: (L.chinY - hair) * mm, mirror: (L.chinY - L.crownY) * mm, eye: (L.eyeY - F.y) / F.h * 100, top: (hair - F.y) * mm, chin: (F.y + F.h - L.chinY) * mm };
};
const landmarksOf = (g, hair) => {
  const L = g.lines, d = (L.chinY - L.eyeY) * 0.3; // 양 눈 x 간격은 배치에 쓰이지 않는다(중심만)
  return { chin: { y: L.chinY }, leftEye: { x: L.eyeCenterX - d, y: L.eyeY }, rightEye: { x: L.eyeCenterX + d, y: L.eyeY }, imageWidth: g.W, imageHeight: g.H, hairTop: hair };
};
const paidFrame = (fn, g, hair, spec) => {
  const p = fn(landmarksOf(g, hair), spec);
  // renderPlacement와 같은 경계 클램프(렌더 경로) — 원본 밖이면 패딩 경로라 클램프하지 않는다
  const extractTop = p.scaledH >= spec.frameH ? Math.max(0, Math.min(p.extractTop, p.scaledH - spec.frameH)) : p.extractTop;
  const F = { x: p.extractLeft / p.scale, y: extractTop / p.scale, w: spec.frameW / p.scale, h: spec.frameH / p.scale };
  const scale0 = (spec.faceTargetMm * (spec.frameH / spec.frameHmm)) / L2mirrorPx(g);
  const shrink = Math.abs(p.scale - scale0) > 1e-12;                          // ③④ 하단 축소 루프
  return {
    F, p, shrink,
    hairGuard: !shrink && (p.eyeAnchor - p.eyeAnchorTarget) > 1.5 / spec.frameH, // ② 머리 잘림 → 틀을 1px 넘게 올림
    clamp: extractTop !== p.extractTop,                                         // 원본 위 경계에 걸림
    sanityDrop: hair < g.lines.crownY - L2mirrorPx(g) * 0.15,                   // HAIR_VOLUME_MAX 새니티로 hairTop 무시
  };
};
const L2mirrorPx = (g) => g.lines.chinY - g.lines.crownY;

const rows = readFileSync(INP, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.ok && r.geom);
const out = [];
let freeMismatch = 0, oldMismatch = 0;
for (const r of rows) {
  const g = r.geom, hair = g.hairTopRatio * g.H;
  const hp = resolveHeadPlacement({ frame: g.frame0, lines: g.lines, hairTopRatio: g.hairTopRatio, imageHeight: g.H, ...headPlacementSpec(SPEC, SLUG), slackPx: HAIR_MARGIN_SLACK_ROWS * g.rowPx });
  const free = hp.verdict === 'no_room' ? null : hp.frame;
  if (free) { const m = metrics(free, g.lines, hair); if (Math.abs(m.eye - r.form.eye) > 0.02 || Math.abs(m.top - r.form.top) > 0.02) freeMismatch++; }
  const b = paidFrame(crop.resolvePlacement, g, hair, SPEC);
  const a = paidFrame(crop.resolvePlacement, g, hair, SPEC_AFTER);
  if (old) { // 하위호환: eyeAnchor 생략 시 구 엔진과 같은 틀인가 (구 엔진은 resolvePlacement 비export → fitSpecGeometry로 비교)
    const fo = (await old.fitSpecGeometry(null, landmarksOf(g, hair), SPEC)).frame;
    const fn = (await crop.fitSpecGeometry(null, landmarksOf(g, hair), SPEC)).frame;
    if (['x', 'y', 'w', 'h'].some((k) => fo[k] !== fn[k])) oldMismatch++;
  }
  const mm = (F) => metrics(F, g.lines, hair);
  const rec = { id: r.id, verdict: hp.verdict, ship: r.ship, before: { ...mm(b.F), hairGuard: b.hairGuard, shrink: b.shrink, clamp: b.clamp, sanityDrop: b.sanityDrop, src: b.p.eyeAnchorSource ?? 'default' },
    after: { ...mm(a.F), hairGuard: a.hairGuard, shrink: a.shrink, clamp: a.clamp, sanityDrop: a.sanityDrop, src: a.p.eyeAnchorSource } };
  if (free) {
    const fc = free.y + free.h / 2, fmm = FH / free.h;
    rec.free = mm(free);
    rec.dyBefore = ((b.F.y + b.F.h / 2) - fc) * fmm; // + = 유료 틀이 무료보다 아래
    rec.dyAfter = ((a.F.y + a.F.h / 2) - fc) * fmm;
  }
  out.push(rec);
}

const pct = (v, p) => { const s = [...v].sort((x, y) => x - y); const i = (s.length - 1) * p / 100, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const q = (v) => v.length ? [10, 50, 90].map((p) => pct(v, p).toFixed(2)).join(' / ') : '—';
const cnt = (f) => out.filter(f).length;
const withFree = out.filter((r) => r.free);
console.log(`입력 ${rows.length}건 · 무료 통과 ${withFree.length} · 무료 재계산 불일치 ${freeMismatch}${old ? ` · 생략 시 구 엔진 대비 불일치 ${oldMismatch}/${rows.length}` : ''}`);
console.log(`후 앵커 출처: ${JSON.stringify(out.reduce((a, r) => ((a[r.after.src] = (a[r.after.src] || 0) + 1), a), {}))} · 전: ${JSON.stringify(out.reduce((a, r) => ((a[r.before.src] = (a[r.before.src] || 0) + 1), a), {}))}`);
console.log('\n## 유료 vs 무료 (무료 통과건, p10 / p50 / p90)\n');
console.log('| 지표 | 전(유료 0.43) − 무료 | 후(유료 0.45) − 무료 |');
console.log('|---|---|---|');
console.log(`| 틀 중심 세로 차 mm (+=유료 틀이 아래) | ${q(withFree.map((r) => r.dyBefore))} | ${q(withFree.map((r) => r.dyAfter))} |`);
console.log(`| |세로 차| 중앙값 mm | ${pct(withFree.map((r) => Math.abs(r.dyBefore)), 50).toFixed(2)} | ${pct(withFree.map((r) => Math.abs(r.dyAfter)), 50).toFixed(2)} |`);
for (const [k, lab] of [['eye', '눈 %p'], ['top', '머리 위 여백 mm'], ['chin', '턱 아래 mm'], ['head', '실측 두상 mm'], ['mirror', '거울상 mm']]) {
  console.log(`| ${lab} | ${q(withFree.map((r) => r.before[k] - r.free[k]))} | ${q(withFree.map((r) => r.after[k] - r.free[k]))} |`);
}
console.log('\n## 유료 크롭 자체 (전 200 / 후 200)\n');
console.log('| 지표 | 전(0.43) | 후(0.45) | 출고본 |');
console.log('|---|---|---|---|');
console.log(`| 눈 % p10/p50/p90 | ${q(out.map((r) => r.before.eye))} | ${q(out.map((r) => r.after.eye))} | ${q(out.map((r) => r.ship.eye))} |`);
console.log(`| 머리 위 여백 mm | ${q(out.map((r) => r.before.top))} | ${q(out.map((r) => r.after.top))} | ${q(out.map((r) => r.ship.top))} |`);
console.log(`| 턱 아래 mm | ${q(out.map((r) => r.before.chin))} | ${q(out.map((r) => r.after.chin))} | ${q(out.map((r) => r.ship.chin))} |`);
console.log(`| 눈 > ${EYE_RATIO_MAX * 100}% | ${cnt((r) => r.before.eye > EYE_RATIO_MAX * 100 + 1e-6)} | ${cnt((r) => r.after.eye > EYE_RATIO_MAX * 100 + 1e-6)} | ${cnt((r) => r.ship.eye > 48)} |`);
console.log(`| 헤어 가드 발동(② 머리 잘림 → 틀 올림) | ${cnt((r) => r.before.hairGuard)} | ${cnt((r) => r.after.hairGuard)} | — |`);
console.log(`| 하단 축소 루프(③④) | ${cnt((r) => r.before.shrink)} | ${cnt((r) => r.after.shrink)} | — |`);
console.log(`| 머리 위 여백 < 0 (잘림 잔존) | ${cnt((r) => r.before.top < -1e-6)} | ${cnt((r) => r.after.top < -1e-6)} | ${cnt((r) => r.ship.top < 0)} |`);
console.log(`| 원본 위 경계 클램프 | ${cnt((r) => r.before.clamp)} | ${cnt((r) => r.after.clamp)} | — |`);
console.log(`| hairTop 새니티 무시(HAIR_VOLUME_MAX) | ${cnt((r) => r.before.sanityDrop)} | ${cnt((r) => r.after.sanityDrop)} | — |`);
console.log(`\n- 유료−출고 세로: 눈 %p 전 ${q(out.map((r) => r.before.eye - r.ship.eye))} → 후 ${q(out.map((r) => r.after.eye - r.ship.eye))}`);
