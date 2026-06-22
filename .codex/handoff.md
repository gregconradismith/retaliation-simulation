# Retaliation Simulation Handoff

Date: 2026-06-22

Created 2026-06-21 as a sibling static GitHub Pages/PWA game repository.

Current state:

- Dependency-free static app scaffold.
- Artillery exchange simulation with two sides.
- Left and right controls for launch frequency, explosion mean, and explosion variance.
- Launch timing uses stochastic waiting times controlled by side-specific frequency.
- Projectiles launch from the visible gun muzzle using shared battery geometry.
- Vertical timeline shows launch ticks and impact circles scaled by explosion size.
- Explosion sizes are sampled from side-specific normal distributions.
- Explore mode shows editable parameters.
- Challenge mode hides randomized parameters for a timed round and asks which side is more aggressive.
- Current aggression score is launch frequency times mean explosion size.
- Round duration is user-adjustable and defaults to 30 seconds.
- PWA manifest, service worker, and icons.
- GitHub Pages target URL: `https://gregconradismith.github.io/retaliation-simulation/`.

Important caution:

The model is intentionally a toy perception game. It should not be described as
a validated model of conflict escalation.

## Migration Readiness Snapshot

- Checked on 2026-06-21 before moving computers.
- Non-interactive `git fetch --all --prune` completed successfully.
- Root `README.md` points to `.codex/handoff.md` when a root README exists.

Pre-edit Git state after fetch:

```bash
## main...origin/main
```

## 2026-06-21 Update

- Fixed projectile start points so artillery originates at the visible barrel tip instead of randomized positions around the tank.
- Added horizontal launch tick marks to the vertical timeline while preserving filled impact circles scaled by explosion size.
- Bumped the service-worker cache name and app.js cache-busting query for the app-shell change.
- Verified with `node --check app.js`, `node --check service-worker.js`, `git diff --check`, and local browser previews at desktop and mobile width.

## 2026-06-21 Visual Marker Update

- Made timeline launch ticks shorter and thinner.
- Enlarged timeline impact circles and increased their nonlinear scaling with explosion size.
- Moved Blue and Red battlefield labels to the upper left and right corners of the canvas.
- Removed the translucent field drawn around in-flight projectiles.
- Bumped the service-worker cache name and app.js cache-busting query.

## 2026-06-21 Horizontal Ticker Update

- Replaced the central vertical ticker with two horizontal top-of-battlefield progress tracks.
- The blue and red timeline lines grow from left to right over the round duration.
- Launch ticks and impact-size circles appear along the elapsed portion of each horizontal track.
- Moved Blue and Red battlefield labels beside their respective tanks.
- Bumped the service-worker cache name and app.js cache-busting query.

## 2026-06-21 Civilian Buildings Update

- Added a small school to the right of the blue tank and a small hospital to the left of the red tank.
- Kept the buildings on the battlefield layer behind tanks, projectiles, and explosions.
- Bumped the service-worker cache name and app.js cache-busting query.

## 2026-06-21 Building Cleanup Update

- Reworked the school and hospital drawings with larger, cleaner silhouettes and simpler symbols.
- Reduced tiny cramped details so the buildings read better at desktop and mobile canvas sizes.
- Bumped the service-worker cache name and app.js cache-busting query.
