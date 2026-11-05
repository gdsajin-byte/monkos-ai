#!/usr/bin/env python3
"""목록 보강 — YouTube Data API v3 videos.list(50개 배치)로 설명·태그·게시일·조회수 → catalog/desc_api.jsonl (PF_GO, 11-05 22:15 작가님 키 승인)
  catalog_api.py           catalog.jsonl 전체(이미 받은 id는 건너뜀)
키: SM YOUTUBE_DATA_API_KEY — scripts/secret.sh get 으로 실행 중에만 읽는다(값 출력·저장 금지). 쿼터: 호출 1회 = 1단위.
"""
import json, re, ssl, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path
import certifi

BASE = Path.home() / ".monkos" / "go-commentary-yt"
OUT = BASE / "catalog" / "desc_api.jsonl"
REPO = Path(__file__).resolve().parents[2]
COM = re.compile(r"해설\s*(?:위원)?\s*[:：]?\s*([가-힣]{2,4})(?:\s*\d+단)?")
CAS = re.compile(r"(?:진행|캐스터|MC)\s*[:：]\s*([가-힣]{2,4})")


def iso_secs(d):
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or "")
    if not m:
        return None
    dd, h, mi, s = (int(x or 0) for x in m.groups())
    return dd * 86400 + h * 3600 + mi * 60 + s


def main():
    r = subprocess.run([str(REPO / "scripts" / "secret.sh"), "get", "YOUTUBE_DATA_API_KEY"], capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        sys.exit("❌ catalog_api: YOUTUBE_DATA_API_KEY 조회 실패")
    key = r.stdout.strip()
    ids = [json.loads(l)["id"] for l in (BASE / "catalog.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    done = set()
    if OUT.exists():
        done = {json.loads(l)["id"] for l in OUT.read_text(encoding="utf-8").splitlines() if l.strip()}
    todo = [i for i in ids if i not in done]
    ctx = ssl.create_default_context(cafile=certifi.where())
    calls = got = 0
    t0 = time.time()
    with open(OUT, "a", encoding="utf-8") as f:
        for k in range(0, len(todo), 50):
            batch = todo[k:k + 50]
            q = urllib.parse.urlencode({"part": "snippet,contentDetails,statistics", "id": ",".join(batch), "key": key, "maxResults": 50})
            try:
                j = json.load(urllib.request.urlopen(f"https://www.googleapis.com/youtube/v3/videos?{q}", timeout=60, context=ctx))
            except urllib.error.HTTPError as e:
                print(f"❌ catalog_api: HTTP {e.code} — {e.read().decode()[:200]}"); break
            calls += 1
            for it in j.get("items", []):
                sn, st = it.get("snippet", {}), it.get("statistics", {})
                ds = sn.get("description") or ""
                row = {"id": it["id"], "date": (sn.get("publishedAt") or "")[:10], "title": sn.get("title"), "channelTitle": sn.get("channelTitle"),
                       "duration": iso_secs(it.get("contentDetails", {}).get("duration")), "views": int(st.get("viewCount", 0) or 0),
                       "likes": int(st.get("likeCount", 0) or 0), "comments": int(st.get("commentCount", 0) or 0),
                       "commentator": COM.findall(ds), "caster": CAS.findall(ds), "tags": sn.get("tags") or [], "description": ds}
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
                got += 1
            if calls % 50 == 0:
                print(f"{calls}회 · {got}편 · {time.time() - t0:.0f}초", flush=True)
    key = None
    print(f"끝 — 호출 {calls}회(쿼터 {calls}단위) · {got}편 · {time.time() - t0:.0f}초 · 남은 {len(todo) - got}(비공개·삭제 등)")


if __name__ == "__main__":
    main()
