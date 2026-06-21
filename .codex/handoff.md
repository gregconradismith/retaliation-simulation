# Retaliation Simulation Handoff

Created 2026-06-21 as a sibling static GitHub Pages/PWA game repository.

Current state:

- Dependency-free static app scaffold.
- Artillery exchange simulation with two sides.
- Left and right controls for launch frequency, explosion mean, and explosion variance.
- Launch timing uses stochastic waiting times controlled by side-specific frequency.
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
