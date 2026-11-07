### Task 3 — Remove the legacy-worktree cases from the watcher review-drop and stall payload suites, and reword `remote-start.test.mjs`'s worktree case as a hand-made one

**Goal:** the two watcher payload suites stop exercising a legacy worktree run, and the review-drop suite instead holds the refusal: a review drop whose record has no `copy_kind` and names a live linked worktree is refused, never reused. `remote-start.test.mjs` stops describing its occupying linked worktree as a legacy run copy: it is a worktree a person made by hand, which start must not touch.

**Depends on:** Task 1 — `hr_run_copy_check_var` refuses a linked worktree through `hr_run_target_check_var`, the library's one home of that rule, with an `HR_RUN_REFUSAL` naming it — and Task 2 — the watcher has no `worktree` copy kind, and `seedRecord` defaults `copy_kind: 'clone'`. The review-drop reuse path (`process_inbox_file` (2b)) already turns a failed copy check into `fail_before_launch` with *"the working copy <wt> is not one this repository lists (<refusal>) — remove it and drop the review file again"*; this task asserts that and changes no script.

**Where this task stops.** Test files only.

### Targets

- `cli/test/watcher-review-drop-payloads.test.mjs`
- `cli/test/watcher-stall-reset-payloads.test.mjs`
- `cli/test/remote-start.test.mjs` — the case *"a refused start leaves a legacy linked worktree at the copy's path untouched"*, its comment, and the header's fixture sentence; wording only.

**Work:**

- [ ] `watcher-review-drop-payloads.test.mjs`: delete *"(L1, legacy) migration coverage …"* and *"(R1, legacy) migration coverage …"* and the `// Migration coverage` comment above them. Replace *"(L7, legacy) …"* with one case — keep the `legacy: true` fixture option, renamed to describe a record with no `copy_kind` naming a linked worktree on the branch — asserting the drop is not launched: the watcher log carries the copy check's refusal naming a linked worktree inside the existing *"is not one this repository lists"* line, the inbox file is archived as `fail_before_launch` does, no session started, and the worktree is untouched.
- [ ] Same file: rewrite the header — drop the *"Worktree-only, kept as migration coverage on a legacy worktree: L1, L7 and R1"* paragraph and the L1/L7/R1 RED ONCE entries; state the new case's rule and its RED ONCE mutation (the `worktree` refusal in `hr_run_target_check_var` dropped, or `hr_run_copy_check_var` calling `hr_wrapper_target_check_var` directly again → the drop is reused and launched). Name `hr_run_target_check_var` as the rule's owner; add no kind test to `hr_run_copy_check_var` or any script. Any other mutation entry that names *"the (L1, legacy) mutation"* is restated without it, or removed with the case it held.
- [ ] `watcher-stall-reset-payloads.test.mjs`: delete *"(S4, legacy) migration coverage …"*, its `// Migration coverage` comment, the `legacy` option of `createStallFixture` and the branch that builds it, and the header's S4 paragraph and RED ONCE entry.
- [ ] `remote-start.test.mjs`, wording only, every assertion and the fixture setup kept as they are: rename the case *"a refused start leaves a legacy linked worktree at the copy's path untouched"* to *"a refused start leaves a hand-made linked worktree at the copy's path untouched"*; reword its comment *"A registered working tree, so `git worktree remove --force` would delete it were the guard gone."* so it no longer cites `git worktree remove --force` (which `remote-run.sh` never runs) — e.g. *"A registered working tree a person made by hand, which start must not touch."*; and reword the header's *"one legacy case plants a linked worktree there instead"* the same way, e.g. *"one case plants a hand-made linked worktree there instead"*.

**Verification:**

- `watcher-review-drop-payloads.test.mjs` and `watcher-stall-reset-payloads.test.mjs` pass — the two test files this task edits.
- `grep -n -i 'legacy\|migration coverage' cli/test/watcher-review-drop-payloads.test.mjs cli/test/watcher-stall-reset-payloads.test.mjs` prints no line describing a legacy worktree run that resumes or is reused.
- `remote-start.test.mjs` passes — the third test file this task edits — and `grep -n -i -E 'legacy|worktree remove' cli/test/remote-start.test.mjs` prints no hit.
