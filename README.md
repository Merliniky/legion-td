# 军团战争 · Legion TD (demo v2 · Mega 3.41)

A single-player mobile web demo modelled on the WC3 custom map Legion TD. It reuses the art and audio from 英雄冲突 / 宝石塔防: the HoMM3 sprite atlases, three.js toon daylight scene, FX pools, SFX and music, and UI style. It is plain static files with no build step.

- `index.html`, `lt.css`: the portrait phone UI. All text is Simplified Chinese.
- `lt_core.js`: pure game logic, shared by the browser (`window.LT`) and node. It covers lanes, combat, economy, waves, mercenaries and the AI opponent.
- `lt.js`: the renderer and UI. It uses the same sprite-atlas/facing system as `td.js`.
- `sim.js` / `calib.js`: balance sims (AI vs AI). Run `node sim.js 60` or `node calib.js 30`.
- `test/qa.js`, `test/qa2.js`, `test/desk.js`: headless Playwright QA at 390×844. Screenshots are written to `shots/`.
- Copied from heroes-clash (read-only copy): `lib/`, `assets/`, `icons/`, `audio.js`, `sprdata.js`, `style.css`, `td.css`, `CREDITS.md`. `assets/ui/*.png` holds roster icons cropped from the sprite atlases.

Debug URL flags: `?debug&seed=N&gold=N`, `?autostart`.

## v2 — Legion TD Mega 3.41 roster

- `data/roster_mega.json`: all 16 races (including Prophet random pool and Hybrid morphs), 187 units with their branching upgrades, 31 waves (bosses at 10/20/30), 24 mercenaries, the king, economy, damage table and modes. Stats come from the map's object data, and ability behaviour is corrected with the *Legion TD Mega Book 3.41*. Estimated values are marked `est:true`.
- `data/roster_mega.md`: the same data as a Chinese table, including the model mapping. Regenerate it with `node tools/gen_md.mjs`. The extraction scripts are in `tools/ltd_extract/`.
- `models.js`: the model mapping for every unit, wave creep and summon. It uses reused HD sprites with tint, scale and 3D decorations, or procedural toon meshes. `abil_zh.js` holds the Chinese ability names.
- Modes: X3, the original rule (36 crabs on wave 1, and so on); X1, a simplification (counts ×⅓, bounty ×3).
- URL flags: `?race=Orc`, `?mode=X1`, `?ai=Undead`, `?showcase=<race|waves|summons>`.
- QA: `RACE=Orc node test/qa_race.js` (390×844, picks the race in the UI, builds, then the AI plays to wave 6). `node test/showcase.js` writes `shots/races/showcase_*.png`. The results are in `test/results/`.
