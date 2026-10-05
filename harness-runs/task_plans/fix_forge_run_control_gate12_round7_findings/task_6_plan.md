### Task 6 — `status` never calls a running run's ledger fully ticked, and names a round whose ledger is not written yet

**Goal:** Stop `@sdlc-harness status` from telling a reader that a run has finished when it has only started a new round.

In Gate 12 round 7, `status` on issue #10 and on pull request #11 came at 09:55:39Z, 49 s into user-review round 1. Both replies read `` `feat_invoices_4` is `running`. `` and `Every entry of the flow-progress ledger is ticked.` Here is what had happened:
- The round's job writes a fresh ledger at the same path, `<state_dir>/flow_progress/<branch>_progress.md`, in its own `chore: Add flow-progress ledger for <branch>` commit (`5f94336`, 09:55:53Z).
- `control_ledger_next_var` reads `refs/remotes/origin/<branch>:<that path>` from a fetch made before that commit landed, and that copy still held the task engine's completed ledger.
- The round's own commit, `chore: add user review for feat_invoices_4`, was already on the tip.

**Depends on:** Task 5. Both tasks edit `cli/templates/scripts/remote-run.sh`. Task 5 owns `forge_report` and the header's `report` paragraph. This task edits only `control_status`, a new helper beside it, and the header's control-paragraph sentence about `status`. Ship it after Task 5, so the two diffs never interleave.

**Decisions this task carries, from the story index.**
- **The new test.** When the ledger on origin reads fully ticked (`LEDGER_NEXT` empty after a successful `control_ledger_next_var`), test whether the branch tip carries a user-review round commit newer than the ledger's last change. The subject is produced by `hr_user_review_subject <branch>` (`cli/templates/scripts/lib/harness-run-lib.sh`, which prints `chore: add user review for <branch>`). Never retype it.
- **What the reply then says.** Each text is fixed here byte for byte, because Task 9 quotes it in `docs/github-run-control.md`.
  - **A newer round commit exists**, whatever the state word: ``A user-review round has started on `<branch>`, and its flow-progress ledger is not written yet.``
  - **No newer round commit, and `CS_WORD` is `running`:** `The run is still running, and its flow-progress ledger has no open entry: it is finishing its last step, or a new stage has not written its ledger yet.`
  - **Otherwise**, unchanged: `Every entry of the flow-progress ledger is ticked.`
- **Not taken: reading the engine the newest run was dispatched with.** `fetch` reports `engine` only from a finished run's bundle, so a run in flight has none, and reading the dispatch inputs costs another API call. The commit test reads only what the control job's fetch already holds.

### Targets

- `cli/templates/scripts/remote-run.sh`: `control_status`, a new `control_round_newer_than_ledger` function placed directly above it, and the header's control paragraph. That paragraph is the one that reads "`status` is READ-ONLY and accepted in every state", and its sentence "the next ledger entry (or that every entry is ticked, or that the ledger could not be read)" is the one to change.
- `cli/test/remote-control.test.mjs`: the `status` cases.

**Work:**

- [ ] **`control_round_newer_than_ledger`.** Give it a comment in the file's `# name — what it answers` style. It returns 0 when `refs/remotes/origin/$CONTROL_BRANCH` carries a commit whose subject is exactly the output of `hr_user_review_subject "$CONTROL_BRANCH"` and that is newer than the newest commit touching the ledger. It returns 1 otherwise, including when git fails. The two reads:
  1. the ledger's last change: `git -C "$root" log -1 --format=%H "refs/remotes/origin/$CONTROL_BRANCH" -- "<state_rel>/flow_progress/${CONTROL_BRANCH}_progress.md"`, with `state_rel` from `hr_state_dir`, exactly as `control_ledger_next_var` resolves it;
  2. the subjects after it: `git -C "$root" log --format=%s "<that sha>..refs/remotes/origin/$CONTROL_BRANCH"`.

  Compare whole lines, so a subject that merely contains the text does not match. Use a fixed argument vector with no `eval`, and stay bash 3.2-compatible like the rest of the file.
- [ ] **`control_status`.** In the `[ -z "$LEDGER_NEXT" ]` arm, choose among the three texts from the decisions above. Keep the `${para}` paragraph joins. The other arms, "Next in the flow-progress ledger: …" and "could not be read", are unchanged.
- [ ] **The header's control paragraph.** Rewrite the `status` sentence's ledger clause. It replies with the next ledger entry. When the ledger reads fully ticked, it says one of three things instead:
  - that a user-review round has started and its ledger is not written yet, when the tip carries the round's `chore: add user review for <branch>` commit after the ledger's last change;
  - that a `running` run is still finishing or starting a stage, never "every entry is ticked";
  - otherwise, that every entry is ticked.

  Keep "or that the ledger could not be read".
- [ ] **`remote-control.test.mjs`.** Use the suite's `controlFixture` and its existing run-list helpers. Add these cases:
  1. **The acceptance case.** The ledger on origin is fully ticked, and the run is listed in flight (`running`). A further commit on origin's `feat_x` carries the subject `chore: add user review for feat_x`, pushed after the ledger commit. The reply names a started user-review round whose ledger is not written yet, and `doesNotMatch(/Every entry of the flow-progress ledger is ticked/)`.
  2. **The same ledger, running, with no round commit.** The reply says the run is still running with no open ledger entry, and does not match `/every entry .* is ticked/i`.
  3. **A round commit older than the ledger's last change** (round placed, then its ledger written). With an open entry in that newer ledger, the reply is `Next in the flow-progress ledger: …` as today. With it fully ticked and the run not running, the reply is the unchanged `Every entry … is ticked.`
  4. **A subject that only contains the round text** (for example `chore: add user review for feat_x_2`) is not a match.

  The existing case `status with no run listed says so, and a fully ticked ledger says every entry is ticked` keeps passing unchanged.

**Verification:**

- From `cli/`, run `npm test -- test/remote-control.test.mjs`, the test file this task edits. It passes, including every pre-existing `status` case.
- `bash scripts/typecheck.sh` exits 0.
- Grep `remote-run.sh` for the literal `chore: add user review for` and find it nowhere in `control_status` or the new helper. The subject comes from `hr_user_review_subject` alone.
- The two new reply texts in `control_status` are byte-identical to the two fixed under **What the reply then says.** above. Task 9 quotes them in `docs/github-run-control.md` → `## 1.`.
