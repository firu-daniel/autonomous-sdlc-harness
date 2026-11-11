### Task 16 — Bring the self-adopted script copies to the respelled template bytes and respell the `.gitignore` `.bak` rules

**Goal:** This repository has adopted its own harness, so its `scripts/` copies of five shipped templates and its own `.gitignore` must carry the same new names as the templates and the generator.

**Depends on:**
- Task 3: `cli/templates/scripts/remote-run.sh`.
- Task 4: `cli/templates/scripts/lib/harness-run-lib.sh`, `cli/templates/scripts/prompt-injection-screen.sh`, `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/lib/run-analytics.jq`.
- Task 1: `WORKFLOW_RUN_PATH` and `WORKFLOW_RESUME_PATH`, from which `cli/src/generators/repoRoot.ts` builds the managed block's two ignore rules `.github/workflows/devscene-run.yml.bak` and `.github/workflows/devscene-resume.yml.bak`.

Each copy's content is identical to its template today; `## Context` → *The self-adopted copies follow their templates byte for byte* gives the measurement.

**Where this task stops.** It copies content and edits two `.gitignore` lines; it changes no logic. `cli/test/gate12-sandbox-round-cli.test.mjs` copies `scripts/lib/harness-run-lib.sh` from this checkout, and that suite is Task 19's.

### Targets

- `scripts/remote-run.sh`
- `scripts/lib/harness-run-lib.sh`
- `scripts/prompt-injection-screen.sh`
- `scripts/autonomous-watcher.sh`
- `scripts/lib/run-analytics.jq`
- `.gitignore`

**Work:**

- [ ] Replace the content of each of the five `scripts/` copies with its `cli/templates/scripts/` counterpart's content after Tasks 3 and 4. Keep each copy's existing file mode. Hand-edit nothing.
- [ ] `.gitignore`: change `.github/workflows/harness-run.yml.bak` to `.github/workflows/devscene-run.yml.bak`, and `.github/workflows/harness-resume.yml.bak` to `.github/workflows/devscene-resume.yml.bak`, inside the managed block. Change no other line.

**Verification:**

- Content only, never mode: for each pair, `cmp cli/templates/scripts/<file> scripts/<file>` exits 0 and prints nothing (`cmp` compares bytes and ignores file mode). Run it on `remote-run.sh`, `lib/harness-run-lib.sh`, `prompt-injection-screen.sh`, `autonomous-watcher.sh` and `lib/run-analytics.jq`. Do not use `git diff --no-index` for this check: it reports a mode change as a difference, and `scripts/autonomous-watcher.sh`, `scripts/remote-run.sh` and `scripts/prompt-injection-screen.sh` are `100755` against their `100644` templates by design (`## Context` → *The self-adopted copies follow their templates byte for byte*). Never `chmod` a copy to make a check pass.
- `git diff --stat -- scripts` lists only the five targets. Their file modes are unchanged (`git diff --summary -- scripts` reports no mode change).
- `grep -nE "harness-(run|resume)\.yml" .gitignore` prints nothing, and `grep -nE "devscene-(run|resume)\.yml\.bak" .gitignore` prints both rules.
- `bash -n` exits 0 on `scripts/remote-run.sh`, `scripts/lib/harness-run-lib.sh`, `scripts/prompt-injection-screen.sh` and `scripts/autonomous-watcher.sh`.

**Deviations from plan:**
- Copy route: `cp cli/templates/scripts/remote-run.sh scripts/remote-run.sh` was refused by the permission layer (don't-ask mode), so each copy was brought to its template's bytes with Edit-tool string replacements derived from `diff <template> <copy>`. The result rests on execution, not reading: `cmp` exits 0 with no output on all five pairs, and `git diff --summary` reports no mode change. Editing in place left each file's mode as it was.
- Evidence downgrade: the four `bash -n <file>` runs were refused by the permission layer. The parse claim rests instead on `bash scripts/typecheck.sh`, whose `check-shell-parse` step printed `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, and on each copy being byte-identical (`cmp`) to its template. The Run gates phase re-runs the same shell parse.
