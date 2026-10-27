### 4. `session.sh` does not parse under bash 3.2.57, its own declared floor and the `bash` a stock macOS host runs the probe with, so Gate 15's `run` defines no `sp_setup`, `sp_session` or `sp_teardown` and measures nothing

**File:** `scripts/lib/sandbox-probe/session.sh` (`sp__render`) — `SP__RENDER_REFUSAL="the per-run profile for '$1' was refused: ${out:-the watcher's render printed nothing}"`. The parse error surfaces later in `sp_session`, at `"usage: sp_session <name> <settings file> <prompt file> [options]"`.

**The problem.** The probe runs on macOS only (`scripts/sandbox-probe.sh` header), with the shebang `#!/usr/bin/env bash`. On a stock macOS host that resolves to `/bin/bash` 3.2.57. `session.sh`'s header declares *"Bash 3.2 floor"*, and so does every other library under `scripts/lib/sandbox-probe/`.

`sp__render` builds its refusal with an apostrophe (`watcher's`) inside the word of a `${out:-…}` default, and that expansion sits inside a double-quoted string. Bash 3.2 scans for the closing `}` and treats that `'` as the start of a single-quoted span. The span runs on to a later `'` in the file, so the parser's quote state is wrong from line 126 onward. By the time it reaches `sp_session`'s usage string, the parser no longer sees that string as quoted. It reads `<name> <settings file> …` as redirections, and `>` followed by `<` is the reported `syntax error near unexpected token '<'`.

A sourced file that fails to parse defines none of the functions after the error. So under 3.2:

- `sp_setup`, `sp_session`, `sp_extra_clone` and `sp_teardown` are undefined.
- `scripts/sandbox-probe.sh` turns a missing library function into a usage refusal (its header: *"1 usage, or a library function not yet present"*).
- `run` therefore launches no session, and none of the legs Findings 1–3 grade is reachable on the platform the probe exists for.

`--list` still prints its table, with the error on stderr, which is why the defect stays quiet.

**Proof.**

- Three Phase A implementers recorded the same failure independently:
  - `harness-runs/task_plans/feat_unattended_sandbox_measurement/task_5_plan.md`: *"`scripts/lib/sandbox-probe/session.sh` fails `bash -n` under bash 3.2.57, which is both `/bin/bash` and the `bash` on PATH here, with `line 313: syntax error near unexpected token '<'` inside `sp_session` … core, preflight, judge, controls and legs-local all pass `bash -n`; session.sh alone fails."*
  - `task_7_plan.md`: *"the per-function parse locates it in `sp__render`"*. In its own file, the same 3.2 parse *"caught one bash 3.2 defect in this file (a quote inside a `"${x:-…}"` default), fixed"*. That is the construct at `sp__render`.
  - `task_9_plan.md`: *"sourcing `scripts/lib/sandbox-probe/session.sh` (Task 4) fails with `session.sh: line 313: syntax error near unexpected token '<'`"*.
- `git log origin/dev..HEAD -- scripts/lib/sandbox-probe/session.sh` shows one commit, Task 4's `5bf977fa`. The file those notes measured is the file at HEAD.
- A grep of `scripts/lib/sandbox-probe/` and `scripts/sandbox-probe.sh` for an apostrophe inside a `${…:-…}` default matches `session.sh` `sp__render` only.
- This review could not re-run `bash -n` itself: the permission mode refused every Bash execution of `/bin/bash`. The localisation above rests on the three recorded measurements and on Task 7's per-function parse.

**Fix.**

1. In `scripts/lib/sandbox-probe/session.sh` → `sp__render`, replace the line

```bash
    SP__RENDER_REFUSAL="the per-run profile for '$1' was refused: ${out:-the watcher's render printed nothing}"
```

   with

```bash
    [ -n "$out" ] || out="the watcher's render printed nothing"
    SP__RENDER_REFUSAL="the per-run profile for '$1' was refused: $out"
```

   Both lines keep the apostrophe in a plain double-quoted string, where bash 3.2 reads it literally, and leave no `'` inside any `${…}`. `out` is not read after this point: the branch returns 1. The refusal text is byte-identical to the old one.

2. Run `/bin/bash -n scripts/lib/sandbox-probe/session.sh` from the checkout root. Use `/bin/bash` by its absolute path so the run is under 3.2.57. It must exit 0 and print nothing.

3. Only if step 2 still reports an error inside `sp__render`, also move the inline script out of the double-quoted command substitution. Add `script` to `sp__render`'s `local out rc` line, and replace the `out="$(bash -c '` … `' _ "$SP_SCRIPTS/autonomous-watcher.sh" "$1" "$2" 2>/dev/null)"` statement with

```bash
  script='
    . "$1" status >/dev/null 2>&1
    if ! run_profile_render "$2" "$3" clone; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
    if ! run_profile_check "$RUN_PROFILE_FILE" "$3"; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
    printf "%s\n" "$RUN_PROFILE_FILE"'
  out="$(bash -c "$script" _ "$SP_SCRIPTS/autonomous-watcher.sh" "$1" "$2" 2>/dev/null)"
```

   Then repeat step 2.

This fix edits no test file and runs none. `bash -n` is a parse check, not a test run.
