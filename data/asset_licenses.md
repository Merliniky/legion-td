# Third-party asset licenses

All files in `assets/hq/` are third-party 3D assets that are free for commercial use. None of them are ripped from any commercial game.
They were optimized with gltf-transform (resample, dedup, prune, and PNG textures resized to 256px). Their geometry and rigs are unchanged.

| File | Source asset | Author | License | Source URL |
|---|---|---|---|---|
| kk_knight.glb | KayKit Character Pack: Adventurers 1.0, Knight (+ shared animation set) | Kay Lousberg (KayKit) | CC0 1.0 | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 |
| kk_barbarian.glb | KayKit Adventurers 1.0, Barbarian | Kay Lousberg | CC0 1.0 | same |
| kk_mage.glb | KayKit Adventurers 1.0, Mage | Kay Lousberg | CC0 1.0 | same |
| kk_rogue.glb | KayKit Adventurers 1.0, Rogue | Kay Lousberg | CC0 1.0 | same |
| kk_rogue_hooded.glb | KayKit Adventurers 1.0, Rogue (Hooded) | Kay Lousberg | CC0 1.0 | same |
| q_horse.glb | Horse | Quaternius | CC0 1.0 | https://poly.pizza/m/qvTrSG9pZF |
| q_horse_white.glb | White Horse | Quaternius | CC0 1.0 | https://poly.pizza/m/bEdE4rmZy9 |
| q_crab.glb | Crab Enemy | Quaternius | CC0 1.0 | https://poly.pizza/m/Gs3yfsV5lB |
| q_spider.glb | Spider | Quaternius | CC0 1.0 | https://poly.pizza/m/yRYJiAJyiM |
| q_hedgehog.glb | Hedgehog | Quaternius | CC0 1.0 | https://poly.pizza/m/Uu0PXwt2nU |
| q_pigeon.glb | Pigeon | Quaternius | CC0 1.0 | https://poly.pizza/m/9NGlBTpDEr |
| q_fish.glb | Fish | Quaternius | CC0 1.0 | https://poly.pizza/m/7V4gaDMQV8 |
| q_frog.glb | Frog | Quaternius | CC0 1.0 | https://poly.pizza/m/37wofOCOzG |
| q_birb.glb | Birb | Quaternius | CC0 1.0 | https://poly.pizza/m/gZ2ExU9OAB |
| q_dragon.glb | Dragon | Quaternius | CC0 1.0 | https://poly.pizza/m/3rUm1cN3yp |
| q_dragon_evo.glb | Dragon Evolved | Quaternius | CC0 1.0 | https://poly.pizza/m/LlwD0QNUPj |

The KayKit LICENSE.txt says: CC0 1.0 Universal, "free to use in personal, educational and commercial projects". Credit is appreciated but not required.
On poly.pizza, each Quaternius model page lists "Licence: CC0 1.0".

Considered and rejected:
- "Hawk Lp Rigged" (CC-BY, Sherkiz): attribution-only license.
- Poly by Google animals: CC-BY and not animated.

Code: `lib/addons/postprocessing/*` and `lib/addons/shaders/*` come from three.js r169 (MIT).
