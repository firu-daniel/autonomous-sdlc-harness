### Task 17 — Respell the command-spelling gate, `run-gates.sh` and `publish-main.sh`

**Goal:** Make gate 6d enforce the bare spelling of the renamed analyze command, `/analyze`, against the example's renamed state directory. Make `run-gates.sh` name `/devscene:analyze` in its hand-run gate list. Make `publish-main.sh` strip the renamed root config from `main`.

**Depends on:**
- Task 1, `ANALYZE_COMMAND = '/devscene:analyze'`. The task prompt changes it, gate 6's prose and this check together.
- Task 3, which writes the measured line `claude -p "/analyze" --permission-mode plan …` into `cli/src/commands/init.ts` exactly once.
- Task 15, which moved the example's state directory to `examples/notes-app/devscene/`.

Task 29 writes the gate-8 fenced block's two lines into `docs/development.md` as `/analyze --dry-run` and `/analyze`, and states this pattern and these carve-outs in gate 6's prose. Until Task 29 lands, the two `docs/development.md` exemptions below cover no line. The check runs only at Phase G, after Task 29.

**Where this task stops.** Gate 6's prose in `docs/development.md` is Task 29's. This task does not run the gate; Phase G does.

### Targets

- `scripts/check-command-spelling.sh`
- `scripts/run-gates.sh`
- `scripts/publish-main.sh`

**Work:**

- [ ] `check-command-spelling.sh` `PATTERN`: replace the alternative `harness-analyze` with `analyze`, giving `'(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)'`.
- [ ] `check-command-spelling.sh` exemptions: `'docs/development.md|line|/analyze --dry-run'`, `'docs/development.md|line|/analyze'` and `'cli/src/commands/init.ts|contains|claude -p "/analyze" --permission-mode plan'`. In the `git grep` exclusions and the header's scan-set list, `examples/notes-app/sdlc-harness/` becomes `examples/notes-app/devscene/`. The header's REPRO plants read ``Run `/analyze` here.``. Their recorded coordinates are one run's output, so leave them as they are.
- [ ] `run-gates.sh`: the hand-run gate list line becomes `echo "  8  /devscene:analyze, which is judgement and runs inside a model session"`. Apply row 1 of `## Context`'s spelling table to its two comments.
- [ ] `publish-main.sh`: in the removed-paths list, `harness.config.json` becomes `devscene.config.json`. Apply rows 1 and 2 to its header comments, `examples/notes-app/.claude/ and its devscene/` included. After the maintainer's cutover (Task 35) this repository's root file has that name.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-analyze' -- scripts/check-command-spelling.sh scripts/run-gates.sh scripts/publish-main.sh` prints nothing.
- Run this read-only probe of the new pattern from the checkout root: `git --no-pager grep -nE '(^|[^A-Za-z0-9_.}/:-])/analyze([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)' -- . ':(exclude).claude/' ':(exclude)examples/notes-app/.claude/' ':(exclude)examples/notes-app/devscene/' ':(exclude)harness-runs/' ':(exclude)scripts/check-command-spelling.sh'`. Every line it prints is `cli/src/commands/init.ts`'s measured line or, once Task 29 lands, one of `docs/development.md`'s two gate-8 lines. Record which of these exist at this task's commit.
- `bash -n` on each of the three scripts exits 0.
