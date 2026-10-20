### Task 15 — Add the owed anchor rows to `docs/sandbox-verification.md`, and record the library change in `docs/guard-verification.md`

**Goal:** Write down, as **owed** measurements, the one fact this branch's value rests on: a sandboxed Bash call in a watcher-launched session sees `HARNESS_MAIN_REPO` and prints the main checkout. If it does not, every plugin reader silently falls back, so these rows decide whether the branch merges. Record in `docs/guard-verification.md` that the shared library changed, in a function no guard calls.

**Depends on:**

- **Task 3**, which exports `HARNESS_MAIN_REPO="$MAIN_REPO"` inside `spawn_engine`'s engine subshell (`cli/templates/scripts/autonomous-watcher.sh`), before the `"$AGENT_CLI" -p` launch. A sandboxed call inherits it from there or not at all.
- **Task 1**, which allow-lists the read as the exact rule `Bash(printenv HARNESS_MAIN_REPO)`.
- **Task 7**, which changes `hc_main_root` in `plugin/hooks/lib/harness-config-lib.sh` and nothing else in that library.

**Where this task stops.** The rows are **owed**: a person takes them (story index `## Manual setup required` item 1), because a run cannot launch a sandboxed session under the profile it measures. No cell here records an Observed result, and no wall-clock figure is written (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).

### Targets

- `docs/sandbox-verification.md` — **Who reads this:**, and a new subsection under `## 2. Git under the record protection`, after `### The per-run clone (2026-10-19)`.
- `docs/guard-verification.md` — one dated note.

**Work:**

- [ ] **`### The main-checkout anchor (owed)`.** Add it under §2, after the per-run clone subsection. Open with one paragraph: what the anchor is, who sets it (`spawn_engine`), who reads it (the plugin's `<MAIN_REPO>` readers through a bare `printenv HARNESS_MAIN_REPO`, and the QA-lock helpers through `hc_main_root`), and why these rows decide the merge. Then a table in the section's existing `| # | Check | Expected | Observed | Verdict |` shape:
  - **AN1** — §0's launch line with `HARNESS_MAIN_REPO=<main>` set on the launch exactly as `spawn_engine` sets it, or a real watcher pass once the main checkout's `scripts/autonomous-watcher.sh` carries this branch's template. cwd = a linked worktree. One exact call: `printenv HARNESS_MAIN_REPO`. Control in the same session: `printenv HOME`. Expected: the call is allowed by the profile rule, runs sandboxed, and prints `<main>`; the control prints the home directory. Observed: **not run — owed.** Verdict: not run — owed.
  - **AN2** — AN1 with cwd = a `git clone --shared` of the main checkout inside the profile's sibling glob, set up as `### The per-run clone (2026-10-19)` describes. Same call and control, same Expected.
  - **AN3** — the persistence control. In one AN1 session, two exact calls: `export HARNESS_MAIN_REPO=/tmp` (through `--allowedTools`, since the profile carries no rule for it), then `printenv HARNESS_MAIN_REPO`. Expected: the second call still prints `<main>`, because a Bash call's `export` does not reach the next call. Plus a session launched **without** the variable, where `printenv HARNESS_MAIN_REPO` prints nothing and exits 1 — the fallback case every reader handles.
  - **AN4** — `reserve-qa-user.sh` then `release-qa-user.sh <slot>` from an AN2 session, through `--allowedTools` as Q2 did. Expected: the lock appears under `<main>/<stateDir>/qa_user_locks/` and is gone after the release.
- [ ] **The headline line.** In **Who reads this:**, add the anchor to the list of what a change re-runs a row for (*"the watcher's launch line"* already names the right reader; extend it with *"and the main-checkout anchor it exports"*). Change nothing else above `## 0. Method`.
- [ ] **`docs/guard-verification.md`.** Under `### 1.5 Costs measured and not addressed`, or as its own short dated paragraph at the end of `## 1. Whole-set latency baseline`, record one paragraph naming:
  - what changed: `hc_main_root` now reads `HARNESS_MAIN_REPO` first;
  - the command that shows no guard calls it, `grep -n 'hc_main_root' plugin/hooks/*.sh`, and its exact output, which is empty;
  - the conclusion: the per-Bash-call path the §1.2 composite measures is unchanged, so no latency row is re-taken.

  State the date and the commit the grep ran against.

**Verification:**

- `grep -n '^| AN[0-9]' docs/sandbox-verification.md` lists the new rows, and each row's Observed cell reads **not run — owed.**
- `grep -n 'HARNESS_MAIN_REPO' docs/sandbox-verification.md docs/guard-verification.md` shows the variable named only in the new subsection and the new note.
- Run `grep -n 'hc_main_root' plugin/hooks/*.sh` and confirm its output is the one quoted in the note.
- `grep -rn '/Users/\|/home/' docs/sandbox-verification.md docs/guard-verification.md` finds no line this task added: the self-containment gate (`.claude/context/conventions.md` → `## The testing bar`).
