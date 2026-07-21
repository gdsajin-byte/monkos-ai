"""SEO 데이터 수집 독립 모듈 — daily_briefing.py에서 분리."""

import base64
import hashlib
import hmac
import json
import os
import sys
import time
from datetime import date, timedelta

import requests

SCOPES_GA4 = ["https://www.googleapis.com/auth/analytics.readonly"]
SCOPES_GSC = ["https://www.googleapis.com/auth/webmasters.readonly"]

NAVER_KEYWORDS = ["증명사진", "AI 증명사진", "여권사진", "취업사진", "취업사진 안경"]

PAGESPEED_URLS = [
    "https://monkos.ai/",
    "https://monkos.ai/specs/kr-passport",
]


def fetch_naver_searchad(keywords):
    api_key = os.environ.get("NAVER_SEARCHAD_API_KEY", "")
    secret_key = os.environ.get("NAVER_SEARCHAD_SECRET_KEY", "")
    customer_id = os.environ.get("NAVER_SEARCHAD_CUSTOMER_ID", "")
    if not all([api_key, secret_key, customer_id]):
        return None

    base_url = "https://api.searchad.naver.com"
    uri = "/keywordstool"
    method = "GET"
    api_keywords = [kw.replace(" ", "") for kw in keywords]
    match_set = {kw.replace(" ", "") for kw in keywords}
    seen = set()
    results = []

    for batch_start in range(0, len(api_keywords), 5):
        batch = api_keywords[batch_start:batch_start + 5]
        timestamp = str(int(time.time() * 1000))
        sign_str = f"{timestamp}.{method}.{uri}"
        signature = base64.b64encode(
            hmac.new(secret_key.encode("utf-8"), sign_str.encode("utf-8"), hashlib.sha256).digest()
        ).decode("utf-8")

        headers = {
            "X-Timestamp": timestamp,
            "X-API-KEY": api_key,
            "X-Customer": customer_id,
            "X-Signature": signature,
        }
        params = {
            "hintKeywords": ",".join(batch),
            "showDetail": "1",
        }
        try:
            resp = requests.get(base_url + uri, headers=headers, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            if not data.get("keywordList"):
                print(f"WARNING: 네이버 SearchAd 빈 응답 — batch {batch}", file=sys.stderr)
            for item in data.get("keywordList", []):
                norm = item.get("relKeyword", "").replace(" ", "")
                if norm in match_set and norm not in seen:
                    seen.add(norm)
                    results.append({
                        "keyword": item["relKeyword"],
                        "pcSearch": item.get("monthlyPcQcCnt", 0),
                        "mobileSearch": item.get("monthlyMobileQcCnt", 0),
                        "pcClick": item.get("monthlyAvePcClkCnt", 0),
                        "mobileClick": item.get("monthlyAveMobileClkCnt", 0),
                        "competition": item.get("compIdx", ""),
                    })
        except Exception as e:
            print(f"WARNING: 네이버 검색광고 API 실패 (batch {batch}) — {e}", file=sys.stderr)
    return results if results else None


def fetch_naver_datalab(keywords):
    client_id = os.environ.get("NAVER_DATALAB_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_DATALAB_CLIENT_SECRET", "")
    if not all([client_id, client_secret]):
        return None

    end_date = date.today().isoformat()
    start_date = (date.today() - timedelta(days=30)).isoformat()

    body = {
        "startDate": start_date,
        "endDate": end_date,
        "timeUnit": "week",
        "keywordGroups": [
            {"groupName": kw, "keywords": [kw]} for kw in keywords[:5]
        ],
    }
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(
            "https://openapi.naver.com/v1/datalab/search",
            headers=headers, json=body, timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for group in data.get("results", []):
            periods = group.get("data", [])
            if len(periods) >= 2:
                prev = periods[-2].get("ratio", 0)
                curr = periods[-1].get("ratio", 0)
                if prev > 0:
                    change = (curr - prev) / prev * 100
                    direction = "↑" if change > 5 else ("↓" if change < -5 else "→")
                else:
                    direction = "→"
                results.append({
                    "keyword": group["title"],
                    "current": curr,
                    "previous": prev,
                    "direction": direction,
                })
        return results
    except Exception as e:
        print(f"WARNING: 네이버 DataLab API 실패 — {e}", file=sys.stderr)
        return None


def fetch_bing_wmt():
    api_key = os.environ.get("BING_WMT_API_KEY", "")
    if not api_key:
        return None

    base_url = "https://ssl.bing.com/webmaster/api.svc/json"
    site = "https://monkos.ai/"

    results = {}
    try:
        resp = requests.get(
            f"{base_url}/GetQueryStats",
            params={"apikey": api_key, "siteUrl": site},
            timeout=15,
        )
        resp.raise_for_status()
        stats = resp.json().get("d", [])
        top_queries = sorted(stats, key=lambda x: x.get("Impressions", 0), reverse=True)[:10]
        results["queries"] = [{
            "query": q.get("Query", ""),
            "impressions": q.get("Impressions", 0),
            "clicks": q.get("Clicks", 0),
            "position": q.get("AvgImpressionPosition", 0),
        } for q in top_queries]
    except Exception as e:
        print(f"WARNING: Bing WMT GetQueryStats 실패 — {e}", file=sys.stderr)
        results["queries"] = []

    try:
        resp = requests.get(
            f"{base_url}/GetLinkCounts",
            params={"apikey": api_key, "siteUrl": site},
            timeout=15,
        )
        resp.raise_for_status()
        link_data = resp.json().get("d", {})
        results["links"] = link_data
    except Exception as e:
        print(f"WARNING: Bing WMT GetLinkCounts 실패 — {e}", file=sys.stderr)
        results["links"] = {}

    return results


def fetch_pagespeed(urls, api_key=None):
    results = []
    for url in urls:
        for strategy in ["mobile", "desktop"]:
            params = {
                "url": url,
                "strategy": strategy,
                "category": "performance",
            }
            if api_key:
                params["key"] = api_key
            try:
                resp = requests.get(
                    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                    params=params, timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
                lh = data.get("lighthouseResult", {})
                audits = lh.get("audits", {})
                score = lh.get("categories", {}).get("performance", {}).get("score", 0)
                lcp = audits.get("largest-contentful-paint", {}).get("numericValue", 0)
                cls = audits.get("cumulative-layout-shift", {}).get("numericValue", 0)
                inp_audit = audits.get("interaction-to-next-paint", {})
                inp = inp_audit.get("numericValue", 0) if inp_audit else 0
                results.append({
                    "url": url.replace("https://monkos.ai", ""),
                    "strategy": strategy,
                    "score": int((score or 0) * 100),
                    "lcp_ms": int(lcp),
                    "cls": round(cls, 3),
                    "inp_ms": int(inp),
                })
            except Exception as e:
                print(f"WARNING: PageSpeed {url} {strategy} 실패 — {e}", file=sys.stderr)
    return results


def fetch_ga4_extended(key_json, property_id, target_date):
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Metric, RunReportRequest,
    )
    from google.oauth2.service_account import Credentials
    creds = Credentials.from_service_account_info(key_json, scopes=SCOPES_GA4)
    client = BetaAnalyticsDataClient(credentials=creds)
    prop = f"properties/{property_id}"

    req = RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date=target_date, end_date=target_date)],
        dimensions=[Dimension(name="deviceCategory")],
        metrics=[
            Metric(name="sessions"),
            Metric(name="bounceRate"),
            Metric(name="averageSessionDuration"),
            Metric(name="screenPageViewsPerSession"),
        ],
    )
    resp = client.run_report(req)
    rows = []
    for row in resp.rows:
        rows.append({
            "device": row.dimension_values[0].value,
            "sessions": int(row.metric_values[0].value),
            "bounceRate": float(row.metric_values[1].value),
            "avgDuration": float(row.metric_values[2].value),
            "pagesPerSession": float(row.metric_values[3].value),
        })
    rows.sort(key=lambda r: r["sessions"], reverse=True)
    return rows


def fetch_gsc_url_inspection(key_json, site_url, urls):
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    creds = Credentials.from_service_account_info(key_json, scopes=SCOPES_GSC)
    service = build("searchconsole", "v1", credentials=creds)

    results = []
    for url in urls[:10]:
        try:
            resp = service.urlInspection().index().inspect(
                body={"inspectionUrl": url, "siteUrl": site_url}
            ).execute()
            result = resp.get("inspectionResult", {})
            index_status = result.get("indexStatusResult", {})
            results.append({
                "url": url,
                "verdict": index_status.get("verdict", "UNKNOWN"),
                "coverageState": index_status.get("coverageState", ""),
                "lastCrawlTime": index_status.get("lastCrawlTime", ""),
            })
        except Exception as e:
            results.append({"url": url, "verdict": "ERROR", "coverageState": str(e)[:80]})
    return results


COMMANDS = {
    "naver-searchad": "fetch_naver_searchad",
    "naver-datalab": "fetch_naver_datalab",
    "bing": "fetch_bing_wmt",
    "pagespeed": "fetch_pagespeed",
    "ga4-device": "fetch_ga4_extended",
    "gsc-inspection": "fetch_gsc_url_inspection",
}


def _parse_args():
    import argparse
    parser = argparse.ArgumentParser(description="SEO 데이터 수집 CLI")
    parser.add_argument("command", choices=list(COMMANDS.keys()) + ["all"],
                        help="수집 채널")
    parser.add_argument("--keywords", default=None,
                        help="키워드 (쉼표 구분)")
    parser.add_argument("--urls", default=None,
                        help="URL 목록 (쉼표 구분)")
    parser.add_argument("--dry-run", action="store_true",
                        help="API 호출 없이 구조만 출력")
    return parser.parse_args()


def _get_sa_key():
    raw = os.environ.get("GCP_SA_KEY", "")
    if not raw:
        return None
    return json.loads(base64.b64decode(raw))


def _run_command(cmd, keywords=None, urls=None, dry_run=False):
    if keywords is None:
        keywords = NAVER_KEYWORDS
    if urls is None:
        urls = PAGESPEED_URLS

    if dry_run:
        return {"command": cmd, "dry_run": True, "keywords": keywords, "urls": urls}

    if cmd == "naver-searchad":
        return fetch_naver_searchad(keywords)
    elif cmd == "naver-datalab":
        return fetch_naver_datalab(keywords)
    elif cmd == "bing":
        return fetch_bing_wmt()
    elif cmd == "pagespeed":
        psi_key = os.environ.get("PAGESPEED_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
        return fetch_pagespeed(urls, api_key=psi_key or None)
    elif cmd == "ga4-device":
        key_json = _get_sa_key()
        if not key_json:
            return {"error": "GCP_SA_KEY not set"}
        prop_id = os.environ.get("GA4_PROPERTY_ID", "")
        if not prop_id:
            return {"error": "GA4_PROPERTY_ID not set"}
        target = (date.today() - timedelta(days=3)).isoformat()
        return fetch_ga4_extended(key_json, prop_id, target)
    elif cmd == "gsc-inspection":
        key_json = _get_sa_key()
        if not key_json:
            return {"error": "GCP_SA_KEY not set"}
        site_url = os.environ.get("GSC_SITE_URL", "sc-domain:monkos.ai")
        return fetch_gsc_url_inspection(key_json, site_url, urls)
    return None


def cli_main():
    args = _parse_args()
    keywords = args.keywords.split(",") if args.keywords else None
    urls = args.urls.split(",") if args.urls else None

    if args.command == "all":
        output = {}
        for cmd in COMMANDS:
            try:
                result = _run_command(cmd, keywords=keywords, urls=urls, dry_run=args.dry_run)
                output[cmd] = result
                if not args.dry_run:
                    status = "OK" if result else "SKIP"
                    print(f"[{cmd}] {status}", file=sys.stderr)
            except Exception as e:
                output[cmd] = {"error": str(e)}
                print(f"[{cmd}] ERROR: {e}", file=sys.stderr)
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        try:
            result = _run_command(args.command, keywords=keywords, urls=urls, dry_run=args.dry_run)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    cli_main()
