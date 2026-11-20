# Heaveball model, rigging and animation options and plan

Goal: produce player models and animations for the Heaveball simulator at the lowest cost, using AI tools where they help and shared assets everywhere else. Matchroom is a browser prototype with a top-down canvas view and eight players per team, and the reference sheets (`charactermodelreference.png`, `bodytypesreference.png`, `heightsbodystyleshairreference.png`) set a stylized low-poly look. All work should run in a browser or on a Chromebook.

## Principles

1. **One base character, many players.** Do not model each player. Generate variety in code from the player-generation spec (height, weight, role).
2. **One skeleton, many clips.** Pick a single humanoid skeleton first. Every model and animation must target it.
3. **Match detail to the camera.** The current overhead view needs far less art than a broadcast or replay camera.
4. **Let the sim drive the animation.** Blend a small clip set using speed, agility, fatigue and contact events rather than authoring many unique clips.
5. **Prove one character end to end** (image, 3D model, rig, animation, in-browser) before building a roster.

## Options

### A. Model creation

| Option | Notes | Cost |
| --- | --- | --- |
| Image-to-3D (Meshy, Tripo, Hunyuan3D) | Feed a clean front view (plus side/back if available) from the reference sheets. Generate 5–10 candidates and keep the best. Hunyuan3D is open source. | $0–20 (free tiers; verify commercial-use terms) |
| Hand modeling in Blender | Highest control, slowest. Linux/Chromebook support may be unreliable. | $0 plus time |
| Browser 3D tools (e.g. Spline) | Runs on a Chromebook, limited rigging control. | $0–low |

Target 2,000–5,000 triangles. The faceted style hides AI mesh flaws.

### B. Rigging

| Option | Notes | Cost |
| --- | --- | --- |
| Mixamo auto-rig | Browser-based, standard humanoid skeleton, free. Check license terms. | $0 |
| Tool's built-in auto-rig (Meshy, Tripo) | Convenient, skeleton may differ from Mixamo. | Included |
| Manual rig | Only if auto-rig fails on the model. | Time |

### C. Animation

| Option | Notes | Cost |
| --- | --- | --- |
| Mixamo library | Run, sprint, jog, idle, jump, tackle, fall, dive, catch and throw-style motions. Works on any model on the same skeleton. | $0 |
| AI text-to-motion (Meshy animations, Cascadeur, open-source MDM-style models) | Use only for gaps such as a one-handed catch or a kick save. | $0–30 |
| Mocap from video | Possible later for signature moves. | Varies |

### D. Rendering approach

| Option | When it fits |
| --- | --- |
| Pre-rendered sprite sheets (e.g. 8 directions × key actions) | Overhead or fixed-angle view. Cheapest at runtime, works on any device. |
| Real-time 3D (Three.js or Babylon.js) with skinned meshes | Broadcast camera, replays, close-ups. Use shared mesh and material instances for 16 players. |

Decide the camera first because it sets the art budget.

## Player variety in code

- Scale bones and apply 3–5 morph targets (heavy, lean, broad shoulders) from generated height and weight.
- Swap skin tone, hair, jersey color and jersey number through a texture atlas or shader parameters.
- Keep helmet, pads and shorts shared, as in the reference sheets.
- Share one mesh and material across all instances.

## Sim-driven animation

- Blend idle, jog and sprint by current speed.
- Scale playback speed by Speed and Agility ratings.
- Add lean and braking from cut angle.
- Trigger tackle, fall and catch clips from contact and ball events.
- Target 8–12 well-blended clips rather than dozens of unique ones.

## Plan

| Phase | Work | Output |
| --- | --- | --- |
| 0. Decide | Confirm camera style (overhead sprites vs 3D) and skeleton. | Decision note |
| 1. Pilot | One character: image-to-3D, clean up, auto-rig in Mixamo, apply run/idle/tackle, view in browser. | Working pilot character |
| 2. Variants | Add morph targets and texture/color swaps for the three roles and body types. | Roster-ready character system |
| 3. Clip set | Assemble the core clip set and fill gaps with AI motion. | 8–12 clip library |
| 4. Integrate | Hook sim values (speed, agility, fatigue, contact) to blending in the renderer. | Animated Matchroom players |
| 5. Polish | Sprite-sheet export or LODs, jersey number rendering, performance check on a Chromebook. | Release candidate |

## Estimated cost

| Item | Route | Rough cost |
| --- | --- | --- |
| Base model | Image-to-3D, free tier or open source | $0–20 |
| Rigging | Mixamo | $0 |
| Core animations | Mixamo library | $0 |
| Missing clips | Free or low-cost text-to-motion | $0–30 |
| Variety | Code (scale, morphs, textures) | $0 |
| Engine | Three.js or Babylon.js | $0 |

## Risks and checks

- **Licensing.** Confirm commercial-use terms for every AI tool and for Mixamo before shipping.
- **Skeleton mismatch.** Models or clips on a different skeleton waste credits. Fix the skeleton first.
- **AI artifacts.** Check for fused fingers, broken pads and asymmetric faces from all angles.
- **Performance.** Test 16 animated players on a mid-range Chromebook.
- **Scope.** Keep to the pilot until the pipeline works end to end.

## Open questions

- Sprite sheets or true 3D for the next milestone?
- Which skeleton and rig standard (Mixamo humanoid is the default assumption)?
- How many body types and hair/face variants are needed at launch?
