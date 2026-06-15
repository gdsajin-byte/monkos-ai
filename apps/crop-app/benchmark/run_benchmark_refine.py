"""BiRefNet raw vs refined benchmark"""
import sys
import io as sysio
sys.stdout = sysio.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = sysio.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import json
import os
import base64
import io

API = "http://localhost:5001"
IMAGES_DIR = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "idpass-android", "app", "src", "main", "assets", "images"
)

TEST_IMAGES = [
    ("ID_Photosample.jpg", "증명사진 (단색 배경)"),
    ("be_f_1.jpg", "인물 (배경 있음)"),
    ("bg_cr_f_1.jpg", "크롭된 배경"),
]

def run():
    print("=" * 70)
    print("BiRefNet raw vs refined 벤치마크 — RTX 4060")
    print("=" * 70)

    health = requests.get(f"{API}/health").json()
    print(f"모델: {health['model']} ({health['device']})\n")

    # 웜업
    warmup_path = os.path.join(IMAGES_DIR, TEST_IMAGES[0][0])
    if os.path.exists(warmup_path):
        print("웜업...")
        with open(warmup_path, "rb") as f:
            requests.post(f"{API}/benchmark", files={"file": f})
        with open(warmup_path, "rb") as f:
            requests.post(f"{API}/benchmark?refine=true", files={"file": f})
        print("웜업 완료\n")

    output_dir = os.path.join(os.path.dirname(__file__), "refine_outputs")
    os.makedirs(output_dir, exist_ok=True)

    results = []

    for filename, desc in TEST_IMAGES:
        path = os.path.join(IMAGES_DIR, filename)
        if not os.path.exists(path):
            print(f"SKIP: {filename}")
            continue

        print(f"[{desc}] {filename}")

        # raw
        with open(path, "rb") as f:
            r1 = requests.post(f"{API}/benchmark", files={"file": f})
        j1 = r1.json()

        # refined
        with open(path, "rb") as f:
            r2 = requests.post(f"{API}/benchmark?refine=true", files={"file": f})
        j2 = r2.json()

        print(f"  raw:     추론 {j1['infer_sec']}s, 총 {j1['elapsed_sec']}s")
        print(f"  refined: 추론 {j2['infer_sec']}s + 후처리 {j2['refine_sec']}s = 총 {j2['elapsed_sec']}s")
        print()

        # 저장
        stem = os.path.splitext(filename)[0]
        for tag, data in [("raw", j1), ("refined", j2)]:
            img_bytes = base64.b64decode(data["result_png_b64"])
            out_path = os.path.join(output_dir, f"{stem}_{tag}.png")
            with open(out_path, "wb") as f:
                f.write(img_bytes)

        results.append({
            "filename": filename,
            "description": desc,
            "input_size": j1["input_size"],
            "raw_infer_sec": j1["infer_sec"],
            "raw_total_sec": j1["elapsed_sec"],
            "refined_infer_sec": j2["infer_sec"],
            "refined_refine_sec": j2["refine_sec"],
            "refined_total_sec": j2["elapsed_sec"],
            "refine_overhead_sec": round(j2["elapsed_sec"] - j1["elapsed_sec"], 3),
        })

    # 요약
    print("=" * 70)
    print(f"{'파일명':<22} {'raw 총':<10} {'refined 총':<12} {'후처리':<10} {'오버헤드':<10}")
    print("-" * 70)
    for r in results:
        print(f"{r['filename']:<22} {r['raw_total_sec']:<10} {r['refined_total_sec']:<12} {r['refined_refine_sec']:<10} {r['refine_overhead_sec']:<10}")

    if results:
        avg_raw = sum(r["raw_total_sec"] for r in results) / len(results)
        avg_ref = sum(r["refined_total_sec"] for r in results) / len(results)
        avg_oh = sum(r["refine_overhead_sec"] for r in results) / len(results)
        print("-" * 70)
        print(f"{'평균':<22} {avg_raw:<10.3f} {avg_ref:<12.3f} {'':10} {avg_oh:<10.3f}")

    report_path = os.path.join(output_dir, "refine_benchmark.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({"results": results}, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장: {report_path}")

if __name__ == "__main__":
    run()
