#!/usr/bin/env python3
"""Head Pose 경량 모델 vs 간접 추정 비교 실측 벤치마크
- 간접 추정: SCRFD + 106점 랜드마크 → pitch/yaw/roll 근사
- 직접 추정: 6DRepNet ONNX 모델 → rotation matrix → euler angles
"""
import os, sys, time, glob, json
import numpy as np
import cv2
import onnxruntime as ort

BASE = os.path.dirname(os.path.abspath(__file__))
CROP_ENGINE = os.path.join(os.path.dirname(BASE), "..", "monkos_AI", "crop-engine")
MODELS_DIR = os.path.join(BASE, "models")
IMAGES_DIR = os.path.join(BASE, "images")
RESULTS_DIR = os.path.join(BASE, "results")

# ── SCRFD + 106점 랜드마크 ──────────────────────────────────────

DET_MODEL = os.path.join(CROP_ENGINE, "models", "det_10g.onnx")
LMK_MODEL = os.path.join(CROP_ENGINE, "models", "2d106det.onnx")
DET_SIZE = 640
THRESH = 0.4
NMS_IOU = 0.4
NUM_ANCHORS = 2
STRIDES = [8, 16, 32]

_center_cache = {}

def _centers(h, w, stride):
    key = (h, w, stride)
    if key not in _center_cache:
        yy, xx = np.mgrid[:h, :w]
        c = np.stack([xx, yy], axis=-1).astype(np.float32) * stride
        c = c.reshape(-1, 2)
        c = np.stack([c] * NUM_ANCHORS, axis=1).reshape(-1, 2)
        _center_cache[key] = c
    return _center_cache[key]

def _nms(dets, iou_thr):
    x1, y1, x2, y2, scores = dets[:, 0], dets[:, 1], dets[:, 2], dets[:, 3], dets[:, 4]
    areas = (x2 - x1 + 1) * (y2 - y1 + 1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1 + 1)
        h = np.maximum(0.0, yy2 - yy1 + 1)
        ovr = (w * h) / (areas[i] + areas[order[1:]] - w * h)
        order = order[1:][ovr <= iou_thr]
    return keep

class FaceDetector:
    def __init__(self):
        self.det = ort.InferenceSession(DET_MODEL, providers=["CPUExecutionProvider"])
        self.det_input = self.det.get_inputs()[0].name
        self.det_outputs = [o.name for o in self.det.get_outputs()]
        self.lmk = ort.InferenceSession(LMK_MODEL, providers=["CPUExecutionProvider"])
        self.lmk_input = self.lmk.get_inputs()[0].name
        self.lmk_size = self.lmk.get_inputs()[0].shape[2]  # 192

    def detect(self, img):
        H, W = img.shape[:2]
        scale = min(DET_SIZE / W, DET_SIZE / H)
        nw, nh = int(round(W * scale)), int(round(H * scale))
        resized = cv2.resize(img, (nw, nh))
        canvas = np.zeros((DET_SIZE, DET_SIZE, 3), dtype=np.uint8)
        canvas[:nh, :nw] = resized
        blob = cv2.dnn.blobFromImage(canvas, 1.0 / 128, (DET_SIZE, DET_SIZE),
                                     (127.5, 127.5, 127.5), swapRB=True)
        outs = self.det.run(self.det_outputs, {self.det_input: blob})
        scores_list, bboxes_list = [], []
        fmc = len(STRIDES)
        for idx, stride in enumerate(STRIDES):
            scores = outs[idx].reshape(-1)
            bbox_pred = outs[idx + fmc].reshape(-1, 4) * stride
            h, w = DET_SIZE // stride, DET_SIZE // stride
            centers = _centers(h, w, stride)
            pos = np.where(scores >= THRESH)[0]
            if pos.size == 0:
                continue
            c, b, s = centers[pos], bbox_pred[pos], scores[pos]
            boxes = np.stack([c[:, 0] - b[:, 0], c[:, 1] - b[:, 1],
                              c[:, 0] + b[:, 2], c[:, 1] + b[:, 3]], axis=-1)
            scores_list.append(s)
            bboxes_list.append(boxes)
        if not scores_list:
            return None
        scores = np.concatenate(scores_list)
        boxes = np.concatenate(bboxes_list) / scale
        dets = np.hstack([boxes, scores[:, None]]).astype(np.float32)
        keep = _nms(dets, NMS_IOU)
        best = keep[0]
        x1, y1, x2, y2, s = dets[best]
        return [max(0, x1), max(0, y1), min(W, x2), min(H, y2)]

    def landmarks(self, img, bbox):
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        cx = (bbox[2] + bbox[0]) / 2.0
        cy = (bbox[3] + bbox[1]) / 2.0
        scale = float(self.lmk_size) / (max(w, h) * 1.5)
        M = np.array([
            [scale, 0, self.lmk_size / 2.0 - cx * scale],
            [0, scale, self.lmk_size / 2.0 - cy * scale]
        ], dtype=np.float64)
        aligned = cv2.warpAffine(img, M, (self.lmk_size, self.lmk_size), borderValue=0.0)
        blob = cv2.dnn.blobFromImage(aligned, 1.0, (self.lmk_size, self.lmk_size),
                                     (0.0, 0.0, 0.0), swapRB=True)
        pred = self.lmk.run(None, {self.lmk_input: blob})[0][0]
        pts = pred.reshape(-1, 2)
        pts[:, 0:2] += 1
        pts[:, 0:2] *= (self.lmk_size // 2)
        IM = cv2.invertAffineTransform(M)
        ones = np.ones((pts.shape[0], 1), dtype=np.float32)
        original = np.hstack([pts, ones]) @ IM.T
        return original

# ── 간접 추정 (106점 랜드마크 기반) ────────────────────────────

LMK_IDX = {
    "CHIN": 0,
    "LEFT_CONTOUR": 1,
    "RIGHT_CONTOUR": 17,
    "LEFT_EYE": [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    "RIGHT_EYE": [87, 88, 89, 90, 91, 92, 93, 94, 95, 96],
    "NOSE_TIP": 86,
    "JAW_BOTTOM": [0, 8, 24, 7, 23, 6, 22],
}

def indirect_estimation(landmarks):
    """106점 랜드마크에서 pitch/yaw/roll 간접 추정"""
    p = lambda i: landmarks[i]
    avg = lambda indices: np.mean([landmarks[i] for i in indices], axis=0)

    left_eye = avg(LMK_IDX["LEFT_EYE"])
    right_eye = avg(LMK_IDX["RIGHT_EYE"])
    nose_tip = p(LMK_IDX["NOSE_TIP"])

    chin = p(LMK_IDX["CHIN"])
    for i in LMK_IDX["JAW_BOTTOM"]:
        pt = p(i)
        if pt[1] > chin[1]:
            chin = pt

    eye_center_y = (left_eye[1] + right_eye[1]) / 2
    eye_center_x = (left_eye[0] + right_eye[0]) / 2

    # Roll: 눈 라인 기울기
    roll_deg = np.degrees(np.arctan2(right_eye[1] - left_eye[1],
                                     right_eye[0] - left_eye[0]))

    # Yaw: 코끝의 좌우 편향 (눈 간 거리 정규화)
    eye_span = np.hypot(right_eye[0] - left_eye[0], right_eye[1] - left_eye[1])
    yaw_ratio = (nose_tip[0] - eye_center_x) / (eye_span if eye_span > 0 else 1)
    yaw_deg = np.degrees(np.arcsin(np.clip(yaw_ratio * 2, -1, 1)))

    # Pitch: 눈~코 / 코~턱 비율
    eye_to_nose = nose_tip[1] - eye_center_y
    nose_to_chin = chin[1] - nose_tip[1]
    if nose_to_chin < 1:
        nose_to_chin = 1
    pitch_ratio = eye_to_nose / nose_to_chin

    # 캘리브레이션: 정면 기준 pitchRatio ≈ 0.85~1.0
    # pitchRatio < 1.0 → 턱 올림 (negative pitch)
    # pitchRatio > 1.0 → 턱 내림 (positive pitch)
    NEUTRAL_RATIO = 0.90
    pitch_deg = (pitch_ratio - NEUTRAL_RATIO) * 45.0

    return {
        "pitch": round(float(pitch_deg), 2),
        "yaw": round(float(yaw_deg), 2),
        "roll": round(float(roll_deg), 2),
        "pitch_ratio": round(float(pitch_ratio), 4),
        "yaw_ratio": round(float(yaw_ratio), 4),
    }

# ── 6DRepNet ONNX 추론 ────────────────────────────────────────

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def rotation_matrix_to_euler(R):
    """ZYX 오일러 각 추출 (degrees)"""
    sy = np.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
    singular = sy < 1e-6
    if not singular:
        x = np.arctan2(R[2, 1], R[2, 2])
        y = np.arctan2(-R[2, 0], sy)
        z = np.arctan2(R[1, 0], R[0, 0])
    else:
        x = np.arctan2(-R[1, 2], R[1, 1])
        y = np.arctan2(-R[2, 0], sy)
        z = 0.0
    return np.degrees(x), np.degrees(y), np.degrees(z)

class HeadPoseModel:
    def __init__(self, model_path, name):
        self.name = name
        self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        inp = self.session.get_inputs()[0]
        self.input_name = inp.name
        self.input_size = tuple(inp.shape[2:][::-1])  # (W, H)
        outs = self.session.get_outputs()
        self.output_names = [o.name for o in outs]
        self.output_shape = outs[0].shape
        self.model_size_mb = os.path.getsize(model_path) / (1024 * 1024)

    def predict(self, img, bbox):
        x1, y1, x2, y2 = [int(v) for v in bbox]
        h, w = img.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        # bbox 확장 (20% 패딩)
        bw, bh = x2 - x1, y2 - y1
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        side = max(bw, bh) * 1.2
        nx1 = int(max(0, cx - side / 2))
        ny1 = int(max(0, cy - side / 2))
        nx2 = int(min(w, cx + side / 2))
        ny2 = int(min(h, cy + side / 2))
        face_crop = img[ny1:ny2, nx1:nx2]

        # 전처리
        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        face_resized = cv2.resize(face_rgb, self.input_size)
        face_norm = face_resized.astype(np.float32) / 255.0
        face_norm = (face_norm - IMAGENET_MEAN) / IMAGENET_STD
        blob = np.transpose(face_norm, (2, 0, 1))[np.newaxis].astype(np.float32)

        # 추론
        t0 = time.perf_counter()
        outputs = self.session.run(self.output_names, {self.input_name: blob})
        elapsed_ms = (time.perf_counter() - t0) * 1000

        R = outputs[0][0]  # 3x3 rotation matrix
        pitch, yaw, roll = rotation_matrix_to_euler(R)

        return {
            "pitch": round(float(pitch), 2),
            "yaw": round(float(yaw), 2),
            "roll": round(float(roll), 2),
            "inference_ms": round(elapsed_ms, 2),
        }

# ── 벤치마크 실행 ──────────────────────────────────────────────

def run_benchmark():
    print("=" * 70)
    print("Head Pose 경량 모델 vs 간접 추정 비교 실측")
    print("=" * 70)

    # 모델 로드
    detector = FaceDetector()
    print(f"[OK] SCRFD + 106점 랜드마크 로드")

    models = []
    for fname, name in [
        ("6drepnet_mobilenetv3s.onnx", "6DRepNet-MobileNetV3s"),
        ("6drepnet_mobilenetv2.onnx", "6DRepNet-MobileNetV2"),
    ]:
        path = os.path.join(MODELS_DIR, fname)
        if os.path.exists(path):
            m = HeadPoseModel(path, name)
            models.append(m)
            print(f"[OK] {name} 로드 ({m.model_size_mb:.1f} MB, input={m.input_size})")

    if not models:
        print("[ERROR] 헤드포즈 모델 없음")
        return

    # 이미지 수집
    images = sorted(glob.glob(os.path.join(IMAGES_DIR, "*.jpg")) +
                    glob.glob(os.path.join(IMAGES_DIR, "*.png")) +
                    glob.glob(os.path.join(IMAGES_DIR, "*.jpeg")))
    print(f"\n테스트 이미지: {len(images)}장")

    results = []

    for img_path in images:
        fname = os.path.basename(img_path)
        img = cv2.imread(img_path)
        if img is None:
            print(f"  [SKIP] {fname}: 로드 실패")
            continue

        # 얼굴 검출
        bbox = detector.detect(img)
        if bbox is None:
            print(f"  [SKIP] {fname}: 얼굴 미검출")
            continue

        # 106점 랜드마크
        t0 = time.perf_counter()
        lmk = detector.landmarks(img, bbox)
        lmk_ms = (time.perf_counter() - t0) * 1000

        # 간접 추정
        t0 = time.perf_counter()
        indirect = indirect_estimation(lmk)
        indirect_ms = (time.perf_counter() - t0) * 1000
        indirect["inference_ms"] = round(lmk_ms + indirect_ms, 2)

        # 모델 추정
        model_results = {}
        for m in models:
            model_results[m.name] = m.predict(img, bbox)

        row = {
            "image": fname,
            "bbox": [round(v, 1) for v in bbox],
            "indirect": indirect,
            "models": model_results,
        }
        results.append(row)

        print(f"\n  [{fname}] bbox={[int(v) for v in bbox]}")
        print(f"    간접추정: pitch={indirect['pitch']:+.1f}° yaw={indirect['yaw']:+.1f}° roll={indirect['roll']:+.1f}° ({indirect['inference_ms']:.1f}ms)")
        for mname, mres in model_results.items():
            print(f"    {mname}: pitch={mres['pitch']:+.1f}° yaw={mres['yaw']:+.1f}° roll={mres['roll']:+.1f}° ({mres['inference_ms']:.1f}ms)")

    if not results:
        print("\n[ERROR] 처리된 이미지 없음")
        return results

    # ── 통계 요약 ──
    print("\n" + "=" * 70)
    print("통계 요약")
    print("=" * 70)

    for m in models:
        pitch_diffs = []
        yaw_diffs = []
        roll_diffs = []
        for r in results:
            ind = r["indirect"]
            mod = r["models"][m.name]
            pitch_diffs.append(abs(ind["pitch"] - mod["pitch"]))
            yaw_diffs.append(abs(ind["yaw"] - mod["yaw"]))
            roll_diffs.append(abs(ind["roll"] - mod["roll"]))

        print(f"\n  간접추정 vs {m.name}:")
        print(f"    pitch MAD: {np.mean(pitch_diffs):.2f}° (max {np.max(pitch_diffs):.2f}°)")
        print(f"    yaw   MAD: {np.mean(yaw_diffs):.2f}° (max {np.max(yaw_diffs):.2f}°)")
        print(f"    roll  MAD: {np.mean(roll_diffs):.2f}° (max {np.max(roll_diffs):.2f}°)")

    # 모델 간 일관성
    if len(models) >= 2:
        print(f"\n  모델 간 일관성 ({models[0].name} vs {models[1].name}):")
        p_d, y_d, r_d = [], [], []
        for r in results:
            m0 = r["models"][models[0].name]
            m1 = r["models"][models[1].name]
            p_d.append(abs(m0["pitch"] - m1["pitch"]))
            y_d.append(abs(m0["yaw"] - m1["yaw"]))
            r_d.append(abs(m0["roll"] - m1["roll"]))
        print(f"    pitch MAD: {np.mean(p_d):.2f}° | yaw MAD: {np.mean(y_d):.2f}° | roll MAD: {np.mean(r_d):.2f}°")

    # 추론 시간
    print(f"\n  추론 시간 (평균):")
    ind_times = [r["indirect"]["inference_ms"] for r in results]
    print(f"    간접추정 (랜드마크 추출 포함): {np.mean(ind_times):.1f} ms")
    for m in models:
        m_times = [r["models"][m.name]["inference_ms"] for r in results]
        print(f"    {m.name}: {np.mean(m_times):.1f} ms (추가 비용)")

    # JSON 결과 저장
    def to_serializable(obj):
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    out_path = os.path.join(RESULTS_DIR, "benchmark_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=to_serializable)
    print(f"\n결과 저장: {out_path}")

    return results


if __name__ == "__main__":
    results = run_benchmark()
