### Task 7 — Move the committer and the two artifact commit points to the new spelling, and replace the bare `git add` re-stage and the `git mv` rename

**Goal:** Make the `committer` agent, the improvement-observations commit and the clarification-digest commit call the main checkout's commit wrapper in the canonical literal spelling. Remove the two other index writes the flows prescribe, each of which fails sandboxed in a linked worktree just as the commit did: the bare `git add` re-stage after a wrapper exit 1, and the `git mv` the implementer's output contract asks for on every rename (`plugin/agents/layer-implementer.md` → `## Output contract` item 2). Drop every "hook failure" description of the wrapper from these files, because it no longer runs a commit hook.

**Depends on:** Task 6. It made the canonical spelling, in `plugin/instructions/autonomous_pause_and_ledger.md` §1.6 and in `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`:

```zsh
bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> <path>... -- "<subject>" ["<body line>"]
```

`<MAIN_REPO>`, `<repo_root>` and `<branch>` are each written as the literal text they resolve to, and there is no `$` anywhere in the command. The call is issued alone, never compounded. Restate that spelling in each code block below, and cite the two canonical anchors for the reasoning rather than restating it.

It also depends on Task 1's wrapper behaviour, which this file relies on:

- **exit 3 syncs the working copy's own index** for the given paths, so calling the wrapper again with a reverted file re-stages it and returns 3;
- **exit 1 leaves the given paths staged** only when the branch moved under the wrapper (its `update-ref` compare-and-swap failed). Every other exit 1, and every exit 2, stages nothing;
- **no commit hook runs**, so "hook failure" no longer describes an exit 1.

### Targets

- `plugin/agents/committer.md`
- `plugin/instructions/improvement_observations_instructions.md`
- `plugin/instructions/clarification_digest_instructions.md`
- `plugin/agents/layer-implementer.md`
- `plugin/agents/layer-reviewer.md`

**Work:**

- [ ] `committer.md`:
  - **The wrapper calls.** Resolve `<repo_root>` and `<MAIN_REPO>` before step 4, with the same bare commands step 6 uses, then use them in both of step 6's push calls and the commit calls. The step 4 block becomes `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> <path1> <path2> ... -- "<subject line>"`, and the `ui_test_pass` step f block the same with `<plan_path>`. Paths stay repo-relative, as step 3 requires: they resolve against `--repo`.
  - **The `<scripts_dir>` row.** Say that both wrappers are invoked under `<MAIN_REPO>`.
  - **The exit map.** "1 detached HEAD, not a git dir, or hook failure" becomes "1 a refusal or a git failure, including a branch that moved under the wrapper".
  - **The hook sentences.** Remove the opening paragraph's "and you do NOT skip hooks: a failing hook is fixed or surfaced, never bypassed" and step 4's "and never skip hooks": the wrapper runs no commit hook, so both describe a hook that no longer runs.
  - **Step 3, a deleted path.** A `git status --short` entry that is a deletion (` D` / `D `) is passed as its **parent directory**, never as the file, because the wrapper warns and skips a path that does not exist and the deletion would be left out (the wrapper's **STAGING POLICY, AND THE ONE TRAP IN IT** header). This is what carries the old half of a rename, now that the implementer renames without `git mv`. Where `unit_findings_folder` sits under that directory, keep step 3's existing exclusion rule as it is.
  - **The "Wrapper-safe subjects" bullet** still says a bare `${IDENT}` is expanded. Make it say the subject carries no `$` at all, and that `<branch>` is substituted as literal text.
  - **Length.** Do not raise the file's word count (`.claude/context/plugin.md` → *"A change to an agent definition never raises its up-front word count"*). Measure it with `wc -w` before and after, and pay for the longer invocation and the step-3 deletion rule by removing the push paragraph's now-duplicated "main checkout's copy" explanation, which the `<scripts_dir>` row states once, and the two hook sentences removed above.
- [ ] `improvement_observations_instructions.md` → `## Commit mechanics`:
  - **The code block and its surroundings.** Rewrite the block to the canonical spelling. Its path is `<state_dir>/improvement_observations/<branch>.md` and its subject is `chore: Log improvement observations for <branch>`, with `<branch>` literal. Replace the sentence "using the `$REPO_ROOT` the activating flow resolved … the wrapper path is repo-relative" to match.
  - **The "A raw `git commit` is refused in a headless run" bullet.** Rewrite its reason: the main checkout's copy is granted by the profile's literal `allow` entry, and it runs outside the sandbox. A raw `git commit` in a worktree cannot write the record sandboxed.
  - **The `<scripts_dir>` row.** Say the commit wrapper is named under `<MAIN_REPO>`.
- [ ] `improvement_observations_instructions.md` → **Wrapper exit status (surface the error).** Make four changes here, and keep the paragraph's other duties:
  - **The bare `git add`.** Delete the carve-out that prescribes one plain bare `git add -- <state_dir>/improvement_observations/<branch>.md`, along with the opening sentence's pointer to "the single exception … under **Wrapper exit status**". Replace the re-stage with a second wrapper call in the canonical spelling, passing the same single path. After the revert it returns exit 3 and leaves the index matching `HEAD`.
  - **When exit 1 leaves the path staged.** Restate it as Task 1 made it: only when the branch moved under the wrapper.
  - **The exit-1 wording.** "**exit 1** (non-git dir / detached HEAD / hook failure — surface the error)" becomes "**exit 1** (a refusal or a git failure, including a branch that moved under the wrapper — surface the error)". `## Push`'s **No exit-code gate** note says the wrapper "**failed** (exit 1, hook failure)"; make it "(exit 1, a refusal or a git failure)".
  - **The first-write residue.** The intake file is new, and was staged and then reverted by deletion. Pass its parent directory, `<state_dir>/improvement_observations`, to that second call, so the deletion is staged away, as the wrapper's STAGING POLICY header prescribes for a deletion. Its exit 3 then leaves nothing staged. This replaces "there is no headless way to unstage it … report that residue".
- [ ] `clarification_digest_instructions.md`:
  - In the `<scripts_dir>` row, say the commit wrapper is named under `<MAIN_REPO>`.
  - Rewrite `## Commit mechanics`' code block to the canonical spelling. Spell its digest path and its subject `chore: Record clarification digest for <branch>` with `<branch>` literal.
  - Where its opening paragraph names "the four wrapper exit codes with their per-code revert and re-stage duties" as canonical in `improvement_observations_instructions.md`, keep the citation: that section is now the second-call re-stage, not a bare `git add`.
- [ ] `layer-implementer.md` and `layer-reviewer.md`, **the rename without `git mv`.** `git mv` writes the worktree record's `index`, which a sandboxed call in a linked worktree cannot do (`docs/sandbox-verification.md` G1, F1), exactly as the bare `git add` above cannot.
  - `layer-implementer.md` → `## Output contract` item 2 becomes: for each renamed file, `Renamed: <old> → <new>`. State the rename procedure there, once: write the new path with the file tools, then remove the old one with a plain `rm <old>` naming the one tracked, non-glob path, which `plugin/hooks/git-rewrite-branch-guard.sh` auto-allows on an ordinary branch. Never `git mv`, and never a `git add` or `git rm`: the committer's wrapper stages both halves, the old path through its parent directory (this task's committer step-3 bullet).
  - `layer-reviewer.md` → `## Process` step 2's "(staged entries, `git mv` renames, `??` untracked)" becomes "(a rename shows as a ` D` deletion beside a `??` path, plus anything staged)", so the reviewer still reads both halves.
  - **Length.** Neither file's word count rises (`.claude/context/plugin.md` → *"A change to an agent definition never raises its up-front word count"*). Measure each with `wc -w` before and after, and pay for any increase from the same file's prose.

**Verification:**

- `grep -n 'commit-on-branch.sh' plugin/agents/committer.md plugin/instructions/improvement_observations_instructions.md plugin/instructions/clarification_digest_instructions.md`. Every invocation shown is `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`, and none carries `$REPO_ROOT` or `${branch}`.
- `grep -n 'git add --' plugin/instructions/improvement_observations_instructions.md` shows no instruction to run a bare `git add`. Any hit that remains describes what the wrapper does internally.
- `wc -w plugin/agents/committer.md plugin/agents/layer-implementer.md plugin/agents/layer-reviewer.md`: no file is above its value before the edit. Record both numbers for each file in the task's report.
- `grep -rn 'git mv' plugin/agents plugin/instructions plugin/commands`: no hit instructs or expects a `git mv`. The only hit allowed is `layer-implementer.md`'s own prohibition.
- `grep -n -i 'hook fail\|failing hook\|skip hooks' plugin/agents/committer.md plugin/instructions/improvement_observations_instructions.md` prints nothing.
- `claude plugin validate --strict plugin` passes.
