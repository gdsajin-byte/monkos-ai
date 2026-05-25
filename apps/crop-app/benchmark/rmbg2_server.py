from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from transformers import AutoModelForImageSegmentation
from torchvision import transforms
from PIL import Image
import torch
import io
import time

app = Flask(__name__)
CORS(app)

model = AutoModelForImageSegmentation.from_pretrained(
    'briaai/RMBG-2.0', trust_remote_code=True
)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = model.to(device).eval()

transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    t0 = time.time()

    if 'file' in request.files:
        img = Image.open(request.files['file']).convert('RGB')
    else:
        img = Image.open(io.BytesIO(request.get_data())).convert('RGB')

    orig_size = img.size
    input_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid()

    mask = transforms.functional.resize(preds[0], list(reversed(orig_size)))
    mask = (mask > 0.5).float()

    img_rgba = img.copy().convert('RGBA')
    alpha = transforms.functional.to_pil_image(mask.squeeze(), mode='L')
    img_rgba.putalpha(alpha)

    buf = io.BytesIO()
    img_rgba.save(buf, format='PNG')
    buf.seek(0)

    elapsed = time.time() - t0
    print(f'처리 완료: {elapsed:.2f}s ({device})')

    return send_file(buf, mimetype='image/png')

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'device': device, 'model': 'RMBG-2.0'})

if __name__ == '__main__':
    print(f'RMBG-2.0 서버: http://0.0.0.0:5000 (device: {device})')
    app.run(host='0.0.0.0', port=5000)
