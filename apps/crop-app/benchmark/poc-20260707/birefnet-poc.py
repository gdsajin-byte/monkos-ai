# BiRefNet-portrait ONNX 배경제거 PoC — rembg 전처리 규약(1024², ImageNet 정규화) 동일 적용
import sys, time
import numpy as np
import onnxruntime as ort
from PIL import Image

src_path, out_path = sys.argv[1], sys.argv[2]
img = Image.open(src_path).convert("RGB")
W, H = img.size

x = np.array(img.resize((1024, 1024), Image.LANCZOS), dtype=np.float32) / 255.0
mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
x = ((x - mean) / std).transpose(2, 0, 1)[None]

t0 = time.time()
sess = ort.InferenceSession(sys.argv[3], providers=["CPUExecutionProvider"])
t1 = time.time()
out = sess.run(None, {sess.get_inputs()[0].name: x})
t2 = time.time()

pred = out[0][0][0]  # (1024,1024) logits
mask = 1 / (1 + np.exp(-pred))  # sigmoid
mask_img = Image.fromarray((mask * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)

# 흰 배경 합성 (애플 PoC와 동일 조건)
m = np.array(mask_img, dtype=np.float32)[..., None] / 255.0
orig = np.array(img, dtype=np.float32)
white = np.full_like(orig, 255.0)
comp = orig * m + white * (1 - m)
Image.fromarray(comp.astype(np.uint8)).save(out_path)
print(f"OK {W}x{H} 모델로드={t1-t0:.1f}s 추론={t2-t1:.1f}s")
