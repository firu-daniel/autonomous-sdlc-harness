### Task 9 — Refresh the self-adopted `scripts/` copies from their templates

**Goal:** Make this repository's own `scripts/` copies byte-identical to the templates Tasks 1–4 changed. This checkout's watcher, library and notifier are then the ones the branch ships, and `cli/test/outer-loop-scripts.test.mjs`'s *"copied verbatim"* contract holds for the self-adopted copies too.

**Depends on:** Task 1 (`cli/templates/scripts/lib/harness-run-lib.sh`), Tasks 2, 3 and 4 (`cli/templates/scripts/autonomous-watcher.sh`) and Task 3 (`cli/templates/scripts/autonomous-notify.sh`). This task copies bytes and changes nothing in them.

**Why a byte copy, and not the forced self-adopt run.** `docs/development.md` → *"Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run"* documents `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force …`. That run also rewrites `.claude/CLAUDE.md` and the three `.claude/context/` conventions documents, which a run may not target. For an outer-loop script, the route's output is the template's bytes: the three files carry no `{{…}}` token, and that same section records every other `scripts/` file coming back byte-identical. A byte copy is therefore the documented route's result for these files. It is the same shape `fix_linux_sandbox_deny_placeholders` Task 5 used. All three copies were byte-identical to their templates at this branch's base.

### Targets

- `scripts/autonomous-watcher.sh`
- `scripts/lib/harness-run-lib.sh`
- `scripts/autonomous-notify.sh`

**Work:**

- [ ] Replace each target with its template's bytes: `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` and `cli/templates/scripts/autonomous-notify.sh`. Keep each file's executable bit as the index has it.

**Verification:**

- `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh`, `cmp scripts/lib/harness-run-lib.sh cli/templates/scripts/lib/harness-run-lib.sh` and `cmp scripts/autonomous-notify.sh cli/templates/scripts/autonomous-notify.sh` each print nothing and exit 0.
- `git diff --stat -- scripts` lists exactly these three files, and `git diff --summary -- scripts` shows no mode change.
