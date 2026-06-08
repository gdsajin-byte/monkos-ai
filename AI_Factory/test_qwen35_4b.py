"""
Qwen 3.5 4B 온디바이스 테스트 — 블로그 에디터 시나리오 4종
지시서: ORDER_20260608_iMac쌍아_4060쌍아_Qwen3.5_4B_온디바이스테스트.md
"""

import json
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

MODEL_NAME = "c:/tmp/qwen35-4b-v2"
OUTPUT_DIR = "AI_Factory/test_outputs/qwen35_4b"


def get_vram_mb():
    return round(torch.cuda.memory_allocated(0) / 1024**2, 1)


def get_vram_peak_mb():
    return round(torch.cuda.max_memory_allocated(0) / 1024**2, 1)


def generate(model, tokenizer, prompt, max_new_tokens=512):
    torch.cuda.reset_peak_memory_stats()
    messages = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    start = time.time()
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
        )
    elapsed = round(time.time() - start, 2)

    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    result = tokenizer.decode(new_tokens, skip_special_tokens=True)
    vram_peak = get_vram_peak_mb()

    return result, elapsed, vram_peak


def main():
    print("=" * 60)
    print("Qwen 3.5 4B 온디바이스 벤치마크")
    print("=" * 60)

    # --- 모델 로드 ---
    print(f"\n[1/5] 모델 로드: {MODEL_NAME} (4-bit 양자화)")
    load_start = time.time()
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_quant_type="nf4",
    )
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
    )
    load_time = round(time.time() - load_start, 1)
    vram_after_load = get_vram_mb()
    print(f"  로드 완료: {load_time}초, VRAM: {vram_after_load} MB")

    results = {}

    # --- 시나리오 1: SEO 제안 ---
    print("\n[2/5] 시나리오 1: SEO 제안")
    prompt_seo = """당신은 SEO 전문가입니다. 아래 블로그 제목에 대해 JSON 형식으로 SEO 메타데이터를 생성하세요.

제목: "증명사진 배경색 완벽 가이드 — 흰색, 파란색, 회색 언제 쓸까"

반드시 아래 JSON 형식으로만 응답하세요:
{"summary": "160자 이내 요약", "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"], "ogTitle": "60자 이내 OG 제목"}"""

    out, sec, vram = generate(model, tokenizer, prompt_seo, max_new_tokens=300)
    results["seo"] = {"output": out, "seconds": sec, "vram_peak_mb": vram}
    print(f"  시간: {sec}초 | VRAM peak: {vram} MB")
    print(f"  출력:\n{out[:500]}")

    # --- 시나리오 2: 이미지 프롬프트 ---
    print("\n[3/5] 시나리오 2: 이미지 프롬프트 생성")
    prompt_img = """You are an image prompt engineer for Google Imagen. Generate an English image prompt based on the following blog post info.

Title: "증명사진 배경색 완벽 가이드"
Keywords: passport photo, background color, white, blue, gray
Category: photography guide

Requirements:
- English only
- Under 200 words
- Optimized for Imagen API
- Professional, clean style

Respond with ONLY the image prompt, nothing else."""

    out, sec, vram = generate(model, tokenizer, prompt_img, max_new_tokens=300)
    results["image_prompt"] = {"output": out, "seconds": sec, "vram_peak_mb": vram}
    print(f"  시간: {sec}초 | VRAM peak: {vram} MB")
    print(f"  출력:\n{out[:500]}")

    # --- 시나리오 3: 글감 정리 ---
    print("\n[4/5] 시나리오 3: 글감 정리 (시드 → 블로그 개요)")
    prompt_outline = """당신은 전문 블로거입니다. 아래 에피소드 정보를 바탕으로 블로그 개요를 작성하세요.

에피소드:
- 제목: AI 증명사진의 배경색 자동 변환 기술
- 요약: ML Kit로 얼굴을 인식하고 Subject Segmentation으로 배경을 분리한 뒤, 사용자가 선택한 색상으로 배경을 교체하는 파이프라인
- 인사이트: 모바일에서 실시간 처리가 가능하며, 기존 사진관 대비 90% 비용 절감

아래 구조로 블로그 개요를 작성하세요:
1. 제목 (클릭을 유도하는 매력적인 제목)
2. 서론 (2-3문장)
3. 본문 섹션 3개 (각 섹션 제목 + 핵심 포인트 2-3개)
4. 결론 (핵심 메시지 1문장)"""

    out, sec, vram = generate(model, tokenizer, prompt_outline, max_new_tokens=500)
    results["outline"] = {"output": out, "seconds": sec, "vram_peak_mb": vram}
    print(f"  시간: {sec}초 | VRAM peak: {vram} MB")
    print(f"  출력:\n{out[:800]}")

    # --- 시나리오 4: slug 생성 ---
    print("\n[5/5] 시나리오 4: slug 생성")
    prompt_slug = """Convert the following Korean blog title to a URL-friendly English slug.

Rules:
- Lowercase only
- Use hyphens between words
- No special characters
- Keep it concise (3-7 words)

Title: "증명사진 배경색 완벽 가이드"

Respond with ONLY the slug, nothing else. Example format: my-blog-post-title"""

    out, sec, vram = generate(model, tokenizer, prompt_slug, max_new_tokens=50)
    results["slug"] = {"output": out, "seconds": sec, "vram_peak_mb": vram}
    print(f"  시간: {sec}초 | VRAM peak: {vram} MB")
    print(f"  출력: {out.strip()}")

    # --- 결과 저장 ---
    results["meta"] = {
        "model": MODEL_NAME,
        "torch_version": torch.__version__,
        "gpu": torch.cuda.get_device_name(0),
        "vram_total_mb": round(torch.cuda.get_device_properties(0).total_memory / 1024**2),
        "vram_after_load_mb": vram_after_load,
        "load_time_sec": load_time,
    }

    with open(f"{OUTPUT_DIR}/results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("결과 요약")
    print("=" * 60)
    print(f"모델 로드: {load_time}초 | VRAM(로드 후): {vram_after_load} MB")
    print(f"{'시나리오':<16} {'시간(초)':<10} {'VRAM peak(MB)':<15}")
    print("-" * 41)
    for key, label in [("seo", "SEO 제안"), ("image_prompt", "이미지 프롬프트"), ("outline", "글감 정리"), ("slug", "slug 생성")]:
        r = results[key]
        print(f"{label:<16} {r['seconds']:<10} {r['vram_peak_mb']:<15}")

    print(f"\n결과 저장: {OUTPUT_DIR}/results.json")


if __name__ == "__main__":
    main()
