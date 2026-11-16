# Emberfall

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/harrxzz/emberfall/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/harrxzz/emberfall/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Gather embers, tend the fire and ward off hollows until dawn. Art is drawn in Canvas; sound is procedural Web Audio and starts after a player gesture. The game runs offline.

## Play

```sh
python3 -m http.server 8080 --directory game
# Open http://localhost:8080/
```

Move with WASD or arrow keys, aim the lantern with the mouse, hold click or Space to ward, return to the fire to automatically offer carried embers, and press Escape to pause. Touch controls are available on coarse-pointer devices.

## Build the dossier

Node.js 22.18 or later is required. Capture the three screenshots listed in `shots.json` from the running game at 1280 × 720, and save them under `screenshots/`. Then run:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/emberfall-output node main.ts
```

The output directory must be outside this repository. The program copies the game and screenshots there and generates `dossier.json` using the official kit's vendored library. Rebuild after any game or screenshot change. Run `node --test tests/simulation.test.mjs` for the simulation tests.

## License

MIT; see [LICENSE](LICENSE).
