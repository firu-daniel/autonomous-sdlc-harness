### Task 15 — Make `dontAsk` the unattended permission mode, and correct the profile's own statements of what an unlisted call does

**Goal:** An unattended run launches in `dontAsk` mode. Under it, a call that matches neither `allow` nor `deny`, or that matches an `ask` rule, is refused at once rather than prompting a session nobody can answer. It also refuses an unlisted host whether or not `sandbox.network.strictAllowlist` is honoured from a `--settings` file (a verified fact; the `strictAllowlist` scope is unresolved). This is the user's ruling on the branch's Question 1. `acceptEdits` stays available as a documented `PERMISSION_MODE` override. The profile template's own `_README` lines that say such a call stalls the run become false, so this task corrects them in the same edit.

**Depends on:** none. This is the first task to edit `cli/templates/claude/settings.autonomous.json`. Task 2 adds the sandbox block and its `_README` lines after this one, and Task 23 adds the credential lines after that. Neither edits a line this task writes.

**Where this task stops.**

- The override clause (*under `PERMISSION_MODE=acceptEdits` such a call prompts, and the run stalls*) is stated in four places only. This task writes two: the watcher's tunable comment and the profile's `_README` mode line. `docs/watcher.md` §4 is **Task 25's** and `docs/cli.md` §6 is **Task 13's**.
- Every other repository sentence saying an unlisted call stalls belongs to the tasks the story's scope register names (rows 49–122).
- The worked example's rendered copy of this template is **Task 26's**.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — the `PERMISSION_MODE` default and its comment (scope register row 138).
- `cli/templates/claude/settings.autonomous.json` — `permissions.defaultMode` (row 143), one new `_README` line, and the rewritten existing lines (scope register rows 39 and 63).
- `cli/templates/claude/settings.autonomous.qa.json` — the `_README` sentence of register row 64.
- `cli/test/watcher-remote-job.test.mjs` — assert the mode the launch line carries.
- `cli/test/profile.test.mjs` — assert the rendered `defaultMode`.

**Work:**

- [ ] `autonomous-watcher.sh`, the tunables block: change `PERMISSION_MODE="${PERMISSION_MODE:-acceptEdits}"` to `dontAsk`. Extend the comment above it, keeping its existing *"Deliberately NOT a permission-bypass mode"* reasoning:
  - under `dontAsk`, a call the profile neither allows nor denies, or that hits an `ask` rule, is refused at once, so a profile gap shows up as a refusal in the run's stream rather than as a session waiting on a prompt;
  - it also refuses a host outside the sandbox's allowed domains, which is what holds if `strictAllowlist` is not honoured from `--settings`;
  - the override: `PERMISSION_MODE=acceptEdits` in `watcher.env` restores prompting, under which those calls stall the run.

  The job mode (`autonomous-watcher.sh job`) uses the same variable, so a remote run launches under `dontAsk` too. Say so in one clause. No other line of the watcher changes; the stall watchdog and its tunables stay as they are.
- [ ] `settings.autonomous.json`: set `"defaultMode": "dontAsk"`. Add one `_README` line, upper-case lead in the file's style, starting `THE PERMISSION MODE IS dontAsk:`. It states:
  - what the mode does to an unlisted or `ask`-matched call;
  - that the watcher passes `--permission-mode` from its `PERMISSION_MODE` tunable, which overrides this key;
  - the override and what it costs.
- [ ] Rewrite these existing `_README` lines to the story's canonical restatement, keeping each line's rule and its upper-case lead (register row 39):
  - `COMPLETENESS IS LOAD-BEARING:` *"in print mode a tool that is neither allowed nor denied stalls rather than prompting … A gap surfaces as a hang, not as an error - add the missing entry here rather than relaxing the permission mode."* → the call is refused at once, so a gap surfaces as a refused step. The remedy stays: add the missing entry here, never relax the mode.
  - `SCRIPT PATHS ARE UNQUOTED LITERALS:` *"falls through to a prompt and stalls an unattended run"* → is refused.
  - `EVERY WRAPPER IN {{scriptsDir}} …`: *"which is the stall this profile exists to prevent"* → the refusal of a needed step. Leave the deploy wrapper's `ask` sentence's rule intact, and state that under `dontAsk` its `ask` entries refuse it outright.
  - the commit-path wrappers' line: *"where an `ask` is evaluated first and parks the run with nothing to answer it"* → is evaluated first and refuses the call.
  - `CREATING A FILE AND CHANGING ONE …`: *"which in print mode is a stall and not a refusal. `defaultMode` does not close that gap: its auto-accept is scoped …"* → it is a refusal of the most common operation in the flow. `dontAsk` auto-accepts nothing, so the `Write` pair is the only grant.

  In `settings.autonomous.qa.json`, rewrite *"Until those lines exist the phase STALLS rather than failing, per the completeness line above"* → the phase's helper calls are refused. Leave that file's un-loaded-tool, `await` and port-probe sentences as they are (register row 64).
- [ ] Tests:
  - `watcher-remote-job.test.mjs`, the *"a stub exiting 0 is completed / stop under the watcher launch line"* case: beside the existing `argv.includes('--permission-mode')` assertion, assert `after('--permission-mode') === 'dontAsk'`.
  - `profile.test.mjs`: on an `init` fixture, assert the rendered `permissions.defaultMode` equals the shipped template's value, read from the template rather than restated.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs` and `npm test --workspace cli -- test/profile.test.mjs` pass. Both are edited by this task. Then run `commands.typecheck` as written.
- Re-run derivation entry G's two commands with `-n` in place of `-l`, pathspec `cli/templates/claude/settings.autonomous.json cli/templates/claude/settings.autonomous.qa.json`. No hit may be a line row 39 or 64 marks for change. The new mode line's override clause is the one permitted new hit.
- `grep -n 'acceptEdits' cli/templates/scripts/autonomous-watcher.sh cli/templates/claude/settings.autonomous.json` hits only the override sentences this task wrote.
- The watcher change is exercised end to end by the remote-job case above, which drives the real launch line through the stub agent.
