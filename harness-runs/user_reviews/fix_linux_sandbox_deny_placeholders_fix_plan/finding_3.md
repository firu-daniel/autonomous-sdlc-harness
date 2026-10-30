### 3. The docs and the story index still say job mode is a goal case the branch does not meet, and the self-adopted scripts lag the templates

**Files:**

- `docs/cli.md` §6, residual 12: the **Job mode** item ("`- **Job mode** (derived from the measured`" … "`No such change has landed.`"), the **Leftovers** item's list ("`The watcher removes what its manifest recorded, outside the sandbox, at these points:`"), and the per-run-profile paragraph ("`On a bubblewrap host, outside job mode, every spawn also writes a manifest beside it`").
- `docs/watcher.md`: the paragraph "`**On a bubblewrap host (Linux, WSL2), outside job mode,** three more things run`".
- `docs/remote-execution.md`: the bullet "`**The post-session steps on a job that passed.**`".
- `harness-runs/story_plans/fix_linux_sandbox_deny_placeholders_story_plan.md`, `## Context`: the bullet "`**The goal case the route does not meet: job mode.**`" and its three sub-bullets.
- The self-adopted copies `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh`.

**Depends on:** Findings 1 and 2. This finding describes what they ship, and copies their template bytes.

**The problem.** The user asked that Task 9's **Job mode** item and the story index's `## Context` bullet be rewritten to describe what the branch does. Once Findings 1 and 2 land, both still say the manifest, the sweep and the start-up recovery do not run in job mode, and that the remedy is a new job. That would be false. Every other statement of the leftover route in `docs/cli.md` and `docs/watcher.md` is also scoped *"outside job mode"*. Three of those scopes stay true and must stay: the trio's omission, the launch check and the cap. The manifest and the sweep are no longer scoped that way.

The repository's own `scripts/` copies are byte copies of the templates (Task 5's rule), so Findings 1 and 2 leave them stale. Gate 15's container re-take drives the root copies.

**Fix:**

- [ ] **`scripts/`:** replace `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh` with the bytes of `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/lib/harness-run-lib.sh`. Neither carries a `{{…}}` token. Keep each file's executable bit. `cmp` of each pair prints nothing. This repository carries no `.github/workflows/harness-run.yml`, so Finding 2's workflow edit has no root copy.
- [ ] **`docs/cli.md` §6, residual 12, the Job mode item.** Keep the derived marking (*"derived from the measured … mechanism and from the code, not measured in a job; a job-mode-shaped session is `docs/sandbox-verification.md` CS6, owed"*). Rewrite the four points as:
  1. **What the job's profile names.** Unchanged.
  2. **What a kill leaves, and what removes it.**
     - A stall-watchdog `kill -9`, a `stop` cancel or a step timeout leaves those paths behind as read-only empty files.
     - The watcher records them before each session in a manifest under `$RUNNER_TEMP` (`hr_job_absent_file`), which no root of the session can write.
     - It removes the recorded leftovers at four points, under the same rule as residual 12's *Leftovers*: at the head of each spawn; in the stall watchdog's recovery, before its copy check and reset; when the job's run ends; and, for a watcher killed with its session, in the workflow's `Sweep the sandbox placeholders` step before `Push the branch`.
     - State the reason for the KILL-tier position: the reset's surface check counts an untracked `.claude/settings.local.json` leftover as a protected-surface change and would give the run up.
  3. **What job mode does not take, and why.** No launch check and no cap. Job mode renders no per-run copy and omits none of the trio, and the job's whole `.git` is a `denyWrite` directory entry. Because that directory exists, no placeholder is mounted there. A job runs one run.
  4. **The remedy and what is owed.** The sweep keeps a leftover it cannot prove is a placeholder; the push then refuses, and the remedy is a new job by the resume route [`remote-execution.md`](remote-execution.md) §1 names. Cite it, do not restate it. Keep the existing sentence that a hosted runner's checkout is unreachable once the job has ended. That the sweep removes them in a job is owed: CS6 and AP3. Drop the *"What lifts it … No such change has landed."* point.
- [ ] **`docs/cli.md` §6, residual 12, Leftovers.** After the five-point list, add one sentence: in job mode the points are the ones the **Job mode** item names. Cite it there, rather than adding job points to this list.
- [ ] **`docs/cli.md` §6, the per-run-profile paragraph.** After *"it is the only list residual 12's sweep removes from"*, add one sentence: in job mode the manifest is `$RUNNER_TEMP/autonomous-sdlc-harness-placeholders/<sanitized branch>.absent` (`hr_job_absent_file`), because a job has no machine state directory. Keep *"On a bubblewrap host, outside job mode,"* on the per-run copy's manifest. That one is local only.
- [ ] **`docs/watcher.md`, the bubblewrap paragraph.** Scope *"outside job mode"* to the launch check only. Say the manifest and the sweep also run in job mode, at the points `docs/cli.md` §6 residual 12's **Job mode** item names, and cite that item rather than listing the points again. Name the `job-sweep` subcommand once.
- [ ] **`docs/remote-execution.md`, the post-session steps bullet.** Add `Sweep the sandbox placeholders` to the list of post-session steps, in its place before `Push the branch`, with one clause on what it removes, citing `docs/cli.md` §6 residual 12.
- [ ] **The story index's `## Context` bullet** "`**The goal case the route does not meet: job mode.**`". Edit only this bullet and its three sub-bullets, never the `## Phase 2 Readiness` section. Replace them with a bullet titled **"Job mode, covered by the user-review fix round."** It states, in the index's own register:
  - a job writes its manifest under `$RUNNER_TEMP`;
  - the sweep runs at the head of each spawn, in the stall watchdog's KILL tier, at `run_job`'s exit, and in the workflow's step before `Push the branch`;
  - the launch check and the cap stay local, with the one-line reason from the docs;
  - it is derived, with CS6 owed;
  - it cites `harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_fix_plan.md`.

  In the index's `**Cross-task names.**` paragraph, add `hr_job_absent_file`, `hr_job_absent_files` and the `job-sweep` subcommand.
- [ ] **Register.** Every new sentence states a Linux effect as derived or owed, never as observed. Every command an adopter runs sits in a fenced block, one per line. The job-mode points are stated once, in residual 12's **Job mode** item, and cited from everywhere else.
