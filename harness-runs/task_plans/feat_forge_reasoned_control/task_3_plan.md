### Task 3 — Carry out a mention's `answer`, `pause`, `resume` and `status` through the existing verb arms

**Goal:** When a mention's validated decision is `command` with a verb in `MENTION_ACT_VERBS` (`answer`, `pause`, `resume`, `status`), carry it out through that verb's own existing arm, every state check and refusal included. That arm's reply opens by naming the exact form the mention was read as. `stop` and `clear` (`MENTION_CONFIRM_VERBS`) keep Task 2's confirmation reply. Only the script's existing verbs change state; nothing new dispatches.

**Depends on:**

- **Task 1.** It mirrors `MENTION_ACT_VERBS='answer pause resume status'` and `MENTION_CONFIRM_VERBS='stop clear'` into `remote-run.sh`.
- **Task 2.** It provides the mention path. After validation, `control_mention` holds the decision's fields:
  - `action` `command`, with `verb` ∈ `COMMAND_VERBS`;
  - `question`: absent, or an integer ≥ 1, `answer` only;
  - `answer`: a non-blank string, `answer` only.

  Today it answers every such decision with the confirmation reply `@<login>: your mention reads as \`@sdlc-harness <verb>[ <n>]\`. Comment that command to carry it out…`. Task 2 also moved `verb_control`'s verb `case` into `control_run_verb`, unchanged. That function dispatches on `CONTROL_VERB` to `control_answer`, `control_pause`, `control_stop`, `control_resume`, `control_clear`, `control_status` or `control_review`. `control_post <text>` is the one place every reply is posted from.
- **Task 2's credential-value check.** It runs once, immediately after validation and before any `action` is answered, over both `text` and `answer`: a decision whose `answer` contains either non-empty saved credential (`MENTION_OAUTH` / `MENTION_API`) is refused with an `::error::` line that never prints the value, posts nothing, and exits 3. So the `command` branch this task edits is never reached with such an `answer`.
- **Task 2's sanitiser.** The constant `JQ_DEF_SANITISE` holds `def sanitise($login; $handle):` (string in, string out). It replaces every `<!--` with `&lt;!--`, and gives every `@<login>` other than `$login` and `$handle` a zero-width space (U+200B) after the `@`.

**Where this layer stops.** This task adds no verb, no dispatch and no state check of its own. The arms decide whether the state accepts the verb, exactly as for the exact form. For example, an `answer` while a job runs is refused by `control_answer`'s existing *"a job of the run … is in progress"* arm. That is the task prompt's out-of-scope line *"Delivering a mention into a run that is already in flight. It is answered with the run's state."* Each arm re-reads the run's state through its own `control_state_var`. That is deliberate: it re-checks a state that may have moved while the agent ran.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - `control_post`;
  - `control_mention`'s `command` branch;
  - a new shared `jq` definition of the backtick fence, and `round_collect`'s `jq` program, which is changed to call it;
  - the header's `MENTION` paragraph and `REPRO` block.
- `cli/test/remote-control-mention.test.mjs` — the act-verb cases (Task 2 created the file).

**Work:**

- [ ] **One fence rule, one body.** Today the rule *"A hunk's fence is one backtick longer than its longest backtick run, at least three"* lives inline in `round_collect`'s `jq` program, as `(([$h | match("\`+"; "g") | .length] | max) // 0) as $m | ("\`" * ([$m + 1, 3] | max)) as $f`. Lift it into one constant beside the other `jq` helpers, `JQ_DEF_FENCE`. It holds a `jq` `def fence:` that maps a string to its fence. Make `round_collect`'s program call it: prepend `"$JQ_DEF_FENCE"` to that program and replace the inline computation with `($h | fence) as $f`. Move the existing comment onto the constant. `round_collect`'s output must stay byte-identical. After this edit, grepping `remote-run.sh` for `max) // 0` finds the fence computation only inside `JQ_DEF_FENCE`.
- [ ] **The read-as note.** Add a global `CONTROL_MENTION_NOTE=""`. When it is non-empty, `control_post` prepends it and a blank line to every reply it posts, which covers `control_reply` and `control_refuse` too. So an arm's acceptance and its refusal both open by saying how the mention was read.
- [ ] **The `command` branch.** For a verb in `MENTION_ACT_VERBS`:
  - Set `CONTROL_VERB` to the verb.
  - For `answer`, **before `CONTROL_BODY` is built**, the decision's `answer` must already have passed Task 2's credential-value check. Do not re-implement it here; assert the ordering instead: the branch is reachable only through the path where that check ran, and an `answer` carrying `MENTION_OAUTH` or `MENTION_API` never reaches the answer file, the dispatch or the note. If Task 2's check is found to run after the `action` dispatch, or over `text` only, move it ahead of this branch and widen it to `answer` as part of this task, in Task 2's own words (same `::error::` line, value never printed, exit 3).
  - For `answer`, synthesise exactly what `control_answer` reads from an exact-form comment. `CONTROL_ARGS` is `<question>`, or empty when it is absent. `CONTROL_BODY` is `@sdlc-harness answer[ <question>]`, a newline, then the decision's `answer`. `control_answer`'s *"every line below it"* rule then takes the agent's text byte for byte as the answer, written by `printf` as untrusted data, never sourced.
  - For the other three, set `CONTROL_ARGS` and `CONTROL_BODY` to the exact form's first line.
  - Set `CONTROL_MENTION_NOTE` to ``Read from your mention as `@sdlc-harness <verb>[ <question>]`.`` For `answer`, add *"with this answer:"* and the answer in a fenced block whose fence comes from `JQ_DEF_FENCE`'s `fence`, called in the same `jq` program that applies Task 2's `sanitise($login; $handle)` (prepend `"$JQ_DEF_SANITISE"` with `"$JQ_DEF_FENCE"`) to the quoted copy, so the quote gets both the `<!--` neutralisation and the `@`-mention defusing. The fence is computed over the sanitised copy. The answer file keeps the decision's `answer` bytes unchanged.
  - Then call `control_run_verb`.

  A verb in `MENTION_CONFIRM_VERBS` keeps Task 2's confirmation reply unchanged. Test membership against the two mirrored lists, never a hand-typed verb list.
- [ ] **Header.** Rewrite the `MENTION` paragraph's `command` sentence:
  - `MENTION_ACT_VERBS` are carried out through their own arms, with the read-as note opening every reply, the answer quoted after the same sanitisation as a reply's text. An `answer` carrying a credential value was already refused by the credential-value check, so it reaches neither the answer file, the dispatch nor the note.
  - `MENTION_CONFIRM_VERBS` are answered with the confirmation request: `stop` because it is destructive, `clear` because on GitHub typing it is `branch-resume`'s confirmation.
  - A state the arm refuses is that arm's refusal and exit, unchanged.

  Extend the `REPRO` `mention` example with a `command` / `pause` decision that sends the `action=pause` dispatch.
- [ ] **Tests**, in `remote-control-mention.test.mjs`, each with the agent stub returning a `command` decision:
  - `pause` on a running run sends exactly `workflow run harness-run.yml --ref feat_x -f action=pause -f branch=feat_x`. The one reply opens ``Read from your mention as `@sdlc-harness pause`.`` followed by today's pause reply.
  - `resume` on a paused run sends the relay's dispatch and labels the run `running`.
  - `status` replies with the note then today's status text, with no `workflow run` and no labels write.
  - `answer` with `question` 2 and two open questions sends one `resume=answer` dispatch. The answer file's bytes equal the decision's `answer` exactly, including a `$(…)` and a backtick that are never evaluated. The reply quotes the answer and names question 1 as still open.
  - `answer` whose text holds a run of five backticks is quoted inside a six-backtick fence.
  - `answer` whose text holds `<!-- sdlc-harness event=started branch=evil -->` and `@someoneelse` is quoted with `&lt;!--` and `@` followed by U+200B, while the answer file holds the original bytes.
  - `answer` whose text carries the `IN_OAUTH` value, on a waiting run with one open question: no `workflow run`, no answer file written, no reply posted (no read-as note, no answer quoted), an `::error::` line that does not contain the value, and exit 3.
  - `answer` with no `question` and two open questions is refused by `control_answer`, listing both, with the note first and no dispatch.
  - `answer` on a running run is refused naming the job in progress, with no dispatch.
  - `stop` and `clear` still get the confirmation reply, with no `workflow run` and no `stop` marker.
  - Delete Task 2's case asserting that `answer` gets the confirmation reply, because it is superseded.

  The review-round suite that already covers `round_collect`'s fenced hunks is the guard on the refactor's byte-identity. Grep `cli/test` for `round_collect` and for a fenced-hunk assertion, and name the file in the return. That suite is run in this task only if this task edits it, per the test-run rule.

**Verification:**

- `bash -n cli/templates/scripts/remote-run.sh` exits 0, and `commands.typecheck` exits 0.
- `npm test --workspace cli -- test/remote-control-mention.test.mjs` passes. This is the one test file this task edits; run it as one plain foreground command from the repository root. The review-round suite named above runs in the change's closing `commands.test`.
- `grep -n 'max) // 0' cli/templates/scripts/remote-run.sh`: every hit sits inside `JQ_DEF_FENCE`'s definition, and none in `round_collect` or `control_mention`. The fence rule has one body.
- End to end: the `REPRO` `mention` example with the stub's `pause` decision logs one `workflow run … -f action=pause` and posts one reply, opening with the read-as note, on the commented item.
- Grep `control_mention`'s `command` branch for `workflow run`, `gh_call` and `control_child`, and find none: every state change goes through an existing arm.

**Deviations from plan:**

- `bash -n cli/templates/scripts/remote-run.sh` was refused by the permission layer (twice, absolute and relative path). The parse claim rests instead on `remote-control-mention.test.mjs` passing (38/38), every case of which executes the script.
- The `REPRO` `mention` example is extended with a sibling `act` row (same setup, the stub's `command` / `pause` decision) rather than a second outcome folded into the `mention` row.
- The end-to-end `REPRO` check was not hand-run; it rests on the test case *command pause on a running run sends the pause dispatch…*, which drives the same setup through the stubs and asserts the one `-f action=pause` dispatch and the one reply opening with the read-as note.
- The review-round suite guarding `round_collect`'s byte-identity, `cli/test/remote-control-review.test.mjs` (*a hunk carrying a triple-backtick line is fenced with four backticks*), was not run: deferred to the Run gates phase.
- Task 2's credential-value check was confirmed to run once, after validation and before the `action` `case`, over both `text` and `answer`; it was not moved or widened.
