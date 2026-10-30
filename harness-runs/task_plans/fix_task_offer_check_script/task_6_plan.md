### Task 6 — Add `task-offer-check.sh` to the script-allowlist guard's documented left-allowed set

**Goal:** The plugin's two statements of which outer-loop scripts the script-allowlist guard deliberately leaves allowed name the new script, with its reason, so the guard's prose stays a complete statement of its set. The guard's decision code does not change.

**Depends on:** Task 1, which ships `task-offer-check.sh` into `<scripts_dir>` as an outer-loop script with `agentInvocable: false` and **no** `DENY_SCRIPT_BASENAMES` entry: it is read-only — it runs `git rev-parse`, `git worktree list` and, on a clone, the library's clone check, then prints at most one path — so the guard auto-allows a plain `bash <scripts_dir>/task-offer-check.sh` like any non-denied `.sh` under `<scripts_dir>`.

**Where this task stops.** No line of the guard outside its comment block changes, and `DENY_SCRIPT_BASENAMES` is not edited. The dated measurement record in `docs/guard-verification.md` is Task 7's. No adopter's directory name is written as a literal: the prose says `<scripts_dir>`-relative or names the basename only, as the surrounding text does.

### Targets

- `plugin/hooks/autonomous-script-allowlist-guard.sh` → the `# LEFT ALLOWED, DELIBERATELY:` comment
- `plugin/hooks/README.md` → `## The deny list`, the sentence opening *"The other outer-loop scripts written into the same directory"*

**Work:**

- [ ] **The guard comment.** Add `` `task-offer-check.sh` `` to the `LEFT ALLOWED, DELIBERATELY:` list and one reason line in the style of the `run-analytics.sh` one: it is run by an interactive session's change-request fence, reads the checkout and its main checkout's run registry, writes nothing, and prints at most one path. Keep the closing *"The last one executes an ARGUMENT"* sentence pointing at `scratch-run.sh` — reorder so it still refers to it.
- [ ] **`plugin/hooks/README.md`.** Add the same basename to the sentence's list and, where that sentence singles out *"The last of them"*, keep that reference on `scratch-run.sh`.

**Verification:**

- `git diff -U0 <base> -- plugin/hooks/autonomous-script-allowlist-guard.sh` shows only lines beginning `#` (`<base>` from a bare `git merge-base HEAD origin/dev`): the guard's decisions are unchanged.
- Reproduce the guard's decision by hand per `plugin/hooks/README.md` → `## Reproducing a decision by hand`, against a throwaway `git init` fixture carrying a `harness.config.json` and a `<scripts_dir>/task-offer-check.sh`: the payload for the command `bash <scripts_dir>/task-offer-check.sh` answers `allow`, and the same command with `| cat` appended answers nothing. Task 7 re-takes the same two decisions for the dated record; this task does not write one.
- `grep -rn -F 'task-offer-check.sh' plugin/hooks` lists exactly the two edited files.
