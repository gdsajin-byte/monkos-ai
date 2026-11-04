"""GSC 읽기(searchAnalytics.query) — en·es specs 페이지별 전체·한국 노출을 받아 '한국 외' 기준선을 만든다.
토큰은 gsc_submit.sh와 같은 소유자 SA 임퍼소네이션(값 미출력). 기간 = 쌍아 실측과 같은 2026-10-06~11-02(28일)."""
import json, subprocess, urllib.parse, urllib.request

SA = "monk-image-engine@monkos.iam.gserviceaccount.com"
SITE = "sc-domain:monkos.ai"
tok = subprocess.run(["gcloud", "auth", "print-access-token", f"--impersonate-service-account={SA}",
                      "--scopes=https://www.googleapis.com/auth/webmasters.readonly"], capture_output=True, text=True, check=True).stdout.strip()
API = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(SITE, safe='')}/searchAnalytics/query"


def q(extra_filters):
    rows, start = [], 0
    while True:
        body = {"startDate": "2026-10-06", "endDate": "2026-11-02", "dimensions": ["page"], "rowLimit": 25000, "startRow": start, "type": "web",
                "dimensionFilterGroups": [{"filters": [{"dimension": "page", "operator": "includingRegex", "expression": r"^https://monkos\.ai/(en|es)/specs/"}] + extra_filters}]}
        req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
        r = json.loads(urllib.request.urlopen(req, timeout=60).read())
        got = r.get("rows", [])
        rows += got
        if len(got) < 25000:
            return rows
        start += 25000


allc = q([])
kor = q([{"dimension": "country", "operator": "equals", "expression": "kor"}])
json.dump({"all": allc, "kor": kor}, open(__import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "gsc_raw.json"), "w"))
print("전체 페이지", len(allc), "· KOR 행", len(kor), "· 전체 노출", sum(r["impressions"] for r in allc), "· KOR 노출", sum(r["impressions"] for r in kor))
