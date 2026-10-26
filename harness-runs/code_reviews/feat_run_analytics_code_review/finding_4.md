### 4. The allow justification "writes only its own branch's analytics files" overstates the bound: the script writes for whatever branch and checkout it is given

**Files:**
- `cli/src/generators/outerLoopScripts.ts` (`OUTER_LOOP_SCRIPTS`, the comment above the `run-analytics.sh` row): "writes only its own branch's analytics files"
- `plugin/hooks/autonomous-script-allowlist-guard.sh` (the `LEFT ALLOWED, DELIBERATELY` comment block): "`run-analytics.sh` writes only its own branch's analytics files."

**The problem.** Both comments justify why the guard auto-allows `run-analytics.sh` with no `DENY_SCRIPT_BASENAMES` entry. Both say the script "writes only its own branch's analytics files". The script has no notion of "its own" branch. `cli/templates/scripts/run-analytics.sh` writes `<state_dir>/run_analytics/<branch>/run-analytics.json` and `.md`:
- for whatever `<branch>` argument it is handed, after `git check-ref-format` accepts it;
- inside whatever checkout `--repo` names, or the current directory's checkout when `--repo` is absent.

A dispatched agent the guard lets through can therefore append forged sessions to any branch's record, in any checkout it can reach. The script never rewrites a recorded session, which is the real bound. These are the comments a later reader of the deny list relies on, and they state a narrower capability than the code grants. The allow decision itself stands, since nothing destructive is reachable. Only its stated reason is wrong.

**Fix.** Replace the justification in both files with wording that matches the script's own header (`WHERE IT STOPS` and `THE MERGE`).

In `cli/src/generators/outerLoopScripts.ts`, replace

```ts
  // Run by the watcher after each session; an agent reaching it through the script-allowlist guard
  // writes only its own branch's analytics files, so `false` is a calling convention and it carries no
  // `DENY_SCRIPT_BASENAMES` entry.
```

with

```ts
  // Run by the watcher after each session. An agent reaching it through the script-allowlist guard
  // can only append sessions to `<state_dir>/run_analytics/<branch>/` for the branch and checkout it
  // names, and never rewrites a recorded one, so `false` is a calling convention and it carries no
  // `DENY_SCRIPT_BASENAMES` entry.
```

In `plugin/hooks/autonomous-script-allowlist-guard.sh`, replace the sentence

```bash
# `run-analytics.sh` writes only its own branch's analytics files. The last one
```

with

```bash
# `run-analytics.sh` only appends sessions to `<state_dir>/run_analytics/<branch>/`
# for the branch and checkout it is given, and never rewrites a recorded one.
# The last one
```

Keep the rest of that block's text and line flow unchanged.

Both edits are comment-only. No behaviour changes, so `docs/guard-verification.md` owes no re-measurement and no test file is edited or run.
