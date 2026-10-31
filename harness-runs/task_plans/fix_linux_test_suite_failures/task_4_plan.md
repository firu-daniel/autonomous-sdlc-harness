### Task 4 — Re-sync the root sweep copy and record the Linux suite's three groups in the documents of record

**Goal:** Do the three things the catch-all layer owns for this branch:

- bring the self-adopted root copy of the sweep up to date with the template Task 3 fixed;
- correct the one paragraph of `docs/cli.md` that the fixture change in Task 1 makes false;
- record in `docs/development.md` which group was a test assumption and which a code defect, together with the guard that now catches each one on macOS. That is the task prompt's *"The branch records which group was a test assumption and which a code defect."*

**Depends on:** Tasks 1, 2 and 3. Everything this task documents is theirs. The facts it restates, so this file needs no other:

- **Task 1** (`cli/test/helpers/fixture.mjs`):
  - `ISOLATED_ENV` points `GIT_CONFIG_GLOBAL` at the checked-in `cli/test/helpers/isolated-gitconfig`. That file sets only `user.useConfigOnly = true`, so git refuses to guess a commit identity on any host.
  - `seedOrigin` gives every fixture's bare `origin` the identity `Harness Fixture <fixture@example.invalid>`.
  - The module header's new choice 7: `run` and `runBounded` reject, without spawning, any caller-supplied argument or `NAME=value` override whose byte length plus one exceeds 131072. That is `MAX_ARG_STRLEN` on 4 KiB pages.
  - The new suite `cli/test/fixture-isolation.test.mjs` asserts all three.
  - Group 2 (`Author identity unknown`, two `remote-start.test.mjs` cases) was a **test assumption**: the bare origin had no identity.
- **Task 2:** Group 1 (`spawn E2BIG`) was a **test assumption** in both tests.
  - `remote-control-mention.test.mjs` passed its 210,000-byte diff in `STUB_PR_DIFF`, and now passes a file through `STUB_PR_DIFF_FILE`.
  - `watcher-stall-reset-payloads.test.mjs` → `commitInCopy` passed J6's whole `remote-run.sh` as a `bash -c` argument, and now hashes the content from a file.
  - The real mention path, `remote-run.sh` → `control_mention_context_extra`, never passes the diff as an argument or environment value.
- **Task 3** (`cli/templates/scripts/cleanup-merged-worktrees.sh`): Group 3 was a **code defect** that depends on the terminal, not on Linux.
  - `run_bounded` used to skip the process-group kill whenever `/dev/tty` opened. Gate 15's `docker run -it` plus `su - probe` gave the suite a controlling terminal, so the `git` stand-in's `sleep 300` kept the pipe open (300.1 s against a 3 s ceiling).
  - It now signals the child alone only when its stdout is a terminal (`[ -t 1 ]`).
  - `outer-loop-scripts.test.mjs` proves it with *"the sweep releases its output pipe on a bounded fetch when a terminal is attached"*, which runs the sweep under `script`.

**How this task's implementer reads the conventions.** This is the catch-all task, so read `.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured, the command and the exact message. Also read `.claude/context/cli.md`, because the documents describe that layer's test harness.

**What the documents must not claim.** The post-fix Linux container run is the user's, taken after this branch's work and before merging. It has not happened when this task runs. Record the 2026-10-30 measurement and the guards; never record a Linux pass.

### Targets

- `scripts/cleanup-merged-worktrees.sh`: the self-adopted root copy. It becomes byte-identical to `cli/templates/scripts/cleanup-merged-worktrees.sh`.
- `docs/cli.md`: the fixture-harness list, which opens *"Six choices in that harness are worth knowing before they cost a debugging round:"*.
- `docs/development.md`: a new paragraph placed directly after the paragraph *"**The suite under jq 1.6, by hand.**"*, in `## 5. Verifying a change` → Gate 4.

**Work:**

- [ ] **`scripts/cleanup-merged-worktrees.sh`.** Replace its whole content with the template's bytes as Task 3 left them. Keep the copy's executable mode. This follows the precedent of #217 and #171, which changed the template and the root copy together. Edit nothing in the template.
- [ ] **`docs/cli.md`.**
  - Rewrite the bullet beginning *"git runs with every configuration source it reads pointed away"*. The system file and the system scope are still redirected and suppressed. The per-user file is now the checked-in `cli/test/helpers/isolated-gitconfig`, which sets only `user.useConfigOnly = true`, so git refuses to guess an identity on every host. Without that file, the same commit passes where the host name carries a domain and fails where it does not, as two `remote-start.test.mjs` cases did in a Linux container. Add that the fixture's bare `origin` now carries the fixture's identity.
  - Add one bullet for the single-string bound: a fixture runner rejects, without spawning, any argument or environment string Linux would refuse with `E2BIG`, so a macOS run catches it.
  - Change *"Six choices"* to the number of bullets the list then holds.
- [ ] **`docs/development.md`: the new paragraph *"**The suite on Linux, by hand.**"***. Write it in the shape of the jq 1.6 paragraph before it.
  - **What was measured** on 2026-10-30, quoting the facts above:
    - the command, `npm test --workspace cli`, run as the non-root `probe` user in the container *A Linux run, in a local container* describes: Debian 12, `node:22-bookworm`, Node 22, git 2.39.5, on `dev` at `1a41540c`;
    - the result: 2,850 tests, 2,807 passed, 21 failed, 22 skipped. Apart from the jq failures the paragraph before covers, there were five failures in three groups, each with its exact message: `spawn E2BIG`; `fatal: unable to auto-detect email address (got 'probe@b6e01aa5ca60.(none)')`; and *"the sweep took 300.1s against a 3s ceiling — the fetch's transport is still holding the pipe"*.
  - **Each group's verdict**: test assumption, test assumption, code defect. Give each one's cause in one sentence.
  - **What now catches each class on macOS**, naming each by file and symbol or case title: the single-string bound, `isolated-gitconfig`, and the pseudo-terminal case.
  - **That the recipe's `docker run -it` and `su - probe` give the suite a controlling terminal**, which is the condition group 3 needed.
  - **How to take the run on a branch's head**: point to *The absent-path check, by hand*'s three clone lines, then `npm ci` and `npm test --workspace cli`, the same route the jq paragraph gives.

  State no result of a run taken after these fixes.

**Verification:**

- `cmp scripts/cleanup-merged-worktrees.sh cli/templates/scripts/cleanup-merged-worktrees.sh` exits 0, and `test -x scripts/cleanup-merged-worktrees.sh` exits 0.
- Re-run the story index's `## Scope register` command entry. Every site it reaches is a register row: the new paragraph's matches of `E2BIG`, `Author identity`, `MAX_ARG`, `useConfigOnly`, `controlling terminal` or `run_bounded` land in the row created for that paragraph, and the `docs/cli.md` matches land in row 1. Every `change` row names this task. A hit outside the register rows is a site this plan missed. Report it rather than leave it unrecorded.
- `docs/development.md`'s new paragraph contains no claim that the suite passes on Linux. `grep -n 'The suite on Linux, by hand' docs/development.md` matches the paragraph's opening line and no other line.
- The self-containment gate's property holds: neither document names a location on this machine. The paths it gives are repo-relative.
