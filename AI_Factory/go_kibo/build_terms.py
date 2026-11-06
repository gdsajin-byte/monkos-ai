#!/usr/bin/env python3
"""바둑 용어 사전 v0 — 한국기원 바둑용어사전(1차 출처) 전 항목을 뼈대로 8분류 · 판 검출 상태 · 해설 대화록 출현 수 · 예문 2.

  python3 build_terms.py
입력(레포 밖): ~/.monkos/go-board/analysis/commentary_v0/terms/kba_raw.json  (한국기원 baduk.or.kr/story/keyword.asp 146쪽 회수, 11-07)
              ~/.monkos/go-commentary-yt/answers/corrected.jsonl            (유튜브 해설 30편 대화록 — 레포 커밋 금지)
              ~/.monkos/go-board/analysis/commentary_v0/go_terms_dist_full.json (go_terms.py dist — 실수 사전 2,000판 출현)
출력: 레포 밖 terms/terms_v0.jsonl(전 항목 + 예문) · 레포 reports/GO_TERMS_v0.md(표 — 예문·대화록 원문 없음)
"""
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402

TD = os.path.join(ANALYSIS_DIR, "commentary_v0", "terms")
YT = os.path.expanduser("~/.monkos/go-commentary-yt/answers/corrected.jsonl")
KBA_URL = "https://www.baduk.or.kr/story/keyword.asp"

CAT_NAMES = {1: "거리 행마", 2: "벌림·걸침·굳힘·협공", 3: "접촉 수", 4: "공격·견제", 5: "끝내기·연결",
             6: "수상전·사활", 7: "모양 평가", 8: "개념", 0: "기타(인물·기전·규칙·일반)"}
# 분류 규칙 — 표제어(괄호 한자 제거) 기준 앞쪽 규칙이 이긴다
RULES = [
    (2, r"걸침|걸치|굳힘|굳히|협공|벌림|벌리|다가섬|양날개|중국식|향소목|화점|소목|외목|고목|삼삼|포석"),
    (1, r"^(한칸|두칸|세칸)(뜀)?$|날일자|눈목자|마늘모|뜀|행마|달리|입구자|밭전자|비마|쌍립|호구이음"),
    (4, r"모자|씌우|씌움|어깨|들여다|치중|침입|삭감|건너붙|봉쇄|공격|가르|엿보|위협|견제|압박|추궁"),
    (5, r"끝내기|미끄|건너|넘어|젖혀잇|붙여넘|차단|선수끝|역끝|가일수|공배|계가|반집"),
    (6, r"단수|축|장문|환격|촉촉|먹여|빵|궁|사활|수상전|패|팻감|눈|활로|후절수|회돌이|옥집|따내|잡|살|죽|자충|빅|수부족|수늘"),
    (7, r"빈삼각|포도|모양|우형|호형|거북|바보|삼각|사각"),
    (3, r"붙이|붙임|붙여|젖히|젖힘|젖혀|끊|끼우|끼움|껴붙|잇다|이음|뻗|늘다|밀다|밀어|막다|막음|내려|꼬부|치받|배붙|기대|두점머리|단점|코붙"),
    (8, r"두터|두껍|실리|대세|바꿔치기|사석|버림|선수|후수|맛|맞보기|기자|완착|과수|세력|외세|맥|급소|악수|패착|묘수|무리|속수|이적|승부수|곤마|대마|손빼|약점|형세|정석|수순|가수|가착|본수|호수|기세|발빠|느리|두텁|엷|무겁|가볍|큰곳|요처|급처"),
]
PERSON = re.compile(r"출생|입단|프로기사|기사회|우승|명인|본인방|혼인보|국수\(|단으로 승단|사망|문하|기전|대회|협회|연맹|부록")
# 판 검출 상태: go_terms.py 꼬리표 ↔ 표제어 줄기
DETECT = {
    "날일자": "날일자", "한칸뜀": "한칸뜀", "두칸뜀": "두칸뜀", "마늘모": "마늘모", "눈목자": "눈목자",
    "두칸벌림": "두칸 벌림", "세칸벌림": "세칸 벌림", "걸치다": "걸침", "굳히다": "굳힘", "협공": "협공",
    "붙이다": "붙임", "젖히다": "젖힘", "이단젖힘": "이단젖힘", "두점머리": "두점머리 젖힘", "끊다": "끊음",
    "끼우다": "끼움", "잇다": "이음", "뻗다": "뻗음", "밀다": "밀기", "막다": "막음", "내려서다": "내려섬",
    "들여다보다": "들여다봄", "어깨짚기": "어깨짚기", "모자": "모자(씌움)", "단수": "단수", "따내다": "따냄",
    "빵따냄": "빵때림", "빈삼각": "빈삼각", "호구": "호구", "젖혀잇다": "젖혀잇기", "껴붙이다": "껴붙임",
}
ENGINE = {"맞보기", "선수", "후수", "두텁다", "두터움", "실리", "대세", "바꿔치기", "사석", "맛", "완착", "과수", "악수", "묘수", "급소",
          "맥", "패착", "승부수", "형세", "대세점", "기자쟁선"}
CODE_TODO = {"축", "장문", "환격", "촉촉수", "먹여치기", "치중", "꼬부리다", "치받다", "건너붙이다", "배붙임", "붙여뻗다", "늘다",
             "한칸벌림", "네칸벌림", "호구이음", "꽉잇다", "미끄러지다", "건너가다", "젖혀끊다", "끼워붙이다", "모붙임", "밑붙임", "위붙임",
             "옆구리붙임", "마늘모붙임", "날일자걸침", "눈목자걸침", "한칸걸침", "두칸걸침", "날일자굳힘", "눈목자굳힘", "한칸굳힘", "두칸굳힘",
             "되젖히다", "삼단젖힘", "양단수", "빅", "자충", "옥집"}


def stem(title):
    t = re.sub(r"\(.*?\)", "", title or "").strip()
    return t


ENDINGS = "어었으는고음기을아았"
ALIAS = {"한칸뜀": ["한칸뛰", "한칸뜀"], "두칸뜀": ["두칸뛰", "두칸뜀"], "날일자": ["날일자", "일자로", "일자행마"], "두점머리": ["두점머리"],
         "이단젖힘": ["이단젖"], "젖혀잇다": ["젖혀잇", "젖혀이"], "껴붙이다": ["껴붙", "끼워붙"], "들여다보다": ["들여다보", "들여다봐", "들여다본"],
         "내려서다": ["내려서", "내려섰"], "어깨짚기": ["어깨짚", "어깨를짚"], "빵따냄": ["빵따", "빵때"], "밀어올림": ["밀어올", "밀어서올"],
         "끼워잇기": ["끼워잇", "끼워이었", "끼워이어", "끼워서이"], "굳히다": ["굳히", "굳혀", "굳힘"], "걸치다": ["걸치", "걸쳐", "걸침"]}


def search_keys(t):
    """대화록에서 찾을 꼴(띄어쓰기 제거 후 비교). 동사 '-다': 2음절 이상 줄기는 줄기 그대로(젖히다→젖히), 1음절 줄기는 활용 어미와 함께(끊다→끊어·끊으·끊는…)."""
    t0 = t.replace(" ", "")
    if t0 in ALIAS:
        return {"lit": set(ALIAS[t0]), "re": None}
    if t0.endswith("다") and len(t0) >= 2:
        st = t0[:-1]
        if len(st) >= 2:
            return {"lit": {st}, "re": None}
        return {"lit": set(), "re": re.compile(re.escape(st) + f"[{ENDINGS}]")}
    return {"lit": {t0} if len(t0) >= 2 else set(), "re": None}


def hit(keys, text_ns):
    return any(k in text_ns for k in keys["lit"]) or (keys["re"] is not None and keys["re"].search(text_ns) is not None)


def main():
    raw = json.load(open(os.path.join(TD, "kba_raw.json"), encoding="utf-8"))
    raw = json.loads(raw) if isinstance(raw, str) else raw
    dist = json.load(open(os.path.join(ANALYSIS_DIR, "commentary_v0", "go_terms_dist_full.json"), encoding="utf-8"))
    dcount = dict(dist["count"])
    lines = []
    for x in open(YT, encoding="utf-8"):
        d = json.loads(x)
        if d.get("speaker") == "해설" and d.get("text") and not d["text"].startswith("["):
            d["ns"] = d["text"].replace(" ", "")
            lines.append(d)
    corpus_chars = sum(len(d["text"]) for d in lines)
    rows = []
    seen = set()
    for x in raw:
        t = stem(x["title"])
        if not t or t in seen:
            continue
        seen.add(t)
        df = x.get("def") or ""
        cat = 0
        if not PERSON.search(df) and not df.startswith("→") or df.startswith("→"):
            for c, rx in RULES:
                if re.search(rx, t):
                    cat = c
                    break
        if PERSON.search(df) and not re.search(r"수법|기법|행마|모양", df):
            cat = 0
        if t in DETECT and cat == 0:  # 검출 대상은 분류 강제(호구 = 모양)
            cat = {"호구": 7}.get(t, 3)
        if t in DETECT:
            det = f"가능·구현({DETECT[t]})"
        elif t in ENGINE:
            det = "엔진 필요"
        elif t in CODE_TODO:
            det = "가능·미구현"
        elif cat in (1, 2, 3, 4, 7):
            det = "규칙 설계 필요"
        elif cat == 8:
            det = "불가(문맥·평가)"
        else:
            det = "—"
        keys = search_keys(t)
        hits = [d for d in lines if hit(keys, d["ns"])]
        rows.append({"term": t, "title": x["title"], "kba_no": x["no"], "cat": cat, "def": df, "src": f"{KBA_URL} #{x['no']}",
                     "detect": det, "det_tag": DETECT.get(t), "yt_count": len(hits),
                     "kibo_count": dcount.get(DETECT.get(t)) if t in DETECT else None,
                     "examples": [{"id": h["id"], "t": h["t_start"], "text": h["text"][:120]} for h in hits[:2]]})
    # 사전 밖 용어(작가님·감수에서 나온 말, 검출기 꼬리표) — 출처 표기
    extra = [("끼워잇기", 3, "끼운 돌을 이어 붙이는 수(작가님 감수 1 '끼워 이었을 때')", "작가님 2026-11-07 04:32 감수 1"),
             ("밀어올림", 3, "변 쪽 돌을 중앙 쪽으로 밀어 올림(작가님 감수 1 '변쪽을 밀어올려서')", "작가님 2026-11-07 04:32 감수 1"),
             ("큰눈목자", 1, "(2,3) 거리 — 관용 표기, 한국기원 표제어 없음", "출처 미확인")]
    for t, cat, df, src in extra:
        if t in seen:
            continue
        keys = search_keys(t)
        hits = [d for d in lines if hit(keys, d["ns"])]
        tag = {"끼워잇기": "끼워잇기", "밀어올림": "밀어올림", "큰눈목자": "큰눈목자"}[t]
        rows.append({"term": t, "title": t, "kba_no": None, "cat": cat, "def": df, "src": src, "detect": f"가능·구현({tag})", "det_tag": tag,
                     "yt_count": len(hits), "kibo_count": dcount.get(tag), "examples": [{"id": h["id"], "t": h["t_start"], "text": h["text"][:120]} for h in hits[:2]]})
    with open(os.path.join(TD, "terms_v0.jsonl"), "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    write_report(rows, len(raw), len(lines), corpus_chars, dist)
    by = Counter(r["cat"] for r in rows)
    print(f"용어 {len(rows)} (한국기원 {len(raw)}) · 분류 {dict(sorted(by.items()))} · 해설 구간 {len(lines)} · {corpus_chars}자")


def write_report(rows, n_raw, n_lines, chars, dist):
    import datetime as dt
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    tech = [r for r in rows if r["cat"] != 0]
    by = Counter(r["cat"] for r in rows)
    dets = Counter(r["detect"].split("(")[0] for r in tech)
    L = [f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/build_terms.py · go_terms.py\n---\n",
         "# 바둑 용어 사전 v0 — 한국기원 사전 뼈대 · 판 검출 · 해설 출현\n",
         f"> 생성 {now} KST. **1차 출처 = 한국기원 바둑용어사전** ({KBA_URL}, 146쪽 {n_raw}항목 회수 11-07 04:48). 정의는 사전 원문 앞부분 인용(40자), 전문은 출처 번호로.",
         f"> 출현 수 = 유튜브 해설 30편 대화록 중 해설 화자 {n_lines}구간({chars:,}자)에서 표제어(동사는 줄기) 포함 구간 수 — 대화록 원문·예문은 레포 밖 `~/.monkos/go-board/analysis/commentary_v0/terms/terms_v0.jsonl`.",
         f"> 기보 출현 = `go_terms.py` 검출기가 실수 사전 2,000판({dist['moves']:,}수)에서 붙인 꼬리표 수. 검출 정확도는 G836 수순 대조만 했고 표본 정밀도는 미측정.",
         "> 보조 출처: 위키백과 '바둑 용어 목록'(https://ko.wikipedia.org/wiki/바둑_용어) 약 140개와 대조 — 한국기원에 없는 표기(큰눈목자·쌍점·끼워잇기)는 '출처 미확인/감수'로 표기.\n",
         "## 1. 분류별 항목 수\n", "| 분류 | 항목 |", "|---|---|"]
    L += [f"| {c}. {CAT_NAMES[c]} | {by[c]} |" for c in (1, 2, 3, 4, 5, 6, 7, 8, 0)]
    L += ["\n## 2. 판 검출 상태(분류 1~8)\n", "| 상태 | 항목 | 뜻 |", "|---|---|---|"]
    expl = {"가능·구현": "go_terms.py가 착수마다 이름을 붙임", "가능·미구현": "착수와 주변 돌(또는 짧은 수읽기 탐색)로 코드 판정 가능, v0 미구현",
            "규칙 설계 필요": "행마·모양 용어지만 규칙을 아직 설계하지 않음", "엔진 필요": "후보 수 값 비교(b18)가 있어야 판정(맞보기=값이 비슷한 두 수 등)",
            "불가(문맥·평가)": "평가·문맥 언어 — 해설 문장 쪽(임베딩)에서 다룸", "—": "분류 0"}
    for k, v in dets.most_common():
        L.append(f"| {k} | {v} | {expl.get(k, '')} |")
    L += ["\n## 3. 검출기 1차 대상 — 구현 꼬리표 전체\n",
          "| 용어 | 분류 | 한국기원 정의(앞부분) | 출처 | 해설 출현 | 기보 출현(2,000판) |", "|---|---|---|---|---|---|"]
    for r in sorted([r for r in rows if r["detect"].startswith("가능·구현")], key=lambda r: (r["cat"], -(r["kibo_count"] or 0))):
        L.append(f"| {r['term']} | {r['cat']} | {r['def'][:40]} | {('#' + str(r['kba_no'])) if r['kba_no'] else r['src']} | {r['yt_count']} | {r['kibo_count'] if r['kibo_count'] is not None else '—'} |")
    for c in (1, 2, 3, 4, 5, 6, 7, 8):
        sub = sorted([r for r in rows if r["cat"] == c], key=lambda r: -r["yt_count"])
        L += [f"\n## 4-{c}. {CAT_NAMES[c]} — {len(sub)}항목 (해설 출현 순)\n", "| 용어 | 검출 | 해설 출현 | 출처 |", "|---|---|---|---|"]
        for r in sub:
            L.append(f"| {r['term']} | {r['detect']} | {r['yt_count']} | {('#' + str(r['kba_no'])) if r['kba_no'] else r['src']} |")
    L += ["\n## 5. 한계\n",
          "- 분류는 표제어 규칙(정규식)으로 자동 배정했다 — 오분류가 있다(예: 일반어가 개념으로). 감수 대상.",
          "- 출현 수는 띄어쓰기를 지운 문자열 포함 수다. 1음절 동사(끊다·잇다·막다·밀다·뻗다)는 줄기+활용 어미(어·었·으·는·고·음·기·을·아·았)로 셌다 — 동음(예: '막는' 일반어)이 섞여 과대일 수 있다.",
          "- 분류 0(인물·기전·규칙·일반)은 표에서 뺐다. 전 항목은 레포 밖 jsonl."]
    open(os.path.join(HERE, "reports", "GO_TERMS_v0.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
