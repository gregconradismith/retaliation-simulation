# Agent Instructions

This repository is a static browser simulation published with GitHub Pages:

https://gregconradismith.github.io/retaliation-simulation/

It follows the dependency-free static/PWA pattern used by `polyqual-game`.
There is no MATLAB reference script for this project. Greg will specify the
actual game mechanics in prose; until then, treat the current dynamics as a
replaceable toy model, not as a validated model of retaliation, conflict, or
social behavior.

Important files:

- `index.html` is the app shell and includes PWA/iPhone metadata.
- `styles.css` contains responsive styling.
- `app.js` contains the provisional simulation model, canvas drawing, controls,
  scoring/status metrics, and service-worker registration.
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

Then open `http://127.0.0.1:8765/` and verify the canvas is nonblank, controls
work, status metrics update, and desktop plus mobile-width layouts are usable.

Do not commit local noise such as `.DS_Store`, editor files, or generated
temporary artifacts.
