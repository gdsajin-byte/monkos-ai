#!/usr/bin/env python3
"""
MONKOS Ads Sync — 로컬 폴더 → GCS 자동 밀어내기 (FIFO 6장)

사용법:
  python3 ads_sync.py              # 1회 동기화
  python3 ads_sync.py --watch      # 폴더 감시 데몬 (30초 폴링)
  python3 ads_sync.py --clear      # GCS 광고 전체 삭제

로컬 폴더: ~/monkos-ads/
GCS 경로:  gs://monk-ai-images/ads/
매니페스트: gs://monk-ai-images/ads/manifest.json → /api/ads가 읽음
"""

import os
import sys
import json
import time
import glob
import subprocess
from datetime import datetime

LOCAL_DIR = os.path.expanduser("~/monkos-ads")
GCS_BUCKET = "monk-ai-images"
GCS_PREFIX = "ads"
GCS_BASE = f"gs://{GCS_BUCKET}/{GCS_PREFIX}"
PUBLIC_BASE = f"https://storage.googleapis.com/{GCS_BUCKET}/{GCS_PREFIX}"
MAX_SLOTS = 6
POLL_INTERVAL = 30

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def run(cmd, check=True):
    """gcloud CLI 실행"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"  ERROR: {result.stderr.strip()}")
    return result


def list_gcs_ads():
    """GCS에 있는 광고 이미지 목록 (manifest 제외)"""
    result = run(f'gcloud storage ls "{GCS_BASE}/"', check=False)
    if result.returncode != 0:
        return []
    files = []
    for line in result.stdout.strip().split("\n"):
        line = line.strip()
        if not line or "manifest.json" in line:
            continue
        if any(line.lower().endswith(ext) for ext in IMAGE_EXTS):
            files.append(line)
    return sorted(files)


def list_local_images():
    """로컬 폴더의 이미지 파일 (수정시간순)"""
    files = []
    for ext in IMAGE_EXTS:
        files.extend(glob.glob(os.path.join(LOCAL_DIR, f"*{ext}")))
        files.extend(glob.glob(os.path.join(LOCAL_DIR, f"*{ext.upper()}")))
    # 수정시간 기준 정렬 (최신 먼저)
    files.sort(key=lambda f: os.path.getmtime(f), reverse=True)
    return files


def upload_image(local_path):
    """이미지 1장 GCS 업로드 (타임스탬프 파일명)"""
    ext = os.path.splitext(local_path)[1].lower()
    if ext == ".jpeg":
        ext = ".jpg"
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    basename = os.path.splitext(os.path.basename(local_path))[0]
    # 파일명: 타임스탬프_원본이름.확장자
    gcs_name = f"{ts}_{basename}{ext}"
    gcs_path = f"{GCS_BASE}/{gcs_name}"

    print(f"  UPLOAD: {os.path.basename(local_path)} → {gcs_name}")
    run(f'gcloud storage cp "{local_path}" "{gcs_path}"')

    # 공개 읽기 설정
    run(f'gcloud storage objects update "{gcs_path}" --add-acl-grant=entity=allUsers,role=READER', check=False)

    return gcs_name


def delete_gcs_file(gcs_uri):
    """GCS 파일 삭제"""
    name = gcs_uri.split("/")[-1]
    print(f"  DELETE: {name} (FIFO 밀어내기)")
    run(f'gcloud storage rm "{gcs_uri}"')


def write_manifest(image_names):
    """매니페스트 JSON 작성 → GCS 업로드"""
    urls = [f"{PUBLIC_BASE}/{name}" for name in image_names]
    manifest = {
        "images": urls,
        "rotate": 6000,
        "transition": 800,
        "updated": datetime.now().isoformat(),
        "count": len(urls)
    }

    local_manifest = "/tmp/ads_manifest.json"
    with open(local_manifest, "w") as f:
        json.dump(manifest, f, indent=2)

    run(f'gcloud storage cp "{local_manifest}" "{GCS_BASE}/manifest.json"')
    run(f'gcloud storage objects update "{GCS_BASE}/manifest.json" '
        f'--add-acl-grant=entity=allUsers,role=READER '
        f'--cache-control="public, max-age=60"', check=False)

    print(f"  MANIFEST: {len(urls)} images → manifest.json")
    return manifest


def sync():
    """메인 동기화 로직"""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Syncing ads...")

    # 1. 로컬 이미지 수집
    local_files = list_local_images()
    if not local_files:
        print("  No local images found")
        return False

    # 2. GCS 현재 상태
    gcs_files = list_gcs_ads()
    gcs_names = set(f.split("/")[-1] for f in gcs_files)

    # 3. 업로드 대상 판별 (로컬에 있고 GCS에 없는 파일)
    # 파일 해시 대신 파일명으로 판별 (단순화)
    uploaded_marker = os.path.join(LOCAL_DIR, ".uploaded")
    uploaded_set = set()
    if os.path.exists(uploaded_marker):
        with open(uploaded_marker) as f:
            uploaded_set = set(f.read().strip().split("\n"))

    new_files = [f for f in local_files if os.path.basename(f) not in uploaded_set]

    if not new_files:
        print("  No new images to upload")
        return False

    # 4. 새 이미지 업로드
    new_names = []
    for f in new_files:
        name = upload_image(f)
        new_names.append(name)
        uploaded_set.add(os.path.basename(f))

    # 업로드 마커 갱신
    with open(uploaded_marker, "w") as f:
        f.write("\n".join(uploaded_set))

    # 5. GCS 전체 목록 갱신
    all_gcs = list_gcs_ads()
    all_names = [f.split("/")[-1] for f in all_gcs]

    # 6. FIFO 밀어내기 — 최신 6장만 유지 (이름 역순 = 최신 먼저)
    all_names.sort(reverse=True)
    if len(all_names) > MAX_SLOTS:
        to_delete = all_names[MAX_SLOTS:]
        for name in to_delete:
            delete_gcs_file(f"{GCS_BASE}/{name}")
        all_names = all_names[:MAX_SLOTS]

    # 7. 매니페스트 업데이트
    # 시간순 정렬 (최신 먼저)
    all_names.sort(reverse=True)
    manifest = write_manifest(all_names)

    print(f"  DONE: {len(new_names)} uploaded, {len(all_names)} total")
    return True


def clear():
    """GCS 광고 전체 삭제"""
    print("Clearing all ads from GCS...")
    gcs_files = list_gcs_ads()
    for f in gcs_files:
        run(f'gcloud storage rm "{f}"')
    # 빈 매니페스트
    write_manifest([])
    print("  All ads cleared")


def watch():
    """폴더 감시 데몬"""
    print(f"Watching {LOCAL_DIR} (poll every {POLL_INTERVAL}s)")
    print(f"Drop images into ~/monkos-ads/ to sync to GCS")
    print(f"Max {MAX_SLOTS} images, FIFO rotation")
    print("Press Ctrl+C to stop\n")

    sync()  # 초기 동기화

    while True:
        time.sleep(POLL_INTERVAL)
        try:
            sync()
        except Exception as e:
            print(f"  ERROR: {e}")


if __name__ == "__main__":
    os.makedirs(LOCAL_DIR, exist_ok=True)

    if "--clear" in sys.argv:
        clear()
    elif "--watch" in sys.argv:
        watch()
    else:
        sync()
