# Reel: «რა არის მეფედრონი» (Remotion)

Vertical 1080×1920, 30 fps Georgian reel. All scene timing comes from `data/timings.json`.

## Files
- `src/config.ts` — channel name, handle (hidden by default), slogan, colours, fonts, voice, Instagram safe zones.
- `data/script.json` — narration text per scene (header tag, section label, sentences).
- `data/keywords.json` — subtitle words coloured by accent / yellow / danger.
- `tools/tts.py` — edge-tts voiceover → `public/voice.wav` + `data/timings.json`.
- `src/scenes/` — hand-drawn SVG/CSS scenes. Animations are cued to the words in `timings.json`.

## Build
```bash
cd video
npm ci
pip install edge-tts numpy
python3 tools/tts.py            # needs network access to speech.platform.bing.com
npx remotion studio src/index.ts  # preview
npx remotion render src/index.ts Reel ../output/raw.mp4   # add --browser-executable=... if Chrome cannot be downloaded
ffmpeg -i ../output/raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -profile:v high -crf 18 -movflags +faststart -c:a copy ../output/mephedrone_ka.mp4
```
