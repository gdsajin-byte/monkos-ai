"""PF_AUTOPILOT Phase 2 — 데일리 브리핑 자동 생성."""

import base64
import json
import os
import sys
from datetime import date, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import unquote

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

KNOWN_SEO_ISSUES = {
    "https://monkos.ai/kr": 404,
    "https://monkos.ai/jp": 404,
    "https://monk.kr": 403,
    "https://monk.kr/blog": 403,
}

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
        "rss_keywords": ["AI", "Gemini", "model", "LLM", "machine learning", "neural", "DeepMind"],
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

    prop = f"properties/{property_id}"

    metrics = [
        Metric(name="sessions"),
        Metric(name="totalUsers"),
        Metric(name="newUsers"),
        Metric(name="screenPageViews"),
    ]

    def run_for_date(d):
        req = RunReportRequest(
            property=prop,
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

    channel_data = _fetch_ga4_channels(client, prop, target_date)
    funnel_data = _fetch_ga4_funnel(client, prop, target_date)

    return today_data, compare_data, channel_data, funnel_data


def _fetch_ga4_channels(client, prop, d):
    req = RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date=d, end_date=d)],
        dimensions=[Dimension(name="sessionDefaultChannelGroup")],
        metrics=[Metric(name="sessions"), Metric(name="newUsers")],
    )
    resp = client.run_report(req)
    rows = []
    for row in resp.rows:
        rows.append({
            "channel": row.dimension_values[0].value,
            "sessions": int(row.metric_values[0].value),
            "newUsers": int(row.metric_values[1].value),
        })
    rows.sort(key=lambda r: r["sessions"], reverse=True)
    return rows


FUNNEL_EVENTS = [
    "spec_select", "photo_upload", "generate_click",
    "preview_view", "begin_checkout", "purchase",
]


def _fetch_ga4_funnel(client, prop, d):
    from google.analytics.data_v1beta.types import Filter, FilterExpression

    req = RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date=d, end_date=d)],
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="eventName",
                in_list_filter=Filter.InListFilter(values=FUNNEL_EVENTS),
            )
        ),
    )
    resp = client.run_report(req)
    event_map = {}
    for row in resp.rows:
        name = row.dimension_values[0].value
        event_map[name] = {
            "count": int(row.metric_values[0].value),
            "users": int(row.metric_values[1].value),
        }
    return [{"event": e, **event_map.get(e, {"count": 0, "users": 0})} for e in FUNNEL_EVENTS]


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
    page_query = query(target_date, ["page", "query"], 1000)[:20]
    country = query(target_date, ["country"], 20)
    return today_totals, compare_totals, top_queries, top_pages, page_query, country


def seo_scan():
    new_issues = []
    known_issues = []
    recovered = []
    for url in PAGES:
        try:
            resp = requests.head(url, timeout=10, allow_redirects=True)
            if resp.status_code != 200:
                if url in KNOWN_SEO_ISSUES and KNOWN_SEO_ISSUES[url] == resp.status_code:
                    known_issues.append(f"{url} {resp.status_code}")
                else:
                    new_issues.append(f"- 🔴 `{url}` → HTTP {resp.status_code}")
            elif url in KNOWN_SEO_ISSUES:
                recovered.append(f"- ✅ `{url}` 복구됨 (기존 {KNOWN_SEO_ISSUES[url]} → 200)")
        except requests.RequestException as e:
            new_issues.append(f"- 🔴 `{url}` → 연결 실패: {e}")
    return {"new": new_issues, "known": known_issues, "recovered": recovered}


def fetch_news():
    results = {"정부자금": [], "AI/기술": []}
    stale_sources = []

    for source in NEWS_SOURCES:
        try:
            if "rss" in source:
                keywords = source.get("rss_keywords")
                items = fetch_rss(source["rss"], limit=3, keywords=keywords)
            else:
                items = fetch_bizinfo(source["url"], source["keywords"])
            results[source["category"]].extend(items)
            if source["name"] == "Anthropic Blog" and items:
                latest = items[0].get("date", "")
                if latest and latest < (date.today() - timedelta(days=14)).isoformat():
                    print(f"WARNING: Anthropic RSS 최신 기사 {latest} — 14일 초과 (피드 정체 의심)", file=sys.stderr)
                    stale_sources.append(source["name"])
        except Exception as e:
            print(f"WARNING: {source['name']} 수집 실패 — {e}", file=sys.stderr)
            continue

    return results, stale_sources


def fetch_rss(url, limit=3, keywords=None):
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "xml")
    items = []
    for item in soup.find_all("item"):
        if len(items) >= limit:
            break
        title = item.find("title").text.strip() if item.find("title") else ""
        if keywords and not any(kw.lower() in title.lower() for kw in keywords):
            continue
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
        except Exception as e:
            print(f"WARNING: bizinfo 키워드 '{kw}' 수집 실패 — {e}", file=sys.stderr)
            continue
        if len(items) >= 3:
            break
    return items[:3]


def detect_anomalies(ga4_today, ga4_compare, gsc_today, gsc_compare, seo_result):
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

    new_seo = seo_result["new"]
    if new_seo:
        alerts.append(f"- 🔴 SEO 스캔 신규 이상 {len(new_seo)}건 감지")

    return alerts


def pct_change(now, before):
    if before == 0:
        return "N/A" if now == 0 else "+∞"
    if before < 10 and now < 10:
        diff = now - before
        sign = "+" if diff >= 0 else ""
        return f"{sign}{diff}"
    change = (now - before) / before * 100
    sign = "+" if change >= 0 else ""
    return f"{sign}{change:.0f}%"


def generate_briefing(ga4_today, ga4_compare, gsc_today, gsc_compare,
                      top_queries, top_pages, seo_result, news, alerts,
                      target_date, compare_date, stale_sources=None,
                      channel_data=None, funnel_data=None,
                      page_query=None, country_data=None,
                      run_date=None):
    run_date = run_date or target_date
    lines = []
    lines.append("---")
    lines.append("type: briefing")
    lines.append(f"date: {run_date}")
    lines.append(f"data_date: {target_date}")
    lines.append("generated: auto (PF_AUTOPILOT)")
    lines.append("---")
    lines.append("")
    lines.append(f"# 데일리 브리핑 {run_date}")
    lines.append(f"> 데이터 기준일: {target_date} / 비교일: {compare_date} (GSC·GA4 데이터 래그 감안)")
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
    lines.append(f"| 지표 | {target_date} | {compare_date} | 변동 |")
    lines.append("|------|------|-----------|------|")
    lines.append(f"| GSC 클릭 | {gsc_today['clicks']:.0f} | {gsc_compare['clicks']:.0f} | {pct_change(gsc_today['clicks'], gsc_compare['clicks'])} |")
    lines.append(f"| GSC 노출 | {gsc_today['impressions']:.0f} | {gsc_compare['impressions']:.0f} | {pct_change(gsc_today['impressions'], gsc_compare['impressions'])} |")
    lines.append(f"| GA4 세션 | {ga4_today['sessions']} | {ga4_compare['sessions']} | {pct_change(ga4_today['sessions'], ga4_compare['sessions'])} |")
    lines.append(f"| GA4 신규 사용자 | {ga4_today['newUsers']} | {ga4_compare['newUsers']} | {pct_change(ga4_today['newUsers'], ga4_compare['newUsers'])} |")
    lines.append("")

    if channel_data:
        total_sessions = sum(r["sessions"] for r in channel_data) or 1
        lines.append("### 채널별 (GA4)")
        lines.append("| 채널 | 세션 | 신규 | 비율 |")
        lines.append("|------|------|------|------|")
        for r in channel_data:
            pct = r["sessions"] / total_sessions * 100
            lines.append(f"| {r['channel']} | {r['sessions']} | {r['newUsers']} | {pct:.0f}% |")
        lines.append("")

    if funnel_data:
        top_users = max((f["users"] for f in funnel_data), default=0) or 1
        lines.append("### 퍼널 (GA4, idphoto-kr)")
        lines.append("| 단계 | 이벤트 수 | 유저 수 | 전환율 |")
        lines.append("|------|----------|---------|--------|")
        for f in funnel_data:
            cvr = f["users"] / top_users * 100
            lines.append(f"| {f['event']} | {f['count']} | {f['users']} | {cvr:.0f}% |")
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
        p = unquote(row["keys"][0].replace("https://monkos.ai", "").replace("https://monk.kr", "monk.kr")) or "/"
        lines.append(f"| {p} | {row['clicks']:.0f} | {row['impressions']:.0f} | {row['ctr']*100:.1f}% |")
    lines.append("")

    if page_query:
        lines.append("### 페이지×키워드 (GSC, Top 20)")
        lines.append("| 페이지 | 키워드 | 클릭 | 노출 | CTR |")
        lines.append("|--------|--------|------|------|-----|")
        for row in page_query:
            p = unquote(row["keys"][0].replace("https://monkos.ai", "").replace("https://monk.kr", "monk.kr")) or "/"
            q = row["keys"][1]
            lines.append(f"| {p} | {q} | {row['clicks']:.0f} | {row['impressions']:.0f} | {row['ctr']*100:.1f}% |")
        lines.append("")

    if country_data:
        lines.append("### 국가별 (GSC)")
        lines.append("| 국가 | 클릭 | 노출 | CTR |")
        lines.append("|------|------|------|-----|")
        for row in country_data:
            lines.append(f"| {row['keys'][0]} | {row['clicks']:.0f} | {row['impressions']:.0f} | {row['ctr']*100:.1f}% |")
        lines.append("")

    # SEO
    lines.append("## 🔧 SEO 스캔")
    new_seo = seo_result["new"]
    known_seo = seo_result["known"]
    recovered_seo = seo_result["recovered"]
    if new_seo:
        lines.extend(new_seo)
    else:
        lines.append("- ✅ 신규 이상 없음")
    if recovered_seo:
        lines.extend(recovered_seo)
    if known_seo:
        lines.append(f"- 🟡 기존 이슈 {len(known_seo)}건 유지 ({', '.join(known_seo)})")
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
    if stale_sources:
        for s in stale_sources:
            lines.append(f"- ⚠️ {s}: 피드 정체 (최신 기사 14일 초과)")
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

    run_date = date.today()
    target = run_date - timedelta(days=3)
    compare = target - timedelta(days=7)

    run_date_str = run_date.isoformat()
    target_date = target.isoformat()
    compare_date = compare.isoformat()

    print(f"[BRIEFING] 실행일: {run_date_str}, 데이터 기준일: {target_date}, 비교일: {compare_date}")

    # 축1: GA4
    print("[1/4] GA4 수집...")
    channel_data = []
    funnel_data = []
    try:
        ga4_today, ga4_compare, channel_data, funnel_data = fetch_ga4(key_json, property_id, target_date, compare_date)
    except Exception as e:
        print(f"WARNING: GA4 수집 실패 — {e}", file=sys.stderr)
        ga4_today = {"sessions": 0, "totalUsers": 0, "newUsers": 0, "screenPageViews": 0}
        ga4_compare = ga4_today.copy()

    # 축1: GSC
    print("[2/4] GSC 수집...")
    page_query = []
    country_data = []
    try:
        gsc_today, gsc_compare, top_queries, top_pages, page_query, country_data = fetch_gsc(
            key_json, site_url, target_date, compare_date
        )
    except Exception as e:
        print(f"WARNING: GSC 수집 실패 — {e}", file=sys.stderr)
        gsc_today = {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
        gsc_compare = gsc_today.copy()
        top_queries, top_pages = [], []

    # 축2: SEO
    print("[3/4] SEO 스캔...")
    seo_result = seo_scan()

    # 축3: 뉴스
    print("[4/4] 뉴스 수집...")
    news, stale_sources = fetch_news()

    # 축4: 이상 감지
    alerts = detect_anomalies(ga4_today, ga4_compare, gsc_today, gsc_compare, seo_result)

    # 생성
    content = generate_briefing(
        ga4_today, ga4_compare, gsc_today, gsc_compare,
        top_queries, top_pages, seo_result, news, alerts,
        target_date, compare_date, stale_sources,
        channel_data, funnel_data, page_query, country_data,
        run_date=run_date_str,
    )

    output_dir = Path("monkos-ops/ops/briefings")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"BRIEFING_{run_date.strftime('%Y%m%d')}.md"
    output_file.write_text(content, encoding="utf-8")

    print(f"[DONE] {output_file} 생성 완료 ({len(content)} bytes)")

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"run_date={run_date_str}\n")
            f.write(f"target_date={target_date}\n")
            f.write(f"briefing_file={output_file}\n")


if __name__ == "__main__":
    main()
