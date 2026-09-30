### Task 17 — Show runs not yet adopted in `/autonomous-sdlc-harness:branch-status` without syncing

**Goal:** Make a trigger-started run visible to `/autonomous-sdlc-harness:branch-status` (acceptance 5) while keeping that command's never-sync, write-nothing rule. It runs `remote-run.sh adopt --list` once, which reads GitHub and writes nothing, and prints each run started on GitHub that has no local record yet. It names the next action: any of the four syncing commands adopts it.

**Depends on:**

- Task 10's `remote-run.sh adopt --list [--repo <root>]`. It prints `remote-run.sh: not adopted: <branch> <newest run url>` per candidate, or `remote-run.sh: nothing to adopt`, and writes nothing. It exits 0 on success, 2 when `execution.target` is not `github-actions`, and 3 when the listing failed.
- Task 16, which makes `/autonomous-sdlc-harness:branch-answer`, `branch-resume`, `branch-pause` and `branch-user-review` adopt first. That is the next action this task names.

**Where this task stops.** The command still never runs `sync` or a writing `adopt`. What an adopted run shows is the existing *Remote record* step, unchanged.

### Targets

- `plugin/commands/branch-status.md`

**Work:**

- [ ] **The listing.** In step 2 (selection), add a bullet:
  - with no argument, or with a branch argument the registry does not hold, run `bash <scripts_dir>/remote-run.sh adopt --list` **once**;
  - on exit 0, print a short *Started on GitHub, not yet adopted locally* section, one line per `not adopted:` branch with its run URL, and nothing when it printed `nothing to adopt`;
  - on exit 2, say nothing, because remote execution is off;
  - on exit 3, report its message.

  For a named branch found there, say it was started on GitHub and has no local record yet, instead of *no such run*.
- [ ] **The next action.** In step 6, add: for a run listed as not yet adopted, any of `/autonomous-sdlc-harness:branch-answer`, `branch-resume`, `branch-pause` or `branch-user-review` adopts it first and then acts on it. A maintainer with no local setup works it from GitHub instead (`docs/remote-execution.md` → `## 1. The lifecycle of a remote run`, which exists today and under which Task 21 adds the route's own subsection).
- [ ] **The fences.**
  - The `## Resolved values` `<scripts_dir>` row says the file invokes `remote-run.sh` read-only, through its `status` verb and its `adopt --list` form, and never `sync` or a writing `adopt`.
  - The closing fence *"It invokes `remote-run.sh status`, which writes nothing, and never `remote-run.sh sync`"* becomes *"It invokes `remote-run.sh status` and `remote-run.sh adopt --list`, both of which write nothing, and never `remote-run.sh sync` or `remote-run.sh adopt` without `--list`"*. Its list of the syncing commands is unchanged.

**Verification:**

- `grep -n "adopt --list" plugin/commands/branch-status.md` shows the step, the resolved-values row and the closing fence.
- `grep -n "remote-run.sh adopt" plugin/commands/branch-status.md` shows no invocation without `--list`. Read each hit: every one is `adopt --list`, or the fence's *never … `adopt` without `--list`*.
