# 军团战争 · Legion TD (demo v1)

A single-player mobile web demo modelled on the WC3 custom map Legion TD. It reuses the art and audio from 英雄冲突 / 宝石塔防: the HoMM3 sprite atlases, three.js toon daylight scene, FX pools, SFX and music, and UI style. It is plain static files with no build step.

- `index.html`, `lt.css`: the portrait phone UI. All text is Simplified Chinese.
- `lt_core.js`: pure game logic, shared by the browser (`window.LT`) and node. It covers lanes, combat, economy, waves, mercenaries and the AI opponent.
- `lt.js`: the renderer and UI. It uses the same sprite-atlas/facing system as `td.js`.
- `sim.js` / `calib.js`: balance sims (AI vs AI). Run `node sim.js 60` or `node calib.js 30`.
- `test/qa.js`, `test/qa2.js`, `test/desk.js`: headless Playwright QA at 390×844. Screenshots are written to `shots/`.
- Copied from heroes-clash (read-only copy): `lib/`, `assets/`, `icons/`, `audio.js`, `sprdata.js`, `style.css`, `td.css`, `CREDITS.md`. `assets/ui/*.png` holds roster icons cropped from the sprite atlases.

Debug URL flags: `?debug&seed=N&gold=N`, `?autostart`.
