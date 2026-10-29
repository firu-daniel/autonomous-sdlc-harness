### Task 7 — Run the template fence's own command in every layout, under bash and zsh

**Goal:** Prove that the opt-out command in the adopter template's change-request fence resolves the main checkout the way `hc_main_root` does, in every layout, and that the marker test says *silence* whenever it cannot establish one. The suite takes the command **from the template itself**, so editing the template without updating the test fails the suite.

**Depends on:**

- **Task 1**, which writes the command into `cli/templates/claude/CLAUDE.md`, item **4. Opt-out.**:
  - **Where.** It is the first inline code span after the exact words `Test it with the shell rather than by reading anything: `, and it contains no backtick.
  - **Its contract.** It reads no `HARNESS_MAIN_REPO`. It invokes `jq` only on the clone arm (after it found `<root>/.git/objects/info/alternates`); the F2 arm runs no `jq`. It prints the main checkout's path and exits 0 **only** when it established one and `<main>/.claude/harness-no-offer` does not exist. Every other outcome exits non-zero.
  - **The shells.** It is written to run under both bash and zsh.
- **Task 6**, which exports `buildRunCopyLayouts(t)` from `cli/test/helpers/run-copy-layouts.mjs`. It returns physical paths for:
  - `main`, `worktree` and `registeredClone` (via `hr_clone_create_var`);
  - `unregisteredClone` (at the derived path, no registry record);
  - `twoLineClone` (registered, alternates holding two lines);
  - `selfClone` (registered, alternates naming itself);
  - `plain` (an unrelated repository).

  That suite proves `hc_main_root` answers `main` for the first three layouts and refuses the three faulty clones, and that `plain` answers itself.

### Targets

- `cli/test/task-offer-fence.test.mjs` (new).

**Work:**

- [x] **Header.**
  - **The rule:** the fence's opt-out command and `hc_main_root` agree on the main checkout in every layout, and the command fails to silence where `hc_main_root` refuses.
  - **Not covered:** this repository's root `.claude/` copy and the worked example's copy. They are renders whose sameness the scope register and Task 12 own.
- [x] **Extract the command.** Read `cli/templates/claude/CLAUDE.md` from `WORKSPACE_ROOT`. Find the one occurrence of the lead-in words and take the text of the first inline code span after them.
  - **Assert** that the lead-in occurs exactly once and the span is non-empty. A template that moves the command fails here, by name.
  - **This reads one fixed file**, so it is not a tree guard and owes no `treeGuards` entry.
- [x] **Run the command in each layout.** Use `runBash(cwd, ['-c', command], { [MAIN_REPO_ANCHOR_VARIABLE]: '' })` for bash. For zsh, go through the same isolated runner: `runBash(cwd, ['-c', 'exec zsh -f -c "$1"', '_', command], { [MAIN_REPO_ANCHOR_VARIABLE]: '' })`. If `command -v zsh` fails, mark that leg skipped with a stated reason; never count it as a pass.
- [x] **The expectations, per shell.**
  - **No marker anywhere:** `main`, `worktree` and `registeredClone` print `main` and exit 0. `plain` prints `plain` and exits 0. `unregisteredClone`, `twoLineClone` and `selfClone` exit non-zero with empty stdout.
  - **After writing an empty `main/.claude/harness-no-offer`:** every layout that resolved `main` now exits non-zero with empty stdout.
  - **The marker written into `registeredClone/.claude/` instead:** `registeredClone` still prints `main` and exits 0. A copy's own marker silences nothing.
  - **`jq` off `PATH`.** Write a `jq` shim that prints nothing and exits 127 into a directory under the suite's `mkdtemp` root, and pass `PATH: <shimDir>:<the isolated PATH>` in the `runBash` env object (`cli/test/helpers/fixture.mjs` → `runCli`'s doc: a `PATH` question is tested by giving the command a `PATH`). With no marker anywhere, `main`, `worktree` and `plain` still print the same answers as above and exit 0, because the F2 arm runs no `jq` (Task 1's contract). `registeredClone` exits non-zero with empty stdout: a missing `jq` silences the offer in a run copy only.
- [x] **Mutation, recorded in the header.** Delete the registry `jq -e` step from the extracted command in memory, never in the template, and run that variant once. `unregisteredClone` must then print a path, which turns the case red. Record in the header that this was run red once, with the date, and keep the mutation out of the committed file.

**Verification:**

- `npm test --workspace cli -- test/task-offer-fence.test.mjs` passes under bash, and under zsh where present. Where zsh is absent, the output names the skip.
- Reading the suite shows the command taken from the template at run time, never copied into the test.
