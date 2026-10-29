### Task 2 — Add `plugin/instructions/main_repo_resolution.md`, the single home of the `<MAIN_REPO>` fallback

**Goal:** Write the one document that states how a plugin reader resolves `<MAIN_REPO>` when a bare `printenv HARNESS_MAIN_REPO` prints nothing. Every one of the plugin's 21 resolution sites will point at its `## The fallback` heading (Task 4). It carries the story's rule (index `## Context` → **The rule**, F1–F8) in reader-facing prose, the record of what it repeats and drops from the outer loop's clone check, and the closed roster of documents that may cite it.

**Where this task stops.** It changes no citing site; **Task 4** moves all 22 occurrences to the pointer in one commit. The heading text `## The fallback` and the module path are **wire strings** from this task on. Task 4's clause names them byte-for-byte, and Task 8's corpus check asserts both.

### Targets

- `plugin/instructions/main_repo_resolution.md` (new).
- `plugin/instructions/README.md` — the file count and the *"came later"* list only.

**Work:**

- [ ] **Skeleton, in this order.**
  - An H1 with **no frontmatter**, because an instruction document carries none (`.claude/context/conventions.md` → `## The stack…`).
  - A two-sentence lead stating who loads it: any reader whose `printenv HARNESS_MAIN_REPO` printed nothing. A reader whose read printed a path never opens it.
  - `## Resolved values`, the three-column `| Token | Class | How to resolve it |` table:
    - `<MAIN_REPO>`, class `derived at runtime`: what this file resolves.
    - `<copy>` and `<candidate>`, class `derived at runtime`, defined by the steps.
  - `## The fallback`.
  - `## What this repeats of the outer loop's clone check, and what it drops`.
  - `## Who may cite this`.
- [ ] **`## The fallback` — the numbered steps, F1–F8, in the reader's own commands.**
  - **Allowed commands.** Every command is **bare and literal**:
    - `git rev-parse --show-toplevel`;
    - `git rev-parse --abbrev-ref HEAD`;
    - `git worktree list --porcelain`;
    - the **`Read` tool** for every file: the alternates file, `<candidate>/.git/HEAD`, `<candidate>/.git/commondir`, `<candidate>/harness.config.json` and the registry.
  - **The rules each step states:**
    - **Testing for a directory.** Use the `Read` tool on `<candidate>/.git/HEAD` to test that `<candidate>/.git` is a directory. Use it on `<candidate>/.git/commondir` to test for absence: only a "does not exist" answer counts as absent.
    - **A refused read is not an absent file.** A file the `Read` tool cannot read for any other reason is a stop, not an absence.
    - **F2 keeps today's answer, by name.** It is the first `worktree ` line of a bare `git worktree list --porcelain`: the checkout itself in a main checkout or an ordinary repository, and its main checkout in a linked worktree. Write F2 in this wording, and never as the full old clause (``the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain` ``): Tasks 4, 8 and 9 assert that the full old clause reaches no file under `plugin/`.
    - **Comparisons are literal string comparisons.** A spelling mismatch stops the reader, so it never gives a wrong answer.
    - **The stop.** One sentence beginning exactly `cannot resolve the main checkout — `, which names the step that failed and the path it read. The reader then does nothing that needs `<MAIN_REPO>`, and **never** uses `<copy>` in its place.
  - **Spell `cannot resolve the main checkout — ` exactly that way.** Task 3's shell refusals use the same opening words.
- [ ] **`## What this repeats …`.**
  - **Repeated from `hr_clone_target_check_var`.** Cite it by repo-relative path, `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_target_check_var`, never as a `${CLAUDE_PLUGIN_ROOT}` path. F6 is its condition 1, F7 its condition 2 and F3 its condition 4. F4 is the main-checkout test plus *never the copy itself*.
  - **Dropped:**
    - Conditions 3 and 5. They protect git calls an unsandboxed wrapper makes inside the clone, and this reader makes none.
    - The canonical-path comparison. No allow-listable literal command canonicalises a path.
    - Condition 1's read of the `HEAD` file. It is replaced by the bare `git rev-parse --abbrev-ref HEAD`.
  - **Platform posture:**
    - `docs/sandbox-verification.md` row CL5 shows the alternates file refused on macOS. On Linux the row is unmeasured (`blocked: F9`).
    - So nothing trusts the alternates file alone. F6 needs a registry at the candidate (the main checkout's own registry is write-protected), and F7 puts the candidate at the work root.
    - The residual is a directory at the work root shaped as a main checkout with its own registry naming this copy.
  - **Known cost.** A main checkout that itself borrows objects through `alternates` takes the clone arm and stops; it sets `HARNESS_MAIN_REPO` instead.
  - **No new permission.** The commands are covered by the profile's `Bash(git rev-parse:*)`, `Bash(git worktree:*)` and its two `Read(…/**)` rules, so the unattended profile needs no new one.
- [ ] **`## Who may cite this` — the closed roster.** List exactly these 24 files and state that a document not on the list does not point here. The shape follows `plugin/instructions/unit_loop_core.md` → `## The test-run rule` → **Who may cite this.**, which lists its non-plugin citers repo-relative beside its `${CLAUDE_PLUGIN_ROOT}` entries.
  - **The 21 plugin citers**, each written as `${CLAUDE_PLUGIN_ROOT}/<dir>/<file>` (Task 4 moves them to the pointer):
    - `agents/committer.md`, `agents/qa-tester.md`;
    - `commands/branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-user-review-fix-autonomous.md`, `branch-status.md`, `branch-user-review.md`;
    - `docs/AUTONOMOUS_FLOW.md`;
    - `instructions/autonomous_pause_and_ledger.md`, `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `improvement_observations_instructions.md`, `plan_orchestration_instructions_autonomous.md`, `task_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md`.
  - **The 3 citers outside the plugin**, each written **repo-relative**, never as a `${CLAUDE_PLUGIN_ROOT}` path:
    - `cli/src/doctor/checks.ts` — the `PROFILE_MAIN_ANCHOR_CHECK` doc comment and `warn(…)` message (Task 5);
    - `docs/watcher.md` — `### The main-checkout anchor`, **Read.** (Task 9);
    - `docs/cli.md` — the main-checkout anchor-rule bullet (Task 9).
  - Keep the closing statement: no document beyond these 24 points at `## The fallback`.

  Add one sentence saying why the module is its own file rather than a row of `dispatch_discipline_instructions.md`: that file's `## Activation` closes the set of documents that may point at it.
  - **Deviations from plan:** The `dispatch_discipline_instructions.md` → `## Activation` sentence sits in the module's lead, not under `## Who may cite this`. `## Who may cite this` is the module's last section, so the verification's `sed -n '/^## Who may cite this$/,/^## /p'` range runs to end of file, and a `${CLAUDE_PLUGIN_ROOT}` path there would count as a 22nd roster entry.
- [ ] **`plugin/instructions/README.md`.**
  - *"twenty-four of the twenty-eight instruction files"* becomes *"twenty-four of the twenty-nine"*.
  - Add *"main-checkout resolution"* to the parenthesised *"came later"* list.
  - Change nothing else.

**Verification:**

- `ls plugin/instructions/*.md | grep -v README.md | wc -l` matches the count the README now states.
- `grep -c '^## The fallback$' plugin/instructions/main_repo_resolution.md` prints `1`. `head -1` of the file is an H1, not `---`.
- `grep -c -F 'cannot resolve the main checkout — ' plugin/instructions/main_repo_resolution.md` prints at least `1`.
- `grep -n -F '$(' plugin/instructions/main_repo_resolution.md` finds nothing. Read `## The fallback` and confirm that every command it names is one of the four bare forms above or a `Read` tool call.
- `sed -n '/^## Who may cite this$/,/^## /p' plugin/instructions/main_repo_resolution.md | grep -o '\${CLAUDE_PLUGIN_ROOT}/[a-z]*/[A-Za-z_.-]*' | sort -u` lists exactly the 21 plugin roster files, and each one exists under `plugin/`. The scope is the lines under `## Who may cite this` only, as Task 8's roster check reads them: a `${CLAUDE_PLUGIN_ROOT}` path elsewhere in the module, such as the sentence citing `dispatch_discipline_instructions.md`'s `## Activation`, is not a roster entry.
- Read `## Who may cite this` and confirm it also lists `cli/src/doctor/checks.ts`, `docs/watcher.md` and `docs/cli.md`, each repo-relative with no `${CLAUDE_PLUGIN_ROOT}` prefix, and that each exists. The roster is those 21 `${CLAUDE_PLUGIN_ROOT}` entries plus these three, and nothing else.
