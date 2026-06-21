# Agent Instructions

This repository is a static browser simulation published with GitHub Pages:

https://gregconradismith.github.io/retaliation-simulation/

It follows the dependency-free static/PWA pattern used by `polyqual-game`.
There is no MATLAB reference script for this project. The current game is a
stylized artillery exchange between two sides. Preserve the central behavior:
each side launches across the canvas, launch timing is controlled by that
side's frequency, and explosion sizes are sampled from side-specific normal
distributions with configurable mean and variance. Keep controls for the left
side on the left and controls for the right side on the right. Preserve the two
modes: Explore mode with visible editable parameters, and Challenge mode with
hidden randomized parameters, a timed round, player judgment of which side is
more aggressive, and a reveal of parameters plus expected and observed summary
statistics. In the current non-reactive model, aggression is defined as launch
frequency times mean explosion size.

Important files:

- `index.html` is the app shell and includes PWA/iPhone metadata.
- `styles.css` contains responsive styling.
- `app.js` contains mode state, stochastic launch timing, normal explosion-size
  sampling, canvas drawing, controls, event logging, round scoring/reveal, and
  service-worker registration.
- `manifest.webmanifest` defines installable app metadata.
- `service-worker.js` caches the app shell for offline/PWA behavior.
- `icons/` contains app icons.
- `.codex/handoff.md` records the initial scaffold state.

Keep the app dependency-free unless Greg explicitly asks otherwise. Use relative
paths so it works from the project Pages URL.

When changing any app-shell file cached by the service worker, update the cache
name in `service-worker.js` (for example, `retaliation-simulation-v2`) so
browsers and iPhone Home Screen installs receive the new version.

For JavaScript or service-worker changes, run:

```bash
node --check app.js
node --check service-worker.js
git diff --check
```

For UI, canvas, scoring, or interaction changes, preview locally:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/` and verify artillery arcs render, explosions
appear at impact, left and right controls affect their respective sides in
Explore mode, Challenge mode hides parameters before reveal, decision buttons
reveal the correct answer and statistics, event logs update, and desktop plus
mobile-width layouts are usable.

Do not commit local noise such as `.DS_Store`, editor files, or generated
temporary artifacts.
