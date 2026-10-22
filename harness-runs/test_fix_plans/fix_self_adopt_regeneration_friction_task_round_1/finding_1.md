### 1. Gate 6a: absolute checkout path in `harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md`

**Site:** `harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md`. The `- **verbatim:** \`context_notes: The layers[].conventions documents exist and are tracked at …` line of the `## [plan-write · arch · iter 0] → architecture-reviewer  (#3)` block (line 3 at the time of the run).

**Failing test:** none — gate 6a no machine paths (`scripts/run-gates.sh`, `machine_path_hits`)

**Failure (from the log, machine paths rewritten):**

```
FAIL  6a no machine paths (printed output, which is the finding)
      ./harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md:3:- **verbatim:** `context_notes: The layers[].conventions documents exist and are tracked at .claude/context/cli.md, .claude/context/plugin.md and .claude/context/conventions.md (source: `git ls-files .claude` in that checkout); …`
```

In the log, the first `.claude/context/cli.md` in that line was prefixed with the absolute path of this checkout's root, which sits under the running user's home directory.

**Diagnosis:** new this round. The orchestrator's dispatch addition for the plan-write architecture review (commit `847891a2`) quoted a `context_notes:` line verbatim, and that line spelled the first conventions document as an absolute path into the run copy. Gate 6a greps the tree for the running user's `$HOME`, skipping only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`. `harness-runs/dispatch_additions/` is committed and is not skipped, so the hit fails the gate. The self-containment rule (`.claude/context/conventions.md` → `## The testing bar`, last bullet) applies to every commit: nothing in the tree may name a location on the machine that wrote it. A grep of the current tree shows this is the only file with a hit.

**Fix:**

- [ ] In that one `- **verbatim:**` line, replace the absolute prefix in front of `.claude/context/cli.md` with the placeholder `<repo_root>/`, so the line reads `… are tracked at <repo_root>/.claude/context/cli.md, .claude/context/plugin.md and .claude/context/conventions.md (source: …`. The placeholder keeps the meaning of the original note (a path rooted at the run copy) without naming the machine.
- [ ] Change nothing else in the block: its heading, `added:` and `why the agent could not derive it:` lines stay as they are, and so do the other two document paths, which are already repo-relative.
- [ ] Afterwards, run `grep -rn` for the home-directory prefix over `harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md`. It should print nothing.
