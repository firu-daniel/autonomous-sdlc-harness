### Task 1 — State "once, alone" for the committer's verify and push calls in `committer.md`

**Goal:** Make the `committer` issue its verify checks and its push the same way it already issues its commit. Each is its own plain Bash call, and the push names `<MAIN_REPO>`'s copy of the wrapper, never `<repo_root>`'s. A compounded or run-copy push runs sandboxed in an unattended run and fails.

**Where this task stops.** This task edits only `plugin/agents/committer.md`, and only `## Process` → `### Standard procedure (`task` / `review_plan_file` / `review_item`)` steps 4, 5 and 6. `### ui_test_pass procedure` needs no edit. Its step f already says "call the wrapper once, alone", and steps g and h defer to steps 5 and 6 ("**Verify** as step 5 does", "**Push** as step 6 does"), so this task's change reaches them unedited. The orchestrator-side copy of the rule in `plugin/instructions/autonomous_pause_and_ledger.md` §1.6 is **Task 2's**. The source guard that pins this wording is **Task 3's**. Task 3 asserts the exact strings named under **Work:** below, so write them byte-for-byte. The return contract (`## Output contract`, `pushed: <yes|no|failed>`) and every other section stay unchanged.

### Targets

- `plugin/agents/committer.md` — `### Standard procedure` steps 4, 5 and 6.

**Work:**

- [ ] **Step 4 — add the definition.** Leave the existing sentence "Resolve `<repo_root>` and `<MAIN_REPO>` per `## Resolved values`, then call the wrapper once, alone, with exactly step 3's paths and every placeholder as literal text:" exactly as it is. Then add the following sentence on one line, at step 4's sub-bullet indent (five spaces), directly after the fenced `commit-on-branch.sh` block and before the line that begins `With a body line:`:

  `**Once, alone** means its own Bash call holding that one command and nothing else — no `cd`, `;`, `&&`, `||`, pipe, `echo "exit $?"`, `$(…)` or shell variable before or after it.`

  Copy that sentence byte-for-byte. Task 2 copies it into §1.6 and Task 3 compares the two copies. Add no rationale (`.claude/context/plugin.md` → `## Writing agent prose` → **An agent's growth is paid for by behaviour.**).
- [ ] **Step 5 — the checks are their own calls.** Replace the step with:

  `5. **Verify:** run `git status --short` and `git log -1 --oneline` as two separate calls, each once, alone: the first shows a clean tree, and the second matches `<short_sha>`.`
- [ ] **Step 6 — the push is one plain call.** Replace the step with:

  `6. **Push:** only when `push == true` and step 4 committed, landed exit 1 included — call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` once, alone, with both spelled literally and `<MAIN_REPO>` resolved per `## Resolved values`, never `<repo_root>`; report `pushed: yes`, or `pushed: failed` when the helper reports a failure, which is not a commit failure. Otherwise `pushed: no`.`

  The trailing reporting clause is today's wording, carried unchanged. That keeps the return contract as it is (task prompt → `## Constraints`).
- [ ] Trim no unrelated text to offset the growth (task prompt → `## The goal` item 4).

**Verification:**

- `git diff plugin/agents/committer.md` touches exactly three places: one added line in step 4 and the replaced lines of steps 5 and 6. No other section changes.
- `grep -c 'once, alone' plugin/agents/committer.md` counts the steps 4, 5 and 6 sentences, `ui_test_pass` step f and the definition. Read each hit to confirm it is one of those, and confirm no other wording of the rule ("single statement", "on its own") was added.
- `grep -nF '**Once, alone** means its own Bash call holding that one command and nothing else' plugin/agents/committer.md` hits exactly one line, inside `### Standard procedure` step 4.
- `### ui_test_pass procedure` steps f, g and h are byte-unchanged, and `## Output contract` is byte-unchanged (`git diff` shows neither).
  - **Deviations from plan:** The second Verification bullet's `grep -c 'once, alone'` is case-sensitive and does not match the definition's capitalised `**Once, alone**`; it returns 4 (steps 4, 5, 6 and `ui_test_pass` step f). The five hits the bullet expects were confirmed with `grep -ci 'once, alone' plugin/agents/committer.md` (5) and by reading each `grep -n -i` hit. The definition sentence is written byte-for-byte as the plan specifies, capital included.
