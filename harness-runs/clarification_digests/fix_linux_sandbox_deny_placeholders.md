## question_1 — The plan loop hit its 5-revision cap: how to proceed, and whether to accept the Linux-only `denyWrite` drop
- **raised by:** planning phase, the `task-plan-reviewer` gate (`/autonomous-sdlc-harness:branch-start-plan-autonomous`, task-plan write loop). The flow walker escalated with `reason: cap`, with 1 Must Fix still open in `harness-runs/task_plan_reviews/fix_linux_sandbox_deny_placeholders/review_2.md`. Architecture review had 2 failing rounds and plan review 3. The draft at park was 11 tasks, 163 points.
- **asked:**
  - **Q1 — How should the non-converged plan proceed?** Options:
    - (a) one more revision, with `review_2.md` given to the writer and the plan gates run again;
    - (b) accept the plan as it is, treating `review_2.md`'s Must Fix as non-blocking or wrong;
    - (c) narrow the scope (the plan had grown from 10 tasks / 141 points to 11 / 163: watcher-side leftover sweeps at four call sites, a start-up recovery path, a one-run-per-repo cap on Linux);
    - (d) stop the branch.
  - **Q2 — Accept that a sandboxed write to the three run-copy git paths is no longer refused on Linux?** This is a security trade-off against the task prompt's goal *"a sandboxed write to each protected path is still refused (CS1, CS2)"*. On Linux and WSL2 only, the per-run profile drops the `sandbox.filesystem.denyWrite` entries for the run copy's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`; the `Edit` deny rules stay. Protection then rests on:
    - the wrappers' existing refusal of a planted file (CS12–CS14);
    - a new watcher check before every launch and resume;
    - a leftover sweep that removes only 0-byte, non-writable regular files owned by the watcher's user that were recorded as absent before the session.

    Residual risk: a sandboxed Bash command in a Linux run copy could write `commondir` or `config.worktree`, and sandboxed git calls later in that session would follow it. macOS is unchanged. Options:
    - (a) accept the Linux-only drop with the compensating checks;
    - (b) reject it and keep the `denyWrite` entries on Linux, by another route (sweep-and-recover only, or Linux unattended runs unsupported until upstream fixes it);
    - (c) another route.
- **answered:** Q1: (a) One more revision. Q2: (a) Accept the Linux-only drop with the compensating checks.
- **carries beyond this branch:** a standing decision: on Linux and WSL2 hosts, the per-run profile may omit the run copy's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` from `sandbox.filesystem.denyWrite`, relying on the wrappers' planted-file refusal, the watcher's pre-launch check and the recorded-leftover sweep. This waives the "sandboxed write to each protected path is still refused" goal for those three paths on Linux until Claude Code's absent-path behaviour is fixed upstream.
