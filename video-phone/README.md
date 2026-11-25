# Reel: «რატომ ვიჭედებით ტელეფონში» (Remotion)

Vertical 1080×1920, 30 fps Georgian explainer, about 1:02. Same look as `../video-sugar/`.

## Scenes
| # | picture |
|---|---------|
| 01 | "just one minute" — feed scrolls, timer races 01:00 → 30:00 |
| 02 | the feed as a slot machine: dull / jackpot / unknown |
| 03 | dopamine: predictable reward vs anticipation + unexpected reward |
| 04 | variable reward: behaviour persists after rewards stop (Skinner) |
| 05 | the feed has no bottom; Aza Raskin, inventor of infinite scroll: "I regret it" (BBC, 2018) |
| 06 | red badges, sound, vibration |
| 07 | tips (notifications off, phone out of the bedroom, grayscale screen), outro |

## Build
```bash
cd video-phone
ELEVENLABS_API_KEY=... python3 tools/tts_eleven.py
python3 tools/audio_mix.py
npx remotion render src/index.ts Reel ../output/raw.mp4
```
