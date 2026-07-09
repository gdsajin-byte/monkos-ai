---
type: order
date: 2026-07-09
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_SPECS
priority: P1
status: 대기
---

# 지시서: 6DRepNet 사이드카 편입 + precheck/크롭 pitch·yaw 정밀화

**[2026-07-09 13:18 KST]** iMac/쌍아 → 막내

## ⚠️ 준수 조항

- 헌법 4조 1항(비밀정보 보호), 4조 2항(파괴적 명령 금지)
- ch5 2조(배포는 deploy.sh 경유)

## 배경

막내2 R&D 실측 결과(`REPORT_20260709_iMac막내2_HeadPose경량모델_비교실측.md`):
- 106점 간접 추정: **roll 합격(MAD 1°), pitch/yaw 불합격(MAD 13~14°, 대각도 부호반전)**
- 6DRepNet-MobileNetV3s: **5.8MB, 4.3ms/장, pitch MAD 2.35°** — 채택 권고

→ crop-engine 사이드카에 6DRepNet을 편입해 pitch·yaw를 도(°) 단위로 정밀 취득한다.
→ 취득한 값을 precheck 게이트(극단 차단) + 크롭 앵커 보정(pitch 기반)에 활용한다.

## 설계 원칙

- 사이드카 `face_detect_scrfd.py`에 `/headpose` 엔드포인트 추가 (기존 `/detect`, `/landmarks`와 병렬)
- 모델 로딩은 서버 시작 시 1회. 추론은 SCRFD bbox → face crop → 6DRepNet.
- portal/server.js의 precheck에서 `/headpose` 호출하여 정밀 pitch·yaw·roll 취득.

---

## Task 1 — ONNX 모델 배치

### 1-1. 모델 파일 복사

```bash
cp apps/head-pose-benchmark/models/6drepnet_mobilenetv3s.onnx \
   monkos_AI/crop-engine/models/6drepnet_mobilenetv3s.onnx
```

### 1-2. .dockerignore 확인

`models/` 디렉토리가 COPY 대상인지 확인 — 현행 Dockerfile에 `COPY models/ ./models/` 있으므로 추가 조치 없음.

---

## Task 2 — 사이드카 `/headpose` 엔드포인트 추가

파일: `crop-engine/face_detect_scrfd.py`

### 2-1. 모델 로딩 (서버 시작 시)

`lmk_session` 로딩 직후에 추가:

```python
POSE_MODEL = os.environ.get("POSE_MODEL", os.path.join(os.path.dirname(__file__), "models", "6drepnet_mobilenetv3s.onnx"))
pose_session = None
if os.path.exists(POSE_MODEL):
    pose_session = ort.InferenceSession(POSE_MODEL, providers=["CPUExecutionProvider"])
    pose_input_name = pose_session.get_inputs()[0].name
    POSE_INPUT_SIZE = 224
```

### 2-2. 추론 함수

```python
def predict_headpose(img, bbox):
    """6DRepNet: bbox → crop 224×224 → rotation matrix → euler angles (pitch, yaw, roll in degrees)"""
    if pose_session is None:
        return None
    x1, y1, x2, y2 = [int(v) for v in bbox]
    h, w = img.shape[:2]
    # bbox 약간 확장 (10%)
    bw, bh = x2 - x1, y2 - y1
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    sz = max(bw, bh) * 1.1
    nx1 = max(0, int(cx - sz / 2))
    ny1 = max(0, int(cy - sz / 2))
    nx2 = min(w, int(cx + sz / 2))
    ny2 = min(h, int(cy + sz / 2))
    face = img[ny1:ny2, nx1:nx2]
    if face.size == 0:
        return None
    face = cv2.resize(face, (POSE_INPUT_SIZE, POSE_INPUT_SIZE))
    # ImageNet 정규화
    face = face.astype(np.float32) / 255.0
    face = (face - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    face = face.transpose(2, 0, 1)[np.newaxis]  # NCHW
    out = pose_session.run(None, {pose_input_name: face})[0][0]  # 3×3 rotation matrix
    # rotation matrix → euler angles (ZYX convention)
    pitch = float(np.degrees(np.arctan2(-out[2][0], np.sqrt(out[0][0]**2 + out[1][0]**2))))
    yaw = float(np.degrees(np.arctan2(out[1][0], out[0][0])))
    roll = float(np.degrees(np.arctan2(out[2][1], out[2][2])))
    return {"pitch": round(pitch, 1), "yaw": round(yaw, 1), "roll": round(roll, 1)}
```

### 2-3. 엔드포인트 라우팅

`do_POST`에서 경로 허용 목록 + 핸들러 추가:

```python
def do_POST(self):
    if self.path not in ("/detect", "/landmarks", "/headpose"):
        return self._json(404, {"error": "not found"})
    ...
    elif self.path == "/headpose":
        bbox = payload.get("bbox")
        if not bbox:
            # bbox 없으면 자동 검출 (최대 얼굴)
            faces = detect(img)
            if not faces:
                return self._json(200, {"pose": None, "reason": "no_face"})
            bbox = faces[0]["bbox"]
        pose = predict_headpose(img, bbox)
        self._json(200, {"pose": pose, "ms": round((time.time() - t0) * 1000, 1)})
```

### 2-4. health 응답 갱신

```python
def do_GET(self):
    if self.path == "/health":
        return self._json(200, {"ok": True, "model": os.path.basename(MODEL),
                                "lmk": os.path.basename(LMK_MODEL),
                                "pose": os.path.basename(POSE_MODEL) if pose_session else "off"})
```

---

## Task 3 — portal precheck에서 `/headpose` 호출

파일: `portal/server.js` — `/api/idphoto/precheck` 엔드포인트

현행 490행 부근, 5점 kps로 roll/yaw 간접 추정하는 블록을 **6DRepNet 정밀값으로 교체**.

### 3-1. headpose 호출

기존 SCRFD `/detect` 호출 직후, 얼굴이 검출된 경우:

```javascript
// 6DRepNet 정밀 포즈 (5점 kps 간접추정 교체)
let posePitch = null, poseYaw = null, poseRoll = null;
try {
  const poseRes = await fetch(`${CROP_ENGINE_URL}/headpose`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: norm.b64, bbox: [x1, y1, x2, y2] }),
    signal: AbortSignal.timeout(10000),
  }).then(r => r.json());
  if (poseRes.pose) {
    posePitch = poseRes.pose.pitch;
    poseYaw = poseRes.pose.yaw;
    poseRoll = poseRes.pose.roll;
  }
} catch (pe) {
  slog(`[IDPhoto][precheck] headpose 불가 (${pe.message}) → 5점 kps 폴백`);
}
```

### 3-2. 게이트 교체

기존 5점 kps 간접추정 게이트를 6DRepNet 값으로 교체. 5점 kps는 폴백:

```javascript
// 포즈 게이트 — 6DRepNet 우선, 불가 시 5점 kps 폴백
const effectiveRoll = poseRoll !== null ? poseRoll : rollDeg;
const effectiveYaw = poseYaw !== null ? poseYaw : (yawRatio !== null ? Math.asin(Math.min(1, Math.abs(yawRatio) * 2)) * 180 / Math.PI * Math.sign(yawRatio) : null);
const effectivePitch = posePitch;  // 간접추정 pitch는 불합격 → 폴백 없음

if (measurable && effectiveRoll !== null && Math.abs(effectiveRoll) > 8) {
  measurable = false; reason = 'head_tilted';
}
if (measurable && effectiveYaw !== null && Math.abs(effectiveYaw) > 15) {
  measurable = false; reason = 'not_frontal';
}
if (measurable && effectivePitch !== null && Math.abs(effectivePitch) > 20) {
  measurable = false; reason = effectivePitch > 0 ? 'chin_too_low' : 'chin_too_high';
}
```

### 3-3. 로그 갱신

```javascript
slog(`[IDPhoto][precheck] 코드게이트 측정성=${measurable}${reason ? `(${reason})` : ''} faces=${nFaces} ` +
  `fbH=${faceRatio !== null ? Math.round(faceRatio * norm.height) : '-'}px ` +
  `bright=${bright} shadow=${shadowDiff} ` +
  `roll=${effectiveRoll} yaw=${effectiveYaw} pitch=${effectivePitch} ` +
  `poseModel=${poseRoll !== null ? '6drep' : 'kps'} ${Date.now() - t0}ms`);
```

### 3-4. 임계값 근거

| 축 | 임계값 | 근거 |
|----|--------|------|
| roll | 8° | 현행 유지 (5점 kps도 합격 — MAD 1°) |
| yaw | 15° | 6DRepNet 도(°) 직접 출력. 15° ≈ 약간 돌린 상태까지 허용 |
| pitch | 20° | 턱 내밀기/숙이기 여유 있게. 셀카 특성상 ±10~15° 흔함 |

---

## Task 4 — 클라이언트 거부 문구 추가

파일: `portal/lib/cms/render-specs.js` — `reasons` 객체

```javascript
chin_too_low: '턱을 너무 숙이고 있어요. 정면을 바라보고 찍어주세요.',
chin_too_high: '턱을 너무 들고 있어요. 정면을 바라보고 찍어주세요.',
```

---

## Task 5 — crop-engine `/api/fit`에 pose 전달

파일: `crop-engine/server.js` — `/api/fit` 엔드포인트

fit 호출 시 사이드카에서 headpose도 호출하여 응답에 포함:

```javascript
// landmarks 호출 직후
let pose = null;
try {
  const poseRes = await fetch(`http://127.0.0.1:${SCRFD_PORT}/headpose`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64, bbox: [x1, y1, x2, y2] }),
  }).then(r => r.json());
  pose = poseRes.pose;
} catch {}
```

응답 JSON에 `pose` 필드 추가 → 크롭 앵커 동적화(Phase 2)에서 사용할 준비.

---

## 검증

| 케이스 | 기대 결과 |
|--------|----------|
| 정면 셀카 | 통과. 로그에 `poseModel=6drep pitch≈0 yaw≈0` |
| 고개 10° 기울임 | 통과 (roll 8° 이하면) |
| 측면 20° 이상 | `not_frontal` 차단 |
| 턱 심하게 숙임 (>20°) | `chin_too_low` 차단 |
| 턱 심하게 쳐듦 (>20°) | `chin_too_high` 차단 |
| crop-engine 사이드카 미응답 | 5점 kps 폴백으로 정상 동작 |
| `/health` 엔드포인트 | `pose: "6drepnet_mobilenetv3s.onnx"` 표시 |

## 배포

1. crop-engine: `./deploy.sh crop-engine` (또는 해당 deploy 스크립트)
2. portal: `./deploy.sh portal prod`

**순서 중요**: crop-engine 먼저 배포 (사이드카에 `/headpose` 있어야 portal이 호출 가능). portal은 폴백이 있으므로 순서 역전되어도 장애는 없음.
