### Task 14 — Record the 2026-10-19 clone measurement as rows CL1–CL5, and add the owed registry rows RG1 and RG2, in `docs/sandbox-verification.md`

**Goal:** Write the measurement that gates this whole series into the standing sandbox record, under `## 0. Method`'s conventions: one row per probe, the commands verbatim, the stamp. The maintainer took it by hand on 2026-10-19, because a sandboxed run cannot start the headless session it needs. Also add the owed rows for Task 12's registry protection. **Every Observed cell below is transcribed from the task prompt (`harness-runs/task_prompts/feat_clone_per_run_task_prompt.md` → `## The goal`, item 1). Nothing is re-measured, and no value is invented.** Where the prompt leaves a filename unnamed, the row keeps a `<placeholder>`.

**Depends on:**

- **Task 12**, which adds `<main>/<stateDir>/autonomous_logs/registry.json`, here `<main>/harness-runs/autonomous_logs/registry.json`, to the profile's `sandbox.filesystem.denyWrite` and to the `Edit` / `Write` deny rules as a `file` entry. RG1 and RG2 measure that entry.
- **Task 1**, whose clone arm refuses a planted `commondir`, `config.worktree` and `objects/info/http-alternates`. This document is where the reason is recorded: CL5.

**Where this task stops.** It changes no measured cell of an existing row. G6 stays owed as written: it asks about a `--no-hardlinks` clone and a relocated record. It changes no profile entry, and writes no sentence scheduling the layout switch (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future"*). `docs/cli.md` and `docs/watcher.md` are Tasks 15 and 16.

### Targets

- `docs/sandbox-verification.md`

**Work:**

- [ ] **Who reads this, and the new subsection's opening.**
  - Add `cli/templates/scripts/lib/harness-run-lib.sh`'s clone arm, and the run registry's protection, to the **Who reads this:** sentence's list of what a reader might be changing.
  - At the end of `## 2. Git under the record protection`, after row G7, add a subsection `### The per-run clone (2026-10-19)`.
  - Open it with its own **Stamp** line: Claude Code 2.1.303, git 2.50.1 (Apple Git-155), macOS, arm64.
  - Follow with a **Setup** paragraph:
    - the clone is a `git clone --shared` of the main checkout, made from an ordinary terminal at `<work_root>/autonomous-sdlc-harness-sbx_clone_probe`, inside the profile's sibling glob;
    - the launch is §0's launch line with cwd = the clone, `--add-dir <clone> --add-dir <main>/harness-runs`, and `--allowedTools` for `git switch`, `dd`, `mv` and `git config` where a call needed it;
    - the exact calls are `git add <file>`, `git commit -m "<subject>"`, `git fetch origin` (the clone's origin is the main checkout's path), `git stash push` then `git stash pop`, and `git switch -c <x>`;
    - the controls are `dd if=/dev/null of=<clone>/.git/<new file> conv=notrunc` and the same in `<main>/.git`, plus `dd if=/dev/null of=<clone>/.git/config conv=notrunc`.

  State that G6 (a) asked the same question for a `--no-hardlinks` clone, and stays owed as written.
- [ ] **Rows CL1–CL3**, in a `| # | Check | Expected | Observed | Verdict |` table.
  - **CL1** — probe 1: the real profile as `fix_sandbox_worktree_record_writes` (`sandbox1e`) left it, with the clone on `dev`.
    - Every git write refused with `Operation not permitted`: `<clone>/.git/index.lock`, `.git/FETCH_HEAD`, `could not write index`, and `refs/heads/<x>.lock` for `switch`.
    - The new-file control in `<clone>/.git` refused, and the one in `<main>/.git` **written**.
    - `git commit` refused by `git-commit-branch-guard.sh` because the clone was on a protected branch, before it reached the sandbox: a setup error, not a finding.
  - **CL2** — probe 2: a scratch profile with only the `denyWrite` entry `<work_root>/autonomous-sdlc-harness-*/.git` removed, with the clone on a non-protected branch. Every git write was refused exactly as in CL1, `git commit` included, and so was the `<clone>/.git/config` open.
  - **CL3** — probe 3: CL2's scratch profile, one `git add` with `--debug-file`, once with cwd = the clone (refused) and once with cwd = the main checkout (**succeeded**).
- [ ] **Rows CL4 and CL5.**
  - **CL4** — probe 4: CL2's scratch profile with the permission pair `Edit(//<work_root>/autonomous-sdlc-harness-*/.git)` / `Write(…)` also removed.
    - **Every git call succeeded:** add, commit (`9ea0349b`), fetch, stash push and pop with the change restored, and `switch -c`.
    - The new-file controls in `<clone>/.git` and `<main>/.git` were both written.
    - The zero-byte open of `<clone>/.git/config` was **still refused**, with no remaining profile entry naming that path.
  - **CL5** — probe 5: CL4's scratch profile. Every write was inert: a zero-byte `dd … conv=notrunc`, an empty non-executable marker, or a key git never reads.
    - **Refused** with `Operation not permitted`: a new file in `<clone>/.git/hooks/`; opening the existing `hooks/pre-commit.sample`; opening `objects/info/alternates`; and `git config sbx.probe true` (`could not lock config file .git/config`).
    - **Written:** a new file in `objects/info/`, where an `http-alternates` would go; a new file in `info/`; and a new file directly in `.git`, where a planted `commondir` or `config.worktree` would go.
    - Then the two renames of byte-identical copies back onto `config` and onto a hook sample. They were refused at the **permission layer** (`… denied because Claude Code is running in don't ask mode`, with no profile rule naming `mv`) and never reached the sandbox, so a rename onto a protected path is **unmeasured**.
    - Then that a first probe-5 session made no call at all: its model declined a sequence that installed a hook and redirected `core.hooksPath`, which is why every probe-5 write is inert.
- [ ] **What the rows settle**, as a short paragraph under the table, in the prompt's terms and no further:
  - sandboxed ordinary git works in a clone, and what closed it in CL1–CL3 was the profile's own sibling-glob `.git` rules, written for a worktree's `.git` pointer file;
  - an `Edit(…)` permission deny rule alone closes that path to sandboxed commands, not only to the file tools;
  - the runtime itself refuses sandboxed writes to the cwd repository's `.git/config`, `.git/hooks/` and `objects/info/alternates`;
  - it leaves the rest of that `.git` open, so the library's clone-arm refusal of `commondir`, `objects/info/http-alternates` and other planted files is load-bearing (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_wrapper_target_check_var`).

  End with: "No profile entry changed on the strength of these rows."
- [ ] **The owed registry rows.** In `## 4. The profile's denials`, after the worktree-record table, add a short table under a bold label, **The run registry.**, opened by one sentence:
  - the unsandboxed wrappers' clone trust check reads `<main>/harness-runs/autonomous_logs/registry.json`, so the profile write-protects it by exact path on both sides;
  - the library itself writes it by `mktemp` in the same directory plus `mv`, so a sandboxed rename onto it has to be refused too.

  The rows:
  - **RG1:** from a sandboxed session per §0, through `--allowedTools Bash(dd:*)`, `dd if=/dev/null of=<main>/harness-runs/autonomous_logs/registry.json conv=notrunc`, with the control `dd` creating `<main>/harness-runs/autonomous_logs/<new file>`, and an `Edit` of the registry. Expected: `Operation not permitted` for the registry, the control written, and `Edit` denied. Observed and Verdict: `**not run — owed.** Measurement not yet taken.` / `not run — owed`.
  - **RG2:** through `--allowedTools Bash(mv:*)`, so the call reaches the sandbox rather than stopping at the permission layer as CL5's renames did, `mv <main>/harness-runs/autonomous_logs/<sibling> <main>/harness-runs/autonomous_logs/registry.json`, where `<sibling>` is a file created by the RG1 control. Expected: refused with `Operation not permitted`, and the registry's `shasum` unchanged. Observed and Verdict: owed, as RG1.

  State that each owed row is filled in by a person under §0's method with `claude --version` in its Observed cell.

**Verification:**

- `grep -n -E '^\| (CL[1-5]|RG[12]) \|' docs/sandbox-verification.md` lists CL1, CL2, CL3, CL4, CL5, RG1 and RG2, each id on one line only.
- `git diff docs/sandbox-verification.md` shows no existing table row's cells changed. Read the diff to confirm that only the **Who reads this:** sentence and the new subsection, paragraph and tables were added.
- Every Observed cell of CL1–CL5 can be traced phrase by phrase to the task prompt's `**Results.**` list. No commit id, path or message appears that the prompt does not carry.
