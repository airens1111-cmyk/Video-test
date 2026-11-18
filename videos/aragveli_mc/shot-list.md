# Список планов — 300 ARAGVIANS (этап 1, на бумаге)

44 плана, всего 186 с (~3:06). Мастер 16:9 · 24 fps · кадр 2.39:1 с полосами.
Объектив — фокусное расстояние в мм для сенсора Super 35 (риг камеры: `video/src/camera/rig.ts`).
**Кроп 9:16** — доля ширины мастера, которую берёт вертикальная камера (`vertical.crop`), и сдвиг по горизонтали (`pan`).
Всё важное — вне зон интерфейса Instagram (сверху ~250 px, снизу ~350 px из 1920).
P01–P16 — камерные позиции на рельефе (`video/src/camera/shots.ts`); F1–F8 — пробные облёты этапа 1.
«(stage 2)» — персонажи, армии, лошади, знамёна появятся после одобрения; на этапе 1 эти места снимаются пустыми.

| # | Старт | Акт | Тип | Объектив, мм | Движение камеры | Длит. | Локация | Пресет света | Кроп 9:16 | В кадре |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 0:00.0 | I | extreme wide | 24 | crane down (F1) | 5 s | (d) Aragvi gorge · P01 | `dawn` | crop 0.55, center | Dawn mist over the Aragvi, block clouds |
| 02 | 0:05.0 | I | wide | 18 | low-angle push-in | 3 s | (d) tower on the spur · P02 | `dawn` | crop 0.5, tower centered | Highland tower, smoke from hearths |
| 03 | 0:08.0 | I | extreme wide | 24 | high orbit (F2) | 5 s | (a) Krtsanisi field · P03 | `overcast` | crop 0.6, field center | Empty field; dust trail on the southern road |
| 04 | 0:13.0 | I | extreme wide | 35 | slow push-in over the horizon | 4 s | (a) road from the south · P06 | `overcast` | crop 0.5, pan +0.2 to dust | Dust trail grows — the Qajar army (stage 2) |
| 05 | 0:17.0 | I | wide | 24 | crane up, title | 3 s | (a) field | `overcast` | title in middle third | Title 300 ARAGVIANS assembling from blocks |
| 06 | 0:20.0 | II | extreme wide | — | map: top-down dolly | 6 s | voxel map | `overcast` | map centred, labels inside safe zone | Kartli-Kakheti highlighted, Tbilisi tower icon |
| 07 | 0:26.0 | II | wide | — | map: arrows from the south | 5 s | voxel map | `overcast` | same | Qajar army arrows via the Aras, Ganja |
| 08 | 0:31.0 | II | wide | — | map: northern dotted line fades | 4 s | voxel map | `overcast` | same | 'Russia, 1783' fades out |
| 09 | 0:35.0 | II | medium | 50 | slow push-in | 5 s | king's tent near the city · P05 | `overcast` | crop 0.5, king centered | Erekle II at the map, candle (stage 2) |
| 10 | 0:40.0 | II | close-up | 85 | rack focus candle → face | 5 s | king's tent | `overcast` | crop 0.45, face upper third | Dramatized line |
| 11 | 0:45.0 | II | wide | 35 | pull-back from the tent | 5 s | P05 rise behind the line | `overcast` | crop 0.55 | Camp on the hill, empty field beyond |
| 12 | 0:50.0 | III | extreme wide | 24 | lateral dolly across both armies | 6 s | (a) field · P08 | `battleNoon` | crop 0.6, pan 0 → +0.3 | Thin Georgian line vs a sea of banners (≈5,000 / ≈30–40,000) |
| 13 | 0:56.0 | III | wide | 35 | tracking along the line (F3) | 5 s | (a) Georgian line · P04 | `battleNoon` | crop 0.55, pan +0.25 | Low over dry grass, dust on the wind |
| 14 | 1:01.0 | III | medium | 50 | static, slight handheld | 4 s | (a) Imeretian wing | `battleNoon` | crop 0.5 | Solomon II's detachment (stage 2) |
| 15 | 1:05.0 | III | extreme wide | 24 | crane down the gorge | 5 s | (d) Aragvi gorge | `dawn→battleNoon` | crop 0.55 | Highlanders come down (stage 2) |
| 16 | 1:10.0 | III | low-angle | 18 | ground-level tracking | 5 s | (a) road to the field | `battleNoon` | crop 0.5, horizon at 1/3 | Boots in the grass, dust (stage 2) |
| 17 | 1:15.0 | IV | wide | 24 | fast tracking with the cavalry | 4 s | (a) mid-field · P07 | `battleNoon` | crop 0.55, pan −0.2 | Cavalry charge, dust trail |
| 18 | 1:19.0 | IV | medium | 35 | handheld, impact | 3 s | (a) shield wall | `battleNoon` | crop 0.5 | Shield wall takes the hit: sparks, cube dust |
| 19 | 1:22.0 | IV | close-up | 85 | slow-mo 0.25× | 3 s | (a) duel pair 1 | `battleNoon` | crop 0.45 | Overhead strike → shield → sparks |
| 20 | 1:25.0 | IV | OTS | 50 | over-the-shoulder, handheld | 3 s | (a) duel pair 2 | `battleNoon` | crop 0.45 | Crossed blades, faces close |
| 21 | 1:28.0 | IV | close-up | 85 | whip pan → | 2 s | (a) duel pair 3 | `battleNoon` | crop 0.45 | Shield bash, opponent falls and settles |
| 22 | 1:30.0 | IV | POV | 24 | handheld POV through the ranks | 3 s | (a) Georgian rank | `battleNoon` | crop 0.5 | Spears, dust, sky glimpses |
| 23 | 1:33.0 | IV | extreme wide | 24 | high orbit | 4 s | (a) field · P08 | `battleNoon` | crop 0.6 | Second wave over the whole field |
| 24 | 1:37.0 | IV | wide | 35 | crane over the river | 4 s | Mtkvari ford, east of the field | `battleNoon` | crop 0.55 | Cavalry crosses the Kura, cube splashes |
| 25 | 1:41.0 | IV | wide | 50 | static, artillery flashes | 4 s | (a) field | `battleNoon` | crop 0.5 | Artillery duel: flashes, smoke |
| 26 | 1:45.0 | IV | medium | 35 | push-in through smoke | 3 s | (a) field | `battleNoon` | crop 0.5 | Main assault on the 11th |
| 27 | 1:48.0 | V | medium | 35 | handheld, then slow-mo | 4 s | (a) breaking line | `battleNoon (drained)` | crop 0.5 | The line breaks; sound drops out |
| 28 | 1:52.0 | V | close-up | 85 | rack focus flag → king | 5 s | (a) command rise · P09 | `battleNoon (drained)` | crop 0.45, king upper third | Mourning theme enters |
| 29 | 1:57.0 | V | wide | 50 | slow push-in | 5 s | (a) command rise | `crimsonSunset (drained)` | crop 0.5 | Ring of enemies closing |
| 30 | 2:02.0 | V | medium | 50 | static | 6 s | (a) command rise | `crimsonSunset` | crop 0.5 | Bodyguards take the bridle; the king is led away (dramatized) |
| 31 | 2:08.0 | VI | medium | 35 | orbit (F5) | 5 s | (b) Mtkvari bank · P11 | `crimsonSunset` | crop 0.6 | The Aragvians turn to face the storm |
| 32 | 2:13.0 | VI | wide | 50 | tracking along the road (F4) | 5 s | withdrawal road · P10 | `crimsonSunset` | crop 0.55 | The king's party heads for the city and the mountains |
| 33 | 2:18.0 | VI | low-angle | 24 | static low over the bank | 4 s | (b) bank · P12 | `crimsonSunset` | crop 0.5, horizon low | They hold the road |
| 34 | 2:22.0 | VI | close-up | 85 | slow-mo, handheld | 3 s | (b) | `crimsonSunset` | crop 0.45 | One falls — sparks, dust settles |
| 35 | 2:25.0 | VI | close-up | 85 | slow-mo | 3 s | (b) | `crimsonSunset` | crop 0.45 | Another falls |
| 36 | 2:28.0 | VI | medium | 50 | rack focus hand → banner | 5 s | (b) | `crimsonSunset` | crop 0.45 | By tradition: reaching for the khan's banner |
| 37 | 2:33.0 | VI | extreme wide | 24 | pull-back up and away | 5 s | (b) → city | `crimsonSunset` | crop 0.6 | Fade to black |
| 38 | 2:38.0 | VII | extreme wide | 35 | push-in across the river (F7) | 5 s | (c) Tbilisi burning · P13 | `burningTbilisi` | crop 0.6 | Fire, smoke, ash; glow on the river |
| 39 | 2:43.0 | VII | wide | 24 | slow crane over the old city | 4 s | (c) Kala → Narikala · P14 | `burningTbilisi` | crop 0.6 | Narikala walls against the glow |
| 40 | 2:47.0 | VII | medium | 35 | static, river mist | 4 s | (c) Metekhi cliff & bridge · P15 | `finalDawn` | crop 0.5 | Dawn after the fire |
| 41 | 2:51.0 | VII | wide | 50 | static, wind only | 4 s | (b) bank | `finalDawn` | crop 0.5 | King and survivors, weapons lowered (symbolic) |
| 42 | 2:55.0 | VII | medium | 50 | pull-back (F8) | 4 s | (e) place of memory · P16 | `finalDawn` | crop 0.55 | Memorial stone, river mist; '27.06.2008 · Holy Martyrs' |
| 43 | 2:59.0 | VII | insert | — | graphic | 3 s | titles | `finalDawn` | text in middle third | '11 Sept (O.S.) · 24 Sept' · 'Monument, 1959' · 'Metro "300 Aragveli", 1967' |
| 44 | 3:02.0 | VII | card | — | static | 4 s | end card | `—` | safe zones respected | Avatar 'კლონი', Follow, 'Dramatized, based on historical accounts' |
