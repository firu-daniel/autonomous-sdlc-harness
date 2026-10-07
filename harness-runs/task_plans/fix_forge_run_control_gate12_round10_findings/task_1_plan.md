### Task 1 — `remote-run.sh control --needs-agent`: the actor and mention check, run alone, posting nothing

**Goal:** Give `remote-run.sh control` a mode that only answers whether the act step would start an agent session for this `issue_comment` event. The mode runs `control`'s own intake and gates 1 to 3 and reports the answer as an exit code and one line. It posts, dispatches and writes nothing, so the workflow can skip installing `claude` and fetching the plugin for every comment that will never reach a session (task prompt, issue 2).

**Where this task stops.** This task builds the mode and its tests in `cli/templates/scripts/remote-run.sh`. The workflow step that calls it, and the gating of the three comment-only steps on its answer, belong to **Task 2** (`cli/templates/github/workflows/harness-control.yml`). The adopter documentation belongs to **Tasks 3 and 4**. Plain `control` (no flag) must behave byte for byte as today: the same replies, the same exit codes, the same gate order.

### Targets

- `cli/templates/scripts/remote-run.sh` — the argument parser, `usage()`, the header's verb list, the `control` paragraphs, the `REPRO` block, and `verb_control` with a new shared gate function.
- `cli/test/remote-control-needs-agent.test.mjs` (new) — the mode's suite.

### The contract this task produces (Task 2 restates it)

- **Invocation:** `bash "$SCRIPTS_DIR/remote-run.sh" control --needs-agent`. `--needs-agent` is a `control` option only: on any other verb the parser refuses it with `usage "$1 is a control option"` (exit 1). `--repo <root>` is accepted beside it, as for `control`.
- **Exit 0**: the comment is a mention (`CONTROL_MENTION=1`) and passes gates 1 to 3 of `control`, in `control`'s order:
  - `HARNESS_REMOTE_STOP` unset;
  - `forge_on`: `forge` is `github` and `execution.target` is `github-actions`;
  - `rerun_actor_listed`;
  - `authorise_actor "$CONTROL_ACTOR" "$CONTROL_SENDER_TYPE"` returning 0.

  It prints one stdout line: `remote-run.sh: control: needs-agent: yes, a mention by @<login> on #<n>`.
- **Exit 2**: no agent session would start. It prints one stdout line, `remote-run.sh: control: needs-agent: no, <reason>`, for each of these cases:
  - `GITHUB_EVENT_NAME` is `pull_request_review`, `issues`, `pull_request` or `delete`;
  - the comment is ignored (`control_comment_intake` returns 1, after its own `ignored, …` line);
  - the comment is the exact form (a `CONTROL_VERB` is set). This is decided **before** any gate, so it makes no `gh` call;
  - a gate refuses. `<reason>` is then the **same** sentence `control` replies with for that gate, with the trailing period dropped as `control_refuse` drops it: the `HARNESS_REMOTE_STOP` sentence, the `forge`/`execution.target` sentence, `RUN_ACTORS_WHY`, or `AUTH_WHY` for `authorise_actor` statuses 1, 2, 3 and 5.
- **Exit 3**: `authorise_actor` returned 4 (the permission call failed). Exactly one stdout line: `remote-run.sh: control: needs-agent: undecided, <AUTH_WHY>`. Plain `control` keeps its exit-2 refusal for that status, unchanged.
- **Exit 1**: an event name `control` does not handle, an unreadable event file, no `jq`, or a usage error. The messages are `control`'s own.
- **Side effects:** none. No comment, no label, no dispatch, no `RUNNER_TEMP` directory, no `trap`. The one `gh` call it may make is `authorise_actor`'s permission call, and only for a mention. The branch is never resolved: a mention whose branch `control` would refuse still answers 0. The act step's own branch refusal stays its reply.
- **No credential is read.** The check step gets no `IN_OAUTH` / `IN_API`. If they are present, `verb_control`'s first statements still unset them as today.

**Work:**

- [ ] **Argument parser and usage.** Add `--needs-agent` to the `while` loop, guarded `[ "$verb" = control ] || usage "$1 is a control option"`, setting a new global `needs_agent=1` (default `0`, declared beside `branch_gone=0`). Update `usage()`'s line to `remote-run.sh control [--needs-agent] [--repo <root>]`, and the header verb list's line to match, keeping `(its own exit map: its paragraph)`.
- [ ] **One gate function, two callers.** Move gates 1 to 3 out of `verb_control` (the `HARNESS_REMOTE_STOP` test through the `authorise_actor` refusal) into one function, for example `control_gates`. On the first failure it returns non-zero with three values set: the exit code `control` uses today, the reason sentence and the way-on sentence `control_refuse` takes today, and the raw `authorise_actor` status where that gate failed. `verb_control` calls it and passes the three values to `control_refuse` unchanged, so every reply, exit code and the gate order stay byte-identical. Gate 4 (`control_verb_handled`) stays where it is: it concerns the exact form only, and `--needs-agent` has already answered `no` by then. Do not copy any gate's test or sentence into a second place (`.claude/context/conventions.md` → *Before adding a copy of anything, grep for it*).
- [ ] **The mode in `verb_control`.** After the event-name `case` and the event-file and `jq` checks, when `needs_agent=1`:
  - any event but `issue_comment` prints the `no` line and exits 2;
  - otherwise run `control_comment_intake` (a return of 1 is the `no` line, exit 2) and the issue-number check;
  - an exact form (`CONTROL_VERB` set) prints the `no` line naming it, as `` the comment is the exact form `@sdlc-harness <verb>` ``, and exits 2;
  - otherwise call the gate function and map its result to the exits above.

  All of this comes before `control_tmp`, the `trap` and `control_close`, so the mode creates nothing.
- [ ] **Header and `REPRO`.**
  - In the `` `control` IS THE COMMENT AND REVIEW ADAPTER `` paragraph, after the ordered refusal list, add a `--needs-agent` sentence or short paragraph stating the contract above: the same gates 1 to 3, run alone, replying to nothing; its exits 0, 2, 3 and 1; and that `WORKFLOW_CONTROL_FILE` runs it before installing the agent, the act step still re-checking everything.
  - In the `MENTION.` paragraph's closing sentence ("The workflow's interface: `IN_OAUTH` / `IN_API` and `HARNESS_MENTION_PLUGIN_DIR`."), add `control --needs-agent`'s exit 2.
  - In `REPRO`, after the `act` case, add `needs-agent` cases on the same `c.json` setup: the mention with `--needs-agent` gives `-> 0`, one `needs-agent: yes` line, and `"$s.log"` holding only the permission call; the body `@sdlc-harness pause` gives `-> 2` with no `gh` call; `HARNESS_RUN_ACTORS=bob` gives `-> 2` naming `HARNESS_RUN_ACTORS`, with nothing posted.
- [ ] **`cli/test/remote-control-needs-agent.test.mjs`.**
  - **Header.** Open with the rule the suite enforces: *the check answers whether a session would start, from `control`'s own gates, and posts, dispatches and creates nothing*.
  - **Fixture.** Carry `cli/test/remote-control-mention.test.mjs`'s fixture shape file-locally, as each control suite carries its own: `init`, `execution.target` `github-actions`, `forge` `github`, `HARNESS_GH_CLI` a logging stub, and `HARNESS_AGENT_CLI` a stub that records any call. Everything sits under the system temp directory, and nothing reaches the network.
  - **Cases**, each asserting the exit, the one `needs-agent:` line, the `gh` log, no comment posted, no `workflow run`, and the agent stub never called:
    - an admitted writer's mention → 0, with only the permission call;
    - an exact-form `@sdlc-harness status` → 2, with no `gh` call;
    - a comment without the handle, and one carrying `<!-- sdlc-harness` → 2, with no `gh` call;
    - a writer `HARNESS_RUN_ACTORS` does not list → 2, naming `HARNESS_RUN_ACTORS`;
    - a `read` collaborator → 2;
    - an unlisted bot → 2, with no `gh` call;
    - `HARNESS_REMOTE_STOP` set → 2;
    - `forge` unset → 2;
    - a re-run (`GITHUB_RUN_ATTEMPT=2`) by an unlisted `GITHUB_TRIGGERING_ACTOR` → 2;
    - a failing permission call → 3;
    - `GITHUB_EVENT_NAME=delete` → 2;
    - `--needs-agent` on `status` → exit 1 with `is a control option`.
  - **Tie to `control`.** For the unlisted-writer mention, run plain `control` on the same event and assert that the `needs-agent: no, <reason>` reason is the text after `was not run: ` in the posted reply, up to its first `. `. That ties the shared gate function to both callers.

**Verification:**

- Run the new suite as one plain foreground command from the repository root: `npm test --workspace cli -- test/remote-control-needs-agent.test.mjs`. Every case passes.
- `commands.typecheck` exits zero. `cli/templates/` is outside the compiler, so this proves only that the package still builds.
- `bash -n cli/templates/scripts/remote-run.sh` reports nothing, and the script stays bash 3.2-clean: no `${var,,}`, no `declare -A`, no `mapfile`.
- Grep `verb_control` and the new gate function: `HARNESS_REMOTE_STOP`, `rerun_actor_listed` and `authorise_actor` each appear in exactly one gate call site. That confirms the gates have one home.
- Walk the header's `REPRO` `needs-agent` cases by hand against a throwaway fixture with the `gh` stub, as the `REPRO` block prescribes. The exits and the `"$s.log"` lines read as written.
