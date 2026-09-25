### 4. Update the `agentInvocable` doc comment now that the guard carries `remote-run.sh`

**Severity:** Should Fix · **Layer:** cli

**Site.** `cli/src/generators/outerLoopScripts.ts`:
- the `OuterLoopScript.agentInvocable` doc comment, which reads *"The `false` rows that carry or owe that entry are `autonomous-watcher.sh`, `restart-watcher.sh`, `cleanup-merged-worktrees.sh` and `remote-run.sh` — the last because a run that could dispatch runs could start runs about itself (the guard is `plugin/hooks/autonomous-script-allowlist-guard.sh`; a row that owes the entry is auto-allowed until the guard carries it)"*;
- the inline comment above the `remote-run.sh` row in `OUTER_LOOP_SCRIPTS`, which reads *"Owes a `DENY_SCRIPT_BASENAMES` entry"*.

**Problem.** Task 1's comments were written before Task 21 landed, and they describe `remote-run.sh` as a row that *owes* the guard's deny entry and is *auto-allowed until the guard carries it*. The same branch added `remote-run.sh` to `DENY_SCRIPT_BASENAMES` in `plugin/hooks/autonomous-script-allowlist-guard.sh`, so the guard now carries it. The comment now describes a state that no longer exists, in the field whose doc comment is the stated input to the permission profile. That is the gap `.claude/context/cli.md` → `## What "done" means here` names: *"A reviewer holds a change to its module's own header … a header a review reads as a guarantee is worth exactly what the code under it still does."* The row itself is architecturally correct: `agentInvocable: false` plus the guard's deny entry, as `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` requires for an outer-loop script.

**Fix.** Two comment edits in `cli/src/generators/outerLoopScripts.ts`:
1. In the `agentInvocable` doc comment, replace "carry or owe that entry" with "carry that entry". Drop the parenthetical clause "a row that owes the entry is auto-allowed until the guard carries it", but keep the pointer to `plugin/hooks/autonomous-script-allowlist-guard.sh`.
2. In the comment above the `remote-run.sh` row, replace "Owes a `DENY_SCRIPT_BASENAMES` entry" with "Carries a `DENY_SCRIPT_BASENAMES` entry".
