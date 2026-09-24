### 1. An upgraded adopter's re-run `init` keeps the old shared library, and the walker then refuses at the first gate with a message that blames `harness.config.json`

> **Self-contained per-finding file** for the `feat_orchestrator_flow_graph_planning_pilot` skeptic-review index. The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**
- `cli/templates/scripts/flow-walker.sh`, the sourcing loop: "for fw_lib in \"$fw_dir/lib/harness-run-lib.sh\" \"$fw_dir/lib/flow-walker-gates.sh\"; do"
- `scripts/flow-walker.sh`, the self-adopted mirror. It must stay byte-identical to the template.
- `cli/test/flow-walker-ui-and-reentry.test.mjs`, a new case.
- `docs/flow-graph-walker.md` → `### Item 6 — the walker and graph ship into \`scriptsDir\`, and the graph is found beside the walker` → the **Cost.** paragraph.

**Problem.** The walker needs a function that only this branch adds to the shared library, and `init` will not replace an existing copy of that library.

1. `flow-walker.sh` sources `<scripts_dir>/lib/harness-run-lib.sh` from its own directory. It reaches `hr_phase_enabled` through `fw_phase_on` (`cli/templates/scripts/lib/flow-walker-gates.sh` → `fw_phase_on`) at every `skipped` gate.
2. `hr_phase_enabled`, and the `phases.*` rows `hr_config_load` now emits, are added to the library by this branch. The library on the default branch has neither. `git show dev:cli/templates/scripts/lib/harness-run-lib.sh | grep -c "hr_phase_enabled\|phases\.parity"` prints `0`.
3. `init` writes every outer-loop row `create-if-absent` (`cli/src/generators/outerLoopScripts.ts` → `writeOuterLoopScripts`: "policy: 'create-if-absent'"). Only `--force` overwrites.

**How an adopter reaches it.** The adopter already ran `init` before this release, then upgrades the plugin, whose new planning core requires the walker. The core's `## The walker` tells them what a missing walker means: *"an adoption that has not re-run `init` since the walker shipped"*. So they re-run `init` without `--force`:
- The three absent files (`flow-walker.sh`, `lib/flow-walker-gates.sh` and `flows/task_plan_writing.graph.json`) are created.
- Their existing `lib/harness-run-lib.sh` is kept byte-for-byte.

**What the next planning run does, reached deterministically:**
- `start` succeeds. Every helper it calls (`hr_repo_root`, `hr_config_load`, `hr_state_dir`, `hr_have_jq`, `hr_tsv_unescape_var`) already exists in the old library.
- The first `next --outcome returned` reaches `business_parity_review`. Unless the run mode skips `parity`, `arrive` evaluates its `skipped` construct: `fw_phase_on "$ROOT" "$phase"; status=$?`.
- `hr_phase_enabled` is undefined, so bash prints `hr_phase_enabled: command not found` and returns 127.
- 127 falls into `*) refuse "cannot resolve phases.$phase in $ROOT/harness.config.json"`, which exits 1.
- The core routes that exit through `<escalate>`. An autonomous run therefore parks on every planning attempt.
- The only line the operator is shown blames a `harness.config.json` that is valid. Nothing names the stale library. `doctor` has no staleness check for outer-loop scripts, so it cannot explain the refusal either.
- The only remedy the documentation implies is `init --force`. That also regenerates every other generated file, `.claude/CLAUDE.md` included, and leaves only a single-generation `.bak`.

The task prompt's acceptance item 4 asks for *"an unattended planning run reaches convergence without a stall on the walker's command"*. An upgraded adoption does not reach convergence.

**Fix.**

- [ ] In `cli/templates/scripts/flow-walker.sh`, directly after the `done` that closes the `for fw_lib in …` sourcing loop, and before the `NL='` line, insert:

  ```bash
  # An older `init` keeps an existing lib/harness-run-lib.sh (create-if-absent), and one written
  # before this walker shipped lacks the phase reader every `skipped` gate calls.
  if ! declare -F hr_phase_enabled >/dev/null; then
    printf 'flow-walker: %s predates this walker (it defines no hr_phase_enabled): delete that file and re-run autonomous-sdlc-harness init, which writes the current copy\n' "$fw_dir/lib/harness-run-lib.sh" >&2
    exit 2
  fi
  ```

  `declare -F` is available in bash 3.2. `refuse` and `fault` are not defined yet at that point, which is why the block prints directly, the same way the sourcing loop above it does.
- [ ] In the same file's header, change the exit-code line `#   2  the configuration, the graph or the state file cannot be resolved or` / `#      written` so that it reads `#   2  the configuration, the graph or the state file cannot be resolved or` / `#      written, or lib/harness-run-lib.sh predates this walker`.
- [ ] Copy the edited template over `scripts/flow-walker.sh` so the two files are byte-identical.
- [ ] Add a case to `cli/test/flow-walker-ui-and-reentry.test.mjs`, numbered after the last existing case. It stays inside that file's header rule, because it asserts a refusal and not a routing sequence:
  - Build a fixture with `fixture(t, { parity: false, qa: false })`.
  - Overwrite the fixture's `scripts/lib/harness-run-lib.sh` with its own current text, with `'hr_phase_enabled() {'` replaced by `'hr_phase_enabled_absent() {'`.
  - Run `walk(dir, ['start', ...flags('--skipped', 'none')])`.
  - Assert `status === 2`, `stdout === ''` and that `stderr` matches `/^flow-walker: .*harness-run-lib\.sh predates this walker/`.
  - Assert that `walkerStatePath(dir)` does not exist.
  - Import `writeFile` from `node:fs/promises` and `existsSync` from `node:fs` as needed.
- [ ] In `docs/flow-graph-walker.md` → `### Item 6 …` → **Cost.**, after the sentence "A missing walker is a loud non-zero exit, which the core's `## The walker` routes to `<escalate>` with `bash`'s own line.", append: "A `lib/harness-run-lib.sh` kept from an `init` that predates the walker is kept by that same `create-if-absent` contract. The walker refuses it at `start` with a line naming the file and the remedy: delete it and re-run `init`."

**Verification:**
- From `cli/`, `node --test test/flow-walker.test.mjs test/flow-walker-ui-and-reentry.test.mjs test/outer-loop-scripts.test.mjs` passes, the new case included.
- `cmp cli/templates/scripts/flow-walker.sh scripts/flow-walker.sh` exits 0.
