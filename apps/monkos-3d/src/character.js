import * as THREE from 'three';

/**
 * 몽코스 3D 캐릭터 — SVG 정본(monkos-icon.svg) 기반
 *
 * SVG 좌표계(512×512)를 Three.js 단위로 변환
 * 기준: 머리 반지름 118px → 1.0 단위
 */

const S = 1 / 118; // SVG→3D 스케일 팩터
const PRIMARY = 0xa78bfa;
const DARK = 0x0f0f23;
const WHITE = 0xffffff;
const PINK = 0xe879f9;

// SVG 중심(256) 기준 오프셋 변환
function svgX(x) { return (x - 256) * S; }
function svgY(y) { return -(y - 256) * S; } // Y 반전

export function createMonkosCharacter() {
  const root = new THREE.Group();
  root.name = 'monkos';

  // ── 몸체 (M자 다리) ──
  const body = createBody();
  root.add(body);

  // ── 귀 (S / K) — 머리 뒤에 ──
  const earL = createSEar();
  const earR = createKEar();
  root.add(earL);
  root.add(earR);

  // ── 머리 ──
  const head = createHead();
  root.add(head);

  // ── 발가락 ──
  const toes = createToes();
  root.add(toes);

  // 전체 위치 약간 아래로 (카메라 중앙 맞추기)
  root.position.y = -0.3;

  return root;
}

// ── 머리 (구체) ──
function createHead() {
  const group = new THREE.Group();
  group.name = 'head';

  // 머리 구체
  const headGeo = new THREE.SphereGeometry(1.0, 32, 32);
  const headMat = new THREE.MeshStandardMaterial({
    color: PRIMARY,
    roughness: 0.4,
    metalness: 0.1,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  group.add(headMesh);

  // ── 눈 ──
  const leftEye = createEye();
  leftEye.position.set(svgX(216) * (1 / S) * S, svgY(165) * (1 / S) * S, 0.85);
  leftEye.name = 'eye_left';
  group.add(leftEye);

  const rightEye = createEye();
  rightEye.position.set(svgX(296) * (1 / S) * S, svgY(165) * (1 / S) * S, 0.85);
  rightEye.name = 'eye_right';
  group.add(rightEye);

  // ── 코 (N자) ──
  const nose = createNose();
  group.add(nose);

  // ── 입 (립싱크용) ──
  const mouth = createMouth();
  group.add(mouth);

  // 머리 위치 (SVG cy=185 → 3D y)
  group.position.y = svgY(185) * (1 / S) * S;

  return group;
}

// ── 눈 (4겹 원) ──
function createEye() {
  const group = new THREE.Group();

  // 흰자
  const sclera = new THREE.Mesh(
    new THREE.CircleGeometry(28 * S, 32),
    new THREE.MeshStandardMaterial({ color: WHITE, side: THREE.DoubleSide })
  );
  sclera.position.z = 0;
  group.add(sclera);

  // 홍채
  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(18 * S, 32),
    new THREE.MeshStandardMaterial({
      color: PRIMARY,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    })
  );
  iris.position.z = 0.01;
  group.add(iris);

  // 동공
  const pupil = new THREE.Mesh(
    new THREE.CircleGeometry(10 * S, 32),
    new THREE.MeshStandardMaterial({ color: DARK, side: THREE.DoubleSide })
  );
  pupil.position.z = 0.02;
  group.add(pupil);

  // 하이라이트
  const highlight = new THREE.Mesh(
    new THREE.CircleGeometry(4 * S, 16),
    new THREE.MeshStandardMaterial({ color: WHITE, side: THREE.DoubleSide })
  );
  highlight.position.set(6 * S, 6 * S, 0.03);
  group.add(highlight);

  return group;
}

// ── 코 (N자 라인) ──
function createNose() {
  const points = [
    new THREE.Vector3(svgX(243), svgY(200), 0.9),
    new THREE.Vector3(svgX(243), svgY(220), 0.9),
    new THREE.Vector3(svgX(269), svgY(200), 0.9),
    new THREE.Vector3(svgX(269), svgY(220), 0.9),
  ];
  // 머리 로컬좌표로 보정 (머리 center = svgY(185))
  const headY = svgY(185);
  points.forEach(p => { p.y -= headY; });

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: WHITE, linewidth: 2 });
  const nose = new THREE.Line(geo, mat);
  nose.name = 'nose';
  return nose;
}

// ── 입 (반원 — 립싱크 타겟) ──
function createMouth() {
  const group = new THREE.Group();
  group.name = 'mouth';

  // 반원 형태의 입 — 크게 (립싱크 시인성 확보)
  const shape = new THREE.Shape();
  const w = 35 * S; // 입 너비 절반 (20→35 확대)
  const h = 18 * S;  // 입 높이 (8→18 확대)
  shape.moveTo(-w, 0);
  shape.quadraticCurveTo(0, -h, w, 0);
  shape.quadraticCurveTo(0, h * 0.3, -w, 0);

  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({
    color: PINK,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'mouth_mesh';
  group.add(mesh);

  // 머리 중심 기준, 코 아래
  const headY = svgY(185);
  group.position.set(0, svgY(235) - headY, 0.9);

  return group;
}

// ── S 귀 (좌) — 튜브 곡선 ──
function createSEar() {
  const group = new THREE.Group();
  group.name = 'ear_S';

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(svgX(138), svgY(145), 0),
    new THREE.Vector3(svgX(90), svgY(160), 0),
    new THREE.Vector3(svgX(186), svgY(188), 0),
    new THREE.Vector3(svgX(138), svgY(236), 0),
  );

  const tubeGeo = new THREE.TubeGeometry(curve, 20, 8 * S, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: PRIMARY,
    roughness: 0.4,
    metalness: 0.1,
  });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));
  return group;
}

// ── K 귀 (우) — 직선 + 분기 ──
function createKEar() {
  const group = new THREE.Group();
  group.name = 'ear_K';

  const radius = 8 * S;
  const mat = new THREE.MeshStandardMaterial({
    color: PRIMARY,
    roughness: 0.4,
    metalness: 0.1,
  });

  // 세로선
  const vLine = new THREE.CubicBezierCurve3(
    new THREE.Vector3(svgX(374), svgY(145), 0),
    new THREE.Vector3(svgX(374), svgY(170), 0),
    new THREE.Vector3(svgX(374), svgY(210), 0),
    new THREE.Vector3(svgX(374), svgY(236), 0),
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(vLine, 12, radius, 8, false), mat));

  // 상단 분기
  const topBranch = new THREE.LineCurve3(
    new THREE.Vector3(svgX(374), svgY(188), 0),
    new THREE.Vector3(svgX(415), svgY(150), 0),
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(topBranch, 8, radius * 0.9, 8, false), mat));

  // 하단 분기
  const botBranch = new THREE.LineCurve3(
    new THREE.Vector3(svgX(374), svgY(188), 0),
    new THREE.Vector3(svgX(417), svgY(230), 0),
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(botBranch, 8, radius * 0.9, 8, false), mat));

  return group;
}

// ── 몸체 (M자 다리) ──
function createBody() {
  const group = new THREE.Group();
  group.name = 'body';

  // M자 형태를 간략화: 두 개의 원기둥 다리 + 연결부
  const legMat = new THREE.MeshStandardMaterial({
    color: PRIMARY,
    roughness: 0.4,
    metalness: 0.1,
  });

  // 왼쪽 다리
  const leftLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(22 * S, 20 * S, 120 * S, 16),
    legMat
  );
  leftLeg.position.set(svgX(187), svgY(350), 0);
  leftLeg.name = 'leg_left';
  group.add(leftLeg);

  // 오른쪽 다리
  const rightLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(22 * S, 20 * S, 120 * S, 16),
    legMat
  );
  rightLeg.position.set(svgX(325), svgY(350), 0);
  rightLeg.name = 'leg_right';
  group.add(rightLeg);

  // 연결부 (골반)
  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(160 * S, 30 * S, 40 * S),
    legMat
  );
  pelvis.position.set(0, svgY(295), 0);
  group.add(pelvis);

  return group;
}

// ── 발가락 (6개) ──
function createToes() {
  const group = new THREE.Group();
  group.name = 'toes';

  const toeMat = new THREE.MeshStandardMaterial({
    color: PRIMARY,
    roughness: 0.4,
    metalness: 0.1,
  });
  const toeR = 11 * S;

  // SVG 좌표
  const toePositions = [
    // 왼발
    [175, 424], [192, 428], [209, 424],
    // 오른발
    [313, 424], [330, 428], [347, 424],
  ];

  toePositions.forEach(([x, y], i) => {
    const toe = new THREE.Mesh(
      new THREE.SphereGeometry(toeR, 12, 12),
      toeMat
    );
    toe.position.set(svgX(x), svgY(y), 0);
    toe.name = `toe_${i}`;
    group.add(toe);
  });

  return group;
}
