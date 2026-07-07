import sys, time, os
import numpy as np
import onnxruntime as ort
from PIL import Image

src_path = sys.argv[1]
model_path = sys.argv[2]
out_prefix = sys.argv[3]

img = Image.open(src_path).convert("RGB")
W, H = img.size

x = np.array(img.resize((1024, 1024), Image.LANCZOS), dtype=np.float32) / 255.0
mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
x = ((x - mean) / std).transpose(2, 0, 1)[None]

import resource
mem_before = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

t0 = time.time()
sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
t1 = time.time()
out = sess.run(None, {sess.get_inputs()[0].name: x})
t2 = time.time()

mem_after = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

pred = out[0][0][0]
mask = 1 / (1 + np.exp(-pred))
mask_img = Image.fromarray((mask * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)

m = np.array(mask_img, dtype=np.float32)[..., None] / 255.0
orig = np.array(img, dtype=np.float32)

white = np.full_like(orig, 255.0)
comp_white = orig * m + white * (1 - m)
Image.fromarray(comp_white.astype(np.uint8)).save(f"{out_prefix}_white.png")

gray = np.full_like(orig, 128.0)
comp_gray = orig * m + gray * (1 - m)
Image.fromarray(comp_gray.astype(np.uint8)).save(f"{out_prefix}_gray.png")

model_mb = os.path.getsize(model_path) / (1024 * 1024)
mem_mb = (mem_after - mem_before) / (1024 * 1024) if sys.platform == "darwin" else (mem_after - mem_before) / 1024

print(f"OK {W}x{H}")
print(f"모델크기={model_mb:.0f}MB")
print(f"모델로드={t1-t0:.2f}s")
print(f"추론={t2-t1:.2f}s")
print(f"메모리증분≈{mem_mb:.0f}MB")
