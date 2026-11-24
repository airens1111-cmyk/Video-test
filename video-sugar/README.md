# Reel: «რატომ გვიზიდავს შაქარი» (Remotion)

Vertical 1080×1920, 30 fps Georgian explainer, about 1:08. Same look as `../video-merab/`.
Animations are cued to words in `data/timings.json`.

## Scenes
| # | picture |
|---|---------|
| 01 | "why do you want one more?" — bitten donut, second donut |
| 02 | tongue → brain, reward centre lights up, dopamine |
| 03 | blood glucose chart spikes; pancreas sends insulin "keys" to cells |
| 04 | glucose drops below normal: tiredness, craving; the loop |
| 05 | a 330 ml can ≈ 35 g ≈ 9 teaspoons; WHO: ideally ≤ 6 (≈ 25 g); drinks barely fill you |
| 06 | "sugar addiction" is not an official diagnosis; animal studies vs habit + reward |
| 07 | three tips, outro |

## Facts
- Cola: ~10.6 g sugar / 100 ml → ~35 g per 330 ml; 1 teaspoon ≈ 4 g.
- WHO guideline (2015): free sugars < 10 % of energy, further reduction to < 5 % (~25 g, ~6 teaspoons) for additional benefit.
- Binge-like sugar intake in rats with intermittent access (Avena et al., 2008); no "sugar addiction" diagnosis in DSM-5.
- Perceived sweetness rises after a lower-sugar diet (Wise et al., 2016).

## Build
```bash
cd video-sugar
python3 tools/draft_timings.py                  # optional: preview without audio
ELEVENLABS_API_KEY=... python3 tools/tts_eleven.py
python3 tools/audio_mix.py
npx remotion render src/index.ts Reel ../output/raw.mp4
ffmpeg -i ../output/raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -profile:v high -crf 18 -movflags +faststart -c:a copy ../output/sugar_ka.mp4
```
