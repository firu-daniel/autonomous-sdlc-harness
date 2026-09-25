### Task 1 — Quote the plugin-root path in all six `hooks.json` guard commands and record the chosen form in the hooks README

**Goal:** Make each of the six `PreToolUse` commands in `plugin/hooks/hooks.json` pass `claude plugin validate --strict plugin` with no warning, and have every guard still run from a plugin path that contains a space, by double-quoting the whole script path. Record in `plugin/hooks/README.md` which form was chosen, with the short rule-level reason, pointing to `docs/development.md` §3 for the measured facts.

**Where this task stops.** This task owns the manifest and the plugin's own README copy of the manifest facts. It does **not** edit `docs/development.md`. That file's §3 copy of the same fact, its §5 Gate 1 paragraph, the measured validator output and the in-session spaced-path check are **Task 2's** (catch-all layer, ships after this one). This task still runs the validator and a shell-level reproduction as its own verification, and reports their output in its return. That return goes to the orchestrator and is not an input to Task 2, which measures the validator before and after this change on its own. What Task 2 does take from this task is the quoted form itself, as written into `hooks.json`. The exec-form findings and the decision of record are Task 2's to establish and record in `docs/development.md` §3; this task's README bullet carries only the short rule-level reason and points there. It does not change any guard script: the task prompt puts their logic out of scope.

### Targets

- `plugin/hooks/hooks.json`: the six `hooks.PreToolUse[0].hooks[].command` strings.
- `plugin/hooks/README.md` → `## Registration, and why it lives here rather than in generated settings`: the bullet opening "`${CLAUDE_PLUGIN_ROOT}` expands inside a hook's `command` string declared here", and the paragraph opening "Keep the JSON strictly valid".

**The exact form, which Task 2 restates.** Each `command` value becomes this JSON string, with only the guard basename varying:

```
"bash \"${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh\""
```

That is, as the shell sees it after the runtime substitutes the token: `bash "<plugin root>/hooks/<guard>.sh"`. The whole path is quoted, not just the token, so a space anywhere in the resolved root stays inside one word. Keep the six basenames byte-identical: `autonomous-protected-branch-guard.sh`, `git-commit-branch-guard.sh`, `git-rewrite-branch-guard.sh`, `autonomous-script-allowlist-guard.sh`, `allow-safe-compounds.sh`, `allow-qa-credentials-read.sh`. Keep the entry order too, which the README's severity-order paragraph describes, along with the `matcher` value, each entry's `"type": "command"` and the `{"hooks": { … }}` wrapper.

**Work:**

- [ ] `hooks.json`: rewrite each of the six `command` values to the form above. Add no field and remove none: the README permits only `matcher`, `type` and `command`, and `--strict` promotes an unknown field to an error.
- [ ] `README.md`, the "`${CLAUDE_PLUGIN_ROOT}` expands inside a hook's `command` string" bullet: **extend this bullet, do not add a new one.** The section opens "Two facts about this manifest", and a third bullet would make that count wrong. Add, in this layer's register:
  - that every occurrence of the token in a `command` string sits inside double quotes with the path it prefixes (`bash "${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh"`, backtick-quoted as prose, not JSON-escaped);
  - the two reasons: `claude plugin validate --strict` warns on an unquoted token and so fails gate `1a`, and a path containing a space otherwise splits the command, so the guard errors instead of judging;
  - the short, rule-level reason shell form was kept over exec form, and only that: quoting changes nothing but word boundaries, it is correct whether the runtime substitutes the token or the shell expands it, and it needs no manifest field beyond `matcher` / `type` / `command`. **Do not establish or record any exec-form finding here** (stdin under exec form, the exit and output contract, which Claude Code versions accept it). That is a measured fact and a decision of record, which `.claude/context/conventions.md` → `### Where a new responsibility goes` homes in `docs/` and nowhere else; Task 2 establishes and records it in `docs/development.md` §3.

  Point to `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover` for the exec-form findings and the measured validator message rather than repeating them, as the section's opening sentence already does.
- [ ] `README.md`, the "Keep the JSON strictly valid" paragraph: add one clause so a future guard entry is written correctly. Every `${CLAUDE_PLUGIN_ROOT}` in a `command` is double-quoted together with its path, because `--strict` rejects the bare form.
- [ ] Verification probe: write `harness-runs/scratch/hooks_quote_probe.mjs`, which is gitignored and never committed, and run it with `bash scripts/scratch-run.sh harness-runs/scratch/hooks_quote_probe.mjs`. The probe uses `child_process.execFileSync` / `spawnSync` with fixed argument vectors, and `fs.mkdtempSync` / `fs.cpSync` / `fs.rmSync` for its temp tree, never a shelled-out `rm -rf`. It does what the Verification bullets below need.

**Verification:**

- `jq . plugin/hooks/hooks.json` exits 0, so the file is still valid JSON.
- `git grep -nF 'bash ${CLAUDE_PLUGIN_ROOT}' -- plugin` prints nothing: no unquoted form is left. `git grep -nF 'CLAUDE_PLUGIN_ROOT}/hooks' -- plugin/hooks/hooks.json` still prints one line per registered guard, so no entry was dropped.
- Through the probe, `claude plugin validate --strict plugin` exits 0, and its combined stdout and stderr contain no line mentioning a warning or quotes. Put the verbatim output and `claude --version` in your return, as this task's own verification record. Task 2 measures its own values.
- **Shell-level reproduction from a spaced path**, inside the probe. First, copy `plugin/` to `<tmp>/harness plugin copy/plugin`. Then build a throwaway fixture repository under a second temp directory: `git init -b main`, one commit, and a `harness.config.json` carrying at least `version: 1`, `defaultBranch: "main"`, `stateDir`, `layers` with a `.` entry, and `commands`, so it is inside the guards' jurisdiction. Leave it on branch `main`. For each of the six entries, read its `command` from the **copy's** `hooks.json` with `jq -r`, replace `${CLAUDE_PLUGIN_ROOT}` textually with the copy's plugin root the way the runtime does, and run the result with `bash -c <that string>`. Pipe in the payload `{"tool_input":{"command":"git merge feat_x"},"cwd":"<fixture>"}` on stdin.
  - Expected: no run prints `No such file or directory` or otherwise fails to start the script.
  - Expected: `autonomous-protected-branch-guard.sh` prints one JSON object whose `hookSpecificOutput.permissionDecision` is `deny`, because HEAD is on a protected branch. The README outcome table: it refuses a merge "issued while HEAD is on one".
  - Run the pre-change string (`bash <root>/hooks/autonomous-protected-branch-guard.sh`, unquoted, substituted the same way) through the same harness and show that it fails to reach the script, so the reproduction is shown to detect the defect.
  - Remove both temp trees in-process at the end, and say in your return that they were removed.
- This emulation is supporting evidence only. The in-session check with the plugin actually loaded from a spaced path is Task 2's, and it is the evidence the recorded fact rests on (`harness-runs/lessons.md` → `## Evidence and measurement`).
- Re-read the edited README bullet against the manifest: the form it quotes is byte-identical to the form in `hooks.json`, less the JSON escaping.

**Deviations from plan:** The Verification bullet expecting `git grep -nF 'bash ${CLAUDE_PLUGIN_ROOT}' -- plugin` to print nothing is not met. After the change, it prints two lines in `plugin/agents/qa-tester.md`, the `reserve-qa-user.sh` / `release-qa-user.sh` invocations under "Park the account you drive". These are instructions in an agent body, not hook `command` strings. `claude plugin validate --strict plugin` does not warn on them (it exits 0 with `✔ Validation passed`), they are outside this task's Targets, and the story index's site table has no row for them. They were left unchanged. Whether the agent-body invocations should also be quoted against a spaced plugin root is surfaced to the orchestrator rather than fixed here. The `hooks.json`-scoped check (`git grep -nF 'CLAUDE_PLUGIN_ROOT}/hooks' -- plugin/hooks/hooks.json`) prints six lines, all quoted.
