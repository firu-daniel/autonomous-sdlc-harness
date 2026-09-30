### Task 24 — Add Gate 12 observation (xiii): an issue label starts a run with the machine off

**Goal:** Write the hand-run procedure that observes acceptance 1 against a real repository: *"The run reaches 'branch ready for review' with the maintainer's machine off and no local watcher running."* No suite can reach it, because it spends a real repository, a runner, a credential and billed minutes (`docs/development.md` → `## 5.`, Gate 12's own reason for being hand-run). The procedure also covers acceptances 2–5 against GitHub:

- a second issue with the same title gets `_2`;
- a labeller without write access is refused, with a comment;
- the issue carries the branch and the run's URL;
- a local maintainer's command adopts the run.

**Depends on:**

- Task 23, which last edited `docs/development.md`; this task edits the same file's `## 5.` after it.
- Task 20, whose `docs/github-issue-trigger.md` → `## 7. What is not verified here` lists the rows this observation settles. The procedure names them, and the round that runs it moves them.

**Where this task stops.** It writes the procedure; it records no result. The maintainer runs it after release (the story index's **Manual setup required**), and the dated round paragraph and the moved rows are that round's edits. It changes no other observation.

### Targets

- `docs/development.md` — `## 5.`, Gate 12's introduction and its observation list (scope register row 52).

**Work:**

- [ ] **The count.** Gate 12's introduction says *"Twelve observations, after a setup that is itself the first"*. Make it thirteen, and add to the introduction's first sentence that the issue trigger's behaviours live in `docs/github-issue-trigger.md` → `## 7. What is not verified here` beside `docs/remote-execution.md` → `## 6.`.
- [ ] **Observation (xiii), *An issue label starts a run with the machine off*,** after (xii) and in its form: a bold lead, then each command alone in its own fenced block, run without a pipe.
  - Its **Setup**, on the scratch repository the gate already names:
    1. `npx --yes autonomous-sdlc-harness@<version> config set forge github`;
    2. `init` at `<version>`;
    3. `git add .github/workflows/harness-trigger.yml`, then the commit;
    4. `gh auth refresh -s workflow`;
    5. `git push --no-verify origin <default branch>`;
    6. `gh label create harness`;
    7. `npx --yes autonomous-sdlc-harness@<version> doctor --check-github`, which passes when `forge` answers `PASS` and `remote-github` names the trigger workflow and the label.
  - Then: stop the local watcher with `npx autonomous-sdlc-harness daemon stop` (use `cli.md` → `## 9. \`daemon\``'s exact verb), switch the machine off or disconnect it, and label an issue from another device, as a person with write access.
- [ ] **Its pass conditions, each recorded verbatim**:
  - within the lookup bound, the issue carries one comment naming `<slug>` and a `harness run <slug>` run URL, and the label is gone;
  - `origin/<slug>` carries one commit `chore: add task prompt for <slug>`, whose prompt is the issue's title and body plus the provenance line;
  - the run reaches "branch ready for review" with a `completed` notification, if `HARNESS_PUSH_URL` is set;
  - editing the issue after labelling changes nothing in the committed prompt.

  Then three legs, each with its own pass condition:
  - **(a)** a second issue with the same title → `<slug>_2`;
  - **(b)** a label applied by an account with triage or read only, or by an unlisted bot, → a refusal comment naming write access, no `harness run` run, and the label removed. A second account is needed; record whether the permission API answered `read` for triage, which settles research T3's unmeasured row;
  - **(c)** with the machine back on and the watcher running, `/autonomous-sdlc-harness:branch-status` lists the run as *not yet adopted*, then `/autonomous-sdlc-harness:branch-pause <slug>` adopts it (a mirror, and a record with `execution: github-actions`) and the relay pauses the job, while a second `/autonomous-sdlc-harness:branch-status` shows the record.
- [ ] **What remains**: add (xiii) to the closing *"What still owes a first recording"* sentence, and to the **Teardown** paragraph: delete the trigger label and the issues the round created, and unset `forge` before the seed reset.

**Verification:**

- `grep -n "^\*\*(xiii)" docs/development.md` prints one line, after the `(xii)` observation's.
- `grep -n "Thirteen observations" docs/development.md` prints one line, and `grep -n "Twelve observations" docs/development.md` prints nothing.
- Every command in the new observation sits alone inside a fenced block (read the section), and every verb it names exists: `grep -n "daemon stop\|config set\|--check-github" docs/cli.md` finds each.

- **Deviations from plan:**
  - Plan asked the Teardown to "unset `forge`"; `config` has no unset verb (`docs/cli.md` → `## 8. \`config\``: `list`, `get`, `set` only), so the Teardown says to remove the key from `harness.config.json` by hand.
  - The daemon commands are pinned (`npx --yes autonomous-sdlc-harness@<version> daemon stop` / `daemon start`) to match every other command in Gate 12, rather than the unpinned form the plan quoted.
  - Leg (c) needs the watcher restarted; it uses `daemon start`, a verb `docs/cli.md` → `## 9. \`daemon\`` names.
  - The intro's first-sentence addition reads "the issue trigger's behaviours live beside it in `docs/github-issue-trigger.md` → `## 7. What is not verified here`", placed in the sentence that cites `docs/remote-execution.md` → `## 6.` (the gate's second sentence after its bold lead).
  - Verification "every verb it names exists" was checked by grep over `docs/cli.md` (`daemon stop`, `config set`, `--check-github` each present) and by reading `## 8.` and `## 9.`; no command in the procedure was executed, since each needs a real GitHub repository.
