"""PF_FACTORY — 소형 LLM 벤치마크 스크립트.

conda run -n factory python benchmark_llm.py
"""

import csv
import gc
import io
import os
import sys
import time
from datetime import datetime, timezone, timedelta

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "300"
os.environ["TRANSFORMERS_OFFLINE"] = "0"

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

KST = timezone(timedelta(hours=9))
TODAY = datetime.now(KST).strftime("%Y-%m-%d")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "benchmarks.csv")

PROMPTS = {
    "kr1": "증명사진 촬영 시 주의사항 3가지를 알려주세요.",
    "kr2": "MONKOS AI 서비스를 한 문장으로 소개해주세요.",
    "en1": "List 3 tips for taking a passport photo.",
}

MODELS = [
    {"id": "Qwen/Qwen2.5-3B-Instruct", "name": "Qwen2.5-3B", "params": "3B", "quant": "fp16"},
    {"id": "microsoft/Phi-3.5-mini-instruct", "name": "Phi-3.5-mini", "params": "3.8B", "quant": "fp16"},
    {"id": "google/gemma-3-4b-it", "name": "Gemma-3-4B-it", "params": "4B", "quant": "fp16"},
]

MAX_NEW_TOKENS = 200


def measure_vram():
    if torch.cuda.is_available():
        return torch.cuda.memory_allocated(0) / 1024**2
    return 0


def benchmark_model(model_info):
    model_id = model_info["id"]
    name = model_info["name"]
    print(f"\n{'='*60}")
    print(f"BENCHMARK: {name} ({model_id})")
    print(f"{'='*60}")

    torch.cuda.empty_cache()
    gc.collect()
    vram_before = measure_vram()

    t0 = time.time()
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
    except Exception as e:
        print(f"[FAIL] Load error: {e}")
        return None

    load_time = time.time() - t0
    vram_after = measure_vram()
    vram_used = vram_after - vram_before

    print(f"  Load time: {load_time:.1f}s")
    print(f"  VRAM: {vram_used:.0f} MB")

    speeds = []
    responses = {}

    for key, prompt in PROMPTS.items():
        messages = [{"role": "user", "content": prompt}]
        try:
            text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        except Exception:
            text = prompt

        inputs = tokenizer(text, return_tensors="pt").to(model.device)
        input_len = inputs["input_ids"].shape[1]

        t1 = time.time()
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                do_sample=False,
                temperature=1.0,
            )
        gen_time = time.time() - t1

        new_tokens = outputs.shape[1] - input_len
        tok_per_sec = new_tokens / gen_time if gen_time > 0 else 0
        speeds.append(tok_per_sec)

        response = tokenizer.decode(outputs[0][input_len:], skip_special_tokens=True)
        responses[key] = response

        print(f"\n  [{key}] {prompt[:40]}...")
        print(f"  -> {new_tokens} tokens in {gen_time:.1f}s ({tok_per_sec:.1f} tok/s)")
        print(f"  -> {response[:150]}...")

    avg_speed = sum(speeds) / len(speeds) if speeds else 0

    del model
    del tokenizer
    torch.cuda.empty_cache()
    gc.collect()

    return {
        "date": TODAY,
        "model_name": name,
        "parameters": model_info["params"],
        "quantization": model_info["quant"],
        "vram_mb": f"{vram_used:.0f}",
        "speed_toks": f"{avg_speed:.1f}",
        "load_time_sec": f"{load_time:.1f}",
        "notes": "",
        "responses": responses,
    }


def append_csv(row):
    csv_row = {k: v for k, v in row.items() if k != "responses"}
    file_exists = os.path.exists(CSV_PATH) and os.path.getsize(CSV_PATH) > 0

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        header = f.readline().strip()

    fields = header.split(",") if header else [
        "date", "model_name", "parameters", "quantization",
        "vram_mb", "speed_toks", "load_time_sec", "notes",
    ]

    with open(CSV_PATH, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        filtered = {k: csv_row.get(k, "") for k in fields}
        writer.writerow(filtered)


def main():
    print(f"[{TODAY}] PF_FACTORY LLM Benchmark Start")
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    results = []
    for m in MODELS:
        try:
            result = benchmark_model(m)
            if result:
                results.append(result)
                append_csv(result)
                print(f"\n  -> CSV appended for {m['name']}")
        except Exception as e:
            print(f"\n[SKIP] {m['name']} failed: {e}")
            torch.cuda.empty_cache()
            gc.collect()

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for r in results:
        print(f"  {r['model_name']}: {r['speed_toks']} tok/s, VRAM {r['vram_mb']}MB")

    return results


if __name__ == "__main__":
    results = main()
    print(f"\n[DONE] {len(results)} models benchmarked")
