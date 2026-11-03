### Task 3 — Register the launcher as an excluded, agent-invocable outer-loop row, and bring the doctor sentence, the profile `_README` and the script lists level with it

**Goal:** One row of `OUTER_LOOP_SCRIPTS` ships `launch-sandboxed-gates.sh`, and the generator derives the rest from that row:

- the file;
- the base profile's excluded entry `bash <repoRoot>/<scriptsDir>/launch-sandboxed-gates.sh:*`;
- its repo-relative and repo-root-absolute allow forms;
- its write protection on both sides;
- the per-run copy's run-copy twin, which the watcher already appends for every such allow entry.

The texts that state the excluded set or list the shipped scripts follow it, so none is silently contradicted. The base stays host-independent: the entry exists on every host, and off a bubblewrap host the launcher answers `in-session` and starts nothing.

**Depends on:** Task 2, which adds the template `cli/templates/scripts/launch-sandboxed-gates.sh`. The template:

- carries the git wrappers' checks `hr_wrapper_main_of`, `hr_git_env_drop`, `hr_wrapper_target_check_var` and `hr_wrapper_branch_var`;
- runs no git command in the target, so it calls neither `hr_pinned_hooks_path` nor `hr_worktree_config_check_var`;
- runs every byte of the target only inside its own `bwrap` sandbox;
- answers `in-session` / `pending` / a refusal as the story index's `## Context` states.

**Where this layer stops.** The launcher's own suite is **Task 4's**. The documents under `docs/` are **Tasks 16–17's**. The live notes-app profile is **Task 18's**. The watcher, `sandboxProfile.ts`, `writeProtection.ts` and `profileEntries.ts` do not change: each derives from the row.

### Targets

- `cli/src/generators/outerLoopScripts.ts`:
  - one new row after the `run-test-suite.sh` row;
  - the `OuterLoopScript.runsUnsandboxed` doc comment;
  - the module header's opening list.
- `cli/src/doctor/checks.ts`: `SANDBOXED_WRAPPER_CONSEQUENCE` and its doc comment.
- `cli/templates/claude/settings.autonomous.json`: the `_README` strings opening `THE OUTER-LOOP SCRIPTS AN AGENT RUNS`, `THREE COMMANDS RUN OUTSIDE THE SANDBOX` and `CREDENTIALS ARE DENIED ON BOTH SIDES` (register rows 27, 29 and 77).
- `cli/templates/scripts/README.md`: *"The other family in this directory is not generated."*
- `cli/README.md`: the templates paragraph listing the outer-loop shell assets.
- The `cli/test` suites that list the outer-loop set by name or pin the changed text. Derive them at implementation time with `git grep -n -E "'(refresh-branch|task-offer-check)\.sh'|THREE COMMANDS|CREDENTIALS ARE DENIED|a clone cannot move the main checkout" -- cli/test`, and give each hit a disposition in the implementer's report.

**Work:**

- [ ] **The row and its owner's comments.**
  - **The row.** Add `Object.freeze({ file: 'launch-sandboxed-gates.sh', mode: 0o755, agentInvocable: true, runsUnsandboxed: true })` after the `run-test-suite.sh` row, with a one-line comment above it. The comment says: run by the orchestrating session's Phase G on a bubblewrap host; it carries no `DENY_SCRIPT_BASENAMES` entry, because it must be reachable.
  - **The `runsUnsandboxed` doc comment.** Rewrite it so the flag's second use is stated: *"Set on the git wrappers … and on the gate launcher, whose main-checkout copy starts the gate worker under a `bwrap` sandbox of its own on a bubblewrap host, because a process a sandboxed call detaches there did not outlive the call (`docs/sandbox-verification.md` F10)"*. Keep *"Set it only on a script carrying the excluded-wrapper checks …"*, and add that a script running no git command in its target, the launcher, owes `hr_pinned_hooks_path` and `hr_worktree_config_check_var` nothing.
  - **The module header.** Its opening list names the gate launcher.
- [ ] **`doctor`'s consequence sentence.** `SANDBOXED_WRAPPER_CONSEQUENCE` is appended to every missing or stale excluded entry, and its claim (*"a clone cannot move the main checkout's branch …"*) is false for the launcher. Reword the constant so that it holds for every `runsUnsandboxed` row. Its new value is exactly this string, which Task 16 restates in `docs/cli.md` §7:
  > `that script runs sandboxed: a git wrapper there cannot move the main checkout's branch from a clone, because the profile write-denies the main checkout's whole \`.git\`, and a linked worktree's git record and an SSH remote are both out of reach on macOS; the gate launcher there cannot start its own \`bwrap\` sandbox on a bubblewrap host, so Run gates refuse and an unattended run parks`

  Its doc comment says the same. Keep `PROFILE_SANDBOX_CHECK`'s code and pass message unchanged.
- [ ] **The profile template's `_README`.** Inside the existing strings, with no new `{{…}}` token:
  - **`THE OUTER-LOOP SCRIPTS AN AGENT RUNS`.** *"the orchestrating session runs two of them"* becomes three, adding *"the gate launcher `launch-sandboxed-gates.sh`, on a bubblewrap host"*.
  - **`THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`.** It becomes `FOUR COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`, and names `launch-sandboxed-gates.sh` among the excluded scripts under `{{scriptsDirAbs}}`. Add two sentences:
    - The launcher is excluded because on a bubblewrap host (Linux, WSL2) a process a sandboxed call detaches did not outlive the call (`docs/sandbox-verification.md` F10).
    - It runs nothing of the run copy outside a sandbox: it starts the gate worker under its own `bwrap` sandbox with no network, writing only the run copy, the profile's protected paths there read-only and the credential paths below masked, and off a bubblewrap host it starts nothing.
  - **`CREDENTIALS ARE DENIED ON BOTH SIDES`** (register row 77). After *"so the excluded wrappers above keep the environment an HTTPS push needs."*, add one sentence: *"The gate launcher, also excluded, keeps it too, and for the gate worker it starts it unsets every `envVars` name below and masks every `files` path below again, inside its own `bwrap` sandbox."* Change no other sentence of the string.

  Keep the JSON valid and every other string byte-identical.
- [ ] **The two script lists.** `cli/templates/scripts/README.md` and `cli/README.md` each name the gate launcher `launch-sandboxed-gates.sh` beside the Run gates wrapper, in the list's existing form. Change no other sentence.
- [ ] **The tests the row moves.** For each derivation hit:
  - add `'launch-sandboxed-gates.sh'` to every list of outer-loop file names, such as `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES`;
  - update every assertion pinning the three rewritten `_README` strings or the consequence sentence to the new text.

  A suite that derives its expectation from `OUTER_LOOP_SCRIPTS` (`cli/test/profile.test.mjs` → `UNSANDBOXED_ROWS`) needs no edit, and is left as it is. Extend no test's header rule beyond naming the new row where the header lists the set.

**Verification:**

- Each test file this task edits passes, through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives.
- `jq -e . cli/templates/claude/settings.autonomous.json` exits 0, and `git diff -- cli/templates/claude/settings.autonomous.json` changes exactly the three `_README` lines.
- `git diff -- cli/src` changes only the one row, the comments named above, and `SANDBOXED_WRAPPER_CONSEQUENCE`'s string. Read every hunk.
- The derivation `git grep -n -E "'(refresh-branch|task-offer-check)\.sh'|THREE COMMANDS|CREDENTIALS ARE DENIED|a clone cannot move the main checkout" -- cli/test` is re-run. Invariant: every hit is in a file this task edited, or the report names why it needs no edit.
- `bash scripts/typecheck.sh` passes.

- **Deviations from plan:** None in what was built. Left unchanged under the plan's "change no other sentence" rule, and flagged for the docs or review pass: the `THREE COMMANDS` string's "The other two are excluded because …" and "all three wrappers" sentences, which still read true of the three git wrappers alone; and `cli/templates/scripts/README.md`'s "**Two of them are run by the orchestrating session:**", which now undercounts by the launcher. Derivation hits other than `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES` need no edit: each names a git wrapper or `task-offer-check.sh` for its own behaviour, not the outer-loop set, and no `cli/test` file pins the three rewritten `_README` strings or the consequence sentence.
