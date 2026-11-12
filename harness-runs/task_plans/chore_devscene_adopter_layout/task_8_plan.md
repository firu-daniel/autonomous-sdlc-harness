### Task 8 — Rename in the remaining script templates and the scripts README

**Goal:** Finish `cli/templates/scripts/`. The walker, the gate launcher, the screen, analytics, the suite runner, the deploy, docs-search and dev-server wrappers, the opt-out check and the two verification wrappers read `devscene.config.json`. The opt-out check tests for `.claude/devscene-no-offer`.

**Depends on:** Task 5, whose run library resolves `devscene.config.json`, `devscene` and `devscene-scripts`. Task 2 named the opt-out marker `.claude/devscene-no-offer`. The `.gitignore` template rule for it is Task 9's.

**Where this task stops.** The suites (`outer-loop-scripts`, `flow-walker*`, `launch-sandboxed-gates`, `prompt-injection-*`, `run-analytics*`, `run-test-suite`, `task-offer-fence`) are Tasks 19, 25 and 26's. This repository's copies under `scripts/` are the maintainer's cutover (Task 35).

### Targets

- `cli/templates/scripts/flow-walker.sh`, `cli/templates/scripts/lib/flow-walker-gates.sh`
- `cli/templates/scripts/launch-sandboxed-gates.sh`, `cli/templates/scripts/run-test-suite.sh`, `cli/templates/scripts/prompt-injection-screen.sh`, `cli/templates/scripts/run-analytics.sh`
- `cli/templates/scripts/deploy.sh`, `cli/templates/scripts/docs-search-server.sh`, `cli/templates/scripts/start-dev-server.sh`
- `cli/templates/scripts/task-offer-check.sh`, `cli/templates/scripts/test.sh`, `cli/templates/scripts/typecheck.sh`
- `cli/templates/scripts/README.md`

**Work:**

- [ ] `flow-walker.sh`, `lib/flow-walker-gates.sh`: apply rows 1 and 2 of `## Context`'s spelling table to every fault message (`no devscene.config.json at $ROOT`), every REPRO fixture (`"stateDir":"devscene/"`, `fw_run_mode_skipped "$root" devscene/ feat_x …`) and every comment.
- [ ] `launch-sandboxed-gates.sh`, `run-test-suite.sh`, `prompt-injection-screen.sh`, `run-analytics.sh`: apply rows 1 and 2 to every refusal (`cannot resolve stateDir from '$target/devscene.config.json'`) and comment.
- [ ] `test.sh`, `typecheck.sh`, `deploy.sh`, `start-dev-server.sh`, `docs-search-server.sh`: apply row 1 to the root-resolution comment and to the `[ -f "$candidate/devscene.config.json" ]` test. Apply rows 1 and 2 to anything else. Keep `harness_fail` and every `{{…}}` token. `docs-search-server.sh`'s database URL default stays (out of scope).
- [ ] `task-offer-check.sh`: apply row 5 to the header, the REPRO line (`: > "$d/.claude/devscene-no-offer"`) and the test `[ ! -e "$main/.claude/devscene-no-offer" ] || exit 1`. `README.md`: apply every row it carries.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-no-offer|harness-task-offer|harness-analyze' -- cli/templates/scripts` prints nothing. With Tasks 5–7 this covers the whole tree.
- `bash -n` on each changed `.sh` file exits 0.

- **Deviations from plan:** The per-file `bash -n <file>` calls were refused by the permission mode (don't-ask). That claim rests instead on the whole-tree `bash scripts/typecheck.sh` run, whose `check-shell-parse` step parses every shell file `git ls-files --cached --others --exclude-standard` lists, the twelve changed `.sh` targets included, and printed `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, then `PASS: typecheck`.
- **Deviations from plan:** `remote-run.sh` (Task 6's file, not a target here) still carries "harness run" noun-phrase prose; row 12 leaves it, and it matches no verification pattern. `README.md` keeps `harness-docs-retrieval serve-mcp` (the out-of-scope Python package name). `run-analytics.sh`'s REPRO copies the scripts to `$d/scripts/` and invokes them by that path, which needs no `scriptsDir`, so row 14 does not apply there.
