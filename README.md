# Retaliation Simulation

A dependency-free static web simulation scaffold for exploring retaliation,
repair, and escalation dynamics. It is intended for publication directly with
GitHub Pages.

Live app:

```text
https://gregconradismith.github.io/retaliation-simulation/
```

The current browser model is a provisional toy model: agents sit on a ring,
external provocations raise grievances, retaliatory responses transmit
grievance to neighbors, and repair damps the system. It is a working shell for
future development, not a claim about real social dynamics.

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
