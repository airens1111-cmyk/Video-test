"""Placeholder timings from the script text (no audio), for previewing scenes.

Estimates each word's duration from its length so scenes can be laid out and
test frames rendered before the voiceover exists. tools/tts_eleven.py later
overwrites data/timings.json with real word times.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEAD, GAP_WORD, GAP_SENT, GAP_SCENE, TAIL = 0.5, 0.06, 0.4, 0.5, 3.2
PER_CHAR, MIN_WORD = 0.055, 0.12

script = json.load(open(os.path.join(ROOT, "data", "script.json"), encoding="utf-8"))
t, scenes = LEAD, []
for i, sc in enumerate(script["scenes"]):
    start = 0.0 if i == 0 else t
    sents = []
    for s in sc["sentences"]:
        words = []
        for w in re.findall(r"\S+", s):
            d = max(MIN_WORD, PER_CHAR * len(w))
            words.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d + GAP_WORD + (0.25 if re.search(r"[,:—]$", w) else 0)
        sents.append({"text": s, "start": words[0]["start"], "end": words[-1]["end"], "words": words})
        t += GAP_SENT
    t += TAIL if i == len(script["scenes"]) - 1 else GAP_SCENE
    scenes.append({"id": sc["id"], "start": round(start, 3), "end": round(t, 3), "sentences": sents})
out = {"voice": None, "duration": round(t, 3), "method": "DRAFT: estimated from text length, no audio", "scenes": scenes}
json.dump(out, open(os.path.join(ROOT, "data", "timings.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("draft duration", out["duration"])
for s in scenes:
    print(s["id"], s["start"], s["end"])
