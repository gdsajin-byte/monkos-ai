#!/usr/bin/env python3
"""젊은 여성 목소리 후보 일괄 — 공유 라이브러리(ko) 추가 → 1테이크(v2) → 무음 분할 → 음량 맞춤 → 피치 편차 (PF_GO, 11-05 09:22 작가님 "젊은 여성으로만 몇개 다시만들어").

  sound_young_f.py run [TAKE SEED]   후보 전부(이미 있는 테이크는 건너뜀) — 점수표 출력
"""
import contextlib, io, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_candidates as sc
import sound_take as T

# 11-05 08:0x 공유 라이브러리(language=ko) 조회분 중 young·female, notice 있음(Jennie 제외), Sola는 09:18 탈락
CANDS = {
    "annakim": "uyVNoMrnUku1dZyVEXwD", "jiyoung": "AW5wrnG1jVizOYY7R1Oo", "han": "8jHHF8rMqMlg8if2mOUe",
    "jisoo": "iWLjl1zCuqXRkW6494ve", "rosaoh": "sf8Bpb1IU97NI9BHSMRf", "kanna": "5I7B1di44aCL15NkP0jn",
    "salang": "mYk0rAapHek2oTw18z8x", "sian": "5n5gqmaQi9Ewevrz7bOS",
    "annie": "Lb7qkOn5hF8p7qfCDH8q", "hanalee": "QPFsEL6IBxlT15xfiD6C",  # 2차 추가(1차 합격 1종뿐)
}
MODEL = "eleven_multilingual_v2"


def owners():
    out = {}
    for l in open("/Users/jeong-kyushin/.claude/jobs/0bf98439/tmp/ko_voices.jsonl", encoding="utf-8"):
        d = json.loads(l)
        out[d["voice_id"]] = (d["public_owner_id"], d["name"], d["notice_period"], d["live_moderation_enabled"])
    return out


def run(take="1", seed="1105", only=None):
    own = owners()
    mine = {v["voice_id"] for v in sc.call("GET", "/v2/voices?page_size=100").get("voices", [])}
    rows = []
    for slug, vid in CANDS.items():
        if only and slug not in only.split(","):
            continue
        if vid not in mine:
            sc.call("POST", f"/v1/voices/add/{own[vid][0]}/{vid}", {"new_name": f"MONK-{slug} ({own[vid][1][:30]})"})
        T.gen(slug, vid, MODEL, take, seed)
        name = f"{slug}_{MODEL}_t{take}"
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                T.split(name); r = T.stats(name)
        except SystemExit as e:
            print(name, "분할 실패", e); continue
        r["voice"] = own[vid][1]; r["notice"] = own[vid][2]; r["live_mod"] = own[vid][3]
        rows.append(r)
    rows.sort(key=lambda r: r["f0_std_st"])
    for r in rows:
        mx = max(abs(float(x.split("(")[1].split("st")[0])) for x in r["rows"] if "nan" not in x)
        print(f"{r['name']:34s} {r['voice'][:34]:34s} F0 {r['f0_med_hz']:5.0f}Hz std {r['f0_std_st']:.2f}st 최대 ±{mx:.1f} | 음량 std {r['loud_std_db']:.2f}dB")
    json.dump(rows, open(T.D / f"young_f_t{take}.json", "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    run(*sys.argv[2:5])
