### Task 2 — Read a mention through a read-only agent and validate its decision against the closed set

**Goal:** Make `remote-run.sh control` read a mention of `@sdlc-harness` anywhere in a created `issue_comment`. Its author passes today's gates and the branch resolves in code first. The script then runs one headless, read-only session whose first message is the plugin's mention-reading slash command, over a context directory, extracts the session's one JSON decision, validates it against the closed set, and answers it. The exact form stays parsed in code with no session, as today.

**Depends on:**

- **Task 1.** It puts these lines beside `COMMAND_VERBS` in `remote-run.sh`:
  - `MENTION_ACTIONS='command reply clarify fixes none'`;
  - `MENTION_ACT_VERBS` / `MENTION_CONFIRM_VERBS`, which this task does not use;
  - `MENTION_COMMAND='/autonomous-sdlc-harness:harness-read-mention'`.

**Where this task stops.** This task answers **every** valid `command` decision with a confirmation request: a reply naming the exact form the mention was read as, and asking the commenter to comment it. It carries out no verb. That is the closed set's most conservative reading, and it is complete on its own.

- **Task 3** then carries out `MENTION_ACT_VERBS` through the existing arms, and keeps this task's confirmation reply for `MENTION_CONFIRM_VERBS`.
- **Task 4** adds `item.md`, `conversation.md` and `diff.patch` to the context directory this task creates.
- **Task 5** wires the credential into `harness-control.yml` under the env names this task reads, `IN_OAUTH` and `IN_API`. It also fetches the pinned plugin and exports its directory as `HARNESS_MENTION_PLUGIN_DIR`, which this task reads.
- **Task 7** writes the instruction file the command loads, `plugin/instructions/mention_reading.md`. Its `## Output contract` states the decision contract below, field for field. **Task 8** writes the slash command this task invokes, `plugin/commands/harness-read-mention.md`, which loads that instruction file by its `${CLAUDE_PLUGIN_ROOT}/instructions/mention_reading.md` path.

Until Tasks 5, 7 and 8 ship, a real job passes no credential and no plugin directory, so every mention takes this task's no-credential reply, or its no-plugin reply. No consumer runs a real session before then: every test here drives an agent stub.

**Why a slash command, and what the read-only closure rests on.** The mention reader is a plugin **command**, because `.claude/context/plugin.md` → `## Where a new asset goes` gives a role a script invokes to `plugin/commands/` (*"a slash command a user or the watcher invokes"*), and this script invokes it the way `autonomous-watcher.sh` invokes the plugin's commands: as the session's first message, by its plugin-qualified name. A command declares no `tools:` (`.claude/context/plugin.md` → `## Frontmatter`), so the read-only closure rests **entirely** on this session's own flags: `--tools Read,Grep,Glob` under `--restricted`. Nothing in the plugin widens or narrows it.

**This task owns the decision contract.** The validator below is its one authority. Task 7's instruction file restates it, byte-identical field names:

- `action` (required): one of `MENTION_ACTIONS`.
- `verb`: required for `command`, one of `COMMAND_VERBS`.
- `question`: optional positive integer, `answer` only.
- `answer`: required non-blank string for `verb` `answer`.
- `text`: required non-blank string for `reply` and `clarify`.
- `reason` (required): one line, logged, never posted.

### Targets

- `cli/templates/scripts/remote-run.sh` — `control_comment_intake`, `verb_control`, new `control_mention*` functions, a few new constants, and the header's `control` paragraph, `WHAT IT NEVER DOES` and `REPRO` block.
- `cli/test/remote-control-mention.test.mjs` (new) — the mention suite.
- `cli/test/remote-control.test.mjs` — the cases whose shapes are now mentions.

**Work:**

- [ ] **Credential capture, intake and routing.** **First, before anything else in `verb_control`** — as its first statements after the `local` line, ahead of the event-name `case`, the event-file check, `hr_have_jq`, any intake and any child process, and for **every** event, not only `issue_comment` — copy the credential into two **non-exported** script globals and remove it from the environment:

  ```
  MENTION_OAUTH="${IN_OAUTH-}"
  MENTION_API="${IN_API-}"
  unset IN_OAUTH IN_API CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_API_KEY
  ```

  New names are used deliberately: assigning to a name that is already exported keeps it exported, so the values must never be held under `IN_OAUTH` / `IN_API` again. The two direct names are unset as well because the script's credential interface is `IN_OAUTH` / `IN_API` alone. From that line on, no child process of the control job — no `gh_call` made by the gates (`authorise_actor`, `forge_repo_var`, `control_branch_from_pr` / `control_branch_from_issue`, `control_state_var`), no `git`, no `control_child` re-entry of `remote-run.sh` on the exact-form path and no `gh` those spawn — inherits either credential. Only the agent subshell re-exports them (*The session* below). Task 5 relies on this: it passes `IN_OAUTH` / `IN_API` to the act step on every `issue_comment` job, and its restated interface says the script *"hands them to the agent child alone"*.

  Then intake. `control_comment_intake` keeps every existing ignore: an action other than `created`, and a body carrying `COMMENT_MARKER` anywhere. It then classifies the comment:
  - **exact form:** the first line's first word equals `COMMAND_HANDLE` (lowercase compare, as today), and the next word lowercased is one of `COMMAND_VERBS`. This sets `CONTROL_VERB` / `CONTROL_ARGS` exactly as today.
  - **mention:** otherwise, when the body holds the handle as a word anywhere (lowercased body; ERE `(^|[^a-z0-9])<handle>([^a-z0-9-]|$)` built from `COMMAND_HANDLE` lowercased, with `tr` and `[[ =~ ]]`, bash 3.2). This sets a new global `CONTROL_MENTION=1` and leaves `CONTROL_VERB` empty, so `control_refuse`'s existing `${CONTROL_VERB:-$COMMAND_HANDLE}` names the handle.
  - **ignored:** otherwise, with one line and no `gh` call (`ignored, the comment does not mention $COMMAND_HANDLE`).

  So a first line `@sdlc-harness check the question` (handle first, no verb) is a mention rather than an unknown verb. In `verb_control`, skip gate 4 (the unknown-verb refusal) when `CONTROL_MENTION=1`. Keep it for the exact form as the guard against a `COMMAND_VERBS` word no arm carries out (`control_verb_handled`); no such word exists today. Everything else is unchanged and runs before any session, in today's order: `HARNESS_REMOTE_STOP`, `forge_on`, `rerun_actor_listed`, `authorise_actor`, `forge_repo_var`, then `control_branch_from_pr` or `control_branch_from_issue`. Then call `control_mention` instead of the verb `case`. Move the verb `case` into a function `control_run_verb`, unchanged, so Task 3 can call it.
- [ ] **`control_mention` up to the session.** In order:
  - (a) `control_state_var "$CONTROL_BRANCH"`. On failure, refuse exit 3 with the arms' wording (*"the state of the run on … could not be read"*). Then `control_state_word_var`.
  - (b) Credentials. Read the saved globals `MENTION_OAUTH` / `MENTION_API` that `verb_control`'s first statements set; `IN_OAUTH` / `IN_API` are already gone from the environment by now and are never read here. When both saved values are empty, refuse exit 2: the reason is that `harness-control.yml` passes the agent no credential, so a mention is not read. The way on lists every command the way today's unknown-verb reply does (`answer [<n>]`, …) and names `docs/github-run-control.md`.
  - (c) The plugin. `HARNESS_MENTION_PLUGIN_DIR` must name a directory holding `commands/<basename>.md`, where `<basename>` is `${MENTION_COMMAND##*:}` (`harness-read-mention`). Otherwise refuse exit 3: the reason is that the harness plugin carrying the mention command is not available to this job, and the way on names `HARNESS_CLI_VERSION` in `harness-run.yml` as the pin the control job fetches and `docs/remote-execution.md` → `### Upgrading`. The directory is read as a path only; nothing under it is sourced or executed by this script.
  - (d) The agent binary is `AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"`, the watcher's seam. When it does not resolve (`command -v`), refuse exit 3.
  - (e) Write the context directory with `mktemp -d "$control_tmp/harness-control-mention.XXXXXX"`, added to `control_dirs` so `control_cleanup` removes it on every exit path. Its files:
    - `comment.md`: a first line `handle: <COMMAND_HANDLE>`, then `Comment by @<login> on <issue|pull request> #<n>:`, a blank line, then the body verbatim, written by `printf '%s'` as data. Task 7's instruction file resolves its `<command_handle>` token from that first line, so the plugin never carries a second copy of the handle.
    - `run.md`: `branch:`, then the `fetch` keys as `key: value` lines (`state`, `pause_reason`, `engine`, `open_questions`, `detail`, `run_url`, `run_status`), `stopped: yes|no` from `CS_STOPPED`, and the next ledger entry from `control_ledger_next_var` with its section. When every entry is ticked or the ledger cannot be read, `run.md` says so.
    - `questions/question_<n>.md`: a copy of each `CS_OPEN` question from `"$CS_DIR/clarifications/$CONTROL_BRANCH/question_<n>.md"`.

    Every context file is capped at `MENTION_FILE_MAX_BYTES=200000` (new constant), cut at its last whole line with a final `(cut at <n> bytes)` line.
- [ ] **The session.** Run once, never retried, in a subshell that runs `cd` into the context directory and `unset`s `GH_TOKEN`, `GITHUB_TOKEN` and `HARNESS_PR_TOKEN`. It exports `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY` from `MENTION_OAUTH` / `MENTION_API`, each only when its saved value is non-empty and only inside that subshell, as `harness-run.yml`'s `Run the harness` step does, as an environment assignment and never in argv. Run the agent with exactly these arguments:
  - `-p "$MENTION_COMMAND"`: the plugin-qualified slash command alone, with no argument. The command takes none (Task 8: no `argument-hint:`), and the fixed task sentence lives in the command body, so no comment text is ever interpolated into argv.
  - `--plugin-dir "$HARNESS_MENTION_PLUGIN_DIR"`. The plugin is loaded for this session only, because `--restricted` ignores the user settings in which `claude plugin install` records an installed plugin. This is the established contract between the two halves: a shipped script launches a plugin slash command by name as a session's first message, exactly as `autonomous-watcher.sh` does, and nothing imports or sources across the boundary (`.claude/context/conventions.md` → `## The layers`). There is no `--system-prompt` and no `--agent`: the command and the instruction file it loads are the prompt.
  - `--add-dir "$HARNESS_MENTION_PLUGIN_DIR/instructions"`. `--restricted` confines the file tools to the working directories (`--add-dir` included), and the command's first step is to `Read` its instruction file at `${CLAUDE_PLUGIN_ROOT}/instructions/mention_reading.md`, which sits outside the context directory. Only the plugin's `instructions/` directory is added, a pinned public release, never the checkout or anything else under `RUNNER_TEMP`.
  - `--output-format json`
  - `--json-schema "<schema>"`. The schema is built at run time with `jq -n` from `MENTION_ACTIONS` and `COMMAND_VERBS`: an object with `additionalProperties: false`, `required: ["action","reason"]`, `action` an enum of `MENTION_ACTIONS`, `verb` an enum of `COMMAND_VERBS`, `question` an integer with `minimum` 1, and `answer`, `text`, `reason` strings.
  - `--tools Read,Grep,Glob` and `--restricted`. A command declares no `tools:`, so these two flags are the whole read-only closure: no `Write`, `Edit`, `Bash`, web or `Skill` tool exists in the session, so the model can neither change anything nor invoke another slash command.
  - `--strict-mcp-config`, `--no-session-persistence` and `--permission-prompts none`. **Not** `--disable-slash-commands`: it would stop the `-p` slash command itself from expanding.
  - `--model "$MENTION_MODEL"` (new constant, `sonnet`; a command declares no `model:`, so this flag alone sets it) and `--max-budget-usd "$MENTION_MAX_BUDGET_USD"` (new constant, `1`, commented as a bound, not a measured cost).

  Capture stdout and stderr to files in the context directory's sibling under `control_tmp`. Do **not** use `--bare`: `claude --help` states that under it *"Anthropic auth is strictly ANTHROPIC_API_KEY … (OAuth and keychain are never read)"*, which would refuse `CLAUDE_CODE_OAUTH_TOKEN`.
- [ ] **Extract, validate, answer.** Extraction:
  - A non-zero exit, stdout that is not a JSON object, `.is_error == true`, or a `.subtype` other than `success` is an agent failure. Refuse exit 3, naming the subtype or the last non-empty stderr line; the way on is to comment again or comment a command.
  - Otherwise the decision is `.structured_output` when it is an object, else `.result | fromjson?` when that is an object, else it is invalid.
  - Log one stdout line per decision, the measurement seam: `remote-run.sh: control: mention on #<n> by @<login> read as <action>[ <verb>] from <structured_output|result>: <reason, one line, truncated>`.

  Validation is in `jq`, and the script's validator is the sole authority whatever `--json-schema` did:
  - `action` ∈ `MENTION_ACTIONS`;
  - `command` needs `verb` ∈ `COMMAND_VERBS`;
  - `verb` `answer` needs a non-blank `answer` string, and an optional `question` that is an integer ≥ 1;
  - `reply` and `clarify` need a non-blank `text`.

  Unknown keys are ignored. An invalid decision is refused exit 2, naming the first rule it broke; the way on lists the commands.

  **The credential-value check covers every agent-written string field that can leave the job — `text` and `answer` — and runs once, immediately after validation and before the `action` is answered**, so no branch of `control_mention`, this task's or Task 3's, is ever reached with a decision that carries a credential. When either field contains either non-empty saved credential (`MENTION_OAUTH` / `MENTION_API`), reject the decision with an `::error::` line that never prints the value, post no agent-written text, and exit 3. In this task `answer` is never posted; Task 3 posts it in the read-as note and dispatches it through `control_answer`, and relies on this check having already refused it.

  Then sanitise the `text` to be posted. The first two rules live in one `jq` definition, a new constant `JQ_DEF_SANITISE` holding `def sanitise($login; $handle):` (string in, string out), beside the other `jq` helpers, so Task 3 applies the same rules to the quoted answer:
  - replace every `<!--` with `&lt;!--`, so no line can read as a harness marker;
  - give every `@<login>` other than `$login` (the commenter's) and `$handle` a zero-width space (U+200B) after the `@`;
  - then, outside `sanitise`, cap the text at `MENTION_TEXT_MAX_BYTES=60000` (new), cut at a whole line with a `(cut)` note.

  Answers, each through `control_post`, which adds the `reply` marker:
  - `none`: no comment, exit 0.
  - `reply` / `clarify`: `@<login>: <text>`, a blank line, then the footer `_Written by an agent that read your mention; it changed nothing. The commands are …; docs/github-run-control.md in the harness documentation states each._` Exit 0.
  - `fixes`: the script's own text, exit 0. A mention does not start a round of fixes. A review that requests changes on the run's pull request starts one (`docs/github-run-control.md` → `## 2.`). An author who cannot request changes on their own pull request starts the round locally with `/autonomous-sdlc-harness:branch-user-review` (`## 4.`).
  - `command` (every verb, in this task): `@<login>: your mention reads as \`@sdlc-harness <verb>[ <n>]\`. Comment that command to carry it out` (for `answer`, *with the answer on the lines below it*). Exit 0.

  Update the header's `control` paragraph:
  - the new classification and the `Ignored` list (a body with no handle);
  - gate 4 being skipped for a mention;
  - a `MENTION` paragraph stating the order — opening with the credential capture: `verb_control`'s first statements, for every event, copy `IN_OAUTH` / `IN_API` into the non-exported `MENTION_OAUTH` / `MENTION_API` and unset them (and `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY`), so no `gh`, `git` or `control_child` process the job spawns inherits a credential and only the agent subshell receives it — then the context directory, the exact agent argv, the extraction and validation rules, the sanitisation, the answers and the exits. The exits are 0 answered or nothing to do; 2 refused; 3 a state read, plugin, binary or agent failure, or a credential value in `text` or `answer`. The paragraph names the command it runs, `plugin/commands/harness-read-mention.md` (`MENTION_COMMAND`), and the instruction file that command loads, `plugin/instructions/mention_reading.md`, whose `## Output contract` restates the decision contract this script validates: a field renamed on either side is an edit to both. It states that the read-only closure is the session's `--tools` and `--restricted`, because a command declares no allowlist;
  - `IN_OAUTH` / `IN_API` and `HARNESS_MENTION_PLUGIN_DIR` as the workflow's interface.

  Amend `WHAT IT NEVER DOES` (*"It never launches a local session"*) to except `control`'s one read-only mention session, and add it to `control`'s writes. Fix the `REPRO` block's `ignored` example, whose `Let's @sdlc-harness pause` is now a mention: use `pause` instead. Add a `mention` example driven by `HARNESS_AGENT_CLI` pointing at a stub printing a `reply` decision, with `HARNESS_MENTION_PLUGIN_DIR` pointing at a throwaway directory holding an empty `commands/harness-read-mention.md`.
- [ ] **Tests.** Create `cli/test/remote-control-mention.test.mjs`:
  - **Header.** It opens with its rule, per `.claude/context/conventions.md` → `## The testing bar`: a mention anywhere is read only after today's gates and the branch resolve in code, the agent's decision is validated against the closed set, and nothing outside it happens.
  - **Fixture.** Follow `remote-control.test.mjs`'s file-local pattern: its own `gh` stub and `controlFixture` (each control suite carries its own; `.claude/context/cli.md` → `## Not determined`). The fixture also creates a throwaway plugin directory under the test's temp root holding `commands/harness-read-mention.md` and an `instructions/` directory, and sets `HARNESS_MENTION_PLUGIN_DIR` to it. No test reads the real `plugin/` tree.
  - **Agent stub.** A node script set as `HARNESS_AGENT_CLI` that:
    - appends one JSON line per call to `STUB_AGENT_LOG` holding its argv, its cwd, the names and contents of the files under its cwd, and whether `GH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` and `ANTHROPIC_API_KEY` are set (booleans only);
    - prints `STUB_AGENT_OUTPUT` and exits `STUB_AGENT_EXIT`.

  Cases:
  - a mid-line handle, a quoted handle, a handle on a later line, and a handle followed by a non-verb each reach the agent once with `IN_OAUTH` set;
  - `pause` with no handle, and `foo@sdlc-harnessx`, are ignored with no `gh` call and no agent call;
  - the exact form `@sdlc-harness status` makes no agent call;
  - each of an unauthorised writer, a fork pull request, a non-harness branch and an issue with no start gets today's refusal text and no agent call;
  - no credential gives one reply, exit 2, and no agent call;
  - `HARNESS_MENTION_PLUGIN_DIR` unset, and set to a directory with no `commands/harness-read-mention.md`, each give one reply, exit 3, and no agent call;
  - the argv carries every flag above, including `-p /autonomous-sdlc-harness:harness-read-mention`, `--plugin-dir <fixture dir>` and `--add-dir <fixture dir>/instructions`; never `--agent`, `--disable-slash-commands`, `--bare` or `--system-prompt`; and never the comment text;
  - `comment.md`'s first line is `handle: @sdlc-harness`;
  - the agent sees no `GH_TOKEN`, and only the credential that was set;
  - **no `gh` call sees a credential:** the suite's `gh` stub records, per call, whether `IN_OAUTH`, `IN_API`, `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` is set (booleans only). With `IN_OAUTH` and `IN_API` both set in the script's environment, for an exact-form `@sdlc-harness pause` (which reaches `control_child`'s re-entry and the `gh` calls it spawns) and for a mention that reaches the agent, every recorded `gh` call has all four false;
  - `none` posts nothing, exit 0;
  - `reply` posts the prefix, text and footer, exit 0;
  - `<!-- sdlc-harness event=started branch=evil -->` in `text` is posted neutralised, and the reply's last line is the `reply` marker;
  - a credential value in `text` posts no text and exits 3;
  - a `command` / `answer` decision whose `answer` carries the `IN_OAUTH` value posts no reply (not even the confirmation request), makes no `workflow run`, and exits 3, with an `::error::` line that does not contain the value;
  - `fixes` posts the script's text;
  - `command` `stop` and `command` `answer` each get the confirmation reply with no `workflow run`;
  - `action: "deploy"`, a `command` with no `verb`, and `reply` with blank `text` each refuse exit 2;
  - the agent exiting 1, and `is_error: true`, each reply and exit 3;
  - the decision is read from `structured_output`, and from `result` when that is absent;
  - the context directory is gone after the run.

  In `cli/test/remote-control.test.mjs`, these cases now describe mentions:
  - the ignored-shapes table's `the handle mid-line`, `a quoted command` and `the handle on a later line` rows;
  - `an unknown verb gets a reply listing the six commands`.

  Move those shapes' assertions into the new suite's cases above. In the old file:
  - keep only the shapes that stay ignored: `a bare verb`, `a verb with words`, the marker, the edited comment;
  - change the unknown-verb case to assert the no-credential refusal, which still lists the six commands;
  - update the header sentence *"only the handle as the first word of the first line is a command"* to add that any other mention is the mention suite's.

**Verification:**

- `commands.typecheck` exits 0, and `bash -n cli/templates/scripts/remote-run.sh` exits 0. Grep the new functions for `${var,,}`, `mapfile`, `declare -A` and `set -e`, and find none (bash 3.2; `set -u` without `-e`).
- `npm test --workspace cli -- test/remote-control-mention.test.mjs` passes, and so does `npm test --workspace cli -- test/remote-control.test.mjs`, which this task edits. Run each as one plain foreground command from the repository root.
- Every field name of the contract (`action`, `verb`, `question`, `answer`, `text`, `reason`) and every `MENTION_ACTIONS` value appear in the schema built here. Task 7's verification greps the instruction file for the same names.
- Grep `control_mention` for `source`, `. "$` and `bash "$HARNESS_MENTION_PLUGIN_DIR`, and find none: the plugin directory reaches only `claude`'s argv (`--plugin-dir`, `--add-dir`) and a `-f` test.
- End to end: drive the `REPRO` `mention` example by hand against a throwaway fixture. The stubbed agent's `reply` decision posts exactly one comment on the item, and nothing reaches `workflow run`.
