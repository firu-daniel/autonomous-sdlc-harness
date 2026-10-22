### Task 4 — Let `restart-watcher.sh` take a multi-word `HARNESS_CLI`

**Goal:** `HARNESS_CLI="node <root>/cli/dist/cli.js" bash scripts/restart-watcher.sh` bounces the daemon through that command. Today it refuses with `'node …/cli/dist/cli.js' is not on PATH`, because the whole value is handed to `command -v` and invoked as one word. The variable's first whitespace-separated word is the program that must resolve on `PATH`, and the remaining words are passed ahead of `daemon stop` / `daemon install`. A one-word value, and the unset default `autonomous-sdlc-harness`, behave exactly as before.

**Where this layer stops.** This task changes the **template** `cli/templates/scripts/restart-watcher.sh`, which is what a future adopter receives and what `cli/test/` exercises through an `init`-wired fixture. It does **not** touch this repository's own `scripts/restart-watcher.sh`. **Task 6** re-copies the finished template there byte for byte. The documentation of the measured rows in `docs/outer-loop-verification.md` §1.5 and the self-adopt recipe are **Task 7's**. The script stays an operator-only outer-loop script (`agentInvocable: false` in `cli/src/generators/outerLoopScripts.ts`, unchanged).

**Source:** `cli/templates/scripts/restart-watcher.sh` → the `# --- The CLI that owns the lifecycle.` block (`cli="${HARNESS_CLI:-autonomous-sdlc-harness}"`) and the two delegated calls `(cd "$main_repo" && "$cli" daemon stop)` / `(cd "$main_repo" && "$cli" daemon install)`.

### Targets

- `cli/templates/scripts/restart-watcher.sh`: the parse, the resolution check, the two invocations, the header and its `REPRO` block, including the preamble's `run()` helper.
- `cli/test/restart-watcher-cli.test.mjs` (new): the suite for the multi-word form.

**Work:**

- [ ] Split `${HARNESS_CLI:-autonomous-sdlc-harness}` into a bash array on whitespace with `read -r -a`. This is bash 3.2-safe, performs no glob expansion and no quote parsing (`.claude/context/conventions.md` → `## The stack…`, the 3.2 floor). A value that is empty or all whitespace after the split is refused with exit 1 and one line naming `HARNESS_CLI`, **before** any array expansion: under `set -u`, bash 3.2 treats `"${arr[@]}"` on an empty array as an unbound variable. Keep a display string (the value as given) for every message.
- [ ] Check the **first word** with `command -v`. The not-found message names that word and keeps the existing remedy line, extended with *"or set HARNESS_CLI to a command and its leading arguments, e.g. `node <path>/cli/dist/cli.js`"*. Exit 1 with nothing read, as the `no CLI` REPRO row requires today.
- [ ] Invoke both delegated commands as `"${cli_argv[@]}" daemon stop` / `"${cli_argv[@]}" daemon install`, still inside the `(cd "$main_repo" && …)` subshells and still each exactly once, with each status surfaced as today. The status and closing lines print the display string where they print `$cli` now.
- [ ] Header: state the `HARNESS_CLI` contract once, as *the first word must be on `PATH` and the remaining words are leading arguments, split on whitespace, so a path containing a space needs a one-line shim on `PATH` instead*. Add a `multi-word` row to the `REPRO` block (`HARNESS_CLI='hcli --via' run` -> `"$w/calls"` holds `--via daemon stop` then `--via daemon install`, exit 0) and a `blank` row (`HARNESS_CLI=' ' run` -> one line naming `HARNESS_CLI`, exit 1). Change the REPRO preamble's helper so a value put in front of `run` wins: today it reads `run() { PATH="$w/bin:$PATH" HARNESS_CLI=hcli bash "$d/scripts/restart-watcher.sh" "$@"; echo "exit $?"; }`, and its prefix assignment overrides the caller's, so `HARNESS_CLI='hcli --via' run` would still run with `HARNESS_CLI=hcli`. Write it as `HARNESS_CLI="${HARNESS_CLI:-hcli}"` inside `run()` (`:-` keeps a blank `' '`, which is non-empty). This also makes the existing `no CLI` row (`HARNESS_CLI=definitely-not-installed run`) reproduce, which it does not today; the `multi-word`, `blank` and `no CLI` rows are then each one input away from `idle`. Update the exit map's `1` line to name both new refusals. Keep `#!/usr/bin/env bash`, `set -u`, and no `set -e`.
- [ ] `cli/test/restart-watcher-cli.test.mjs` (new): its header opens with the rule: *a multi-word `HARNESS_CLI` runs its first word with the rest as leading arguments, and a one-word value behaves as before*. Reuse the arrangement of `cli/test/restart-watcher-remote.test.mjs`: `createWatcherFixture` from `cli/test/helpers/watcher.mjs`, a recorder `hcli` on a temp `PATH`, `HARNESS_AGENT_CLI` set to a name no process carries, and an idle registry. Cases:
  - (a) `HARNESS_CLI='hcli --via'` records `['--via daemon stop', '--via daemon install']` and exits 0;
  - (b) `HARNESS_CLI='hcli'` records `['daemon stop', 'daemon install']`, which is (a)'s perturbation;
  - (c) `HARNESS_CLI='bash <bin>/hcli'` records `['daemon stop', 'daemon install']`, the `node <path>` shape with an interpreter every host has;
  - (d) `HARNESS_CLI='definitely-not-installed --x'` exits 1, names `definitely-not-installed`, and records nothing;
  - (e) `HARNESS_CLI=' '` exits 1, names `HARNESS_CLI`, and records nothing.

**Verification:**

- `npm test --workspace cli -- test/restart-watcher-cli.test.mjs`, run from the repository root as one plain foreground command, passes.
- Each new `REPRO` row, and the existing `no CLI` row, reproduces by hand with the corrected `run()` helper against a throwaway fixture built as the header's own preamble describes, never against this checkout (`.claude/context/plugin.md` → `## Verifying a change in this layer`, which this outer-loop script's `REPRO` block follows).
- `git grep -n 'HARNESS_CLI' -- cli/templates/scripts/restart-watcher.sh` shows the contract stated once in the header and the parse in one place.
- `commands.typecheck` (`bash scripts/typecheck.sh`) exits zero.
