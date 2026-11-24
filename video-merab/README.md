# Reel: «მერაბიშვილი საქართველოს წინააღმდეგ» (Remotion)

Vertical 1080×1920, 30 fps Georgian reel about the ECtHR Grand Chamber judgment
*Merabishvili v. Georgia* (28.11.2017). Same look and components as `../video/`.
Every animation is cued to words in `data/timings.json` (via `cue()` in `src/timing.ts`).

## Scenes
| # | file | picture |
|---|------|---------|
| 01 | scenes1.tsx `S01` | night prison, clock 01:29 → 01:30, cell opens, jacket over the head, car drives off |
| 02 | `S02` | case card (silhouette, no photo), "former PM", calendar December 2013 |
| 03 | `S03` | Tbilisi scheme (Mtkvari, streets), car route prison → chief prosecutor; the alleged deal |
| 04 | `S04` | TV, courtroom live broadcast, ticker; government: "absolute lie" |
| 05 | `S05` | CCTV camera, REC 01:30; bars "24 hours" vs "1 month" (to scale, 1:30) |
| 06 | scenes2.tsx `S06` | Europe map (Natural Earth), flight Tbilisi → Strasbourg, ECHR; Article 18 card |
| 07 | `S07` | official purpose vs hidden purpose, proof meter stuck at ~7% |
| 08 | `S08` | "direct evidence not required", mosaic of facts, stamp "night story confirmed" |
| 09 | `S09` | lawful detention → path turns to "obtaining information" |
| 10 | `S10` | Grand Chamber 17 seats, vote 9 : 8, "prison ≠ tool of pressure", outro |

## Re-voicing one scene
After editing one scene's text in `data/script.json`:
```bash
ELEVENLABS_API_KEY=... python3 tools/revoice_scene.py s04   # only that scene, same voice and loudness
python3 tools/audio_mix.py                                  # rebuild public/mix.wav
```
Later scenes' timings shift automatically; scene animations are cued to words, so they follow.

## Fact check (HUDOC, judgment 001-178753, Grand Chamber, 28.11.2017)
- §60: ~1.30 a.m., Saturday 14.12.2013, taken from Prison no. 9 in a car, head shrouded in his jacket,
  to what he believed was the **Penitentiary Department building**, where the Chief Public Prosecutor was.
  Told publicly at the hearing of 17.12.2013, broadcast live.
- §200: drive of about ten minutes; §70: Minister of Prisons called it "an absolute lie".
- §74: footage kept "only twenty-four hours", then automatically deleted.
- §77: affidavit of the former deputy Minister of Prisons: footage kept for a month.
- §11: Prime Minister July–October 2012; §24: arrested 21.05.2013.
- §335: no direct evidence, but indirect elements; §353: predominant purpose changed.
- Operative part, point 8: violation of Article 18 with Article 5 § 1, **nine votes to eight**; 17 judges.

## Photos (`public/photos/`, cropped)
| file | source (Wikimedia Commons) | licence |
|---|---|---|
| merabishvili.jpg | File:Ivane Merabishvili.jpg — Government of Georgia | public domain |
| zhvania.jpg | File:Surab Schwania.jpg — Andy Dunaway, U.S. Air Force | public domain |
| saakashvili.jpg | File:Mikheil Saakashvili (9798043996).jpg — European People's Party | CC BY 2.0 (credit shown in scene 03) |

## Files
- `src/config.ts` — channel, colours, fonts, voice, safe zones.
- `data/script.json` — narration per scene; `data/timings.json` — word timings (ElevenLabs).
- `data/keywords.json` — subtitle words coloured accent / yellow / danger.
- `data/europe.json` — Europe country outlines for scene 06, projected from Natural Earth 1:50m
  (`world-atlas@2.0.2`, public domain), equirectangular lon −11…50, lat 34…61.
- `public/mix.wav` — voice + music/SFX mix used by the reel.

## Build
```bash
cd video-merab
npm ci
npx remotion studio src/index.ts                       # preview
npx remotion render src/index.ts Reel ../output/raw.mp4 # add --browser-executable=... if Chrome cannot be downloaded
ffmpeg -i ../output/raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -profile:v high -crf 18 -movflags +faststart -c:a copy ../output/merabishvili_ka.mp4
```
