### 3. `ARCHITECTURE.md`'s engine-launch inventory omits the mention session `remote-run.sh` now launches

**Severity:** Should Fix (non-blocking). **Layer:** general.

**Sites in `ARCHITECTURE.md`:**
- `## 4. Two axes: which runtime, and which model`: the sentence *"one environment variable, `${HARNESS_AGENT_CLI:-claude}`, resolved once per script and read in two shipped scripts"*.
- `## 5. Where the engine is reached — the launch path`:
  - its covering grep, `grep -rnE 'HARNESS_AGENT_CLI|AGENT_CLI|ENGINE_COMMAND_|--output-format|--permission-mode|--settings|--add-dir|rate_limit_event|PIPESTATUS' cli/templates/scripts/ cli/src/`;
  - the paragraph that disposes of files the grep reaches, ending *"Remote execution added no launch site"*;
  - the launch-path table under it.
- `## 8. Declaring a seam before building it`: *"one environment variable in the generated watcher, `${HARNESS_AGENT_CLI:-claude}`, read by two scripts and written by nothing"*.

**Problem.** `cli/templates/scripts/remote-run.sh` → `control_mention_session` adds a new engine launch site in a third shipped script. It resolves `AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"` and runs `"$AGENT_CLI" -p "$MENTION_COMMAND" … --add-dir … --output-format json …`. On `dev`, `remote-run.sh` contained no `HARNESS_AGENT_CLI`.

`## 5` states its own covering invariant: *"every site it reaches is a row below, or is named here as owned by another section. If it reaches a site no row covers, the table is wrong and takes a new row."* The covering grep now reaches `remote-run.sh`'s `AGENT_CLI`, `--output-format` and `--add-dir`, and no row covers them. The *"two shipped scripts"* / *"two scripts"* counts and *"Remote execution added no launch site"* are now false.

This is the root architecture document's map of where the harness reaches its engine. `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"a measured fact or a decision of record"*) and `## Documents of record` place such facts in the documents of record. The finding is graded Should Fix because the stale statement sits in a document of record rather than in a layer's placement or dependency direction.

**Fix.** In `ARCHITECTURE.md`:
1. In `## 4`, change *"read in two shipped scripts"* to three. Name `cli/templates/scripts/remote-run.sh` → `control_mention_session` beside the watcher's `AGENT_CLI` and the restart wrapper's `agent_probe`. Make the matching change to *"read by two scripts"* in `## 8`.
2. In `## 5`, replace *"Remote execution added no launch site"* with a sentence stating that `remote-run.sh control` launches one read-only, one-shot mention session.
3. Add a row to `## 5`'s launch-path table for that site. Its first message is `MENTION_COMMAND`, the plugin-qualified slash command. Its flags are `--plugin-dir`, `--add-dir`, `--output-format json --json-schema`, `--tools Read,Grep,Glob --restricted`, `--strict-mcp-config`, `--no-session-persistence`, `--permission-prompts none`, `--model` and `--max-budget-usd`. Its output is structured JSON, read by `jq` and validated by the script. Fill the row's remaining cells in the table's existing form.
4. Re-run `## 5`'s covering grep and confirm that every `remote-run.sh` hit is a row or is dispositioned in the paragraph above the table.
