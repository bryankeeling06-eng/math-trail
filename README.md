# Math Trail

A kid-friendly side-scrolling math runner for ages 5–6. Plain static files — no build step.

**Play:** https://bryankeeling06-eng.github.io/math-trail/

**Admin preview (all crew unlocked):** add `?admin=1` to the Play URL.

If the link 404s for a minute after a push, GitHub Pages is still building — wait ~30–60 seconds and refresh.

## How to play

1. Pick **Add**, **Subtract**, or **Mixed**.
2. Tap **Start Trail** (or **Continue saved trail** if you have a run in progress).
3. A gate rolls toward you with a 0–9 math problem. Tap the correct answer (or press `1` / `2` / `3`) before you reach it.
4. Fill 5 stepping-stones to arrive at the next place. You have 3 lives.

Stars, owned crew/hats, mute, and trail stamps stay saved in that browser (`mathTrailSaveV5`).

## Trail places (loops)

Sunny Hills → Picnic Spot → Duck Pond → Treehouse → Red Barn → Pumpkin Patch → Candy Trail → Snowy Hill → Firefly Night → Outer Space → (back to Sunny Hills)

## What's in the game

- Modes: addition, subtraction, mixed — answers stay 0–9
- Slow pace for 5–6 year olds; speed ticks up a little after correct gates
- 3 lives, bonus-life math question after game over
- **Trail Shop**: Crew characters + Hats (not a costume shop)
- Buddy runner, win moves, pause / mute / fullscreen
- Kid-voice clip paths with `speechSynthesis` fallback when clips are missing

## Files

- `index.html` — UI shell
- `game.js` — single consolidated game (core + trail landmarks, space, shop, polish)
- `.nojekyll` — tells GitHub Pages not to run Jekyll
- `DEPLOY.md` — how to publish

## Deploy

See `DEPLOY.md`. Copy these files over the GitHub repo `main` and push; Pages will update.

## Voices

Cheer and comfort lines play from `voices/*.mp3` (warm teacher voice: Emma Multilingual). Browser TTS is only a fallback if a clip fails to load.
