# MONKOS matte 서버 — BiRefNet 배경제거 + 배경색 합성 정본
# (ORDER_20260707 Task A-1: benchmark/birefnet_server.py 규격화 승계)
#
# 의존성: numpy, Pillow + (torch/transformers | onnxruntime) — 웹 프레임워크 불요(stdlib http.server)
#
# 백엔드 2종:
#   torch (기본, 4060 GPU) — HF ZhengPeng7/BiRefNet-portrait, 06/14 캐시 재사용
#   onnx  (CPU/개발용)     — MATTE_ONNX_PATH 의 BiRefNet-portrait.onnx
#
# 기동:
#   MATTE_BACKEND=torch python matte_server.py                    # 4060
#   MATTE_BACKEND=onnx MATTE_ONNX_PATH=... python matte_server.py # M1 개발
#
# API:
#   GET  /health                          → {status, backend, device, model}
#   POST /api/matte {image, bgColor}      → {success, image, meta}
#     image: base64 (RGB), bgColor: "#RRGGBB" (기본 #FFFFFF)
#     출력 image: 배경 합성 완료 PNG base64 (원본 픽셀 보존, 소프트 알파 합성)
import base64
import io
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
from PIL import Image

BACKEND = os.environ.get('MATTE_BACKEND', 'torch')
# MATTE_PORT 우선, 없으면 Cloud Run 규약 PORT, 최종 5100
PORT = int(os.environ.get('MATTE_PORT') or os.environ.get('PORT') or '5100')
HF_MODEL = os.environ.get('MATTE_HF_MODEL', 'ZhengPeng7/BiRefNet-portrait')
ONNX_PATH = os.environ.get('MATTE_ONNX_PATH', '')

# ImageNet 정규화 + 1024² — rembg/BiRefNet 공통 전처리 규약 (poc-20260707 검증치)
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

_infer_lock = threading.Lock()  # 단일 모델 인스턴스 직렬화 (GPU/CPU 공용)

if BACKEND == 'onnx':
    import onnxruntime as ort
    if not ONNX_PATH or not os.path.exists(ONNX_PATH):
        raise SystemExit(f'MATTE_ONNX_PATH 미지정 또는 파일 없음: {ONNX_PATH}')
    print(f'BiRefNet ONNX 로딩: {ONNX_PATH}')
    _sess = ort.InferenceSession(ONNX_PATH, providers=['CPUExecutionProvider'])
    _input_name = _sess.get_inputs()[0].name
    DEVICE = 'cpu(onnx)'
    MODEL_NAME = os.path.basename(ONNX_PATH)

    def predict_mask(img):
        """RGB PIL → 원본 크기 소프트 마스크(0~1 float32)"""
        w, h = img.size
        x = np.array(img.resize((1024, 1024), Image.LANCZOS), dtype=np.float32) / 255.0
        x = ((x - _MEAN) / _STD).transpose(2, 0, 1)[None]
        pred = _sess.run(None, {_input_name: x})[0][0][0]
        mask = 1 / (1 + np.exp(-pred))  # sigmoid
        m = Image.fromarray((mask * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)
        return np.array(m, dtype=np.float32) / 255.0
else:
    import torch
    from torchvision import transforms
    from transformers import AutoModelForImageSegmentation
    print(f'BiRefNet 모델 로딩: {HF_MODEL}')
    _model = AutoModelForImageSegmentation.from_pretrained(HF_MODEL, trust_remote_code=True)
    DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
    _model = _model.float().to(DEVICE).eval()
    MODEL_NAME = HF_MODEL
    _transform = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize(_MEAN.tolist(), _STD.tolist()),
    ])

    def predict_mask(img):
        w, h = img.size
        x = _transform(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            pred = _model(x)[-1].sigmoid()
        mask = transforms.functional.resize(pred[0], [h, w])
        return mask.squeeze().cpu().numpy().astype(np.float32)

print(f'모델 로드 완료 (backend={BACKEND}, device={DEVICE})')


def parse_hex(s):
    s = (s or '#FFFFFF').strip().lstrip('#')
    if len(s) != 6:
        return (255, 255, 255)
    try:
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return (255, 255, 255)


def matte_composite(image_b64, bg_color):
    """base64 원본 → 소프트 알파 매팅 → 배경색 합성 PNG base64 (이진화 금지 — 헤어 경계 보존)"""
    img = Image.open(io.BytesIO(base64.b64decode(image_b64))).convert('RGB')
    with _infer_lock:
        mask = predict_mask(img)
    m = mask[..., None]
    orig = np.array(img, dtype=np.float32)
    bg_arr = np.zeros_like(orig)
    bg_arr[..., 0], bg_arr[..., 1], bg_arr[..., 2] = bg_color
    comp = orig * m + bg_arr * (1 - m)
    buf = io.BytesIO()
    Image.fromarray(comp.astype(np.uint8)).save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode(), img.size


class MatteHandler(BaseHTTPRequestHandler):
    def _send_json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):  # 기본 접근로그 억제 (처리 로그만 출력)
        pass

    def do_GET(self):
        if self.path == '/health':
            return self._send_json(200, {'status': 'ok', 'backend': BACKEND,
                                         'device': DEVICE, 'model': MODEL_NAME})
        self._send_json(404, {'error': 'not found'})

    def do_POST(self):
        if self.path != '/api/matte':
            return self._send_json(404, {'error': 'not found'})
        t0 = time.time()
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length) or b'{}')
        except (ValueError, json.JSONDecodeError) as e:
            return self._send_json(400, {'success': False, 'error': f'JSON 파싱 실패: {e}'})

        image_b64 = body.get('image')
        if not image_b64:
            return self._send_json(400, {'success': False, 'error': 'image(base64) 필수'})
        bg = parse_hex(body.get('bgColor'))

        try:
            out_b64, size = matte_composite(image_b64, bg)
        except Exception as e:
            return self._send_json(500, {'success': False, 'error': f'매팅 실패: {e}'})

        elapsed = round(time.time() - t0, 3)
        print(f'matte 완료: {size[0]}x{size[1]} bg=#{"%02X%02X%02X" % bg} {elapsed}s')
        self._send_json(200, {
            'success': True,
            'image': out_b64,
            'meta': {'elapsedSec': elapsed, 'device': DEVICE, 'backend': BACKEND,
                     'size': f'{size[0]}x{size[1]}'},
        })


if __name__ == '__main__':
    print(f'MONKOS matte 서버: http://0.0.0.0:{PORT} (backend={BACKEND}, device={DEVICE})')
    ThreadingHTTPServer(('0.0.0.0', PORT), MatteHandler).serve_forever()
