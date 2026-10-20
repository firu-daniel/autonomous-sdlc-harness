### Task 23 — Add the owed clone-layout rows to `docs/sandbox-verification.md`

**Goal:** Record, as **owed** rows a person takes by hand, every check this branch's design rests on that only a real sandboxed Claude Code session can show. A run cannot launch a sandboxed session under the profile it measures (§2's *"G4–G7 are owed measurements, not results"*). Each row is written in the document's existing shape:
- `# | Check | Expected | Observed | Verdict`;
- the exact calls and controls;
- `**not run — owed.** Measurement not yet taken.` in the Observed cell, and `not run — owed` as the verdict.

The rows taken on earlier dates (CL1–CL6, G1–G7, W0–W5, WR1–WR7, RG1–RG3, AN1–AN4) are records of those dates and stay exactly as written.

**Depends on:** Tasks 5, 7, 11 and 13, whose behaviour these rows measure.
- **The base profile (Task 5):** `<main>/.git` as one `denyWrite` directory entry with `Edit(//<main>/.git/**)` / `Write(…)`. Under the sibling glob: `.git/config`, `.git/hooks/**`, `.git/objects/info/alternates`, `.git/commondir`, `.git/config.worktree`, `.git/objects/info/http-alternates`, and no `<glob>/.git` entry.
- **The per-run profile (Task 13):** at `~/.local/state/autonomous-sdlc-harness/run-profiles/<slug>/<sanitized branch>.json`, or under `$XDG_STATE_HOME`, carrying those paths exactly for the run's own clone, a legacy worktree's `.git` pointer, and every other live worktree's pointer. It is passed as the one `--settings`. The watcher refuses a launch when the copy is not on and strict (opt-out marker aside), or differs from the base by more than appended strings.
- **Run copies (Tasks 7 and 11):** every new run copy is a `git clone --shared` at the derived sibling path.

### Targets

- `docs/sandbox-verification.md`

**Work:**

- [ ] Add a subsection under §2, `### The clone layout (owed)`. It carries:
  - a **Stamp** line left for the person taking the rows, naming the fields to fill: Claude Code version, git version, macOS version;
  - a **Setup** paragraph: the main checkout re-rendered with this branch's `init --force` and the watcher restarted (the story index's **Manual setup required** 1), a run copy cut by the watcher from a throwaway task drop, and each session launched as the watcher launches it, with `--settings <the per-run file>`;
  - a note on the **positive controls**. §4 W0's new-file control directly in `<main>/.git` is now expected to be **refused**, so the control for "the sandbox can write" in these rows is a new file directly in `<clone>/.git` (CL5 measured it writable).
- [ ] **Rows on the run's own copy and the main checkout:**
  - **CS1** — the per-run protection: a `dd if=/dev/null of=<p> conv=notrunc` through `--allowedTools Bash(dd:*)` for each of the clone's six `.git` paths and each re-rooted surface path, and the `Edit` of each. Expected: refused on both sides. Controls: the new file in `<clone>/.git`, and a tracked file in the clone.
  - **CS2** — `<main>/.git` refused as a whole: a new file directly in `<main>/.git`, a write to `<main>/.git/refs/heads/<x>`, and a write under `<main>/.git/objects/`. Each is refused, the opposite of W0's control.
  - **CS3** — sandboxed ordinary git in the clone under the **real** regenerated profile, CL4's calls exactly: `add`, `commit`, `fetch`, `stash push` / `pop`, `switch -c`. Each succeeds.
- [ ] **Rows on the wrappers and the legacy layout:**
  - **CS4** — the three excluded wrappers on a real clone, CW1's shape with `--repo <clone>`. Commit, push and refresh each land. `git rev-parse` shows the clone's and the main checkout's `refs/heads/<branch>` equal afterwards, and `git ls-remote origin <branch>` shows the push.
  - **CS5** — a legacy worktree run's commit: a linked worktree with a registry record and no `copy_kind`, launched by the watcher's resume. CW1's call lands, and its per-run profile carries `<wt>/.git`.
- [ ] **Rows on the job, the profile file, and the whole flow:**
  - **CS6** — a job-mode-shaped session: cwd = a main checkout whose profile `init --plugin-root-entries` generated. `git status` exits 0; `git add <file>` is refused with `Operation not permitted`; `bash <main>/scripts/commit-on-branch.sh --repo <main> <file> -- "<subject>"` lands. This is the measurement of `docs/cli.md` §6's job settlement.
  - **CS7** — the per-run profile file's own protection: from a sandboxed session, a `dd` and an `Edit` of the per-run file are refused.
  - **CS8** — a launch on a deliberately invalid profile, in two halves. **(a)** `claude -p` launched directly with `--settings` naming a copy of the per-run file that keeps `sandbox.enabled: true` but sets one other key to a value of the wrong type. A script that writes a marker under `$HOME` is run, to confirm the `--help` sentence *"Settings files that fail validation are silently ignored in this mode"* on the installed version. **(b)** The watcher's tick with that file's delta: expected refused before launch, with no session started.
  - **CS9** — the full flow: one throwaway task run by the watcher end to end on a clone, which is the clone-layout successor of G3.
- [ ] Update the document's opening **Who reads this:** line to add the per-run profile and the clone layout. In §6 *"Also observed, not a row of the task"*, extend the empty-`--settings` bullet with where its follow-up now lives: the watcher's launch check (`docs/cli.md` §6) and CS8.

**Verification:**

- `git grep -nE '^\| CS[0-9] \|' -- docs/sandbox-verification.md` lists one row per id this task added. Each row's Observed cell reads `**not run — owed.** Measurement not yet taken.`, and no row claims an observed result.
- `git diff -U0 docs/sandbox-verification.md` shows no change inside the CL, G, W, WR, RG or AN tables.
- Each row's exact call is written as one command, a person can run it verbatim, and the commands an adopter is meant to run sit in fenced blocks, one per line.

- **Deviations from plan:**
  - CS4: the plan asked for "CW1's shape with `--repo <clone>`" for all three wrappers. Only `commit-on-branch.sh` takes `--repo`; `push-branch.sh` and `refresh-branch.sh` take the copy as a positional `<repo-dir>` (their `# Usage:` headers in `cli/templates/scripts/`), so those two rows' calls use the positional form.
  - CS8: the plan left the wrong-type key open. The row uses `sandbox.failIfUnavailable` set to the string `"true"`, because a wrong-type key the launch check does not grade would pass `run_profile_check` when applied to the base (it only compares the copy to the base, `docs/cli.md` §6 residual 11), so (b)'s "refused before launch" would not hold; the strict-block comparison (`"true" != true`) is what refuses it.
  - CS1: the watcher's clone is made with `--template=`, so `<clone>/.git/hooks` may not exist; the row probes the directory path itself in that case (WR6's form) rather than a file inside it.
