### Task 32 — Record the new deny row in `docs/guard-verification.md` and the unexercised remote path in `docs/outer-loop-verification.md`

**Goal:** Pay the two verification records this branch owes: the guard change's measured rows, and an honest statement of which remote-execution paths ship exercised only against stubs.

**Depends on:** Task 21, which added `remote-run.sh` to `DENY_SCRIPT_BASENAMES` in `plugin/hooks/autonomous-script-allowlist-guard.sh` (a basename entry, lower-cased on both sides, like the four before it). Tasks 5–13, whose suites drive `remote-run.sh`, job mode and the local dispatch against a `gh` stub (`HARNESS_GH_CLI`) and the agent stub (`HARNESS_AGENT_CLI`). Task 31, whose Gate 12 is the hand-run that exercises the real paths.

### Targets

- `docs/guard-verification.md` — §3, a new block of rows under the group its direction belongs to (register row 58).
- `docs/outer-loop-verification.md` — §4, a new paragraph (register row 58).

**Work:**

- [ ] **Drive the guard change as a pair**, per `docs/guard-verification.md` → `### What a later change owes this section`: on §0's primary fixture, run the guard from the plugin tree **before** Task 21 (the parent of its commit, checked out into a throwaway directory) and **after** it, for `bash <repo>/<S>/remote-run.sh dispatch feat_x --engine task`, its `REMOTE-RUN.sh` spelling, the `cd <repo> && bash <S>/remote-run.sh …` spelling, the double-quoted absolute spelling, the same inside a sibling worktree, and a compound with an allowed wrapper; plus the keeper control `bash <repo>/<S>/commit-on-branch.sh …`, which must stay `allow` in both columns. Record each as a row — before `allow`, after **SILENT**, mechanism *`remote-run.sh` added to the deny basenames* — numbered after the section's last row, with the date and the two trees named as the section's other blocks name theirs.
- [ ] If a `docs/guard-verification.md` §1 latency figure depends on the deny list's length, re-measure it per that section's method and record the new figure; if none does, say so in one sentence in the new block.
- [ ] `docs/outer-loop-verification.md` §4: a paragraph **A real GitHub Actions run.** stating that every remote-execution row — `remote-run.sh`'s verbs, job mode, the local dispatch and relays, `doctor`'s `remote-github` check — is driven against a `gh` stub and the agent stub, so nothing here shows GitHub accepting a dispatch, a `GITHUB_TOKEN` self-dispatch, the poller's enable and disable, a job's time limits, or a skipped job's cost; the risk each leaves; and Gate 12 in `docs/development.md` as the hand-run that records them. Do not edit any measured row or count elsewhere in the file (register rows 15–18, 29–33).

**Verification:**

- Every new guard row was driven, not asserted: the commands and both outputs are reproducible from the block as written.
- `grep -n "remote-run.sh" docs/guard-verification.md docs/outer-loop-verification.md` finds only the new block and the new paragraph.
