### 3. `## Shell assets` names three main-checkout wrappers; there are four

**Severity:** Should Fix (user observation 3)

**File:** `.claude/context/conventions.md` → `## Shell assets`, the bullet that opens **A command an unattended run issues must be spellable as a literal.**, at the sentence *"**A call to a main-checkout wrapper — `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` under `<MAIN_REPO>` — carries no `$` at all**"*.

**The problem, verified.** That sentence names three main-checkout wrappers. Since this branch, `launch-sandboxed-gates.sh` is a fourth call issued under `<MAIN_REPO>` from a run copy, and the same rule binds it:

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md` → the `<gate_launcher>` row bind it to `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh <repo_root> <gate_key>_round_<gate_round>`, *"with no `$` anywhere in the command … the profile's literal `allow` entry is the call's only grant from a run copy"*.

The plan recorded this as `## Corpus staleness` (register row 73), and `harness-runs/improvement_observations/fix_linux_detached_gate_run.md` repeats it, but no unit fixed it. The user asks for the edit now. Their observation is authoritative over the task-plan writer's conventions-document prohibition, which binds plan tasks, not this fix.

**Fix:** In that sentence, name the launcher beside the git wrappers, and keep the two grounds the sentence already gives:

1. from a run copy the guard does not vouch for the main checkout's copy, so the permission profile's literal `allow` entry is the call's only grant;
2. any shell expansion loses the match.

For example:

> **A call to a main-checkout wrapper — `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` and `launch-sandboxed-gates.sh` under `<MAIN_REPO>` — carries no `$` at all**, a bare `${IDENT}` and the commit subject included: from a run copy the guard does not vouch for the main checkout's copy, so the permission profile's literal `allow` entry is the call's only grant, and any shell expansion loses the match (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6; `plugin/instructions/dispatch_discipline_instructions.md` → `## Commit mechanics`; for the launcher, the `<gate_launcher>` row of `plugin/instructions/plan_orchestration_instructions_autonomous.md`).

Change nothing else in the bullet. Confirm with `grep -n 'launch-sandboxed-gates.sh' .claude/context/conventions.md` that it prints one line, the edited one.
