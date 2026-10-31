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

**Deviations from plan:**

- Evidence downgrade — the by-hand guard reproduction (second `**Verification:**` bullet) was not executed. Creating the throwaway `git init` fixture under `$TMPDIR` was refused (`Permission to use Bash ... has been denied`; then *"Claude Code is running in don't ask mode"*), and piping the payload `{"tool_input":{"command":"bash <repo_root>/scripts/task-offer-check.sh"},"cwd":"<repo_root>"}` into `bash plugin/hooks/autonomous-script-allowlist-guard.sh` was refused the same way. The claim instead rests on: (1) `git diff -U0 ef7e35be8f98893cdd72d715dd8018009b121fb5 -- plugin/hooks/autonomous-script-allowlist-guard.sh` filtered for `^[+-]` lines not beginning `[+-]#` returns nothing, so the guard's decision code is byte-identical to the base; (2) reading `DENY_SCRIPT_BASENAMES` in that file — it lists `deploy.sh`, `autonomous-watcher.sh`, `restart-watcher.sh`, `cleanup-merged-worktrees.sh`, `remote-run.sh` and not `task-offer-check.sh`. The `allow` / `| cat` silent pair is re-taken by Task 7 for the dated record.
- Verification bullets 1 and 3 ran: the base diff (`<base>` = `ef7e35be8f98893cdd72d715dd8018009b121fb5`) changes only `#` lines; `grep -rn -F 'task-offer-check.sh' plugin/hooks` lists only `plugin/hooks/autonomous-script-allowlist-guard.sh` and `plugin/hooks/README.md`.
