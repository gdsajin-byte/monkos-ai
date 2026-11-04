#!/usr/bin/env python3
"""한국어 원어민 목소리(ElevenLabs 공유 라이브러리) 4종으로 v2 방식 소리 생성 (PF_GO, 11-05 08:03 작가님 키 권한 저장).

  sound_ko_voices.py add    공유 목소리 4종을 내 목소리에 추가(이미 있으면 건너뜀) — voice_id 그대로 쓴다
  sound_ko_voices.py gen    숫자 1~10 = 문맥 단독 생성(sound_count_v2.ctx) + 나머지 문구(count11·remain1~3·start·counting) 단독 생성
이후 팩 조립: sound_pack_build.py ko
"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_candidates as sc
import sound_count_v2 as v2

# slug: (voice_id, public_owner_id, 표시 이름, 유형) — 11-05 08:0x 공유 라이브러리(language=ko) 조회, rate 1.0·notice 730일·live_moderation 꺼짐
KO = {
    "jingeon": ("BbsagRO6ohd8MKPS2Ob0", "c5d728223ad32cf62f75290705b4c1da98687535e0a804154aa1eff39c4fe6a6",
                "Jin Geon Song", "차분한 남성 해설가형"),
    "sola": ("KlstlYt9VVf3zgie2Oht", "98b0a9a9ec7363c02603024a30a594046055d61684f436bd3c4a89cf305829d5",
             "Sola", "또렷한 여성 아나운서형"),
    "selly": ("ETPP7D0aZVdEj12Aa7ho", "e53b0fd0bc0e173f855ef494aaaccd0b002dabaa2de100551904ed6ff009c77e",
              "Selly Han", "따뜻한 중년형"),
    "minjoon": ("nbrxrAz3eYm9NgojrmFK", "be8cd8b465e16bf5b135a3b9dc77f7a3a0b21f127a976d29f51aaee81343fbcb",
                "Min-joon", "젊은 중성형"),
}
OTHER = [p for p in sc.PHRASES_FULL if p[0] in ("count11", "remain1", "remain2", "remain3", "start", "counting")]


def add():
    mine = {v["voice_id"] for v in sc.call("GET", "/v2/voices?page_size=100").get("voices", [])}
    for slug, (vid, owner, name, kind) in KO.items():
        if vid in mine:
            print(f"skip {slug} (이미 있음)"); continue
        r = sc.call("POST", f"/v1/voices/add/{owner}/{vid}", {"new_name": f"MONK-{slug} ({name})"})
        print(f"add {slug} → {r.get('voice_id')}")


def gen():
    n = 0
    for slug, (vid, *_r) in KO.items():
        v2.ctx(vid, slug)
        for tag, text in OTHER:
            p = sc.OUT / f"voice_{slug}_{tag}.mp3"
            if p.exists():
                continue
            p.write_bytes(sc.call("POST", f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                                  {"text": text, "model_id": sc.MODEL,
                                   "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}}, raw=True))
            n += len(text)
        print(f"ok {slug} 문구 chars(누적 이 실행) {n}")


if __name__ == "__main__":
    {"add": add, "gen": gen}[sys.argv[1]]()
