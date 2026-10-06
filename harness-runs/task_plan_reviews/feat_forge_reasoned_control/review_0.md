# Task plan review — iteration 0

## Must Fix

1. **Scope register: D1 and D2 are under-inclusive** — file: the story index (`feat_forge_reasoned_control_story_plan.md`), `## Scope register`.
   I re-ran D1–D3 verbatim and re-walked D4. Every site those entries reach already has a row, so the closure invariant holds for the entries as written. But two durable corpus sites inside the scope predicate are reached by no entry:
   - `llms.txt` → the `docs/github-run-control.md` entry (*"working a run from GitHub: comment commands, review rounds, the draft pull request, …"*). It is the same topic list as row 4 (`README.md`). D1 never reaches it because it greps `'*.md'` only, while D3 already greps `'*.txt'`.
   - `docs/team-accounts-research.md` → `**What would change.**`, the bullet *"`harness-trigger.yml`, `harness-control.yml`, `harness-resume.yml` and `authorise_actor`: no change, since none holds a credential."* After Task 5, `harness-control.yml`'s act step does hold a credential, so this sentence becomes false. It is also a sibling of row 30 in the same document. None of D2's alternatives matches *"none holds a credential"*.

   **Fix:** In the story index, widen both command entries and add one row per newly reached site, each with its disposition and reason. A likely shape is `no-change` for `llms.txt`, for row 4's reason, and for the research bullet either a Task 10 dated pointer, as row 30 gets, or `no-change` with a stated reason. The corrected entries are strictly wider than the current ones:
   - D1: the same regex over `-- '*.md' '*.txt' ':!harness-runs/**' ':!examples/**' ':!.claude/**'`.
   - D2: `git grep -nE "Only the run job holds|reads no (repository )?secret|references no secret|credential secrets never reach|holds? (a|no) (Claude )?credential|none holds a credential|\| \`(CLAUDE_CODE_OAUTH_TOKEN|ANTHROPIC_API_KEY)\` \| secret \|" -- '*.md' ':!harness-runs/**' ':!examples/**' ':!.claude/**'`.

   Re-run against this tree, the widened D2 also reaches `docs/remote-execution.md` → `## 9.`'s *"The harness is never in the money path."* paragraph (*"it never holds a credential outside the adopter's own repository secrets"*). That sentence stays true, but it needs its own `no-change` row. If Task 10 changes `docs/team-accounts-research.md`, update its `### Targets` and `**Work:**` to match.

2. **The credential reaches every child of the control job, not only the agent** — file: `task_2_plan.md`, Work bullet 2 (`control_mention` step (b)).
   Task 2 reads `IN_OAUTH` / `IN_API` into non-exported locals and `unset`s them only inside `control_mention`, after step (a) has already read the run's state. Task 5 puts both names in the act step's `env:` on every `issue_comment` job. So the exported credential stays in the environment of everything the script spawns before that point, and on any path that never reaches it:
   - every `gh_call` made by the gates (`authorise_actor`, `forge_repo_var`, `control_branch_from_pr` / `control_branch_from_issue`, `control_state_var`);
   - `git`;
   - and, on the exact-form path, every `control_child` re-entry of `remote-run.sh` (`dispatch`, `stop`, …) and the `gh` processes those spawn.

   This contradicts the story index's Context (*"The script hands them only to the agent child."*), Task 5's restated interface (*"hands them to the agent child alone"*), and the security account Task 9 writes into `docs/github-run-control.md` → `## 6.`. The prompt's Constraints make this the account of record for which events and code paths the secret reaches.

   **Fix:** In `task_2_plan.md`, move the copy-into-non-exported-globals-and-`unset IN_OAUTH IN_API` to the very top of `verb_control`, before intake and before any child process, for every event. `control_mention` then reads the saved values. Add a case to `remote-control-mention.test.mjs`: the `gh` stub records whether `IN_OAUTH`, `IN_API`, `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` is set, and for both an exact-form `@sdlc-harness pause` and a mention, no `gh` call sees any of them. Update the header's `MENTION` paragraph to match. Task 5's and Task 9's restatements then hold as written.

## Should Fix

1. **`task_5_plan.md`: the exact form pays for the agent's setup on every comment job.** The two install steps and `Fetch the pinned plugin` are gated only on `github.event_name == 'issue_comment'`. The job's `if:` prefilter admits every comment containing `@sdlc-harness`, so an exact-form `@sdlc-harness pause` and a comment on a non-harness item both run `setup-node`, `npm install -g @anthropic-ai/claude-code` and a marketplace clone before the script answers in code. Goal 5 (*"The exact form stays a cheap path"*) and goal 3 (*"must end quickly"*) argue against that. Either:
   - put a cheap classification step first (for example, a `remote-run.sh control` intake-only mode that exports whether the comment is a mention) and gate the three steps on it; or
   - state the cost and the reason for accepting it in the header's `THE PLUGIN` paragraph and in Task 9's §6 text.

2. **`task_8_plan.md`: say plainly that a quote reply to a park comment is now a mention.** A park comment ends with a ready-to-copy `@sdlc-harness answer <n>` block. GitHub's quote reply copies the rendered text and drops the hidden `<!-- sdlc-harness` line, so quoting a park comment now starts an agent session. The planned §3 sentence (*"A quote or a remark that does not mention the handle is still never read"*) is true, but it hides the common case. In the §3 amendment and in the moved *"Never a command"* sentence, state:
   - that such a quote is read as a mention;
   - that what keeps it from becoming an answer is the agent's rule that quoted lines are someone else's words (Task 7), with the exact-form command as the only channel that bypasses the agent.

3. **`task_9_plan.md`: the residual-risk paragraph omits where an injected `answer` lands.** An `answer` decision is delivered by the `resume=answer` dispatch into a run session that holds write tools and the credential. So injected text in the diff, the conversation or a question file that steers the agent's `answer` text reaches a privileged session, and the read-as note arrives only after the dispatch. The residual-risk paragraph should name that consumer. Also consider tightening Task 7's decision rule 3: `answer` text is taken only from the commenter's own unquoted lines in `comment.md`, or from an option the open question words. Otherwise choose `clarify`.

4. **`task_2_plan.md`: fix the argv order.** `claude --help` lists `--tools <tools...>` as variadic. The prompt is a positional argument (`-p` is the boolean `--print`), so if the prompt is placed after `--tools Read,Grep,Glob`, the tool list swallows it. State that the positional prompt goes right after `-p` and before every variadic flag. Add a test case asserting the stub's argv places it there.

## Nice to Have

1. **`task_2_plan.md`: the gate order names a function the code does not have.** The listed gate order names `forge_on`. `verb_control` actually tests `hr_forge` / `hr_execution_target` inline, so name it as the code does.
2. **`task_2_plan.md`: an unlabelled refusal on the mention path.** `verb_control`'s `forge_repo_var || control_reply … "\`$CONTROL_VERB\` was not run"` prints an empty verb for a mention. Use `${CONTROL_VERB:-$COMMAND_HANDLE}`, as `control_refuse` does.
