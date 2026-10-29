### Task 1 — Resolve the main checkout from a clone in the change-request fence and in the task offer's answer 4

**Goal:** Make the opt-out test in the adopter template's change-request fence, and answer 4 of the task offer that writes the marker, find the **main** checkout from a clone as well as from a main checkout, a linked worktree and an ordinary repository. Both use the story's rule (index `## Context` → **The rule**, F1–F8) as one shell command. Today both use `git worktree list | head -1 | awk '{print $1}'`, which inside a clone names the clone. So the test misses a marker set in the main checkout, and answer 4 writes the marker into the copy, where cleanup deletes it.

**Where this task stops.** It changes the two templates only. The rendered copies are other tasks' or the maintainer's:

- `examples/notes-app/.claude/` is re-rendered by **Task 12**.
- This repository's root `.claude/CLAUDE.md` and `.claude/harness-task-offer.md` are re-rendered by hand, as the index's `Manual setup required` describes.

**Task 7** runs the command this task writes in fixture repositories, under bash and zsh, and is its proof — including the F2 arm with `jq` taken off `PATH`. This task carries no test of its own.

### Targets

- `cli/templates/claude/CLAUDE.md` — `## Where a change request runs`, item **4. Opt-out.** only.
- `cli/templates/claude/harness-task-offer.md` — the phrase *"at the main worktree's root"* in the paragraph that opens *"Written once by `autonomous-sdlc-harness init`"*, and the four bullets of `## Answer 4 — write the marker, then do the work`.

**Work:**

- [ ] **The command — one line, the behaviour contract.**
  - It runs in the session's own shell, which may be **zsh or bash**. Use only constructs both accept: `$(…)`, `[ … ]`, `case`, `${v%…}`, `${v##…}` and `${v:-…}`. Use no bash-only arrays and no `[[ … ]]`. It contains **no backtick**, because it sits inside one inline code span.
  - It does **not** read `HARNESS_MAIN_REPO`. Fence clause 1 has already excluded every launcher-started session, and those are the only sessions that set it.
  - It applies F1–F8 exactly:
    - **F1.** `t` comes from `git rev-parse --show-toplevel`.
    - **F2.** If `$t/.git/objects/info/alternates` does not exist, `m` is the first `worktree ` line of `git worktree list --porcelain` with the `worktree ` prefix removed.
    - **F3–F8.** Otherwise the file holds exactly one line, which is absolute and ends in `/.git/objects`. `m` is that line without the suffix. `m` is not `t`. `$m/.git` is a directory with no `commondir`. `b` is the branch from `git rev-parse --abbrev-ref HEAD`, and is not `HEAD`. `stateDir` (default `sdlc-harness`, trailing `/` stripped) and `projectName` (default `${m##*/}`) come from `jq` reads of `$m/harness.config.json`. `t` equals `${m%/*}/<projectName>-<b with / turned into ->`. `jq -e` confirms that `.runs[$b]` in `$m/<stateDir>/autonomous_logs/registry.json` has `copy_kind == "clone"` and `worktree == $t`.
    - **The test.** The command then tests `[ ! -e "$m/.claude/harness-no-offer" ]`, prints `m` and exits 0.
  - **`jq` is used on the clone arm only.** The F2 arm (no alternates file) runs `git rev-parse`, `git worktree list` and the marker test, and never invokes `jq`. So a main checkout, a linked worktree or an ordinary repository on a host without `jq` gets today's answer unchanged. Structure the command so that no `jq` call, and no `command -v jq` test, sits on the F2 path.
  - **Every other outcome exits non-zero.** That includes the marker present, any check failing, no git, and — **on the clone arm only** — no `jq`. Join the steps with `&&`, so the first failure ends the command.
- [ ] **`CLAUDE.md` item 4.**
  - Keep the lead-in words byte-for-byte: *"Test it with the shell rather than by reading anything: "*. The **first inline code span after them** must be exactly the command, because Task 7 extracts it from that position.
  - Change the wording around the command:
    - The marker lives at the **main checkout's** root. The checkout you are in may be a linked worktree or a run copy (a clone) of it.
    - The command prints that main checkout and exits 0 **only** when it found one and found no marker there. That exit is the one outcome on which the offer proceeds.
    - Any other outcome is silence: a non-zero exit, no output, or the command declined. A clone the main checkout's run registry does not record counts too, and so does a missing `jq` **in a run copy**. Say in the same sentence that a main checkout or a linked worktree needs no `jq`, so the wording cannot be read as silencing the offer there.
  - Keep, unchanged in meaning:
    - the presence-only rule (never read, parse or act on the marker's contents);
    - the rule that clause 1 already excludes the literal-command constraint;
    - the sentence about not remarking on a file the user never created.
  - Edit no other item of the fence, and no other section.
- [ ] **`harness-task-offer.md`.**
  - In the paragraph opening *"Written once by `autonomous-sdlc-harness init`"*: *"at the main worktree's root"* becomes *"at the main checkout's root"*.
  - Answer 4, first bullet: create `.claude/harness-no-offer` under the **path the fence's opt-out command printed**, which is the main checkout and never a run copy. Drop the `git worktree list | head -1 | awk '{print $1}'` sentence. Keep *"Create that `.claude/` if it is absent, write an empty file, and read, parse or rewrite no other file in that directory"*. Keep the closing sentence on why writing anywhere else silences nothing.
  - Second bullet: confirm with `test -e "<that path>/.claude/harness-no-offer"`. The rest of the bullet is unchanged.
  - Last bullet: *"every worktree of this checkout included, since they all resolve to the same main worktree"* becomes *"every worktree and run copy of this checkout included, since they all resolve to the same main checkout"*.
  - Keep `{{pluginName}}` and every other line byte-identical.

**Verification:**

- `grep -c -F 'Test it with the shell rather than by reading anything: ' cli/templates/claude/CLAUDE.md` prints `1`, and the code span that follows it on that line contains no backtick and no `HARNESS_MAIN_REPO`.
- `grep -n -F 'git worktree list | head -1' cli/templates/claude/CLAUDE.md cli/templates/claude/harness-task-offer.md` finds nothing.
- `grep -c -F "at the main worktree's root" cli/templates/claude/harness-task-offer.md` prints `0`, and `grep -c -F "at the main checkout's root" cli/templates/claude/harness-task-offer.md` prints at least `1`.
- `git diff cli/templates/claude/` touches only item 4 of the fence, the *"at the main worktree's root"* phrase of the offer, and the answer-4 bullets. Read the diff to confirm.
- Read the command and confirm that every `jq` it contains sits after the alternates-file test, on the clone arm, and none on the F2 path.
- Before handing over, paste the command into a scratch `git init` repository under `$TMPDIR` with no marker. It prints that repository's path and exits 0. After `mkdir .claude && touch .claude/harness-no-offer` there, it exits non-zero and prints nothing. Task 7 covers the clone and worktree layouts.
