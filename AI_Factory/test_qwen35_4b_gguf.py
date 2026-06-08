"""
Qwen 3.5 4B GGUF (Q4_K_M) 온디바이스 테스트 — llama.cpp 기반
지시서: ORDER_20260608_iMac쌍아_4060쌍아_Qwen3.5_4B_온디바이스테스트.md
"""

import json
import os
import subprocess
import time

LLAMA_CLI = "c:/tmp/llama-cpp/llama-cli.exe"
MODEL_PATH = "c:/tmp/qwen35-4b-q4km.gguf"
OUTPUT_DIR = "AI_Factory/test_outputs/qwen35_4b"
TORCH_LIB = os.path.abspath(".venv_factory/Lib/site-packages/torch/lib")

ENV = os.environ.copy()
ENV["PATH"] = f"c:\\tmp\\llama-cpp;{TORCH_LIB};" + ENV.get("PATH", "")


def run_prompt(prompt, max_tokens=512):
    cmd = [
        LLAMA_CLI,
        "-m", MODEL_PATH,
        "-ngl", "99",
        "-c", "2048",
        "-n", str(max_tokens),
        "--temp", "0",
        "-p", prompt,
        "--no-display-prompt",
    ]
    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True, env=ENV, timeout=120)
    elapsed = round(time.time() - start, 2)
    output = result.stdout.strip()
    stderr = result.stderr

    tokens_per_sec = 0.0
    vram_mb = 0.0
    for line in stderr.split("\n"):
        if "eval time" in line and "token" in line:
            parts = line.strip().split()
            for i, p in enumerate(parts):
                if "token" in p and i > 0:
                    try:
                        tokens_per_sec = float(parts[i-1].replace("(", ""))
                    except ValueError:
                        pass
        if "VRAM used" in line:
            try:
                vram_mb = float(line.split("VRAM used:")[1].split("MiB")[0].strip())
            except (IndexError, ValueError):
                pass

    return output, elapsed, tokens_per_sec, stderr


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("Qwen 3.5 4B (Q4_K_M GGUF) 온디바이스 벤치마크")
    print("=" * 60)

    results = {}

    scenarios = [
        {
            "key": "seo",
            "label": "SEO 제안",
            "max_tokens": 300,
            "prompt": """당신은 SEO 전문가입니다. 아래 블로그 제목에 대해 JSON 형식으로 SEO 메타데이터를 생성하세요.

제목: "증명사진 배경색 완벽 가이드 — 흰색, 파란색, 회색 언제 쓸까"

반드시 아래 JSON 형식으로만 응답하세요:
{"summary": "160자 이내 요약", "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"], "ogTitle": "60자 이내 OG 제목"}""",
        },
        {
            "key": "image_prompt",
            "label": "이미지 프롬프트",
            "max_tokens": 300,
            "prompt": """You are an image prompt engineer for Google Imagen. Generate an English image prompt based on the following blog post info.

Title: "증명사진 배경색 완벽 가이드"
Keywords: passport photo, background color, white, blue, gray
Category: photography guide

Requirements:
- English only
- Under 200 words
- Optimized for Imagen API
- Professional, clean style

Respond with ONLY the image prompt, nothing else.""",
        },
        {
            "key": "outline",
            "label": "글감 정리",
            "max_tokens": 500,
            "prompt": """당신은 전문 블로거입니다. 아래 에피소드 정보를 바탕으로 블로그 개요를 작성하세요.

에피소드:
- 제목: AI 증명사진의 배경색 자동 변환 기술
- 요약: ML Kit로 얼굴을 인식하고 Subject Segmentation으로 배경을 분리한 뒤, 사용자가 선택한 색상으로 배경을 교체하는 파이프라인
- 인사이트: 모바일에서 실시간 처리가 가능하며, 기존 사진관 대비 90% 비용 절감

아래 구조로 블로그 개요를 작성하세요:
1. 제목 (클릭을 유도하는 매력적인 제목)
2. 서론 (2-3문장)
3. 본문 섹션 3개 (각 섹션 제목 + 핵심 포인트 2-3개)
4. 결론 (핵심 메시지 1문장)""",
        },
        {
            "key": "slug",
            "label": "slug 생성",
            "max_tokens": 50,
            "prompt": """Convert the following Korean blog title to a URL-friendly English slug.

Rules:
- Lowercase only
- Use hyphens between words
- No special characters
- Keep it concise (3-7 words)

Title: "증명사진 배경색 완벽 가이드"

Respond with ONLY the slug, nothing else. Example format: my-blog-post-title""",
        },
    ]

    for i, sc in enumerate(scenarios):
        num = i + 1
        print(f"\n[{num}/4] 시나리오: {sc['label']}")
        output, elapsed, tps, stderr = run_prompt(sc["prompt"], sc["max_tokens"])

        results[sc["key"]] = {
            "output": output[:2000],
            "seconds": elapsed,
            "tokens_per_sec": tps,
        }
        print(f"  시간: {elapsed}초 | tok/s: {tps}")
        print(f"  출력:\n{output[:500]}")
        if "error" in stderr.lower():
            print(f"  [WARN] stderr 에러 감지")

    # save stderr from last run for diagnostics
    with open(f"{OUTPUT_DIR}/last_stderr.txt", "w", encoding="utf-8") as f:
        f.write(stderr)

    results["meta"] = {
        "model": "Qwen3.5-4B-Q4_K_M.gguf",
        "quantization": "Q4_K_M",
        "runtime": "llama.cpp b9553",
        "gpu": "NVIDIA GeForce RTX 4060 8GB",
    }

    with open(f"{OUTPUT_DIR}/results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("결과 요약")
    print("=" * 60)
    print(f"{'시나리오':<16} {'시간(초)':<10} {'tok/s':<10}")
    print("-" * 36)
    for sc in scenarios:
        r = results[sc["key"]]
        print(f"{sc['label']:<16} {r['seconds']:<10} {r['tokens_per_sec']:<10}")

    print(f"\n결과 저장: {OUTPUT_DIR}/results.json")


if __name__ == "__main__":
    main()
