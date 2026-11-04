### Task 4 — Record the `sandbox1h` checks as *not yet measured* in `docs/cli.md` and `docs/outer-loop-verification.md`

**Goal:** Give the round's after-the-release adopter checks, which are not sandbox rows, their *not yet measured* rows where their documents of record keep them. These are `sandbox1h` §1–§3: `init --force` at `<version>` and `restart-watcher.sh` against a real daemon. Give `sandbox1c2` §4's optional `upload-artifact` measurement its pointer from the residual that states it unmeasured.

**Depends on:** Task 2, which defines `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.**, whose step 4 takes `sandbox1h` §1–§2 and whose step 9 takes `sandbox1h` §3. It also defines observation (xvi). Task 1 defines `docs/sandbox-verification.md` §10 row SB4. This task cites those anchors byte for byte, as the story index's `## Context` fixes them, and writes no procedure.

### Targets

- `docs/cli.md`: `## 3. The re-run contract` (the `<stateDir>/README.md` row and the `.gitignore` row), `## 5. The wrapper-script contract` (**Where a wrapper's body comes from**), and `## 6.` → `**Residuals, stated rather than hidden:**` → residual 1, item 5 (the *"Whether `actions/upload-artifact` follows a link it meets is not measured"* sub-bullet).
- `docs/outer-loop-verification.md`: `### 1.5 `restart-watcher.sh``.

**Work:**

- [ ] **`docs/cli.md` §3.**
  - Append one sentence to the **Why** cell of the `<stateDir>/README.md` and per-directory READMEs row, after *"is named in the run's notes, because `git status` never lists it."*. It says that on a published release, against a 0.6.7 adoption, the note's wording, `git status --short` against `--ignored`, and the `--quiet` run (no hidden-`.bak` line, the `.bak` files still written, decided rather than a defect) are *not yet measured*, and are taken by `development.md`'s Gate 12 sandbox series round, step 4.
  - Append one sentence to the `.gitignore` row's cell: a fresh `init` writing the managed block's comment with its two newer exception lines is *not yet measured* on a published release, taken by the same step.
  - Keep each row's columns intact: no `|` inside the added text.
- [ ] **`docs/cli.md` §5.** After the paragraph **Where a wrapper's body comes from**, add one sentence. It says that an adopter's forced run at a published `<version>` (`HARNESS_SELF_ADOPT` unset) is *not yet measured*, and is taken by the round's step 4: no `kept by this self-adopt run` row in `== commands`, both wrappers re-rendered from detection, and every state-dir README that already matches its template `= kept` with no `.bak`.
- [ ] **`docs/cli.md` §6, residual 1, item 5.** After the sub-bullet *"Whether `actions/upload-artifact` follows a link it meets is not measured …"* (its closing measurement block included), add one sentence. It names the round's step 7, `sandbox-verification.md` §10 SB4's optional half, as where it would be measured: a throwaway workflow on the same runner image uploading a directory holding a link with the pinned `actions/upload-artifact`. The sentence says it is optional and not yet measured, and leaves the residual's text standing.
- [ ] **`docs/outer-loop-verification.md` §1.5.** After the section's last paragraph and before `### 1.6`, add a block opening with the bold lead **On a published release, against a real daemon.** The block holds:
  - one sentence stating that this section's rows drive a recorder and that the real-daemon case is the round's step 9 (`development.md` → Gate 12 → the sandbox series round);
  - a three-column table `| Condition | Expected | Observed |`. Its macOS row is the repository's daemon installed and idle, with `HARNESS_CLI="npx autonomous-sdlc-harness@<version>"`: exit 0, with `daemon stop` and `daemon install` naming the repository's own label. Its Linux row is a systemd host: exit 0, the `systemctl --user` lines printed, nothing restarted. The Linux row is marked *not run* where no such host is available. Both Observed cells read **not yet measured.**
  - the command, if one is shown, in a fenced block on one line.

**Verification:**

- `git grep -n "not yet measured" docs/cli.md docs/outer-loop-verification.md` lists each of the five new sentences and rows, and every one of them names the sandbox series round and its step.
- The §3 table still parses: `git grep -n -e "^| .<stateDir>/README.md. and the per-directory READMEs |" -e "^| .\.gitignore. | merge-lines (a managed block" -- docs/cli.md` returns both rows, each still a three-cell row.
- No new line states a measured result, a run id or a date of a run. None carries a line-number citation, an absolute machine path or a spelled-out home directory. The `restart-watcher.sh` command, if shown, sits in a fenced block on one line.
- The residual 1, item 5 sub-bullet's existing text is byte-identical, and the addition follows it.
