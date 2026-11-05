### Task 1 — Make `hr_remote_status_write` remove a link at its target before the rename and refuse a directory, with cases in `remote-save-links.test.mjs`

**Goal:** Close the shipped defect the user chose to fix (park 1, `Q1: a`). Today `hr_remote_status_write` in `cli/templates/scripts/lib/harness-run-lib.sh` ends with a plain `mv "$tmp" "$out"`. When `<out_json>` is a symbolic link to a directory, that `mv` moves the temp file into the linked directory and leaves the link in place. This is reasoned from how `mv` treats a directory target, and it has not been measured. After this task, no link at `<out_json>` survives a write, and no write ever lands through one.

**Where this task stops.** This task changes this one function and its doc comment, and adds test cases. It changes no other rename in the library. `hr_remote_bundle_restore`'s own `mv` onto `autonomous_logs/remote_status.json` stays as it is, and Task 8 states it in `docs/cli.md` §6 residual 1, item 4. This repository's self-adopted copy, `scripts/lib/harness-run-lib.sh`, is **Task 2's**: do not edit it here. No document, row or driver file is this task's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_status_write` and the doc comment above it.
- `cli/test/remote-save-links.test.mjs`: new cases, and its header's rule and `RED ONCE` list.

**Work:**

- [ ] `hr_remote_status_write`: before `mktemp`, when `<out_json>` is a directory and not a link (`[ -d "$out" ] && [ ! -L "$out" ]`), return 1 and write nothing. Immediately before the `mv`, when `[ -L "$out" ]`, remove the link itself with `rm -f "$out"`. A link to a regular file, a link to a directory and a dangling link are all removed the same way. Never add a trailing `/`, and never use a flag that follows the link. If that removal fails, remove `$tmp` and return 1. Every other path is unchanged: the vocabulary checks, the `jq` body, *"Prints nothing"*, and `0` on a write.
- [ ] Doc comment above it: state the new contract in the function's own words. A link at `<out_json>`, whatever it names, is removed before the rename, so the write never follows it and no link there survives a write. A directory there is `1`, writing nothing. Then state the gap this does not close, as a residual and not as deferred work: a process the session started and left running could put a link at `<out_json>` between the test and the rename. Cite `docs/cli.md` §6 residual 1, item 5, whose first bullet states the same gap for `save`. Keep the header's existing *"Written only by `hr_remote_status_write`"* index entries true.
- [ ] `remote-save-links.test.mjs`, new cases, each against the `init`-written library (`${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`, sourced through `runBash`, as `saveFixture` already calls it). Use a registry under the fixture's state directory and an *outside* directory beside the fixture:
  - **(W1)** `<out_json>` is a link to the outside directory. Exit 0. `lstat(<out_json>)` is a regular file whose JSON carries the branch. The outside directory's entry list is unchanged, so no `remote_status.json.tmp.*` and no `remote_status.json` is there.
  - **(W2)** `<out_json>` is a link to an outside regular file. That file's bytes are unchanged, and `<out_json>` is now a regular file.
  - **(W3)** `<out_json>` is a dangling link to an outside path. Nothing is created at that path, and `<out_json>` is a regular file.
  - **(W4)** `<out_json>` is a real directory. Exit 1. The directory's entry list is unchanged, and no `*.tmp.*` sits beside it.
- [ ] Header: widen the stated rule to cover the watcher's own status write, *a status write never follows a link at its target and leaves none there*. Add one `RED ONCE` entry, **(M8)**, for the mutation you actually apply once and revert: delete the `[ -L "$out" ]` removal. Record the case that fails and its message as observed, and the cases that stay green. Revert the mutation before the task's own run.

**Verification:**

- `npm test --workspace cli -- test/remote-save-links.test.mjs`, run from the checkout root as one foreground command, passes. This is the test file this task edits.
- The (M8) entry records a failure you observed, not one you predicted. Under the mutation, (W1) fails on what the outside directory holds, which is the defect the user approved fixing.
- `git diff` of `harness-run-lib.sh` touches `hr_remote_status_write` and its doc comment only.
