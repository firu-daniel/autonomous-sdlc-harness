### Task 18 — Correct the unlisted-call statements in the guard hooks and their README

**Goal:** Every allow-only guard hook explains its design with the same cost model: a silent guard leaves the call to the permission profile, and *"an unanswerable prompt is a stall"*. Under the `dontAsk` mode the generated profile now ships, a call the profile neither allows nor denies, or that hits an `ask`, is **refused at once**. A hook's own `ask` decision is treated the same way. Rewrite each such outcome clause. The design arguments stay intact: a guard's false positive is still a lost permit, and a lost permit still costs the run that step. No hook's behaviour changes. These are scope register rows 102–106, 162 and 163.

**Depends on:** Task 15, which makes `dontAsk` the default in `cli/templates/scripts/autonomous-watcher.sh` (`PERMISSION_MODE`) and in the generated profile's `permissions.defaultMode`. Follow the story's canonical restatement: state the default, and do not repeat the `acceptEdits` override clause, which `docs/cli.md` §6 and `docs/watcher.md` §4 own.

**Where this task stops.**

- The README's statements of what each guard sees stay as they are (row 41). They are `feat_unattended_sandbox_measurement`'s to rewrite.
- Sentences naming an interactive prompt cost with no unattended outcome stay: README 66 and 82, `allow-qa-credentials-read.sh` 177 and 395, the guard's 663.
- So do the `harness-config-lib.sh` *"no diagnostics on stdout"* lines.

### Targets

- `plugin/hooks/README.md` — line hints 12, 13, 39, 80.
- `plugin/hooks/autonomous-script-allowlist-guard.sh`:
  - 13;
  - the token-list sentence near 136–139, *"in an allow-only guard a false positive is silence, which is a prompt, which in an unattended run is a stall"*;
  - 255, *"falls through to `ask` and STALLS an unattended run"*;
  - the *"quoted (the stall escape)"* row near 373.
- `plugin/hooks/allow-safe-compounds.sh` — 11.
- `plugin/hooks/allow-qa-credentials-read.sh` — 23.
- `plugin/hooks/lib/harness-config-lib.sh` — 464–465.
- `plugin/hooks/autonomous-protected-branch-guard.sh` — the header sentence *"A named ordinary push stalls at the `git push` / `ask` entry in the adopter's permission profile instead"* (row 162).
- `plugin/hooks/git-commit-branch-guard.sh` — header item 2, *"in an unattended run an `ask` / cannot be answered, so it is a silent stall"* (row 163).

**Work:**

- [ ] `README.md`:
  - 12 *"where a false positive is a stall"* → where a false positive is a refused call;
  - 13 *"does not stall on one prompt"* → is not refused for one piece;
  - 39 *"in an unattended run an `ask` cannot be answered, so it is a silent stall"* → in an unattended run that `ask` is refused at once;
  - 80 *"the practical outcome for a dispatched agent is a prompt it cannot answer, never a silent permit"* → is a refusal, never a silent permit.
- [ ] `autonomous-script-allowlist-guard.sh`: 13 *"an unanswerable prompt is a stall"*; the 139 sentence; 255 *"falls through to `ask` and STALLS an unattended run. That is a real escape this normalization was added to fix"* → falls through to `ask`, which an unattended run refuses. The normalization's purpose stays. Relabel the 373 row's *"(the stall escape)"* to *"(the refused-wrapper escape)"*, unless that label is quoted elsewhere: grep `plugin docs cli` for `stall escape` first, and keep the label if any other file quotes it.
- [ ] `allow-safe-compounds.sh` 11 *"prompt is a stall"*, and `allow-qa-credentials-read.sh` 23 *"in an unattended run an unanswerable prompt is a stall"* → is a refusal.
- [ ] `harness-config-lib.sh` 464–465 *"and stalls an unattended run on a prompt it cannot answer"* → and is refused in an unattended run.
- [ ] The two guard headers no other bullet names:
  - `autonomous-protected-branch-guard.sh`: *"A named ordinary push stalls at the `git push` `ask` entry in the adopter's permission profile instead"* → is refused at the `git push` `ask` entry in an unattended run instead. Keep the next clause, *"so do NOT move `git push` out of `ask` on the strength of this guard"*, byte for byte; the reason it gives still holds;
  - `git-commit-branch-guard.sh` item 2: *"Interactively that is a stray prompt; in an unattended run an `ask` cannot be answered, so it is a silent stall"* → in an unattended run that `ask` is refused at once, so the commit does not land. Keep *"Hence: the repository is resolved from the command and the payload"* as it is. Use the same words as `README.md` 39, which states the same fact.

**Verification:**

- `bash -n` each edited hook, one plain command per file:

  ```
  bash -n plugin/hooks/autonomous-script-allowlist-guard.sh
  ```

- `bash -n plugin/hooks/autonomous-protected-branch-guard.sh` and `bash -n plugin/hooks/git-commit-branch-guard.sh`, one plain command each, exit 0.
- Re-run derivation entry G's two commands with `-n` in place of `-l`, pathspec `plugin/hooks`. Every remaining hit must be a line this file lists as kept. Re-run derivation entry H's first step and read each `plugin/hooks` hit with its whole sentence; none may meet entry G's `change` rule.
- `git diff --stat` shows comment-only changes in the `.sh` files. Read the diff and confirm no line outside a `#` comment changed.
