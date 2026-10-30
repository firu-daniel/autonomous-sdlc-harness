### Task 10 — Re-render the notes-app profile's write-protection `_README` line

**Goal:** Keep the live fixture `examples/notes-app/.claude/settings.autonomous.json` equal to what `init` now renders. Task 1 rewrote the `_README` line *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* that `applyWriteProtection` writes. Record the re-render where the example's README keeps its account of the edits the kept artifacts carry.

**Depends on:** Task 1, which changes only that `_README` line's Linux sentences, in host-neutral text naming the three rows whose `bubblewrapDenyWrite` is `false`: `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. It leaves every `denyWrite` and `permissions.deny` entry of the base unchanged on every host, so no other key of the fixture changes.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` is the one that decides this task. The fixture's rendered files are **live** and maintained, but the prose of its `.claude/CLAUDE.md`, its context documents and its run artifacts is a frozen capture that must not be edited.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` → the paragraph *"The one edit the kept artifacts carry, and where it landed."*

**Work:**

- [ ] Render a throwaway fixture with the built CLI under `os.tmpdir()`, never in this checkout. Take its `WHAT RUNS OUTSIDE THE SANDBOX` `_README` line, and pass it through the README's three substitution clauses, longest path first: the scratch root becomes `/workspace/notes-app`, its parent `/workspace`, and the home directory and account become `/workspace` and `adopter`. Replace the fixture's line with the result. Change no other line.
- [ ] `examples/notes-app/README.md`: append one sentence to that paragraph's chain of re-renders. A later re-render of the write-protection `_README` line, through the same three clauses, added the Linux placeholder statement for the three `.git` trust files and changed no entry.

**Verification:**

- `git diff --stat -- examples/notes-app` lists exactly these two files. `git diff -U0 -- examples/notes-app/.claude/settings.autonomous.json` shows one changed line, the `WHAT RUNS OUTSIDE THE SANDBOX` one.
- `grep -nE '/Users/|/home/|/private/' examples/notes-app/.claude/settings.autonomous.json` finds nothing.
- `jq -e . examples/notes-app/.claude/settings.autonomous.json` exits 0.

- **Deviations from plan:** No file under `examples/notes-app/` was changed: the fixture write was refused (see `## Disposition`), so the README sentence recording a re-render was not written either — it would record an edit that did not land. Two findings from the render, made with the built CLI (`node cli/dist/cli.js init --non-interactive --no-analyze --force --quiet`) over a `git archive HEAD:examples/notes-app` copy at `/tmp/claude-501/t10.bCvi/notes-app`, compared by `harness-runs/scratch/t10_compare.py` run through `bash scripts/scratch-run.sh`:
  - The plan's "change only that line's Linux sentences" holds for Task 1's delta, but the rendered `WHAT RUNS OUTSIDE THE SANDBOX` line is **not** equal to the fixture's line plus that delta: it also carries a `/workspace/notes-app/scripts/run-analytics.sh - the run watcher, the remote job or a person runs the main checkout's run-analytics.sh outside the sandbox;` segment. That is pre-existing drift (run-analytics landed in `c573db24` / `ce42229e`, not on this branch): the fixture's `denyWrite` and `deny` carry no `run-analytics.sh` entry, while the render carries `Edit(//…/scripts/run-analytics.sh)` and a `denyWrite` path for it. Taking the rendered line verbatim would make the `_README` name a path the file does not protect. The correct edit for this task is the Task 1 splice alone; the probe printed `spliced == substituted render minus run-analytics: True` and `spliced == substituted render: False`. The `run-analytics.sh` drift across the line and its entries is out of this task's "change no other line" scope and owes its own re-render.
  - Evidence downgrade: the plan's three **Verification** bullets were not executed against an edited fixture, since none landed. The substituted render line was checked for `/Users/`, `/home/`, `/private/`, `/tmp/` and the account name and carried none (probe output).

## Disposition

- **(a) Attempted:** an `Edit` replacing the substring `by exact path, which holds on Linux too. A run's own edit` in `examples/notes-app/.claude/settings.autonomous.json` with the Task 1 bubblewrap sentence (exact text in (d)), two attempts with the same edit.
- **(b) Refusal, quoted, both attempts:** `Permission to use Edit has been denied because Claude Code is running in don't ask mode.`
- **(c) Why no permission entry lifts it:** the target sits under a `.claude/` directory, the class the tool layer's `.claude/**` write guard covers, which is evaluated ahead of the permission profile. Profile read: `.claude/settings.json` holds only `enabledPlugins` and `extraKnownMarketplaces` — no `permissions` key; `.claude/settings.local.json` does not exist. The run's `--settings` profile under `~/.local/state/autonomous-sdlc-harness/run-profiles/` could not be read from this session (read refused), so its contents are not reported.
- **(d) Operator remedy — one paste, from the checkout root:**

```bash
python3 - <<'PY'
p = "examples/notes-app/.claude/settings.autonomous.json"
s = open(p).read()
old = "by exact path, which holds on Linux too. A run's own edit"
new = ("by exact path. On a host sandboxed by bubblewrap, Claude Code enforces an exact entry for a path that does not exist "
       "by mounting a placeholder at that path, which breaks git in the run copy and can be left on disk, so the per-run copy "
       "there leaves the run copy's .git/commondir, .git/config.worktree, .git/objects/info/http-alternates out of `denyWrite`: "
       "their `Edit` rules stay, and the watcher refuses to launch or resume a run copy carrying one. A run's own edit")
assert s.count(old) == 1
open(p, "w").write(s.replace(old, new))
r = "examples/notes-app/README.md"
t = open(r).read()
a = "`Bash` rows. The file now carries 163"
b = ("`Bash` rows. A later re-render of the write-protection `_README` line, through the same three clauses, added the Linux "
     "placeholder statement for the three `.git` trust files and changed no entry. The file now carries 163")
assert t.count(a) == 1
open(r, "w").write(t.replace(a, b))
PY
git diff --stat -- examples/notes-app
jq -e . examples/notes-app/.claude/settings.autonomous.json >/dev/null && echo json-ok
```
