# Task plan review — iteration 1

Iteration 0's two Must Fix items are resolved:
- D1 and D2 were widened, and rows 50–52 were added, with Task 11 targeting row 51.
- The credential capture moved to the top of `verb_control` for every event, and a test now checks that no `gh` call sees a credential.

Other checks:
- **Index structure:** good. The index has 11 readiness entries and 11 per-task files, in strict 1:1 correspondence.
- **Tags:** every task carries a single-layer tag and a points value of 20 or less.
- **Work bullets:** no task has more than 5.
- **Order:** tasks run bottom-up, `cli` then `plugin` then `general`.
- **Conventions documents:** no task targets one.
- **Test runs:** no test run breaks the test-run rule.

I re-ran D1, D2 and D3 verbatim and walked D4. Every site those entries reach is already a row, so the closure invariant holds for the entries as written. One derivation is under-inclusive.

## Must Fix

1. **Scope register: D3 misses some of the slash-command enumerations it exists to cover** — the story index (`feat_forge_reasoned_control_story_plan.md`), `## Scope register`.
   The register says it covers *"the corpus sites that enumerate the plugin's slash commands and instruction files, to which this branch adds one each (Tasks 7 and 8)"*. D3 finds such sites only through the words `nineteen`, `twenty-seven`, `Not every command`, `plugin/commands/*` and `slash-command definitions`. Several durable sites describe the plugin's commands as "the `branch-*` commands plus `harness-analyze`", and no entry reaches them:
   - `plugin/README.md`, the *"Roadmap items 3–5 filled the asset directories"* paragraph: *"Item 15 added `/autonomous-sdlc-harness:harness-analyze` to `commands/`, the one command there that is not a `branch-*` entry point"*. Once Task 8 lands `harness-read-mention.md`, this sentence is **false**.
   - `plugin/README.md`, opening paragraph: *"the agent definitions, the `branch-*` slash commands and the `/autonomous-sdlc-harness:harness-analyze` setup command, the tool-guard hooks …"*. This is an exhaustive list of what the plugin carries, and it will be missing the new command.
   - `README.md`, *"**The plugin carries the process assets a run executes.**"*: *"the `branch-*` slash commands, the `/autonomous-sdlc-harness:harness-analyze` setup command, …"*. Same shape.
   - `README.md`, the Mermaid diagram's `plugin/` node: *"agents · branch-* commands · /autonomous-sdlc-harness:harness-analyze"*.
   - `llms.txt`, the `plugin/` entry: *"namely agents, `branch-*` commands, `/autonomous-sdlc-harness:harness-analyze`, guard hooks, instructions and samples"*.
   - `plugin/docs/README.md`, the *"Both are **process assets**"* paragraph: *"the `branch-*` commands cite `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md` by path"*. This one probably stays true, but it needs a row.

   **Fix:** In the story index, replace D3 with this strictly wider command. It adds two alternatives and keeps every existing one:
   ```
   git grep -nE "nineteen|twenty-seven|Not every command|plugin/commands/\*|slash-command definitions|\`?branch-\*\`? (slash )?commands|not a \`branch-\*\`" -- '*.md' '*.txt' ':!harness-runs/**' ':!examples/**' ':!.claude/**'
   ```
   Against this tree it reaches every existing D3 row plus the six sites above. Add one row per site with its disposition:
   - `plugin/README.md`'s *"the one command there that is not a `branch-*` entry point"* must be `change`. It sits under `plugin/`, so the natural owner is Task 8: add `plugin/README.md` to `task_8_plan.md`'s `### Targets` and a matching `**Work:**` item. Task 8 already has 5 Work bullets, so fold the item into the existing `plugin/commands/README.txt` bullet rather than adding a sixth.
   - The other five each get either `change`, with an owning task (`README.md` and `llms.txt` belong to a `general` task such as Task 11, and its `### Targets` and `**Work:**` must then name them), or `no-change` with a stated reason. Row 4 and row 50 are the precedent for an enumeration that "lists topics".

## Should Fix

1. **`task_5_plan.md`: the restated Task 2 interface is out of date.** The `**Depends on:**` bullet says `remote-run.sh control` reads `IN_OAUTH` / `IN_API` *"on the mention path only"*, *"copies each into a non-exported local"* and *"`unset`s both at once"*. `task_2_plan.md` now copies them into the non-exported **globals** `MENTION_OAUTH` / `MENTION_API` as the first statements of `verb_control`, for **every** event. It also unsets `CLAUDE_CODE_OAUTH_TOKEN` and `ANTHROPIC_API_KEY`. Restate it as Task 2 now defines it, so that Task 5's header text (`THE PERMISSIONS`) says the same thing.

2. **`task_5_plan.md`: an exact-form command and a `thanks @sdlc-harness` still pay for the agent's setup.** This was iteration 0's Should Fix 1, and it was neither addressed nor recorded as rejected. `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin` are gated only on `github.event_name == 'issue_comment'`. So every comment the prefilter admits installs the CLI and clones the marketplace before the script answers in code. That pulls against goal 5 (*"The exact form stays a cheap path"*) and goal 3 (*"must end quickly"*). Either gate the three steps on a cheap classification (for example, an intake-only step that exports whether the comment is a mention), or state the cost and why it is accepted, both in the header's `THE PLUGIN` paragraph and in Task 9's or Task 10's text.

3. **`task_10_plan.md`: the residual-risk paragraph does not name where an injected `answer` lands.** This was iteration 0's Should Fix 3, and it is still open. `conversation.md` carries comments from anyone who can comment on the item, including non-collaborators on a public repository. The diff and the question files are untrusted too. If injected text steers the agent's `answer` text, that text is dispatched via `resume=answer` into a run session that holds write tools and the credential. The read-as note quoting it arrives only after that dispatch. Saying it is *"something the authorised commenter could have typed"* understates this. Name the privileged consumer and the ordering in the paragraph. Also consider tightening `task_7_plan.md` → `## Deciding` rule 2: take `answer` text only from the commenter's own unquoted lines in `comment.md`, or from an option the open question words; otherwise choose `clarify`.

4. **`task_2_plan.md`: state the argv order as a requirement.** `claude --help` declares both `--add-dir <directories...>` and `--tools <tools...>` as variadic, and the prompt is the positional `[prompt]` (`-p` is the boolean `--print`). The list happens to put `-p "$MENTION_COMMAND"` first, but nothing says the order matters. An implementer who reorders the list would have the prompt swallowed. Say that the positional prompt goes immediately after `-p` and before every variadic flag, and make the argv test assert the prompt's position, not just that it is present. This was iteration 0's Should Fix 4.

5. **`task_9_plan.md`, Verification: the inlined D1 command is iteration 0's version.** It greps `'*.md'` only, while the register's D1 now also covers `'*.txt'`. Cite D1 by name ("re-run D1 verbatim from the story index") rather than inlining a copy that can drift.

6. **`task_10_plan.md`, §8 row on the CLI's flags:** *"whose version was not recorded"* falls short of `.claude/context/conventions.md` → `## Documents of record` (*"A measured fact states what was measured, the command and the exact message"*). Have the implementer run `claude --version` alongside `claude --help` when writing the row, and record that version together with the quoted lines.

## Nice to Have

1. **`task_2_plan.md`:** on the mention path, `CONTROL_VERB` is empty, so two strings come out without a verb:
   - `verb_control`'s `forge_repo_var || control_reply … "\`$CONTROL_VERB\` was not run"`;
   - the log line `control: $CONTROL_VERB on $CONTROL_BRANCH …`.

   Use `${CONTROL_VERB:-$COMMAND_HANDLE}`, or a `mention` word, as `control_refuse` does (iteration 0's Nice to Have 2). The gate order still names `forge_on` where the code tests `hr_forge` / `hr_execution_target` inline.
2. **`task_8_plan.md`, Verification:** `sed -n '1,/^---$/p'` stops at line 1, because the frontmatter opens with `---`. Use `sed -n '2,/^---$/p'` or an `awk` range so that the check actually reads the frontmatter keys.
