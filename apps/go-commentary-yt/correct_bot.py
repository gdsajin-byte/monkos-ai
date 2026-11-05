#!/usr/bin/env python3
"""자막 교정 봇 v1 — 무료 자동 자막 → 문장 구간 + 교정(lexicon_v1 규칙) + 화자(해설·캐스터, 글자 n-gram 나이브 베이즈) (PF_GO, 11-06 04:55 쌍아 권장안, 무료·CPU)
  correct_bot.py check   → 홀드아웃 9편: 화자 정확도(자막 구간 ↔ Flash 장면 화자, 시간 겹침 다수)
  correct_bot.py batch   → 목록에서 해설자별 조회수 상위 10편(정답지 30편 제외, 자동 자막 있는 것) → answers/corrected.jsonl
화자: 이현욱 개인 채널(캐스터 없음)은 전부 '해설'. 방송은 정답지 학습 21편의 Flash 장면(대사·화자)으로 학습한 분류기.
로그인·쿠키 없음(yt-dlp 공개 자동 자막만), 유료 호출 0.
"""
import json, math, re, subprocess, sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
CAT = Path.home() / ".monkos" / "go-commentary-yt" / "catalog.jsonl"
sel = json.loads((B / "selection.json").read_text())
SEL_IDS = {r["id"] for r in sel}
HOLD = set(json.loads((B / "lexicon_v1_eval.json").read_text())["summary"]["hold_ids"])
RULES = sorted([(k["from"], k["to"]) for k in json.loads((B / "lexicon_v1.json").read_text())["rules"]], key=lambda x: -len(x[0]))


def norm(s):
    return re.sub(r"[^가-힣A-Za-z0-9]", "", s)


def correct(text):
    out, fixes = [], []
    for t in text.split():
        n = norm(t)
        for h, r in RULES:
            if n.startswith(h) and len(n) - len(h) <= 3:
                new = t.replace(h, r, 1) if h in t else r + n[len(h):]
                out.append(new); fixes.append([t, new]); break
        else:
            out.append(t)
    return " ".join(out), fixes


def subs_path(vid, d):
    f = next(d.glob(f"{vid}*.json3"), None)
    if not f:
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--skip-download", "--write-auto-subs", "--sub-langs", "ko", "--sub-format", "json3",
                        "-o", str(d / vid), f"https://www.youtube.com/watch?v={vid}"], capture_output=True)
        f = next(d.glob(f"{vid}*.json3"), None)
    return f


def segments(f, gap=1.2, maxlen=120):
    """자동 자막 이벤트 → 말 구간(1.2초↑ 쉼 또는 120자에서 끊음)."""
    ev = json.loads(f.read_text()).get("events", [])
    segs, cur = [], None
    for e in ev:
        txt = "".join(s.get("utf8", "") for s in e.get("segs") or []).replace("\n", " ").strip()
        if not txt:
            continue
        a = e.get("tStartMs", 0) / 1000
        b = a + e.get("dDurationMs", 0) / 1000
        if cur and (a - cur["t_end"] > gap or len(cur["text"]) > maxlen):
            segs.append(cur); cur = None
        if cur:
            cur["text"] += " " + txt; cur["t_end"] = max(cur["t_end"], b)
        else:
            cur = {"t_start": a, "t_end": b, "text": txt}
    if cur:
        segs.append(cur)
    return segs


class NB:
    """글자 2·3-gram 다항 나이브 베이즈(라플라스 1)."""

    def __init__(self):
        self.c = defaultdict(Counter); self.n = Counter(); self.V = set()

    @staticmethod
    def feats(t):
        t = norm(t)
        return [t[i:i + k] for k in (2, 3) for i in range(len(t) - k + 1)]

    def fit(self, xs, ys):
        for x, y in zip(xs, ys):
            f = self.feats(x); self.c[y].update(f); self.n[y] += 1; self.V |= set(f)
        self.tot = {y: sum(c.values()) for y, c in self.c.items()}
        return self

    def predict(self, x):
        f = self.feats(x); N = sum(self.n.values()); V = len(self.V)
        lp = {y: math.log(self.n[y] / N) + sum(math.log((self.c[y][g] + 1) / (self.tot[y] + V)) for g in f) for y in self.c}
        m = max(lp.values()); z = sum(math.exp(v - m) for v in lp.values())
        y = max(lp, key=lp.get)
        return y, math.exp(lp[y] - m) / z


def scene_rows(ids):
    import board_events as be
    out = []
    for jf in sorted(B.glob("*/flash_*/gemini_full.json")):
        vid = jf.parent.parent.name
        if vid not in ids:
            continue
        j = json.loads(jf.read_text())
        for s, (a, b) in zip(j["scenes"], be.scene_times(j)):
            if s.get("speaker") in ("해설", "캐스터") and s.get("line"):
                out.append({"id": vid, "a": a, "b": max(b, a + 1), "speaker": s["speaker"], "line": s["line"]})
    return out


def train_nb(ids=None):
    broadcast = {r["id"] for r in sel if r["caster"]}
    rows = scene_rows((ids if ids is not None else SEL_IDS - HOLD) & broadcast)
    return NB().fit([r["line"] for r in rows], [r["speaker"] for r in rows]), len(rows)


TH_FILE = B / "speaker_threshold.json"
_AUD = {}
F0Q = float(__import__("os").environ.get("F0Q", "0.5"))  # 구간 목소리 높이 대표값 분위 — 검증 편 기준 0.5(0.791) > 0.75(0.781)로 0.5 채택(11-06). 0.75는 홀드아웃 0.852였으나 홀드아웃으로 고르지 않는다


def audio_arr(vid, d=None):
    """전체 음성 → 8kHz 모노 int16(한 번만 디코드)."""
    if vid in _AUD:
        return _AUD[vid]
    import numpy as np, imageio_ffmpeg
    src = next((B / vid).glob("audio.*"), None) or (next((d or B / "audio_batch").glob(f"{vid}.*"), None))
    if not src:
        return None
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-i", str(src), "-f", "s16le", "-ac", "1", "-ar", "8000", "-"], capture_output=True).stdout
    _AUD.clear(); _AUD[vid] = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    return _AUD[vid]


def f0_median(x):
    """자기상관 기본 주파수(80~400Hz) — 유성 프레임(에너지 상위 60%)의 중앙값. 해설(남)·캐스터(여) 가르기용."""
    import numpy as np
    if x is None or len(x) < 1024:
        return None
    fr = np.lib.stride_tricks.sliding_window_view(x, 512)[::256]
    fr = fr - fr.mean(axis=1, keepdims=True)
    e = (fr ** 2).mean(axis=1)
    fr = fr[e >= np.quantile(e, 0.4)]
    if not len(fr):
        return None
    sp = np.fft.rfft(fr * np.hanning(512), n=1024)
    ac = np.fft.irfft(np.abs(sp) ** 2)[:, :128]
    ac = ac / np.maximum(ac[:, :1], 1e-9)
    lag = 20 + ac[:, 20:100].argmax(axis=1)
    pk = ac[np.arange(len(ac)), lag]
    f = 8000 / lag[pk > 0.35]
    return float(np.quantile(f, F0Q)) if len(f) >= 3 else None


def speaker_for(r, nb, text, th=None, f0=None):
    if not r.get("caster") and "이현욱" in (r.get("commentator") or []):
        return "해설", 1.0
    if f0 is not None and th is not None and th > 1:  # 목소리 높이 문턱(Hz)
        return ("캐스터", 1.0) if f0 >= th else ("해설", 1.0)
    y, p = nb.predict(text)
    pc = p if y == "캐스터" else 1 - p
    th = th if th is not None else (json.loads(TH_FILE.read_text())["threshold"] if TH_FILE.exists() else 0.5)
    return ("캐스터", pc) if pc >= th else ("해설", 1 - pc)


def labeled(ids):
    """자동 자막 구간 + 정답 화자(겹치는 Flash 장면 화자, 시간 다수) + 구간 목소리 높이."""
    sc = scene_rows(ids)
    out = []
    for vid in sorted(ids):
        f = subs_path(vid, B / "subs")
        ss = [x for x in sc if x["id"] == vid]
        if not f or not ss:
            continue
        aud = audio_arr(vid)
        lo, hi = min(x["a"] for x in ss), max(x["b"] for x in ss)
        for g in segments(f):
            if g["t_end"] <= lo or g["t_start"] >= hi:
                continue
            ov = Counter()
            for x in ss:
                o = min(g["t_end"], x["b"]) - max(g["t_start"], x["a"])
                if o > 0:
                    ov[x["speaker"]] += o
            if ov:
                f0 = f0_median(aud[int(g["t_start"] * 8000):int(g["t_end"] * 8000)]) if aud is not None else None
                out.append((vid, g["text"], ov.most_common(1)[0][0], f0))
    return out


def score(nb, segs, th, byid):
    conf = Counter()
    for vid, txt, gold, f0 in segs:
        conf[(gold, speaker_for(byid[vid], nb, txt, th, f0)[0])] += 1
    n = sum(conf.values())
    return sum(v for (g, p), v in conf.items() if g == p) / max(1, n), conf, n


def evaluate():
    """문턱은 학습 편 안의 검증 편(방송 편 매 4번째)에서만 정하고, 홀드아웃은 마지막에 1번 잰다. 글자 분류기(확률 문턱)와 목소리 높이(Hz 문턱) 둘 다."""
    byid = {r["id"]: r for r in sel}
    trb = [r["id"] for r in sel if r["caster"] and r["id"] not in HOLD]
    val = set(trb[3::4]); fit = set(trb) - val
    nb_fit, _ = train_nb(fit)
    vsegs = labeled(val)
    best_p = max((score(nb_fit, vsegs, t / 100, byid)[0], t / 100) for t in range(30, 100, 2))
    best_h = max((score(nb_fit, vsegs, float(h), byid)[0], float(h)) for h in range(120, 260, 5))
    mode, th = ("pitch", best_h[1]) if best_h[0] >= best_p[0] else ("text", best_p[1])
    TH_FILE.write_text(json.dumps({"mode": mode, "threshold": th, "val_ids": sorted(val), "val_acc_text": best_p, "val_acc_pitch": best_h, "val_segments": len(vsegs)}, ensure_ascii=False))
    nb, ntr = train_nb()
    hsegs = labeled(HOLD)
    acc_t, conf_t, n = score(nb, hsegs, best_p[1], byid)
    acc_h, conf_h, _ = score(nb, hsegs, best_h[1], byid)
    base = Counter(x[2] for x in hsegs).most_common(1)[0][1] / max(1, n)
    res = {"train_scenes": ntr, "val_segments": len(vsegs), "val_acc_text": best_p, "val_acc_pitch_hz": best_h, "chosen": [mode, th], "hold_segments": n,
           "hold_acc_text": acc_t, "hold_acc_pitch": acc_h, "majority_baseline": base, "no_f0": sum(1 for x in hsegs if x[3] is None),
           "confusion_text": {f"{g}→{p}": v for (g, p), v in conf_t.items()}, "confusion_pitch": {f"{g}→{p}": v for (g, p), v in conf_h.items()}}
    (B / "speaker_eval.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print(json.dumps(res, ensure_ascii=False, indent=1))


def batch():
    """화자: 검증 편으로 고른 방식(speaker_threshold.json) — 방송은 목소리 높이(음성 공개 스트림 받기, 로그인 없음), 높이를 못 잰 구간은 글자 분류기."""
    global TH
    TH = json.loads(TH_FILE.read_text())
    nb, _ = train_nb()
    rows = [json.loads(l) for l in CAT.read_text(encoding="utf-8").splitlines() if l.strip()]
    api = {json.loads(l)["id"]: json.loads(l) for l in (Path.home() / ".monkos/go-commentary-yt/catalog/desc_api.jsonl").read_text(encoding="utf-8").splitlines()}
    d = B / "subs_batch"
    d.mkdir(exist_ok=True)
    out = (B / "corrected.jsonl").open("w")
    stat = []
    for w in ("목진석", "이현욱", "송태곤"):
        cand = sorted([r for r in rows if w in r["commentator"] and r["id"] not in SEL_IDS and (r.get("duration") or 0) >= 600],
                      key=lambda r: -(api.get(r["id"]) or {}).get("views", 0))
        got = 0
        for r in cand:
            if got >= 10:
                break
            f = subs_path(r["id"], d)
            if not f:
                continue
            got += 1
            nseg = nfix = 0
            spk = Counter()
            solo = not r.get("caster") and w == "이현욱"
            aud = None
            if not solo and TH["mode"] == "pitch":
                ad = B / "audio_batch"; ad.mkdir(exist_ok=True)
                if not next(ad.glob(f"{r['id']}.*"), None):
                    subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "-f", "bestaudio[ext=m4a]/bestaudio", "-o", str(ad / f"{r['id']}.%(ext)s"),
                                    f"https://www.youtube.com/watch?v={r['id']}"], capture_output=True)
                aud = audio_arr(r["id"], ad)
            for g in segments(f):
                txt, fixes = correct(g["text"])
                f0 = f0_median(aud[int(g["t_start"] * 8000):int(g["t_end"] * 8000)]) if aud is not None else None
                sp, p = speaker_for(r, nb, txt, TH["threshold"], f0) if f0 is not None or TH["mode"] != "pitch" else speaker_for(r, nb, txt, 0.98)
                spk[sp] += 1; nseg += 1; nfix += len(fixes)
                out.write(json.dumps({"id": r["id"], "commentator": w, "caster": r.get("caster") or [], "t_start": round(g["t_start"], 2), "t_end": round(g["t_end"], 2),
                                      "speaker": sp, "speaker_p": round(p, 3), "text_auto": g["text"], "text": txt, "fixes": fixes,
                                      "source": "youtube_auto_subs", "corrector": "lexicon_v1", "f0_hz": round(f0, 1) if f0 else None,
                                      "speaker_model": "solo_channel" if solo else (f"pitch_median_{TH['threshold']:.0f}hz" if f0 is not None else "nb_char23_v1")},
                                     ensure_ascii=False) + "\n")
            stat.append({"id": r["id"], "commentator": w, "views": (api.get(r["id"]) or {}).get("views", 0), "segments": nseg, "fixes": nfix, "speakers": dict(spk)})
            print(w, r["id"], f"구간 {nseg} 교정 {nfix} 화자 {dict(spk)}", flush=True)
    out.close()
    (B / "corrected_stats.json").write_text(json.dumps(stat, ensure_ascii=False, indent=1))
    print(f"편 {len(stat)} · 구간 {sum(s['segments'] for s in stat)} · 교정 {sum(s['fixes'] for s in stat)} → {B / 'corrected.jsonl'}")


if __name__ == "__main__":
    {"check": evaluate, "batch": batch}[sys.argv[1]]()
