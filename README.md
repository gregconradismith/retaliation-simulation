# Retaliation Simulation

A dependency-free static web game for assessing perception of conflict
dynamics through a stylized artillery exchange. It is intended for publication
directly with GitHub Pages.

Live app:

```text
https://gregconradismith.github.io/retaliation-simulation/
```

The current browser model has two sides. Each side launches artillery across
the canvas according to its own stochastic launch frequency. Explosion sizes
are sampled from side-specific normal distributions with means and variances
set by the side controls.

Explore mode exposes those parameters directly. Challenge mode hides randomly
chosen parameters for a timed round, asks which side is more aggressive, and
then reveals the parameters plus expected and observed summary statistics.
Aggression is currently scored as launch frequency times mean explosion size.

This is a toy perception game, not a validated model of conflict escalation.

## GitHub Pages

Publish this repository from the `main` branch root. The app uses relative paths
so it works from a project URL such as:

```text
https://USERNAME.github.io/REPOSITORY/
```

On iPhone, open the Pages URL in Safari and use Share -> Add to Home Screen.

## Local Preview

From this directory:

```sh
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Codex Coordination

Codex session state is tracked in `.codex/handoff.md`; durable decisions and
task history may also appear in `.codex/` when useful.
