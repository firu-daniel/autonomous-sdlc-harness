### 2. `scripts/run-gates.sh` still says it uses "the same derivation" as the wrappers `init` writes, which this branch changed

**File:** `scripts/run-gates.sh` (the anchoring comment above `script_dir=`) — "the same derivation, and the same reasoning, as the wrappers `init` writes."

**The problem.** This repository's own `commands.test` wrapper, `scripts/test.sh`, ends in `bash scripts/run-gates.sh "$@"`. `run-gates.sh` places its root with this block, which the branch did not touch:

```bash
# Anchor to the repository root from this script's own location, never the caller's directory —
# the same derivation, and the same reasoning, as the wrappers `init` writes.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
```

The branch changed the derivation the wrappers use (`cli/templates/scripts/test.sh`, `typecheck.sh`, `start-dev-server.sh`, `deploy.sh`, and this repository's rendered `scripts/test.sh` and `scripts/typecheck.sh`). They now walk up to the nearest directory that holds `harness.config.json` and that git confirms as its own top. They fall back to git's discovery from the script's own directory only when no directory confirms. `run-gates.sh` still starts git's discovery at `scripts/`, which is exactly the F15 failure the wrappers were changed to avoid. So the comment now claims a sameness that does not exist.

**Who is misled.** A maintainer who reads `run-gates.sh` for how it places its root, or checks whether it shares the wrappers' F15 behaviour, gets "yes" from the comment. The code says "no". No supported layout of this repository mounts a `scripts/.git` placeholder in the checkout a gate runs from: the repository runs no `execution.target` job, and in the clone layout the launcher's `"$target"/?*` filter skips the main checkout's entry. So this is a stale claim, not a live failure.

**Fix.** Make the comment state what the code does. In `scripts/run-gates.sh`, replace the exact substring

```
# the same derivation, and the same reasoning, as the wrappers `init` writes.
```

with

```
# the same reasoning as the wrappers `init` writes, but by git's discovery from this script's own
# directory rather than their `harness.config.json` walk (`docs/sandbox-verification.md` §5 F15).
```

Change nothing else in the file. This edits a comment only and calls for no test run.
