#!/usr/bin/env python3
"""
블로그 드래프트 발행기 — 자판기 노드 (PF_OPUS 생산 파이프라인)

monkos-ops/contents/blog/*.md → 포털 CMS(/api/admin/blog) 드래프트(published:false) 업로드.
발행(공개)은 하지 않는다 — 최종 게이트는 사람(작가님)이 에디터에서 수행한다 (하네스 §9).

- 멱등: CMS에 동일 slug 존재 시 건너뜀 (에디터 수정본을 덮어쓰지 않음)
- frontmatter `cms: skip` 파일은 제외
- 키 미등록(PORTAL_AGENT_KEY 부재) 시 경고만 남기고 정상 종료
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

BLOG_DIR = Path("monkos-ops/contents/blog")
PORTAL_BASE = os.environ.get("PORTAL_BASE", "https://monkos.ai")
AGENT_KEY = os.environ.get("PORTAL_AGENT_KEY", "").strip()

LANG_MAP = {"ko": "ko", "kr": "ko", "ja": "ja", "jp": "ja", "en": "en"}
SUFFIX_MAP = {"ko": "kr", "ja": "ja", "en": "en"}


def parse_frontmatter(text):
    """단순 YAML frontmatter 파서 (key: value, 리스트는 [a, b] 형태만)."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    meta = {}
    for line in text[3:end].splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line.strip())
        if not m:
            continue
        key, val = m.group(1).lower(), m.group(2).strip().strip('"').strip("'")
        if val.startswith("[") and val.endswith("]"):
            meta[key] = [t.strip().strip('"').strip("'") for t in val[1:-1].split(",") if t.strip()]
        else:
            meta[key] = val
    body = text[end + 4:].lstrip("\n")
    return meta, body


def extract_title(meta, body):
    # CMS는 title을 별도 필드로 렌더링하므로 본문 선두 H1은 항상 제거 (중복 방지)
    stripped = body.lstrip()
    m = re.match(r"^#\s+(.+?)\s*$", stripped, re.MULTILINE)
    h1 = m.group(1).strip() if m else None
    if m:
        stripped = stripped[m.end():].lstrip("\n")
    title = meta.get("title") or h1
    return title, (stripped if m else body)


def api(method, path, payload=None):
    req = urllib.request.Request(
        f"{PORTAL_BASE}{path}",
        data=json.dumps(payload).encode() if payload else None,
        method=method,
        headers={
            "Authorization": f"Bearer {AGENT_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, json.loads(res.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, {}


def main():
    if not AGENT_KEY:
        print("::warning::PORTAL_AGENT_KEY 미등록 — CMS 업로드 건너뜀. "
              "GitHub Secrets에 포털 AGENT_API_KEYS 값 중 1개를 등록하면 가동된다.")
        return 0

    results = []
    for f in sorted(BLOG_DIR.glob("*.md")):
        if f.name.lower() == "readme.md":
            continue
        meta, body = parse_frontmatter(f.read_text(encoding="utf-8"))
        if str(meta.get("cms", "")).lower() == "skip":
            results.append(f"⏭ {f.name} — cms: skip")
            continue
        slug = meta.get("slug", "").strip()
        title, body = extract_title(meta, body)
        if not slug or not title:
            results.append(f"⏭ {f.name} — slug/title 부재 (frontmatter 보정 필요)")
            continue

        lang = LANG_MAP.get(str(meta.get("lang", "ko")).lower(), "ko")
        base_slug = re.sub(r"-(kr|ja|en)$", "", slug)
        full_slug = f"{base_slug}-{SUFFIX_MAP[lang]}"

        status, _ = api("GET", f"/api/admin/blog/{full_slug}")
        if status == 200:
            results.append(f"⏭ {f.name} — CMS에 이미 존재 ({full_slug})")
            continue
        if status == 401:
            print("::error::인증 실패(401) — PORTAL_AGENT_KEY 값 확인 필요")
            return 1

        tags = meta.get("tags", [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]
        payload = {
            "title": title,
            "content": body,
            "summary": meta.get("summary", ""),
            "tags": tags,
            "lang": lang,
            "slug": base_slug,
            "published": False,  # 드래프트 고정 — 발행 게이트는 사람
            "author": meta.get("author", "MONKOS"),
            "category": meta.get("category", ""),
        }
        status, res = api("POST", "/api/admin/blog", payload)
        if status == 201:
            results.append(f"✅ {f.name} → CMS 드래프트 생성 ({res.get('slug', full_slug)})")
        elif status == 409:
            results.append(f"⏭ {f.name} — slug 충돌(409), 기존 문서 보존")
        else:
            results.append(f"❌ {f.name} — HTTP {status}")

    print("\n".join(results))
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as s:
            s.write("## 블로그 드래프트 업로드\n\n" + "\n".join(f"- {r}" for r in results) + "\n")
    return 1 if any(r.startswith("❌") for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
