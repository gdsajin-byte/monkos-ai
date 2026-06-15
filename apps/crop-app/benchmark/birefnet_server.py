from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from transformers import AutoModelForImageSegmentation
from torchvision import transforms
from PIL import Image
import torch
import numpy as np
import io
import time
from refine import refine_mask

app = Flask(__name__)
CORS(app)

print("BiRefNet 모델 로딩 중...")
model = AutoModelForImageSegmentation.from_pretrained(
    'ZhengPeng7/BiRefNet', trust_remote_code=True
)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = model.float().to(device).eval()
print(f"모델 로드 완료 (device: {device})")

if device == 'cuda':
    torch.cuda.reset_peak_memory_stats()

transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

def _predict_mask(img):
    """BiRefNet 추론 → numpy mask (0~1 float) 반환"""
    orig_size = img.size
    input_tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid()
    mask = transforms.functional.resize(preds[0], list(reversed(orig_size)))
    return mask.squeeze().cpu().numpy()

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    if device == 'cuda':
        torch.cuda.reset_peak_memory_stats()

    t0 = time.time()
    do_refine = request.args.get('refine', 'false').lower() == 'true'

    if 'file' in request.files:
        img = Image.open(request.files['file']).convert('RGB')
    else:
        img = Image.open(io.BytesIO(request.get_data())).convert('RGB')

    mask_np = _predict_mask(img)

    if do_refine:
        mask_binary = (mask_np > 0.5).astype(np.float32)
        img_rgba, _ = refine_mask(img, mask_binary)
    else:
        mask_binary = (mask_np > 0.5).astype(np.float32)
        alpha = Image.fromarray((mask_binary * 255).astype(np.uint8), mode='L')
        img_rgba = img.copy().convert('RGBA')
        img_rgba.putalpha(alpha)

    buf = io.BytesIO()
    img_rgba.save(buf, format='PNG')
    buf.seek(0)

    elapsed = time.time() - t0
    vram_mb = torch.cuda.max_memory_allocated() / 1024 / 1024 if device == 'cuda' else 0
    mode_str = 'refined' if do_refine else 'raw'
    print(f'처리 완료 ({mode_str}): {elapsed:.2f}s, VRAM peak: {vram_mb:.0f}MB ({device})')

    return send_file(
        buf, mimetype='image/png',
        download_name='birefnet_result.png',
        as_attachment=False
    )

@app.route('/benchmark', methods=['POST'])
def benchmark():
    """추론 시간 + VRAM을 JSON으로 반환 (벤치마크용)"""
    if device == 'cuda':
        torch.cuda.reset_peak_memory_stats()
        torch.cuda.synchronize()

    do_refine = request.args.get('refine', 'false').lower() == 'true'
    t0 = time.time()

    if 'file' in request.files:
        img = Image.open(request.files['file']).convert('RGB')
    else:
        img = Image.open(io.BytesIO(request.get_data())).convert('RGB')

    orig_size = img.size
    mask_np = _predict_mask(img)

    if device == 'cuda':
        torch.cuda.synchronize()

    t_infer = time.time() - t0

    if do_refine:
        t_ref0 = time.time()
        mask_binary = (mask_np > 0.5).astype(np.float32)
        img_rgba, _ = refine_mask(img, mask_binary)
        t_refine = time.time() - t_ref0
    else:
        t_refine = 0
        mask_binary = (mask_np > 0.5).astype(np.float32)
        alpha = Image.fromarray((mask_binary * 255).astype(np.uint8), mode='L')
        img_rgba = img.copy().convert('RGBA')
        img_rgba.putalpha(alpha)

    buf = io.BytesIO()
    img_rgba.save(buf, format='PNG')
    buf.seek(0)

    elapsed = time.time() - t0
    vram_mb = torch.cuda.max_memory_allocated() / 1024 / 1024 if device == 'cuda' else 0

    import base64
    result_b64 = base64.b64encode(buf.getvalue()).decode()

    return jsonify({
        'elapsed_sec': round(elapsed, 3),
        'infer_sec': round(t_infer, 3),
        'refine_sec': round(t_refine, 3),
        'refined': do_refine,
        'vram_peak_mb': round(vram_mb, 1),
        'input_size': f'{orig_size[0]}x{orig_size[1]}',
        'device': device,
        'model': 'BiRefNet',
        'result_png_b64': result_b64,
    })

@app.route('/health')
def health():
    vram_info = {}
    if device == 'cuda':
        vram_info = {
            'vram_total_mb': round(torch.cuda.get_device_properties(0).total_memory / 1024 / 1024),
            'vram_allocated_mb': round(torch.cuda.memory_allocated() / 1024 / 1024, 1),
            'gpu_name': torch.cuda.get_device_name(0),
        }
    return jsonify({
        'status': 'ok',
        'device': device,
        'model': 'BiRefNet (ZhengPeng7/BiRefNet)',
        'license': 'Apache-2.0',
        **vram_info,
    })

if __name__ == '__main__':
    print(f'BiRefNet 서버: http://0.0.0.0:5001 (device: {device})')
    app.run(host='0.0.0.0', port=5001)
