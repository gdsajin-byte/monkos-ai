"""PF_FACTORY — HuggingFace/Civitai 모델 추적 스크립트.

매일 실행: 신규/인기 모델 조회 → model_tracking.csv에 append.
4060 8GB VRAM 범위 필터 적용.

사용법:
    python track_models.py              # 전체 추적
    python track_models.py --dry-run    # CSV 미기록, 콘솔 출력만
"""

import csv
import io
import json
import os
import sys
from datetime import datetime, timezone, timedelta

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import requests

KST = timezone(timedelta(hours=9))
TODAY = datetime.now(KST).strftime("%Y-%m-%d")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "model_tracking.csv")

VRAM_LIMIT_GB = 8
MAX_PARAMS_TEXT = 7_000_000_000
MAX_PARAMS_IMAGE = None

HF_API = "https://huggingface.co/api"
CIVITAI_API = "https://civitai.com/api/v1"

CATEGORIES = [
    "text-generation",
    "text-to-image",
    "image-to-image",
]


def fetch_hf_trending(category, limit=10):
    url = f"{HF_API}/models"
    params = {
        "pipeline_tag": category,
        "sort": "likes7d",
        "limit": limit,
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code == 400:
            params["sort"] = "downloads"
            resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[WARN] HF {category} fetch failed: {e}")
        return []


def fetch_civitai_new(limit=10):
    url = f"{CIVITAI_API}/models"
    params = {
        "sort": "Newest",
        "limit": limit,
        "types": "Checkpoint",
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("items", [])
    except Exception as e:
        print(f"[WARN] Civitai fetch failed: {e}")
        return []


def parse_hf_model(model, category):
    model_id = model.get("id", "unknown")
    downloads = model.get("downloads", 0)
    tags = model.get("tags", [])
    license_tag = next((t for t in tags if t.startswith("license:")), "unknown")
    license_name = license_tag.replace("license:", "") if ":" in license_tag else license_tag

    safetensors = model.get("safetensors", {})
    params = None
    if safetensors and "total" in safetensors:
        params = safetensors["total"]
    elif safetensors and "parameters" in safetensors:
        p = safetensors["parameters"]
        if isinstance(p, dict):
            params = sum(p.values())
        else:
            params = p

    param_str = ""
    if params:
        if params >= 1_000_000_000:
            param_str = f"{params / 1_000_000_000:.1f}B"
        elif params >= 1_000_000:
            param_str = f"{params / 1_000_000:.0f}M"
        else:
            param_str = str(params)

    notes = []
    if category == "text-generation" and params and params > MAX_PARAMS_TEXT:
        notes.append("over-vram")
    if any(t in tags for t in ["ko", "korean", "multilingual"]):
        notes.append("ko-support")

    return {
        "date": TODAY,
        "source": "huggingface",
        "model_name": model_id,
        "parameters": param_str,
        "category": category,
        "license": license_name,
        "hf_downloads": str(downloads),
        "notes": "; ".join(notes),
    }


def parse_civitai_model(model):
    name = model.get("name", "unknown")
    model_type = model.get("type", "Checkpoint")
    stats = model.get("stats", {})
    downloads = stats.get("downloadCount", 0)

    return {
        "date": TODAY,
        "source": "civitai",
        "model_name": name,
        "parameters": "",
        "category": model_type.lower(),
        "license": "",
        "hf_downloads": str(downloads),
        "notes": "",
    }


def load_existing():
    existing = set()
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing.add((row.get("date", ""), row.get("model_name", "")))
    return existing


def append_to_csv(rows):
    file_exists = os.path.exists(CSV_PATH) and os.path.getsize(CSV_PATH) > 0
    with open(CSV_PATH, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "source", "model_name", "parameters",
            "category", "license", "hf_downloads", "notes",
        ])
        if not file_exists:
            writer.writeheader()
        writer.writerows(rows)


def main():
    dry_run = "--dry-run" in sys.argv
    existing = load_existing()
    new_rows = []

    print(f"[{TODAY}] PF_FACTORY 모델 추적 시작")

    for cat in CATEGORIES:
        models = fetch_hf_trending(cat, limit=10)
        for m in models:
            row = parse_hf_model(m, cat)
            key = (row["date"], row["model_name"])
            if key not in existing:
                new_rows.append(row)
                print(f"  [NEW] {row['source']}/{row['category']}: {row['model_name']} ({row['parameters']}) dl={row['hf_downloads']}")

    civitai_models = fetch_civitai_new(limit=10)
    for m in civitai_models:
        row = parse_civitai_model(m)
        key = (row["date"], row["model_name"])
        if key not in existing:
            new_rows.append(row)
            print(f"  [NEW] {row['source']}/{row['category']}: {row['model_name']} dl={row['hf_downloads']}")

    print(f"\n총 {len(new_rows)}건 신규 감지")

    if new_rows and not dry_run:
        append_to_csv(new_rows)
        print(f"CSV 적립 완료: {CSV_PATH}")
    elif dry_run:
        print("[DRY-RUN] CSV 미기록")

    return len(new_rows)


if __name__ == "__main__":
    count = main()
    print(f"\n[DONE] 신규 모델 {count}건")
