"""
Qwen 3.5 4B (Q4_K_M GGUF) 온디바이스 벤치마크 — llama-server HTTP API
지시서: ORDER_20260608_iMac쌍아_4060쌍아_Qwen3.5_4B_온디바이스테스트.md
"""

import json
import os
import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SERVER_URL = "http://localhost:8090"
OUTPUT_DIR = "AI_Factory/test_outputs/qwen35_4b"


def chat(prompt, max_tokens=512):
    payload = {
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0,
    }
    start = time.time()
    r = requests.post(f"{SERVER_URL}/v1/chat/completions", json=payload, timeout=180)
    elapsed = round(time.time() - start, 2)
    data = r.json()

    choice = data["choices"][0]["message"]
    content = choice.get("content", "")
    reasoning = choice.get("reasoning_content", "")
    usage = data.get("usage", {})
    completion_tokens = usage.get("completion_tokens", 0)
    timings = data.get("timings", {})
    tok_per_sec = round(timings.get("predicted_per_second", 0), 1)

    return content, elapsed, tok_per_sec, completion_tokens, reasoning


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("Qwen 3.5 4B (Q4_K_M) 온디바이스 벤치마크")
    print(f"Server: {SERVER_URL}")
    print("=" * 60)

    # 워밍업
    print("\n[0/4] 워밍업...")
    chat("Say OK", max_tokens=5)

    results = {}
    scenarios = [
        {
            "key": "seo",
            "label": "SEO 제안",
            "max_tokens": 4000,
            "prompt": '당신은 SEO 전문가입니다. 아래 블로그 제목에 대해 JSON 형식으로 SEO 메타데이터를 생성하세요.\n\n제목: "증명사진 배경색 완벽 가이드 — 흰색, 파란색, 회색 언제 쓸까"\n\n반드시 아래 JSON 형식으로만 응답하세요:\n{"summary": "160자 이내 요약", "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"], "ogTitle": "60자 이내 OG 제목"}',
        },
        {
            "key": "image_prompt",
            "label": "이미지 프롬프트",
            "max_tokens": 4000,
            "prompt": 'You are an image prompt engineer for Google Imagen. Generate an English image prompt based on the following blog post info.\n\nTitle: "증명사진 배경색 완벽 가이드"\nKeywords: passport photo, background color, white, blue, gray\nCategory: photography guide\n\nRequirements:\n- English only\n- Under 200 words\n- Optimized for Imagen API\n- Professional, clean style\n\nRespond with ONLY the image prompt, nothing else.',
        },
        {
            "key": "outline",
            "label": "글감 정리",
            "max_tokens": 4000,
            "prompt": '당신은 전문 블로거입니다. 아래 에피소드 정보를 바탕으로 블로그 개요를 작성하세요.\n\n에피소드:\n- 제목: AI 증명사진의 배경색 자동 변환 기술\n- 요약: ML Kit로 얼굴을 인식하고 Subject Segmentation으로 배경을 분리한 뒤, 사용자가 선택한 색상으로 배경을 교체하는 파이프라인\n- 인사이트: 모바일에서 실시간 처리가 가능하며, 기존 사진관 대비 90% 비용 절감\n\n아래 구조로 블로그 개요를 작성하세요:\n1. 제목 (클릭을 유도하는 매력적인 제목)\n2. 서론 (2-3문장)\n3. 본문 섹션 3개 (각 섹션 제목 + 핵심 포인트 2-3개)\n4. 결론 (핵심 메시지 1문장)',
        },
        {
            "key": "slug",
            "label": "slug 생성",
            "max_tokens": 4000,
            "prompt": 'Convert the following Korean blog title to a URL-friendly English slug.\n\nRules:\n- Lowercase only\n- Use hyphens between words\n- No special characters\n- Keep it concise (3-7 words)\n\nTitle: "증명사진 배경색 완벽 가이드"\n\nRespond with ONLY the slug, nothing else. Example format: my-blog-post-title',
        },
    ]

    for i, sc in enumerate(scenarios):
        print(f"\n[{i+1}/4] 시나리오: {sc['label']}")
        content, elapsed, tps, tokens, reasoning = chat(sc["prompt"], sc["max_tokens"])

        results[sc["key"]] = {
            "output": content,
            "seconds": elapsed,
            "tokens_per_sec": tps,
            "completion_tokens": tokens,
            "reasoning_tokens": len(reasoning.split()) if reasoning else 0,
        }
        print(f"  시간: {elapsed}초 | {tps} tok/s | {tokens} tokens")
        print(f"  출력:\n{content[:600]}")

    # VRAM 확인
    try:
        import subprocess
        vram_out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
            text=True
        ).strip()
        vram_mb = int(vram_out)
    except Exception:
        vram_mb = 0

    results["meta"] = {
        "model": "Qwen3.5-4B-Q4_K_M.gguf (unsloth)",
        "quantization": "Q4_K_M",
        "runtime": "llama.cpp b9553 (llama-server)",
        "gpu": "NVIDIA GeForce RTX 4060 8GB",
        "vram_used_mb": vram_mb,
        "thinking_mode": "disabled (/no_think)",
    }

    with open(f"{OUTPUT_DIR}/results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("결과 요약")
    print("=" * 60)
    print(f"VRAM 사용: {vram_mb} MB")
    print(f"{'시나리오':<16} {'시간(초)':<10} {'tok/s':<10} {'tokens':<8}")
    print("-" * 44)
    for sc in scenarios:
        r = results[sc["key"]]
        print(f"{sc['label']:<16} {r['seconds']:<10} {r['tokens_per_sec']:<10} {r['completion_tokens']:<8}")

    print(f"\n결과 저장: {OUTPUT_DIR}/results.json")


if __name__ == "__main__":
    main()
