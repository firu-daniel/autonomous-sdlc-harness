### 2. `layer-implementer`'s refused-call fallback runs `bash <scripts_dir>/<name>.sh` with nothing left to say which wrapper `<name>` is

**File:** `plugin/agents/layer-implementer.md` (`## Resolved values`, the `<test_cmd>` / `<typecheck_cmd>` row), "run `bash <scripts_dir>/<name>.sh` instead"

**Problem.** `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6 routes a refused `<typecheck_cmd>` call to "the refused-call fallback of `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → `## Resolved values`".

On `dev`, the clause around the fallback said which script to run: `<name>.sh` was the wrapper "whose body is the line `init` inlined into it", for a key holding a raw command line. Task 2 thinned that clause to "If that call is **refused**, run `bash <scripts_dir>/<name>.sh` instead and report in your return which string you ran." Now nothing identifies `<name>`:
- It is not in the row.
- It is not in the preamble's path-placeholder list.
- The file's only other `<name>` is the probe file name in `**The probe route, in every mode.**`, which is a different thing.

`<scripts_dir>` holds many wrappers (`commit-on-branch.sh`, `push-branch.sh`, `test.sh`, `typecheck.sh`, `scratch-run.sh`, …). An implementer on the fallback path has to guess which one to run. The fallback serves only `<typecheck_cmd>`, because the same row says the unit never runs `<test_cmd>`. The wrapper `init` writes for `commands.typecheck` is `typecheck.sh` (`cli/src/generators/scripts.ts`, the `{ key: 'typecheck', file: 'typecheck.sh' }` entry; `cli/templates/scripts/typecheck.sh`, whose header reads "It is what `commands.typecheck` invokes").

**Fix.** In that row, replace `run `bash <scripts_dir>/<name>.sh` instead` with `run `bash <scripts_dir>/typecheck.sh` instead`. The resulting sentence:

```markdown
If that call is **refused**, run `bash <scripts_dir>/typecheck.sh` instead and report in your return which string you ran.
```

The word count is unchanged (one token for one token).

- [ ] Make the replacement above.
- [ ] Confirm with `grep -n '<name>' plugin/agents/layer-implementer.md` that the only remaining `<name>` is the probe-route `<state_dir>/scratch/<name>.<ext>`.

The fix runs no test.
