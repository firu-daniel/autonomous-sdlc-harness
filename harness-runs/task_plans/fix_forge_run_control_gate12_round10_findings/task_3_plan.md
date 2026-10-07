### Task 3 — `docs/github-run-control.md`: the install gated on the agent check, and the `--restricted` row repointed

**Goal:** Make the adopter document describe what Tasks 1 and 2 built. Before installing the agent and fetching the plugin, a comment job runs the commenter checks in a step of their own. A comment that fails them, and every exact-form command, costs neither. Also record, in `## 8.`, the GitHub behaviour that gating rests on, and repoint the `--restricted` row at Gate 12's new step 11, with why round 10's form of that step was not observed.

**Depends on:** Tasks 1 and 2. This file describes them; it changes no behaviour. The facts it states, restated so you do not have to guess them:
- **The check step.** `harness-control.yml` runs the step `Decide whether the comment needs the agent` (`id: needs`) on an `issue_comment` event only. It runs `remote-run.sh control --needs-agent`, which applies `control`'s checks 1 to 4 of *Mentions read by an agent* (`HARNESS_REMOTE_STOP`, the `forge` / `execution.target` keys, the re-runner, the commenter) after telling an exact-form command from a mention. It replies to nothing.
- **The answer.** The step writes `agent=no` only when the check exits 2, which covers a comment that is not a mention and one that fails a check. The steps `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin` run only when the output is not `no`.
- **The fallback.** A failed permission call, an older `remote-run.sh` without the flag, or a failed step all leave the output anything but `no`, and the job installs as before.
- **The act step re-checks everything and replies as today.** For a mention by an admitted commenter, that means the permission call is made twice.
- **The workflow file is not upgraded in place.** `harness-control.yml` is written create-if-absent and is not re-rendered by `init --upgrade-workflows`. A copy written before this release keeps installing for every comment until `init --force` replaces it, after a `.bak` (`docs/remote-execution.md` → `### Upgrading`).

Write no measured duration. The task prompt's "~5–10 s" is a figure from the gate, and this document says "an install and a clone" (lessons ledger, *Evidence and measurement*).

### Targets

- `docs/github-run-control.md` — `## 1.` → *Mentions read by an agent*; `## 6.`; `## 8.`.

**Work:**

- [ ] **`## 1.` → *Mentions read by an agent* → *The checks, in order, before any session.*** After the numbered list, add a short paragraph:
  - checks 1 to 4 run twice: first in the job's own `Decide whether the comment needs the agent` step, which replies to nothing, then again in the act step, which replies;
  - a comment that fails one of them, and every command in the exact form, skips installing the agent binary and fetching the plugin;
  - a failed permission call in that first step installs anyway, and the act step's reply names the failure.

  Leave the numbered list itself unchanged: the order and the replies are unchanged.
- [ ] **`## 6.` → *A credential and an agent in the control job*.**
  - **What reads the mention.**: say the `Fetch the pinned plugin` step runs only for a mention whose commenter passed checks 1 to 4 (§1, linked as the section's other links are).
  - After **What one mention spends.**, add a bullet **What a comment that is not read spends.**:
    - an exact-form command, and a comment the checks refuse, installs nothing and clones nothing;
    - a mention by an admitted commenter costs one more permission call than before;
    - the saving needs a `harness-control.yml` written by this release or later, and an older copy keeps installing until `init --force` replaces it, linking `remote-execution.md` → `### Upgrading`.
- [ ] **`## 8.` → the row *`--restricted` confines `Read`, `Grep` and `Glob` to the working directory and the one `--add-dir`*.** Rewrite its **Source** cell to say three things:
  - the help text only;
  - round 10's form of the step, a mention asking for an outside file, was not observed: the agent declined before any tool call (control job `37577497146`'s decision line, *"did not read it"*), as `plugin/instructions/mention_reading.md` instructs;
  - Gate 12 observation (xiv) leg (j) step 11 in `development.md` now drives `claude --restricted` directly, and is where it would be recorded.

  Leave **What rests on it** and **If it is wrong** unchanged.
- [ ] **`## 8.` → a new row**, placed after the `--restricted` row and before *The whole mention path on a real repository*:
  - **Behaviour:** *A step's `$GITHUB_OUTPUT` line is read by a later step's `if:` as `steps.<id>.outputs.<name>`, and a `continue-on-error` step that failed leaves it empty*.
  - **What rests on it:** skipping the install and the fetch for a comment that will not be read (§1, §6).
  - **Source:** GitHub's documented behaviour, not retrieved here, because unattended runs have no web access; Gate 12 observation (xiv) leg (j), steps 1 and 10, in `development.md`, observes it.
  - **If it is wrong:** an unreadable output compares unequal to `no`, so every comment job installs and fetches as it did before this change, and nothing else changes. Name no release version for "this change": none is settled on this branch.

**Verification:**

- Grep `docs/github-run-control.md` for `needs-agent`, `Decide whether the comment needs the agent` and `agent=no`. Each spelling matches the step name, flag and output in `cli/templates/github/workflows/harness-control.yml` byte for byte.
- Every link added resolves to a heading that exists: the `§1` / `§6` anchors already used in the file, and `remote-execution.md#upgrading`.
- The `## 8.` table still has four cells per row, and the new row sits between the two rows named above.
- No sentence states a duration in seconds or minutes for the install or the clone.
