### Task 18 — Write the follow-up task prompt for the rows with no route

**Goal:** Turn the gap this branch found into one follow-up task prompt, as the task prompt requires (*"the gap becomes a follow-up task prompt"*). Five row clauses of `docs/sandbox-verification.md` → `## 10.` cannot be reached through the shipped `harness-run.yml` and watcher without changing behaviour:
- SB2's `PAUSE_PROGRESS.md` arm;
- SB2's `remote_status.json` variant;
- SB3;
- JS3N;
- RJ2's launch-check clause: the planted profile is a job surface, so the refusal step refuses the branch first. This is settled from the source, not conditional on a measurement.

The prompt is a proposal for a maintainer to drop. It changes nothing on this branch.

**Depends on:** Task 16, whose hand-step paragraphs under steps 7 and 8 of `docs/development.md` → **The sandbox series round (#170 step 4) — not yet run.** state each reason. This prompt cites those paragraphs and the sources below. It does not restate them as decided work.

### Targets

- `harness-runs/task_prompts/chore_gate12_unroutable_sandbox_rows_task_prompt.md` (new).

**Work:**

- [ ] Write the prompt in the shape this directory's prompts take (`harness-runs/task_prompts/README.md`: one prompt per branch, named for it). Open with what the follow-up branch decides and that it starts from a `dev` carrying `feat_gate12_sandbox_round_driver`. For each of the five, give:
  - the row and its source check (`sandbox1c2` §2 and §3, `sandbox1c` §3);
  - why no route exists, citing by symbol and quoted anchor, never by line number:
    - `cli/templates/scripts/autonomous-watcher.sh` header → *"THE PAUSE NOTE belongs to the run that wrote it"* and *"IT WRITES `remote_status.json`"*;
    - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_status_write`;
    - `cli/templates/claude/settings.autonomous.json` → `permissions.allow` (no `ln`) and `"defaultMode": "dontAsk"`;
    - `cli/src/generators/writeProtection.ts` → `protectedPaths` (the `CONFIG_FILENAME` and `PROFILE_PATH` entries) and `jobSurfacePaths`;
    - `cli/templates/github/workflows/harness-run.yml` → `Refuse a branch that changed the job's own files`, for RJ2;
    - for SB2's `PAUSE_PROGRESS.md` arm, `run_job`'s `-f` test before `hr_remote_move_aside`, noting that the claim holds for the row's link to a regular token file and that a dangling or directory link is not moved aside;
  - the question the follow-up must answer: is the row's premise closed upstream, so that its expected result is read from the source and the row is rewritten accordingly, or does the row need a test seam to reach it?
- [ ] Constraints section:
  - Any seam is opt-in, off by default and behind an environment variable rather than a configuration key (`harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it"*).
  - No measured result is invented.
  - Nothing runs against GitHub in the follow-up's own tests.
  - The rows' **Read from** columns are the contract.
- [ ] State RJ2 as **settled from the source**, not conditional: `protectedPaths` carries `join(repoRoot, PROFILE_PATH)` and `jobSurfacePaths` keeps every checkout-relative entry, so a branch planting `.claude/settings.autonomous.json` is refused before the launch check. The follow-up decides RJ2 the same way as the other four: rewrite the row against the source, or give it a seam.

**Verification:**

- The file cites every source above by path and symbol or quoted anchor, carries no line number, and names no absolute machine path.
- It names this branch's script commands only by repository-relative path.

- **Deviations from plan:** The plan lists the source checks as `sandbox1c2` §2 and §3 and `sandbox1c` §3. RJ2's row in `docs/sandbox-verification.md` → `## 10.` gives `sandbox1e4` §10 item 2, so the prompt cites that for RJ2.
