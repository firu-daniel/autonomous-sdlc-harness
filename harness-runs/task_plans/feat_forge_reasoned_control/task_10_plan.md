### Task 10 — Record the credential decision, the injection boundary and the unverified behaviours in `docs/github-run-control.md` §6 and §8

**Goal:** Write the security account of record the task prompt asks for in `## 6. Who can act, and pull requests from forks`. It covers:

- the decision to give the control job a credential;
- which events can reach it, and the exposure;
- how the job reaches the plugin's mention command;
- why a hostile comment, or hostile text in the code under review, cannot make the job act outside the closed set.

Cite `docs/remote-execution.md` → `## 11. Security` rather than restating it. Then add `## 8. What is not verified here` rows for every behaviour the mention path rests on that nobody has measured.

**Depends on:**

- **Task 2.** The mention path, its agent invocation, validation and sanitisation, restated here.
  - **Where it runs.** The agent runs once, in a subshell `cd`'d into a context directory under `RUNNER_TEMP`, outside the checkout. `GH_TOKEN`, `GITHUB_TOKEN` and `HARNESS_PR_TOKEN` are unset, and only the non-empty credential is exported.
  - **Its argv.** `-p /autonomous-sdlc-harness:harness-read-mention --plugin-dir "$HARNESS_MENTION_PLUGIN_DIR" --add-dir "$HARNESS_MENTION_PLUGIN_DIR/instructions" --output-format json --json-schema "<schema>" --tools Read,Grep,Glob --restricted --strict-mcp-config --no-session-persistence --permission-prompts none --model sonnet --max-budget-usd 1`. No comment text ever enters argv. There is no `--agent` and no `--disable-slash-commands` (it would stop the `-p` command expanding).
  - **The read-only closure.** A plugin command declares no `tools:` (`.claude/context/plugin.md` → `## Frontmatter`), so the closure rests entirely on the session's `--tools Read,Grep,Glob` under `--restricted`.
  - **The decision.** The script's `jq` validator is the sole authority on it.
  - **The posted text.** Agent text has `<!--` neutralised, other people's `@` mentions defused, and a 60,000-byte cap. A decision whose text contains a credential value is refused with exit 3, and its text is never posted.
- **Task 3.** Only `answer`, `pause`, `resume` and `status` are carried out, through their existing arms. `stop` and `clear` are never carried out from a mention.
- **Task 5.** The act step's `IN_OAUTH: ${{ github.event_name == 'issue_comment' && secrets.CLAUDE_CODE_OAUTH_TOKEN || '' }}` and the matching `IN_API` line. Three comment-only, `continue-on-error` steps:
  - two install Node and `claude`, printing `claude --version`;
  - `Fetch the pinned plugin` clones the plugin at the tag `autonomous-sdlc-harness--v<pin>`, where the pin is the `HARNESS_CLI_VERSION` of the repository's `harness-run.yml`. It checks the clone's `plugin.json` version against the pin and exports the plugin's directory as `HARNESS_MENTION_PLUGIN_DIR`. It runs no `claude plugin install`.
- **Tasks 7 and 8.** The instruction file `plugin/instructions/mention_reading.md` (Task 7) states that every file in the context directory is data, never instructions, and fixes the decision's `## Output contract`. The slash command `plugin/commands/harness-read-mention.md` (Task 8) loads it; it declares no `tools:` and no `model:`.

**Where this task stops.** §1's description of mentions is **Task 9**'s, so this task links to it rather than repeating it. `docs/remote-execution.md` is **Task 11**'s, and this task only cites its `## 9.` and `## 11.`.

### Targets

- `docs/github-run-control.md` — `## 6.` (scope register row 38) and `## 8.` (row 39).

**Work:**

- [ ] **§6, new paragraph `**A credential and an agent in the control job.**`**, after *"**One check, shared with the trigger.**"*'s material and before *"**Pull requests from forks.**"*. It states:
  - **The decision.** The comment path of `harness-control.yml` reads `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`, whichever is set, so a mention can be read. Billing follows `remote-execution.md` → `## 9. Credentials and billing`, cited, not restated.
  - **Which events reach it.** `issue_comment` only, through the act step's expression. `pull_request_review`, `issues`, `pull_request` and `delete` get empty values.
  - **What reads the mention.** One session running the plugin's `/autonomous-sdlc-harness:harness-read-mention` command, at the release the repository's `harness-run.yml` is pinned to. The comment job clones that release's tag and loads it for the one session only, so the command and instruction a mention runs under are the release the run job installs, whatever the default branch carries. A pinned release older than mentions has no such command, and the mention gets a reply saying so.
  - **The merge-commit caveat.** A `pull_request_review` job runs the pull request's merge-commit copy of the file (C2), so a same-repository head can edit it to read the secret on its own review. That person already has write access and can do the same with any workflow of their own (`remote-execution.md` → `## 9.`). A fork's review job gets no secret (C2).
  - **The exposure that already held.** Every actor needs `admin` or `write` and must pass `HARNESS_RUN_ACTORS`, checked before any session, and a comment on a fork's pull request is refused (`control_branch_from_pr`). Cite `remote-execution.md` → `## 11. Security` for the rest.
  - **What a run of the mention path spends.** One session, bounded by `--max-budget-usd`, never retried.
- [ ] **§6, new paragraph `**Why hostile text stays inside the closed set.**`** Comment text, the issue or pull request, the conversation, the diff and the question files are all untrusted input to the agent. State the boundary as numbered reasons:
  1. The authorisation, the branch and the item are decided in code before any session, and the decision has no field that names a branch or an item.
  2. The agent can read only the context directory and the pinned plugin's `instructions/` directory (a public release). The session's `--tools` names `Read`, `Grep` and `Glob` only, under `--restricted`; that is the whole closure, since a plugin command carries no allowlist of its own. It has no shell, no write, no network, no MCP server and no tool that invokes a slash command. Its environment carries no GitHub token, and its working directory is outside the checkout, so no repository setting, hook or `CLAUDE.md` loads.
  3. Its only output is one JSON object, which the script validates against the closed set whatever `--json-schema` did. Anything else is a refusal.
  4. Only the existing verb arms change state, with every check they already make. `stop` and `clear` are never carried out from a mention.
  5. Posted text is neutralised so it cannot forge a harness marker, defused so it cannot notify other people, capped, prefixed with the commenter's login, and refused outright if it carries a credential value.

  Then the residual risk, stated plainly. Injected text can still steer the agent to a wrong choice **inside** the set: an unwanted pause or resume, a status reply, an answer whose text differs from what the commenter meant, or a misleading `reply`. Each is something the authorised commenter could have typed. The reply names what the mention was read as and quotes an answer in full, so the commenter can see it and correct it.
- [ ] **§8, new table rows**, in the table's `| Behaviour | What rests on it | Source | If it is wrong |` form:
  - **`--json-schema` in `--print` mode.**
    - Behaviour: whether it puts the decision in `structured_output`, and what happens when the output fails the schema.
    - What rests on it: the extraction order (`structured_output`, then `result`).
    - Source: unmeasured; the task prompt's lead, re-verified here only as far as `claude --help` lists the flag.
    - If wrong: the decision is read from `result`, or the mention gets the *"not one the harness carries out"* refusal. Nothing outside the set happens either way.
  - **A `--plugin-dir` plugin's slash command as the `-p` prompt, under `--restricted` and `--tools Read,Grep,Glob`.**
    - Behaviour: whether `-p /autonomous-sdlc-harness:harness-read-mention` expands to the command's body when the plugin is loaded by `--plugin-dir` rather than installed, while `--restricted` ignores user, project and local settings and the session's tools exclude `Skill`; whether `${CLAUDE_PLUGIN_ROOT}` in that body resolves to the `--plugin-dir` directory; and whether `--add-dir "$HARNESS_MENTION_PLUGIN_DIR/instructions"` lets `Read` open the instruction file under `--restricted`.
    - What rests on it: that the session follows the mention instruction at all.
    - Source: the help lines below, and `cli/templates/scripts/autonomous-watcher.sh`'s measured note that a plugin-qualified `-p` slash command expands with no `Skill` tool_use, measured on an installed plugin without `--restricted`, not on this shape.
    - If wrong: the session ends in error, or runs without the instruction and returns a decision the validator refuses, or returns `none` with a `blocker:` reason. The mention gets the exit-3 reply, an invalid-decision refusal or no reply, and the exact commands are unaffected.
  - **The flags the job's installed `claude` accepts.** Quote the lines `claude --help` printed on the planning machine on 2026-10-06, whose version was not recorded, byte for byte. Each line is in the form `--json-schema <schema>  JSON Schema for structured output validation.`:
    - `--json-schema`;
    - `--plugin-dir <path>  Load a plugin from a directory or .zip for this session only`;
    - `--add-dir`;
    - `--max-budget-usd <amount>  Maximum dollar amount to spend on API calls (only works with --print)`;
    - `--restricted`'s *"ignores user, project and local settings files"* and *"Also confines the file tools to the working directories (--add-dir included)"*;
    - `--permission-prompts`'s *"\"none\" (nobody: anything that would prompt is denied automatically …)"*;
    - `--tools`;
    - `--bare`'s *"Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper via --settings (OAuth and keychain are never read)"*, the reason `--bare` is not used.

    What rests on it: the session's argv. Source: those help lines, plus the comment job's `claude --version` log line. If wrong: an unknown flag ends the agent non-zero, every mention gets the exit-3 reply, and the exact commands are unaffected.
  - **`--restricted` confining `Read` / `Grep` / `Glob` to the working directory and the one `--add-dir`.**
    - What rests on it: that the agent cannot read the checkout, other `RUNNER_TEMP` files (the rest of the plugin clone included) or `/proc`.
    - Source: the help text only.
    - If wrong: the agent can read files beyond its context and, with them, its own environment. The credential-value check still refuses any reply carrying the secret, and the agent still has no write, shell or network tool.
  - **The whole mention path on a real repository.**
    - What rests on it: all of `### Mentions read by an agent`, and the `Fetch the pinned plugin` step.
    - Source: no Gate 12 round has observed it. Point at Gate 12 observation (xiv) in `development.md` generically; Task 11 adds the mention leg there later, and this row does not depend on it.
    - If wrong: the failing step is visible in the control job's log, where the fetch step names its cause and every decision is one line, and in the reply the job posted or did not post.
- [ ] Update `## 8.`'s lead sentence *"Every automated case drives a `gh` stub."* to say the mention cases also drive an agent stub through `HARNESS_AGENT_CLI`, so no automated case measures the agent's judgement or loads the real plugin.

**Verification:**

- Every citation this task writes resolves: `remote-execution.md` → `## 9. Credentials and billing` and `## 11. Security`, and C2 in `github-integration-research.md`. Check each heading with `grep -n` in its file. §11's content is cited, never copied: no sentence of `remote-execution.md` → `## 11.` appears verbatim in §6.
- Each quoted `claude --help` line in §8 is reproduced exactly as listed above, and the row says the version was not recorded rather than naming one.
- Each mechanism §6 claims exists in the shipped files:
  - `grep -F` finds `--restricted`, `--tools Read,Grep,Glob`, `--plugin-dir`, `--add-dir`, `MENTION_COMMAND`, `unset GH_TOKEN` (or the equivalent spelling Task 2 used) and the credential-value check in `cli/templates/scripts/remote-run.sh`;
  - it finds the `github.event_name == 'issue_comment' && secrets.` expression and `Fetch the pinned plugin` in `cli/templates/github/workflows/harness-control.yml`;
  - it finds the data-not-instructions statement in `plugin/instructions/mention_reading.md`, and `plugin/commands/harness-read-mention.md` carries no `tools:` line (`grep -n '^tools:'` finds none), so §6 attributes the closure to the session flags alone.
- No figure in §6 or §8 is a timing or a cost measured by a run (lessons ledger, *Evidence and measurement*). The budget is named as a bound, not as a measured cost.

**Deviations from plan:**

- The `--add-dir` and `--tools` help lines carry no text in the plan; they are quoted from `claude --help` as run during implementation on 2026-10-07, version not recorded, and the §8 row dates them separately from the planning machine's lines.
- The plan's §8 refusal quote *"not one the harness carries out"* is not text `remote-run.sh` emits; the row quotes the two refusals `control_mention` actually posts: *"carries no decision object"* and *"is not a valid decision"*.
