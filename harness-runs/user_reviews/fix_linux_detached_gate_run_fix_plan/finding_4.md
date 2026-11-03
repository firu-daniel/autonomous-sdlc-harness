### 4. Plan-review Should Fix 1, never applied: the launcher's environment reads are stated without the measured ground that makes them safe

**Severity:** Should Fix (user observation 4, first item)

**File:** `cli/templates/scripts/launch-sandboxed-gates.sh`, in the header block that opens `# NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET.` and ends after the bullet `` #   - `HOME` reads a credential path's `~/`. ``. Also:

- `docs/cli.md` §6, residual 13, the list under **What it does not hold**;
- `harness-runs/story_plans/fix_linux_detached_gate_run_story_plan.md` → `## Context`, the sentence *"It reads no environment variable for a trust decision. `HARNESS_MAIN_REPO` included: an assignment prefix could set one."*;
- the root copy `scripts/launch-sandboxed-gates.sh`.

**Depends on:** Finding 2, which deletes the `` `XDG_STATE_HOME` / `HOME` place the per-run profile `` bullet from this same block. Apply this finding to the block as Finding 2 leaves it.

**Source.** `harness-runs/task_plan_reviews/fix_linux_detached_gate_run/review_1.md` → `## Should Fix` 1, re-raised in `review_2.md` → `## Should Fix` 1 (*"Not addressed from round 1"*). It was neither applied nor recorded under `## Rejected findings`. The reviewer's point was this: what keeps an assignment prefix from setting the variables the launcher reads is **measured, not structural**. An assignment-prefixed call does not match the `excludedCommands` entry, so it stays sandboxed. The fix asked for those reads and that ground to be named, with their platform.

**What the tree holds now, verified.** Later work rewrote the header to list what the environment reaches, as residuals: `PATH`, `XDG_STATE_HOME` / `HOME` and `HOME`. The story index's `## Context` still says *"It reads no environment variable for a trust decision"*. Once Finding 2 lands, two reads remain:

- `PATH`, which finds `bwrap`, `jq`, `git` and `setsid`;
- `HOME`, which reads a credential path's `~/`, with the passwd home masked as well.

Neither the header nor residual 13 states why an assignment prefix cannot set them. That is the half of the review that is still unapplied. The records it rests on, as `docs/sandbox-verification.md` holds them:

- **P1b (§3, macOS):** `pass (runs 2 and 3, 2026-10-27 and 2026-10-28)`.
- **P1b (Linux) (§8):** `pass` on 2026-10-29 and 2026-11-02, *"refused earlier than on macOS (F9)"*, with *"What answers it after F9's fix is not traced"*.

Both rows measure `push-branch.sh`'s excluded spelling. No row measures the launcher's own.

**Fix:**

- [x] **1. The launcher header.** After the residual bullets in the `NO ENVIRONMENT VARIABLE DECIDES TRUST IN THE TARGET.` block, add one paragraph that states the ground and its platform, and claims nothing beyond the records:
  > What keeps an assignment prefix from setting these is measured, not structural: a prefixed call does not match the `excludedCommands` entry and stays sandboxed (`docs/sandbox-verification.md` P1b, macOS, runs 2 and 3; P1b (Linux), `pass`, answered by F9's earlier refusal, the answer after F9's fix not traced). Both rows measure `push-branch.sh`; this script's own spelling is owed to the next Gate 15 container run.
- [x] **2. `docs/cli.md` residual 13.** Add one bullet under **What it does not hold**:
  > the environment the excluded call inherits still reaches it: `PATH` finds `bwrap`, `jq`, `git` and `setsid`, and `HOME` places a credential path's `~/` (the passwd home is masked too); an assignment prefix that sets them leaves the call sandboxed, measured for `push-branch.sh` only (P1b, macOS; P1b (Linux), answered by F9's earlier refusal), and owed for this script's own entry at the next Gate 15 container run.
- [x] **3. The story index's `## Context`.** Replace *"It reads no environment variable for a trust decision. `HARNESS_MAIN_REPO` included: an assignment prefix could set one."* with *"No environment variable decides trust in the target, `HARNESS_MAIN_REPO` included. `PATH` and `HOME` still reach it, and an assignment prefix leaves the call sandboxed (P1b, macOS; Linux owed for this script at Gate 15)."* Edit no other line of that file, and never its `## Phase 2 Readiness — Ordered Fix List`.
- [x] **4. Root copy.** Apply step 1 to `scripts/launch-sandboxed-gates.sh` as well, and confirm `cmp` is silent against the template.

**Deviations from plan:** Per `harness-runs/user_review_fix_plan_point_reviews/fix_linux_detached_gate_run_fix_plan/item_4/review_0.md`, the plan's "owed to the next Gate 15 container run" (steps 1, 2 and 4) and "Linux owed for this script at Gate 15" (step 3) were replaced. No row in `docs/sandbox-verification.md` measures a prefixed `launch-sandboxed-gates.sh` call, and the `gate-sandbox` leg issues the launcher unprefixed. The review's Must Fix 1 offered two remedies. This fix takes the alternative: "not measured, and no row takes it". Adding a row would also need `scripts/sandbox-probe.sh` changed to issue the call, which is outside this finding. Step 3's sentence now reads "An assignment prefix left `push-branch.sh`'s excluded call sandboxed (P1b, macOS and Linux); this script's own spelling is not measured, and no row takes it." (Should Fix 2). Residual 13's lead-in now reads "each derived from the code unless it says otherwise" (Should Fix 1).
