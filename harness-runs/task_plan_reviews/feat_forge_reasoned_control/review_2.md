# Task plan review — iteration 2

Iteration 1's Must Fix is resolved:
- D3 is now the wider command.
- Rows 68–73 are added.
- `plugin/README.md` is in Task 8's targets and work.
- `README.md` and `llms.txt` are in Task 11's targets and work.

Other checks:
- **Index structure:** good. It has 11 readiness entries and 11 per-task files, in 1:1 correspondence.
- **Tags:** every task has a single-layer tag and a points value of 20 or less.
- **Work bullets:** no task has more than 5.
- **Order:** bottom-up, `cli` → `plugin` → `general`.
- **Conventions documents:** no task targets one.
- **Test runs:** no forbidden test run.

I re-ran D1, D2 and D3 verbatim and walked D4. Every site any of them reaches is a row, so the closure invariant holds. I also checked the plan's identifier claims against `cli/templates/scripts/remote-run.sh`, and they hold: `verb_control`'s gate order, `control_refuse`'s `${CONTROL_VERB:-$COMMAND_HANDLE}`, `control_answer`'s *"is in progress"* arm, `forge_dispatch_engine_var`'s `--jq` projection, and `round_collect`'s fence expression. I checked the cited `claude --help` lines against `claude --help` on this machine, and they match.

## Must Fix

1. **The credential-value check does not cover an agent-written `answer`. Task 3 posts that answer publicly and dispatches it** — file: `task_3_plan.md`, the `**The command branch.**` Work bullet. Related wording is in `task_2_plan.md`, the `**Extract, validate, answer.**` bullet.
   Task 2 rejects a decision with exit 3 when *"the text"* carries a credential value, *"before posting any agent-written text"*. Its only test is *"a credential value in `text` posts no text and exits 3"*. In Task 2 that is complete, because `answer` is never posted there.
   Task 3 then makes `answer` reach two public surfaces, and no task applies the check to it:
   - **The read-as note.** It quotes the decision's `answer` in full in a comment posted on the item, through `control_post`. Only the `<!--` neutralisation is applied, not the credential check and not the `@`-mention defusing.
   - **The dispatch.** `control_answer` writes the text to `answers/answer_<n>.md` and sends it through `control_child … dispatch … --resume answer --answers-from`. That is a `workflow_dispatch` input, readable by anyone who can read the repository's Actions runs.
   This contradicts Task 10's account of record:
   - `## 6.` reason 5: *"refused outright if it carries a credential value"*;
   - the `## 8.` `--restricted` row's mitigation: *"The credential-value check still refuses any reply carrying the secret"*.
   The `--restricted` confinement that would keep the agent from reading its own environment is itself recorded as unverified. So this check is the layer the plan says holds when that confinement fails, and the `answer` path skips it.
   **Fix:**
   - In `task_3_plan.md`, before `CONTROL_BODY` is built, refuse with the same `::error::` line (value never printed) and exit 3 when the decision's `answer` contains either non-empty saved credential (`MENTION_OAUTH` / `MENTION_API`). It must never reach the answer file, the dispatch or the note.
   - Apply Task 2's `@`-mention defusing to the quoted copy in the note, alongside the `<!--` neutralisation. The answer file keeps its bytes.
   - Add a case to `remote-control-mention.test.mjs`: a `command` / `answer` decision whose `answer` carries the `IN_OAUTH` value gets no `workflow run`, no answer posted, and exit 3.
   - In `task_2_plan.md`, reword the check to cover every agent-written string field that leaves the job (`text` and `answer`). Alternatively, state there that Task 3 extends it to `answer`.

## Should Fix

Items 1–6 below were all raised in iteration 1. None is resolved in the artifact or recorded under `## Rejected findings`; the index has no such section.

1. **`task_5_plan.md`: the restated Task 2 interface is still out of date.** The `**Depends on:**` bullet still says the script reads `IN_OAUTH` / `IN_API` *"on the mention path only"*, *"copies each into a non-exported local"* and *"`unset`s both at once"*. Task 2 now does something different:
   - it copies them into the non-exported **globals** `MENTION_OAUTH` / `MENTION_API`;
   - it does so as `verb_control`'s first statements, for **every** event;
   - it also unsets `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY`.

   Restate the interface as Task 2 defines it.
2. **`task_5_plan.md`: every admitted comment pays for the agent's setup.** This is the third time it has been raised. `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin` are gated only on `issue_comment`. So an exact-form `@sdlc-harness pause`, and a comment on a non-harness item, install the CLI and clone the marketplace before the script answers in code. That works against goal 5 (*"The exact form stays a cheap path"*). Fix it in one of two ways:
   - gate the three steps on a cheap classification step;
   - or state the cost and why it is accepted, in the header's `THE PLUGIN` paragraph and in Task 9's or Task 10's text.
3. **`task_10_plan.md`: the residual-risk paragraph does not name where an injected `answer` lands.** It still says each wrong choice *"is something the authorised commenter could have typed"*. Two facts are missing:
   - An `answer` decision is dispatched with `resume=answer` into a run session that holds write tools and the credential.
   - `conversation.md`, the diff and the question files may carry text from people other than the authorised commenter.

   Name that consumer, and state that the read-as note arrives only after the dispatch. Also consider tightening `task_7_plan.md` → `## Deciding` rule 2: take `answer` text only from the commenter's own unquoted lines, or from an option the open question words; otherwise choose `clarify`.
4. **`task_2_plan.md`: state the argv order as a requirement.** `--add-dir <directories...>` and `--tools <tools...>` are variadic, and the prompt is the positional `[prompt]`, since `-p` is the boolean `--print`. Say that the prompt goes immediately after `-p` and before every variadic flag. Make the argv test assert its position, not just its presence.
5. **`task_9_plan.md`, Verification: the inlined D1 copy is stale.** It greps `'*.md'` only, while the register's D1 also covers `'*.txt'`. Cite D1 by name ("re-run D1 verbatim from the story index") instead of carrying a copy.
6. **`task_10_plan.md`, §8 flags row:** *"whose version was not recorded"* falls short of `.claude/context/conventions.md` → `## Documents of record` (*"A measured fact states what was measured, the command and the exact message"*). Have the implementer run `claude --version` beside `claude --help`, and record that version with the quoted lines. Align the matching Verification bullet.

## Nice to Have

1. **`task_2_plan.md`: two strings print no verb on the mention path.** `verb_control`'s `forge_repo_var || control_reply … "\`$CONTROL_VERB\` was not run"` and the log line `control: $CONTROL_VERB on $CONTROL_BRANCH …` both print an empty verb for a mention. Use `${CONTROL_VERB:-$COMMAND_HANDLE}`. Separately, the gate list still names `forge_on`, where `verb_control` actually tests `hr_forge` / `hr_execution_target` inline.
2. **`task_8_plan.md`, Verification:** `sed -n '1,/^---$/p'` stops at line 1, because the frontmatter opens with `---`. Use `sed -n '2,/^---$/p'` instead.
