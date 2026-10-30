### Task 8 — Self-adopt the script under `scripts/` and record the root `.claude/` paste

**Goal:** This repository, which has adopted its own harness, carries the new script in its own `scripts/`, and the maintainer has an exact, render-checked paste for the two root `.claude/` files the template change reaches: item 4 of `.claude/CLAUDE.md` and `.claude/settings.json`.

**Depends on:** Task 1 — `cli/templates/scripts/task-offer-check.sh`, which `init` copies verbatim into `<scriptsDir>` with mode `0755`. Task 2 — the template's item 4, rendered with `{{taskOfferCheckCommand}}` = `bash <scriptsDir>/task-offer-check.sh` (`scripts` here). Task 3 — `init` merges `"permissions": { "allow": ["Bash(bash scripts/task-offer-check.sh)"] }` into an existing `.claude/settings.json` that has no `permissions`, after its existing keys.

**Why no `.claude/` write is attempted.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and an attempted write there can park the run instead of failing it. So this task never edits, creates or runs a command that writes a file under `.claude/` — including `init` aimed at this repository, which would also regenerate the analyze-filled `.claude/CLAUDE.md` wholesale. The maintainer applies the paste recorded below (story index → **Manual setup required**). `.claude/harness-task-offer.md` needs no paste: its template is unchanged.

### Targets

- `scripts/task-offer-check.sh` (new; this repository's self-adopted copy)
- This file → a `## Paste record` section appended at its end

**Work:**

- [ ] **The script copy.** Write `scripts/task-offer-check.sh` byte-for-byte from `cli/templates/scripts/task-offer-check.sh` and give it mode `0755` — the verbatim copy `init` itself makes for an outer-loop script. Touch nothing else under `scripts/`.
- [ ] **The fresh fixture render.** Write a scratch script under `harness-runs/scratch/` and run it through `bash scripts/scratch-run.sh harness-runs/scratch/<name>.sh`. It makes a directory under the system temp root, `git init`s it with a fixture identity, runs the built CLI's `init --non-interactive --no-analyze --scripts-dir scripts` there (by the absolute path of this checkout's `cli/dist/cli.js`), prints that fixture's item **4. Opt-out.** line of `.claude/CLAUDE.md` and its `.claude/settings.json`, and removes the temporary directory on exit. If the call is refused or the CLI is not built, record that in the paste record as *render not checked* and carry the check into the Manual setup line rather than guessing.
- [ ] **The paste record.** Append `## Paste record` to this file with: (1) the replacement for the single line that is item 4 in this repository's `.claude/CLAUDE.md`, as a fenced block, byte-identical to the fixture's item 4 line (item 4 renders no `{{pluginName}}` and no `{{projectName}}`, so nothing in it differs between this repository and the fixture — say so, and say whether the fixture line and the template-derived line compared equal); (2) the whole intended `.claude/settings.json`, as a fenced block: this repository's two current keys unchanged, followed by the `permissions` key exactly as the fixture's file carries it; (3) one fenced command per line the maintainer runs afterwards to confirm the paste — a `git diff -- .claude/CLAUDE.md` that shows only item 4 changed, and a `grep -c -F 'Bash(bash scripts/task-offer-check.sh)' .claude/settings.json` that reports one occurrence.

**Verification:**

- `cmp cli/templates/scripts/task-offer-check.sh scripts/task-offer-check.sh` exits 0, and `test -x scripts/task-offer-check.sh` exits 0.
- `git diff --name-only <base> -- scripts` lists only `scripts/task-offer-check.sh` (`<base>` from a bare `git merge-base HEAD origin/dev`): no other self-adopted script, and not `scripts/lib/harness-run-lib.sh`, changed.
- `git status --short -- .claude` prints nothing: this task wrote nothing under `.claude/`.
- The paste record states for each span whether it was checked against the fixture render, and for every checked span that the two compared byte-identical.
