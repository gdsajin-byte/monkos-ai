---
type: order
date: 2026-07-09
device: M1
agent: 쌍아
target: 막내
portfolio: PF_SPECS
priority: P0
status: 대기
---

# 지시서: InsightFace 2단 — 106점 랜드마크로 FaceMesh 교체

**[2026-07-09 03:06 KST]** M1/쌍아 → 막내

## 배경

7/8 SCRFD 도입(1단)으로 **검출(bbox)** 은 결정론 확보. 그러나 **측량(landmarks)은 여전히 FaceMesh** 경유.

민아 7/9 실측 (`REPORT_20260709_M1민아_fit좌표불안정_실측진단.md`):
- 동일 이미지에 FaceMesh chinY **26.6px 요동** (비결정론)
- 턱 윤곽 9점 max Y = 구조적 하향 바이어스 (목·칼라 위치)
- 크라운 미러(1:1)로 오차 **2배 증폭** → 프레임 높이 진폭 7.7%
- 정합 게이트(eyeChinRatio)가 항등식(≡0.5) → 아무것도 못 거름

`2d106det.onnx`(5MB)는 GCS에 대기 중. SCRFD 사이드카에 추가하여 **검출+측량 모두 InsightFace 일원화**.

## 현행 흐름 vs 목표

```
현행:  SCRFD(bbox) → buildRough → FaceMesh(478점, 비결정) → fitSpecGeometry
목표:  SCRFD(bbox+kps) → 106점 랜드마크(결정론) → fitSpecGeometry
```

portal 코드 변경 없음 — crop-engine 내부에서 FaceMesh를 InsightFace로 교체.

---

## Task 1 — 사이드카 106점 랜드마크 추론 추가

파일: `crop-engine/face_detect_scrfd.py`

### 1-1. 2d106det 모델 로딩 (기동 시 1회)

```python
LMK_MODEL = os.environ.get("LMK_MODEL", os.path.join(os.path.dirname(__file__), "models", "2d106det.onnx"))
lmk_session = ort.InferenceSession(LMK_MODEL, providers=["CPUExecutionProvider"])
lmk_input_name = lmk_session.get_inputs()[0].name
LMK_SIZE = tuple(lmk_session.get_inputs()[0].shape[2:4])  # (192, 192) 예상 — 모델에서 직접 취득
```

### 1-2. 얼굴 정렬 함수 (5점 kps → 정규 얼굴)

106점 모델은 **정렬된 얼굴 입력**을 전제한다. SCRFD가 반환한 5점 kps(좌눈, 우눈, 코, 좌입, 우입)로 유사변환(similarity transform) 적용.

```python
ARCFACE_DST_112 = np.array([
    [38.2946, 51.6963],  # left eye
    [73.5318, 51.5014],  # right eye
    [56.0252, 71.7366],  # nose tip
    [41.5493, 92.3655],  # left mouth corner
    [70.7299, 92.2041],  # right mouth corner
], dtype=np.float32)

def align_face(img, kps_5, target_size):
    dst = ARCFACE_DST_112 * (target_size[0] / 112.0)
    M = cv2.estimateAffinePartial2D(np.array(kps_5, dtype=np.float32), dst, method=cv2.LMEDS)[0]
    aligned = cv2.warpAffine(img, M, target_size, borderValue=(0, 0, 0))
    return aligned, M
```

### 1-3. 추론 + 역변환

```python
def predict_landmarks(img, kps_5):
    aligned, M = align_face(img, kps_5, LMK_SIZE)
    blob = cv2.dnn.blobFromImage(aligned, 1.0/128, LMK_SIZE, (127.5, 127.5, 127.5), swapRB=True)
    pred = lmk_session.run(None, {lmk_input_name: blob})[0]
    pts = pred.reshape(-1, 2)
    # 출력 좌표 범위 확인 필수 — [-1,1] 정규화 또는 [0,SIZE] 픽셀 두 가지 가능성 있음
    # 교차검증(Task 5)으로 확정할 것. 만약 [-1,1]이면:
    #   pts = pts * (LMK_SIZE[0] / 2) + LMK_SIZE[0] / 2
    # 역변환: 정렬 좌표 → 원본 좌표
    IM = cv2.invertAffineTransform(M)
    ones = np.ones((pts.shape[0], 1), dtype=np.float32)
    original = np.hstack([pts, ones]) @ IM.T
    return original.tolist()
```

### 1-4. 새 엔드포인트 `POST /landmarks`

```python
# Handler.do_POST에 추가
if self.path == "/landmarks":
    payload = json.loads(self.rfile.read(n))
    raw = base64.b64decode(payload["image"].split(",")[-1])
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    kps = payload["kps"]  # [[x,y]*5] — SCRFD 반환값
    t0 = time.time()
    lmk = predict_landmarks(img, kps)
    self._json(200, {"landmarks": lmk, "count": len(lmk),
                      "ms": round((time.time() - t0) * 1000, 1)})
```

**health 엔드포인트에도 landmark 모델 상태 추가** (`"lmk": os.path.basename(LMK_MODEL)`).

---

## Task 2 — InsightFace 랜드마크 → anatomy 변환기

새 파일: `crop-engine/lib/face-detect-insight.js`

106점 랜드마크를 기존 `detectFace()` 반환 형식과 동일하게 변환한다. `fitSpecGeometry`는 변경 없이 그대로 사용.

### 2-1. 106점 인덱스 매핑

> **⚠️ 아래 인덱스는 표준 InsightFace 2d106det 기준 — Task 5 교차검증에서 시각 오버레이로 확정 필수.**

```javascript
// 표준 2d106det 랜드마크 맵 (확정 전 — 오버레이 검증으로 보정)
const LMK = {
  CONTOUR: Array.from({length: 33}, (_, i) => i),  // 0-32: 얼굴 윤곽 (좌귀→턱→우귀)
  LEFT_EYE: [52, 53, 54, 55, 56, 57],              // 좌안 6점
  RIGHT_EYE: [58, 59, 60, 61, 62, 63],             // 우안 6점
  NOSE_TIP: 49,                                      // 코끝 (코 하단 5점 중 중앙)
  OUTER_LIP: Array.from({length: 12}, (_, i) => 64 + i),  // 64-75
  INNER_LIP: Array.from({length: 8}, (_, i) => 76 + i),   // 76-83
  LEFT_CONTOUR: 0,   // 좌측 윤곽 끝
  RIGHT_CONTOUR: 32, // 우측 윤곽 끝
};
```

### 2-2. 변환 함수

```javascript
export function insightToAnatomy(landmarks106, imageWidth, imageHeight) {
  const p = (i) => ({ x: landmarks106[i][0], y: landmarks106[i][1] });
  const avg = (indices) => {
    const pts = indices.map(p);
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  };

  const leftEye = avg(LMK.LEFT_EYE);
  const rightEye = avg(LMK.RIGHT_EYE);
  const noseTip = p(LMK.NOSE_TIP);

  // 턱 = 하단 윤곽점 중 최대 Y (인덱스 ~8-24 부근이 턱 하단)
  const jawIndices = LMK.CONTOUR.slice(5, 28); // 귀 부분 제외, 턱 하단만
  let chin = p(jawIndices[0]);
  for (const i of jawIndices) {
    const pt = p(i);
    if (pt.y > chin.y) chin = pt;
  }

  // 정수리 = 눈-턱 1:1 미러 (기존 fitSpecGeometry 동일)
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const crownY = eyeCenterY - (chin.y - eyeCenterY);

  // 게이트 수치
  const gate = {};
  try {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // 입벌림 (내측 입술 수직/입 가로)
    const mouthW = dist(p(LMK.OUTER_LIP[0]), p(LMK.OUTER_LIP[6]));
    const innerTop = p(LMK.INNER_LIP[2]);    // 상내순 중앙 근사
    const innerBot = p(LMK.INNER_LIP[6]);    // 하내순 중앙 근사
    gate.mouthOpen = +(Math.abs(innerBot.y - innerTop.y) / (mouthW || 1)).toFixed(3);
    // 눈뜸 (눈 수직/눈 가로)
    const eyeH_L = Math.abs(p(LMK.LEFT_EYE[1]).y - p(LMK.LEFT_EYE[5]).y);
    const eyeW_L = dist(p(LMK.LEFT_EYE[0]), p(LMK.LEFT_EYE[3]));
    gate.eyeOpenL = +(eyeH_L / (eyeW_L || 1)).toFixed(3);
    const eyeH_R = Math.abs(p(LMK.RIGHT_EYE[1]).y - p(LMK.RIGHT_EYE[5]).y);
    const eyeW_R = dist(p(LMK.RIGHT_EYE[0]), p(LMK.RIGHT_EYE[3]));
    gate.eyeOpenR = +(eyeH_R / (eyeW_R || 1)).toFixed(3);
    // roll (눈선 기울기)
    gate.rollDeg = +((Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI).toFixed(1);
    // yaw (코끝-눈중심선 이탈)
    const eyeSpan = dist(leftEye, rightEye) || 1;
    const midX = (leftEye.x + rightEye.x) / 2;
    gate.yawRatio = +((noseTip.x - midX) / eyeSpan).toFixed(3);
    // 좌우 비대칭
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
```

---

## Task 3 — crop-engine fit-spec에서 FaceMesh→InsightFace 교체

파일: `crop-engine/server.js`

### 3-1. handleFitSpec 수정

```javascript
import { insightToAnatomy } from './lib/face-detect-insight.js';

async function handleFitSpec(req, res) {
  const body = await readBody(req);
  const { image, spec, hairScan } = JSON.parse(body.toString());
  // ... 기존 검증 동일 ...
  const imageBuffer = Buffer.from(image, 'base64');

  // ── InsightFace 경로 (FaceMesh 대체) ──
  let landmarks = null;
  if (scrfdReady) {
    try {
      // 1) SCRFD 검출
      const det = await fetch(`http://127.0.0.1:${SCRFD_PORT}/detect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json());

      if (det.faces && det.faces.length > 0 && det.faces[0].score >= 0.4) {
        // 2) 106점 랜드마크
        const lmk = await fetch(`http://127.0.0.1:${SCRFD_PORT}/landmarks`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, kps: det.faces[0].kps }),
          signal: AbortSignal.timeout(10000),
        }).then(r => r.json());

        if (lmk.landmarks && lmk.landmarks.length === 106) {
          landmarks = insightToAnatomy(lmk.landmarks, det.imageSize.width, det.imageSize.height);
          console.log(`[FitSpec] InsightFace 106점: chin=(${landmarks.chin.y.toFixed(0)}), eye=(${landmarks.leftEye.y.toFixed(0)})`);
        }
      }
    } catch (e) {
      console.error(`[FitSpec] InsightFace 실패 (${e.message}) → FaceMesh 폴백`);
    }
  }

  // FaceMesh 폴백 (InsightFace 실패 시)
  if (!landmarks) {
    landmarks = await detectFace(imageBuffer);
    if (landmarks) console.log('[FitSpec] FaceMesh 폴백 사용');
  }

  if (!landmarks) {
    return sendJSON(res, 200, { success: true, detected: false });
  }

  const fit = await fitSpecGeometry(imageBuffer, landmarks, spec, { hairScan: hairScan !== false });
  sendJSON(res, 200, { success: true, detected: true, gate: landmarks.gate || null, ...fit });
}
```

### 3-2. 기존 FaceMesh 코드 유지 (폴백)

`face-detect.js`와 `initFaceDetector()`는 삭제하지 않는다. InsightFace 실패 시 폴백으로 유지. 안정 확인 후 별도 지시서로 제거.

---

## Task 4 — portal fit Gemini 비전 퇴출

파일: `portal/server.js` `/api/idphoto/fit` 엔드포인트 (line ~393-452 부근)

### 현행 (비결정 요소)

```javascript
// ③ Gemini 비전 = 전문가 심미 대행
// hair_touching_top true/false 요동 → 프레임 y 18px 차이
```

### 변경

**③ 블록 전체를 제거**하고 `let vision = null;`만 남긴다.

이유:
1. InsightFace 랜드마크가 결정론이면 기하 추정(hairTopY = crownY - facePx × 0.08)도 안정
2. Gemini 비전이 fit에서 하던 일(hair_touching 판단 + 축소)은 `fitSpecGeometry` 내부의 기하 로직이 이미 수행 (헤어 침범 시 HAIR_MARGIN_MIN 4.4% 재앵커 + 축소)
3. precheck에서 Gemini 퇴출한 것과 같은 원칙: **"판정은 코드"**

**삭제 범위**: `try { const scale = ...` 부터 `} catch (ve) { ... }` 전체 (약 60행). `vision` 변수는 null로 유지 (하위에서 참조).

---

## Task 5 — 교차검증 (착수 전 필수)

1단(det_10g)과 같은 방식: **공식 insightface 패키지 출력과 수제 디코드 출력의 델타 0.0px 확인**.

### 5-1. 검증 스크립트

```python
# verify_106.py (일회성, 배포 대상 아님)
import insightface
from face_detect_scrfd import detect, predict_landmarks
import cv2, numpy as np

app = insightface.app.FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640,640))

for path in ['test1.jpg', 'test2.jpg', 'test3.jpg']:
    img = cv2.imread(path)
    # 공식
    faces = app.get(img)
    official = faces[0].landmark_2d_106
    # 수제
    my_faces = detect(img)
    my_lmk = np.array(predict_landmarks(img, my_faces[0]['kps']))
    # 비교
    delta = np.abs(official - my_lmk)
    print(f'{path}: max_delta={delta.max():.1f}px  mean={delta.mean():.1f}px')
    assert delta.max() < 2.0, f'교차검증 실패: max {delta.max():.1f}px'
```

테스트 이미지 3장: 7/8 실측 때 사용한 GCS 원본 (카우치·밤·정장).

### 5-2. 시각 오버레이

106점을 원본 위에 찍어 **턱·눈·코·입 안착** 육안 확인. 오버레이 이미지를 COMPLETION 보고서에 첨부.

### 5-3. fit 안정성 실측

InsightFace 교체 후 동일 이미지로 `/api/fit-spec` **5회 호출** → frame/lines 완전 동일 확인 (진폭 0px).

---

## Task 6 — Dockerfile + deploy

파일: `crop-engine/Dockerfile`

변경: `COPY face_detect_scrfd.py ./` 행은 이미 존재. 추가 사항 없음 (models/ 폴더에 2d106det.onnx 포함 — deploy.sh GCS 인출).

deploy.sh의 모델 인출 행에 `2d106det.onnx` 추가 확인:
```bash
gsutil cp gs://monkos-models/insightface/2d106det.onnx models/
```

배포: `./deploy.sh production` (crop-engine만. portal은 코드 변경 있을 때만).

---

## 실행 순서

1. **Task 5-1, 5-2** (교차검증) — 수제 디코드가 공식과 일치하는지 먼저 확인
2. **Task 1** (사이드카 /landmarks 엔드포인트)
3. **Task 2** (anatomy 변환기)
4. **Task 3** (fit-spec 교체) → 로컬 테스트
5. **Task 5-3** (fit 안정성 5회 실측) → 진폭 0px 확인
6. **Task 4** (portal Gemini 비전 퇴출) — fit 안정성 확인 후
7. **Task 6** (배포)

portal 변경(Task 4)은 crop-engine 배포·안정 확인 후 별도 배포.

---

## ⚠️ 준수 조항

- deploy.sh 경유 배포 (ch5 2조)
- `.env`, `secrets/` 수정 금지 (헌법 4조 1항)
- 범위 밖 작업 금지 — FaceMesh 코드 삭제, 클라이언트 측 FaceMesh 변경은 별도 지시서
- 106점 인덱스 매핑은 **교차검증 오버레이로 확정 후** 코드에 반영. 추정값으로 배포 금지
- 원본 파일 참조: `face_detect_scrfd.py` (수제 디코드 패턴), `lib/face-detect.js` (anatomy 반환 형식)
- 7/8 실측 보고서: `REPORT_20260708_iMac민아_InsightFace비교실측.md` (SCRFD 교차검증 선례)
- 7/9 진단 보고서: `REPORT_20260709_M1민아_fit좌표불안정_실측진단.md` (본 지시서 근거)
