#!/usr/bin/env python3
# SCRFD 얼굴 검출 + 106점 랜드마크 사이드카 — crop-engine 내부 전용
# 모델: det_10g.onnx (SCRFD-10GF) + 2d106det.onnx (106점 랜드마크)
# 프로토콜:
#   POST /detect {"image": base64} → {"faces":[{"bbox":[x1,y1,x2,y2],"score":f,"kps":[[x,y]*5]}],"ms":f}
#   POST /landmarks {"image": base64, "bbox": [x1,y1,x2,y2]} → {"landmarks":[[x,y]*106],"count":106,"ms":f}
# 의존: onnxruntime, opencv-python-headless, numpy (전부 프리빌트 휠 — 컴파일 불요)
import json, time, base64, os, sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np
import cv2
import onnxruntime as ort

MODEL = os.environ.get("SCRFD_MODEL", os.path.join(os.path.dirname(__file__), "models", "det_10g.onnx"))
LMK_MODEL = os.environ.get("LMK_MODEL", os.path.join(os.path.dirname(__file__), "models", "2d106det.onnx"))
PORT = int(os.environ.get("SCRFD_PORT", "5001"))
DET_SIZE = 640
THRESH = float(os.environ.get("SCRFD_THRESH", "0.4"))
NMS_IOU = 0.4

session = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name
output_names = [o.name for o in session.get_outputs()]
# det_10g: fmc=3, strides 8/16/32, anchor 2, kps 포함 → 출력 9개 (score×3, bbox×3, kps×3 순)
STRIDES = [8, 16, 32]
NUM_ANCHORS = 2
_center_cache = {}

# 2d106det 랜드마크 모델 (2단 — 교차검증 delta 0.0px 확정, 2026-07-09)
# 정렬: bbox 중심 기반 스케일 (공식 insightface Landmark.get 동일)
# 전처리: mean=0.0, std=1.0 (모델 내부 Sub/Mul 노드로 자체 정규화)
lmk_session = ort.InferenceSession(LMK_MODEL, providers=["CPUExecutionProvider"])
lmk_input_name = lmk_session.get_inputs()[0].name
LMK_INPUT_SIZE = lmk_session.get_inputs()[0].shape[2]  # 192


def predict_landmarks(img, bbox):
    """106점 랜드마크 추론 — bbox 중심 기반 정렬 + 역변환으로 원본 좌표 반환"""
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    cx = (bbox[2] + bbox[0]) / 2.0
    cy = (bbox[3] + bbox[1]) / 2.0
    scale = float(LMK_INPUT_SIZE) / (max(w, h) * 1.5)
    M = np.array([
        [scale, 0, LMK_INPUT_SIZE / 2.0 - cx * scale],
        [0, scale, LMK_INPUT_SIZE / 2.0 - cy * scale]
    ], dtype=np.float64)
    aligned = cv2.warpAffine(img, M, (LMK_INPUT_SIZE, LMK_INPUT_SIZE), borderValue=0.0)
    blob = cv2.dnn.blobFromImage(aligned, 1.0, (LMK_INPUT_SIZE, LMK_INPUT_SIZE),
                                 (0.0, 0.0, 0.0), swapRB=True)
    pred = lmk_session.run(None, {lmk_input_name: blob})[0][0]
    pts = pred.reshape(-1, 2)
    pts[:, 0:2] += 1
    pts[:, 0:2] *= (LMK_INPUT_SIZE // 2)
    IM = cv2.invertAffineTransform(M)
    ones = np.ones((pts.shape[0], 1), dtype=np.float32)
    original = np.hstack([pts, ones]) @ IM.T
    return original.tolist()


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


def detect(img):
    H, W = img.shape[:2]
    scale = min(DET_SIZE / W, DET_SIZE / H)
    nw, nh = int(round(W * scale)), int(round(H * scale))
    resized = cv2.resize(img, (nw, nh))
    canvas = np.zeros((DET_SIZE, DET_SIZE, 3), dtype=np.uint8)
    canvas[:nh, :nw] = resized
    blob = cv2.dnn.blobFromImage(canvas, 1.0 / 128, (DET_SIZE, DET_SIZE), (127.5, 127.5, 127.5), swapRB=True)
    outs = session.run(output_names, {input_name: blob})
    scores_list, bboxes_list, kps_list = [], [], []
    fmc = len(STRIDES)
    for idx, stride in enumerate(STRIDES):
        scores = outs[idx].reshape(-1)
        bbox_pred = outs[idx + fmc].reshape(-1, 4) * stride
        kps_pred = outs[idx + fmc * 2].reshape(-1, 10) * stride
        h, w = DET_SIZE // stride, DET_SIZE // stride
        centers = _centers(h, w, stride)
        pos = np.where(scores >= THRESH)[0]
        if pos.size == 0:
            continue
        c, b, k, s = centers[pos], bbox_pred[pos], kps_pred[pos], scores[pos]
        boxes = np.stack([c[:, 0] - b[:, 0], c[:, 1] - b[:, 1], c[:, 0] + b[:, 2], c[:, 1] + b[:, 3]], axis=-1)
        kps = k.reshape(-1, 5, 2)
        kps = np.stack([c[:, 0, None] + kps[:, :, 0], c[:, 1, None] + kps[:, :, 1]], axis=-1)
        scores_list.append(s)
        bboxes_list.append(boxes)
        kps_list.append(kps)
    if not scores_list:
        return []
    scores = np.concatenate(scores_list)
    boxes = np.concatenate(bboxes_list) / scale
    kpss = np.concatenate(kps_list) / scale
    dets = np.hstack([boxes, scores[:, None]]).astype(np.float32)
    keep = _nms(dets, NMS_IOU)
    faces = []
    for i in keep:
        x1, y1, x2, y2, s = dets[i]
        faces.append({
            "bbox": [float(max(0, x1)), float(max(0, y1)), float(min(W, x2)), float(min(H, y2))],
            "score": float(s),
            "kps": [[float(px), float(py)] for px, py in kpss[i]],
        })
    faces.sort(key=lambda f: f["score"], reverse=True)
    return faces


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            return self._json(200, {"ok": True, "model": os.path.basename(MODEL),
                                    "lmk": os.path.basename(LMK_MODEL)})
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path not in ("/detect", "/landmarks"):
            return self._json(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n))
            raw = base64.b64decode(payload["image"].split(",")[-1])
            img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return self._json(400, {"error": "decode 실패 (HEIC 등 미지원 포맷)", "code": "DECODE_FAILED"})
            t0 = time.time()
            if self.path == "/detect":
                faces = detect(img)
                self._json(200, {"faces": faces, "ms": round((time.time() - t0) * 1000, 1),
                                 "imageSize": {"width": int(img.shape[1]), "height": int(img.shape[0])}})
            else:
                bbox = payload["bbox"]
                lmk = predict_landmarks(img, bbox)
                self._json(200, {"landmarks": lmk, "count": len(lmk),
                                 "ms": round((time.time() - t0) * 1000, 1)})
        except Exception as e:
            self._json(500, {"error": str(e)})


if __name__ == "__main__":
    print(f"[scrfd] ready model={os.path.basename(MODEL)} lmk={os.path.basename(LMK_MODEL)} port={PORT}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
