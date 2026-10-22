### Task 6 — Re-copy `scripts/restart-watcher.sh` and align this repository's managed `.gitignore` block with the template

**Goal:** Bring two of this repository's own `init` outputs up to what a forced self-adopt run would now write. The re-copied `scripts/restart-watcher.sh` lets the operator here run it with `HARNESS_CLI="node <root>/cli/dist/cli.js"` today. The `.gitignore` alignment makes that run's `merge-lines` add nothing, so it no longer leaves a near-duplicate comment line to remove by hand.

**Depends on:** Task 4, which produces the finished `cli/templates/scripts/restart-watcher.sh`, and Task 5, which appends to `cli/templates/repo/gitignore`'s `{{harnessBackups}}` comment the two exception lines *"# The exception is a .bak landing inside a directory whose contents are ignored above: git hides it"* / *"# all the same, so the forced run names each such .bak in its notes."*. This task copies the script byte for byte and the comment as rendered, and changes nothing in either. **This is the catch-all task for this repository's own adoption**: `scripts/` and `.gitignore` at this root are `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). That is why they are edited here rather than through `cli/templates/`, and why no template changes in this task.

### Targets

- `scripts/restart-watcher.sh`: replaced by a byte-for-byte copy of `cli/templates/scripts/restart-watcher.sh`, mode 755 kept.
- `.gitignore` (repository root): the managed block only, from its `# >>> autonomous-sdlc-harness (managed block: …) >>>` header to the next blank line.

**Work:**

- [ ] Copy `cli/templates/scripts/restart-watcher.sh` over `scripts/restart-watcher.sh` byte for byte. An outer-loop script is copied verbatim and never rendered (`docs/cli.md` → `## 5. The wrapper-script contract`, *"Two families land in `scriptsDir`"*), so the copy must not be hand-edited.
- [ ] In the managed block, replace the hand-reworded comment `# The per-machine settings file the agent runner writes beside the committed profiles.` with the template's own line `# The per-machine settings file the agent runner writes.` (`cli/templates/repo/gitignore`).
- [ ] Replace the hand-written three-line `# Added by hand in this repository, not by init: …` comment above `.claude/settings.autonomous.json` with the template's four-line `# The unattended run's permission profile. …` comment. Move that comment and the rule to the template's position, directly after `.claude/settings.local.json`. Then add the template's `# The copies \`init --upgrade-workflows\` and \`init --force\` take …` comment, **including the two exception lines Task 5 appended to it** (so this repository never carries the bare *"Every other .bak a forced run writes is left visible on purpose."* sentence that the named-`.bak` note contradicts), and its three lines `.github/workflows/harness-run.yml.bak`, `.github/workflows/harness-resume.yml.bak`, `.claude/settings.autonomous.json.bak` after `/harness.config.json.bak`, in template order. Take every line from `cli/templates/repo/gitignore` rendered with this repository's values (`stateDir` `harness-runs`, `pushEnvPath` `.claude/push-notify.env`), never retyped from memory. Touch nothing outside the managed block.

**Verification:**

- `cmp cli/templates/scripts/restart-watcher.sh scripts/restart-watcher.sh` exits 0, and `test -x scripts/restart-watcher.sh` exits 0.
- `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze --dry-run --non-interactive`, run from the repository root against the CLI the earlier tasks' typecheck compiled, prints `= would keep     .gitignore` and no `would merge    .gitignore` line, and leaves `git status --short` showing only this task's two files. Where the run's permission profile refuses that command, record it as not run, never as a pass.
- `git check-ignore -q .claude/settings.autonomous.json` exits 0, so the profile is still ignored after the move. `git check-ignore -q harness-runs/scratch/README.md` exits 1, so the README negation is untouched.
