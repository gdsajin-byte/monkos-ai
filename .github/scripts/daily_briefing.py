"""PF_AUTOPILOT Phase 2 — 데일리 브리핑 자동 생성."""

import base64
import json
import os
import sys
from datetime import date, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)
from google.auth.credentials import AnonymousCredentials
from google.oauth2.service_account import Credentials

SCOPES_GA4 = ["https://www.googleapis.com/auth/analytics.readonly"]
SCOPES_GSC = ["https://www.googleapis.com/auth/webmasters.readonly"]

PAGES = [
    "https://monkos.ai",
    "https://monkos.ai/kr",
    "https://monkos.ai/jp",
    "https://idphoto-kr.monkos.ai",
    "https://idphoto-jp.monkos.ai",
    "https://monk.kr",
    "https://monk.kr/blog",
    "https://image.monkos.ai",
]

NEWS_SOURCES = [
    {
        "name": "정부자금",
        "category": "정부자금",
        "url": "https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do",
        "keywords": ["AI", "SW", "소상공인", "창업", "인공지능", "디지털"],
    },
    {
        "name": "Anthropic Blog",
        "category": "AI/기술",
        "rss": "https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml",
    },
    {
        "name": "Google AI Blog",
        "category": "AI/기술",
        "rss": "https://blog.google/technology/ai/rss/",
    },
]


def get_credentials():
    raw = os.environ.get("GCP_SA_KEY", "")
    if not raw:
        print("ERROR: GCP_SA_KEY not set", file=sys.stderr)
        sys.exit(1)
    key_json = json.loads(base64.b64decode(raw))
    return key_json


def fetch_ga4(key_json, property_id, target_date, compare_date):
    creds = Credentials.from_service_account_info(key_json, scopes=SCOPES_GA4)
    client = BetaAnalyticsDataClient(credentials=creds)

    metrics = [
        Metric(name="sessions"),
        Metric(name="totalUsers"),
        Metric(name="newUsers"),
        Metric(name="screenPageViews"),
    ]

    def run_for_date(d):
        req = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date=d, end_date=d)],
            metrics=metrics,
        )
        resp = client.run_report(req)
        if resp.rows:
            return {m.name: int(resp.rows[0].metric_values[i].value)
                    for i, m in enumerate(metrics)}
        return {m.name: 0 for m in metrics}

    today_data = run_for_date(target_date)
    compare_data = run_for_date(compare_date)
    return today_data, compare_data


def fetch_gsc(key_json, site_url, target_date, compare_date):
    from googleapiclient.discovery import build

    creds = Credentials.from_service_account_info(key_json, scopes=SCOPES_GSC)
    service = build("searchconsole", "v1", credentials=creds)

    def query(d, dimensions, row_limit=10):
        body = {
            "startDate": d,
            "endDate": d,
            "dimensions": dimensions,
            "rowLimit": row_limit,
        }
        resp = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
        return resp.get("rows", [])

    def totals(d):
        body = {"startDate": d, "endDate": d}
        resp = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
        rows = resp.get("rows", [])
        if rows:
            r = rows[0]
            return {
                "clicks": r.get("clicks", 0),
                "impressions": r.get("impressions", 0),
                "ctr": r.get("ctr", 0),
                "position": r.get("position", 0),
            }
        return {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}

    today_totals = totals(target_date)
    compare_totals = totals(compare_date)
    top_queries = query(target_date, ["query"], 10)
    top_pages = query(target_date, ["page"], 10)
    return today_totals, compare_totals, top_queries, top_pages


def seo_scan():
    issues = []
    for url in PAGES:
        try:
            resp = requests.head(url, timeout=10, allow_redirects=True)
            if resp.status_code != 200:
                issues.append(f"- 🔴 `{url}` → HTTP {resp.status_code}")
        except requests.RequestException as e:
            issues.append(f"- 🔴 `{url}` → 연결 실패: {e}")
    return issues


def fetch_news():
    results = {"정부자금": [], "AI/기술": []}

    for source in NEWS_SOURCES:
        try:
            if "rss" in source:
                items = fetch_rss(source["rss"], limit=3)
            else:
                items = fetch_bizinfo(source["url"], source["keywords"])
            results[source["category"]].extend(items)
        except Exception as e:
            print(f"WARNING: {source['name']} 수집 실패 — {e}", file=sys.stderr)
            continue

    return results


def fetch_rss(url, limit=3):
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "xml")
    items = []
    for item in soup.find_all("item")[:limit]:
        title = item.find("title").text.strip() if item.find("title") else ""
        link = item.find("link").text.strip() if item.find("link") else ""
        pub_date = item.find("pubDate")
        if pub_date:
            try:
                dt = parsedate_to_datetime(pub_date.text.strip())
                date_str = dt.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                date_str = ""
        else:
            date_str = ""
        items.append({"title": title, "url": link, "date": date_str})
    return items


def fetch_bizinfo(url, keywords):
    api_url = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"
    items = []
    for kw in keywords:
        params = {
            "crtfcKey": os.environ.get("BIZINFO_API_KEY", "QP6yn2"),
            "dataType": "json",
            "pageUnit": "5",
            "pageIndex": "1",
            "hashtags": kw,
        }
        try:
            resp = requests.get(api_url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            for entry in data.get("jsonArray", []):
                title = entry.get("pblancNm", "")
                detail_url = entry.get("pblancUrl", "")
                pub_date = entry.get("creatPnttm", "")[:10]
                if title and detail_url and len(items) < 3:
                    if not any(i["url"] == detail_url for i in items):
                        items.append({"title": title[:80], "url": detail_url, "date": pub_date})
        except Exception:
            continue
        if len(items) >= 3:
            break
    return items[:3]


def detect_anomalies(ga4_today, ga4_compare, gsc_today, gsc_compare, seo_issues):
    alerts = []

    if ga4_compare["sessions"] > 0:
        change = (ga4_today["sessions"] - ga4_compare["sessions"]) / ga4_compare["sessions"]
        if change <= -0.3:
            alerts.append(f"- 🔴 GA4 세션 전주 대비 {change*100:.0f}% 하락 ({ga4_compare['sessions']} → {ga4_today['sessions']})")

    if gsc_today["clicks"] == 0 and gsc_today["impressions"] == 0:
        alerts.append("- 🟡 GSC 데이터 미도착 (3일 전 기준). 정상 지연 가능성 높음.")
    elif gsc_compare["impressions"] > 0:
        change = (gsc_today["impressions"] - gsc_compare["impressions"]) / gsc_compare["impressions"]
        if change <= -0.3:
            alerts.append(f"- 🔴 GSC 노출 전주 대비 {change*100:.0f}% 하락 ({gsc_compare['impressions']} → {gsc_today['impressions']})")

    if seo_issues:
        alerts.append(f"- 🔴 SEO 스캔 이상 {len(seo_issues)}건 감지")

    return alerts


def pct_change(now, before):
    if before == 0:
        return "N/A" if now == 0 else "+∞"
    change = (now - before) / before * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.0f}%"


def generate_briefing(ga4_today, ga4_compare, gsc_today, gsc_compare,
                      top_queries, top_pages, seo_issues, news, alerts, target_date):
    lines = []
    lines.append("---")
    lines.append("type: briefing")
    lines.append(f"date: {target_date}")
    lines.append("generated: auto (PF_AUTOPILOT)")
    lines.append("---")
    lines.append("")
    lines.append(f"# 데일리 브리핑 {target_date}")
    lines.append("")

    # 긴급
    lines.append("## 🔴 긴급 (즉시 대응)")
    if alerts:
        lines.extend(alerts)
    else:
        lines.append("- 없음")
    lines.append("")

    # 성과
    lines.append("## 📊 성과")
    lines.append("| 지표 | 어제 | 전주 동요일 | 변동 |")
    lines.append("|------|------|-----------|------|")
    lines.append(f"| GSC 클릭 | {gsc_today['clicks']:.0f} | {gsc_compare['clicks']:.0f} | {pct_change(gsc_today['clicks'], gsc_compare['clicks'])} |")
    lines.append(f"| GSC 노출 | {gsc_today['impressions']:.0f} | {gsc_compare['impressions']:.0f} | {pct_change(gsc_today['impressions'], gsc_compare['impressions'])} |")
    lines.append(f"| GA4 세션 | {ga4_today['sessions']} | {ga4_compare['sessions']} | {pct_change(ga4_today['sessions'], ga4_compare['sessions'])} |")
    lines.append(f"| GA4 신규 사용자 | {ga4_today['newUsers']} | {ga4_compare['newUsers']} | {pct_change(ga4_today['newUsers'], ga4_compare['newUsers'])} |")
    lines.append("")

    # GSC 상위 검색어
    lines.append("### GSC 상위 검색어 (Top 10)")
    lines.append("| 검색어 | 클릭 | 노출 | CTR | 순위 |")
    lines.append("|--------|------|------|-----|------|")
    for row in top_queries:
        q = row["keys"][0]
        lines.append(f"| {q} | {row['clicks']:.0f} | {row['impressions']:.0f} | {row['ctr']*100:.1f}% | {row['position']:.1f} |")
    lines.append("")

    # GSC 상위 페이지
    lines.append("### GSC 상위 페이지 (Top 10)")
    lines.append("| 페이지 | 클릭 | 노출 | CTR |")
    lines.append("|--------|------|------|-----|")
    for row in top_pages:
        p = row["keys"][0].replace("https://monkos.ai", "").replace("https://monk.kr", "monk.kr") or "/"
        lines.append(f"| {p} | {row['clicks']:.0f} | {row['impressions']:.0f} | {row['ctr']*100:.1f}% |")
    lines.append("")

    # SEO
    lines.append("## 🔧 SEO 스캔")
    if seo_issues:
        lines.extend(seo_issues)
    else:
        lines.append("- ✅ 전 페이지 정상")
    lines.append("")

    # 뉴스
    lines.append("## 📰 뉴스")
    lines.append("### 정부자금")
    if news["정부자금"]:
        for item in news["정부자금"]:
            date_str = f" — {item['date']}" if item["date"] else ""
            lines.append(f"- [{item['title']}]({item['url']}){date_str}")
    else:
        lines.append("- (수집 건 없음)")
    lines.append("")
    lines.append("### AI/기술")
    if news["AI/기술"]:
        for item in news["AI/기술"]:
            date_str = f" — {item['date']}" if item["date"] else ""
            lines.append(f"- [{item['title']}]({item['url']}){date_str}")
    else:
        lines.append("- (수집 건 없음)")
    lines.append("")

    # 참고
    lines.append("## 🟡 참고")
    lines.append("- 자동 생성 (PF_AUTOPILOT Phase 2)")
    lines.append("")

    return "\n".join(lines)


def main():
    key_json = get_credentials()
    property_id = os.environ.get("GA4_PROPERTY_ID", "")
    site_url = os.environ.get("GSC_SITE_URL", "")

    if not property_id or not site_url:
        print("ERROR: GA4_PROPERTY_ID or GSC_SITE_URL not set", file=sys.stderr)
        sys.exit(1)

    target = date.today() - timedelta(days=3)
    compare = target - timedelta(days=7)

    target_date = target.isoformat()
    compare_date = compare.isoformat()

    print(f"[BRIEFING] 대상일: {target_date}, 비교일: {compare_date}")

    # 축1: GA4
    print("[1/4] GA4 수집...")
    try:
        ga4_today, ga4_compare = fetch_ga4(key_json, property_id, target_date, compare_date)
    except Exception as e:
        print(f"WARNING: GA4 수집 실패 — {e}", file=sys.stderr)
        ga4_today = {"sessions": 0, "totalUsers": 0, "newUsers": 0, "screenPageViews": 0}
        ga4_compare = ga4_today.copy()

    # 축1: GSC
    print("[2/4] GSC 수집...")
    try:
        gsc_today, gsc_compare, top_queries, top_pages = fetch_gsc(
            key_json, site_url, target_date, compare_date
        )
    except Exception as e:
        print(f"WARNING: GSC 수집 실패 — {e}", file=sys.stderr)
        gsc_today = {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
        gsc_compare = gsc_today.copy()
        top_queries, top_pages = [], []

    # 축2: SEO
    print("[3/4] SEO 스캔...")
    seo_issues = seo_scan()

    # 축3: 뉴스
    print("[4/4] 뉴스 수집...")
    news = fetch_news()

    # 축4: 이상 감지
    alerts = detect_anomalies(ga4_today, ga4_compare, gsc_today, gsc_compare, seo_issues)

    # 생성
    content = generate_briefing(
        ga4_today, ga4_compare, gsc_today, gsc_compare,
        top_queries, top_pages, seo_issues, news, alerts, target_date
    )

    output_dir = Path("monkos-ops/ops/briefings")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"BRIEFING_{target.strftime('%Y%m%d')}.md"
    output_file.write_text(content, encoding="utf-8")

    print(f"[DONE] {output_file} 생성 완료 ({len(content)} bytes)")

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"target_date={target_date}\n")
            f.write(f"briefing_file={output_file}\n")


if __name__ == "__main__":
    main()
