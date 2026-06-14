"""BiRefNet benchmark - 5 image quality/speed test"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import time
import json
import os
import sys

API = "http://localhost:5001"
IMAGES_DIR = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "idpass-android", "app", "src", "main", "assets", "images"
)

TEST_IMAGES = [
    ("ID_Photosample.jpg", "증명사진 (정면, 단색 배경)"),
    ("be_f_1.jpg", "인물 전신 (배경 있음)"),
    ("bg_f_1.jpg", "복잡한 배경"),
    ("bg_cr_f_1.jpg", "크롭된 배경"),
    ("PASSPORTUSA.jpg", "여권 사진"),
]

def run():
    print("=" * 60)
    print("BiRefNet 벤치마크 — RTX 4060")
    print("=" * 60)

    health = requests.get(f"{API}/health").json()
    print(f"모델: {health['model']}")
    print(f"디바이스: {health['device']} ({health.get('gpu_name', 'N/A')})")
    print(f"VRAM 전체: {health.get('vram_total_mb', 'N/A')}MB")
    print(f"모델 로드 VRAM: {health.get('vram_allocated_mb', 'N/A')}MB")
    print()

    # 웜업 (첫 추론은 CUDA 커널 컴파일 등으로 느림)
    warmup_path = os.path.join(IMAGES_DIR, TEST_IMAGES[0][0])
    if os.path.exists(warmup_path):
        print("웜업 추론 실행 중...")
        with open(warmup_path, "rb") as f:
            requests.post(f"{API}/benchmark", files={"file": f})
        print("웜업 완료\n")

    results = []
    output_dir = os.path.join(os.path.dirname(__file__), "birefnet_outputs")
    os.makedirs(output_dir, exist_ok=True)

    for filename, desc in TEST_IMAGES:
        path = os.path.join(IMAGES_DIR, filename)
        if not os.path.exists(path):
            print(f"SKIP: {filename} 없음")
            continue

        file_size = os.path.getsize(path) / 1024
        print(f"[{desc}] {filename} ({file_size:.0f}KB)")

        with open(path, "rb") as f:
            r = requests.post(f"{API}/benchmark", files={"file": f})

        data = r.json()
        print(f"  추론 시간: {data['elapsed_sec']}s")
        print(f"  VRAM peak: {data['vram_peak_mb']}MB")
        print(f"  입력 크기: {data['input_size']}")

        # 결과 이미지 저장
        import base64
        result_bytes = base64.b64decode(data["result_png_b64"])
        out_name = f"birefnet_{os.path.splitext(filename)[0]}.png"
        out_path = os.path.join(output_dir, out_name)
        with open(out_path, "wb") as f:
            f.write(result_bytes)
        print(f"  저장: {out_name} ({len(result_bytes) / 1024:.0f}KB)")
        print()

        results.append({
            "filename": filename,
            "description": desc,
            "input_size": data["input_size"],
            "file_size_kb": round(file_size),
            "elapsed_sec": data["elapsed_sec"],
            "vram_peak_mb": data["vram_peak_mb"],
        })

    # 요약
    print("=" * 60)
    print("벤치마크 요약")
    print("=" * 60)
    print(f"{'파일명':<25} {'설명':<20} {'시간(s)':<10} {'VRAM(MB)':<10}")
    print("-" * 65)
    for r in results:
        print(f"{r['filename']:<25} {r['description']:<20} {r['elapsed_sec']:<10} {r['vram_peak_mb']:<10}")

    if results:
        avg_time = sum(r["elapsed_sec"] for r in results) / len(results)
        max_vram = max(r["vram_peak_mb"] for r in results)
        print("-" * 65)
        print(f"{'평균/최대':<25} {'':20} {avg_time:<10.3f} {max_vram:<10.1f}")

    # JSON 저장
    report = {
        "model": "BiRefNet (ZhengPeng7/BiRefNet)",
        "license": "MIT",
        "device": health["device"],
        "gpu": health.get("gpu_name", "N/A"),
        "vram_total_mb": health.get("vram_total_mb", "N/A"),
        "model_vram_mb": health.get("vram_allocated_mb", "N/A"),
        "results": results,
        "avg_elapsed_sec": round(avg_time, 3) if results else None,
        "max_vram_peak_mb": max_vram if results else None,
    }
    report_path = os.path.join(output_dir, "benchmark_results.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장: {report_path}")

if __name__ == "__main__":
    run()
