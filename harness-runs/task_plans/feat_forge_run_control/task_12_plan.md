### Task 12 — Add the `answer` comment command

**Goal:** An authorised reply answers a parked run's question and dispatches `resume: answer` with the answers JSON, as the local relay does (goal 3, acceptance 3). The answer is **untrusted task data**, written verbatim, as `/autonomous-sdlc-harness:branch-answer` treats it. The form, settled in the story index:

- **The command.** The first line is `@sdlc-harness answer <n>`, and the answer is every line below it.
- **The index.** `<n>` names the question file and may be left out when exactly one question is open. Issue comments have no threads, so with several open the command must name its question.
- **A short answer** may follow the index on the first line when nothing follows below.
- **One answer, one dispatch.** Each answer is its own `resume: answer` dispatch with one entry.

**Why one dispatch per answer is safe.** A park left partly answered is one the job already handles: an `answer` dispatch whose park is not fully answered stops as parked before launching any session (`autonomous-watcher.sh` → `run_job`, *"An `answer` dispatch whose park is not fully answered has nothing to consume"*). Its bundle then carries the `answer_<n>.md` that `restore` wrote, so the next answer's job restores it and finds the set complete. Every question's answer therefore lands without the comment thread being used as state.

**Depends on:**

- Task 10's `control` verb, with `control_state_var <branch>` (`CS_STATE`, `CS_REASON`, `CS_ENGINE`, `CS_OPEN` — the space-separated open question indexes — `CS_DETAIL`, `CS_URL`, `CS_ERR`), `control_reply <exit> <text>`, and `CONTROL_BRANCH`, `CONTROL_NUMBER`, `CONTROL_ACTOR`, `CONTROL_ARGS` and `CONTROL_BODY`.
- Task 3's `forge_issue_var`, `forge_pr_var`, `forge_recognised` and `forge_set_state`.
- Task 4's question comments, which tell the reader this form.
- The existing `remote-run.sh dispatch <branch> --engine <kind> --resume answer --answers-from <dir> --indexes "<n>" --chain 0 [--repo <root>]`. It reads `<dir>/answer_<n>.md` and refuses with exit 2, naming the size and `REMOTE_INPUT_PAYLOAD_MAX`, when the inputs payload is over GitHub's 65,535-character limit (research S5: counted in characters over the whole compact inputs object).

**Where this task stops.** `clear` is Task 11's. The question posts are Task 4's. A job that a partial answer starts stops parked without notifying, so no new question comment is posted for it. The stop is `run_job`'s, and nothing here changes it.

### Targets

- `cli/templates/scripts/remote-run.sh` — the `answer` arm of `control`, and the header's `control` paragraph.
- `cli/test/remote-control.test.mjs` — its cases.

**Work:**

- [ ] **The index and the text.**
  - `CONTROL_ARGS`' first word, when it is a positive integer (`^[1-9][0-9]*$`), is `<n>`, and anything after it is the short form.
  - With no index: exactly one open question in `CS_OPEN` makes that its index. Several get the reply that the command must name one, listing them as `@sdlc-harness answer <n>`. None gets the reply below for a run that is not parked.
  - The answer is `CONTROL_BODY` with its first line removed, its bytes otherwise unchanged and a trailing CR on each line stripped. When that is empty or only whitespace, the answer is the short form. When both are empty, it is refused as an empty answer.
- [ ] **The state checks**, after `control_state_var`, each a reply and exit 2:
  - `CS_STATE` `park_loop` → the hold, pointing at `@sdlc-harness clear`.
  - `paused` with `CS_REASON` `expired` → the expiry, quoting `CS_DETAIL`, and that the park's questions can no longer be answered here, with resuming from the committed ledger (`@sdlc-harness resume`) as the way on. An expired bundle is reported as expired, never treated as no park (the lessons ledger's rule).
  - `running` → a job of the run is in progress, so send the answer again once it finishes, naming `CS_URL`. This refusal is what keeps a second answer from queueing behind a running job, where a newer pending run in the per-branch `concurrency` group could cancel it.
  - Any state but `parked` → the state.
  - `<n>` not in `CS_OPEN` → the open indexes.
  - An empty `CS_ENGINE` → the Run workflow form, as Task 11 does.
- [ ] **The dispatch.**
  - Write the answer's bytes to `<dir>/answers/answer_<n>.md` under a fresh `${RUNNER_TEMP:-<mktemp -d>}` directory, with `printf '%s'` and never as shell source.
  - Run `remote-run.sh dispatch <branch> --engine "$CS_ENGINE" --resume answer --answers-from <dir>/answers --indexes "<n>" --chain 0 --repo "$root"`.
  - On exit 2, reply quoting its last stderr line. For the payload limit, that line names the size and the limit; add that the answer must be shortened, or committed to a file on the branch and named in a shorter answer.
  - On exit 3, reply naming the error.
- [ ] **The reply and the label.**
  - When `<n>` was the only open index, reply `Answer to question <n> received from @<login>; every open question is answered, so \`<branch>\` resumes.` and call `forge_set_state running` on the issue and the recognised pull request.
  - Otherwise reply `Answer to question <n> received from @<login> and sent; question(s) <rest> still need an answer: \`@sdlc-harness answer <m>\`.` and leave the label `parked`.
  - The header's `control` paragraph states the form, the one-dispatch rule and why it is safe, the refusals, and that an answer becomes a public comment on a public repository.
- [ ] **`remote-control.test.mjs`**, with a completed run whose bundle is `parked` and carries `question_1.md`, plus `question_2.md` where stated:
  - `@sdlc-harness answer` with lines below and one open question → `workflow run … -f resume=answer -f answers={"1":"<the lines>"}`, a reply saying it resumes, and an `sdlc-harness: running` add;
  - `@sdlc-harness answer 1 Use B.` → the answer `Use B.`;
  - no index with two open → a reply listing both, and no `workflow run`;
  - `answer 2` with two open → sent, a reply naming question 1 as still open, and no label change;
  - `answer 3` → a reply naming the open set;
  - a `park_loop` bundle → a reply naming `clear`;
  - an expired bundle → a reply naming the expiry;
  - an `in_progress` newest run → a reply naming the run, and no `workflow run`;
  - an answer of 70,000 characters → a reply naming the limit, and no `workflow run`;
  - an answer carrying `` $(touch pwned) `` and a backtick → sent byte for byte, and no `pwned` file.

**Verification:**

- `npm test -- test/remote-control.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "REMOTE_INPUT_PAYLOAD_MAX" -- cli/templates/scripts/remote-run.sh` has its comparison only in `verb_dispatch`: `control` adds no second measure of the payload.

**Deviations from plan:**

- `bash -n cli/templates/scripts/remote-run.sh` was refused by the permission layer (twice, from the root and with an absolute path). The parse claim rests instead on `npm test -- test/remote-control.test.mjs`, whose 51 cases each execute the script (51 pass); an earlier run of that file surfaced and fixed a parse error, an apostrophe inside a double-quoted `${…:-…}`.
- The existing case *"a known verb no arm handles yet gets the same reply"* drove `@sdlc-harness answer 1` and is removed: with `answer` handled, every `COMMAND_VERBS` word has an arm, so no verb is left for it to drive.
- With no positive-integer index on the first line, the whole of `CONTROL_ARGS` is the short form (so `@sdlc-harness answer Use B.` answers the one open question). The plan named the short form only after an index.
- A `parked` run with no open question gets a reply saying it is `parked` with none open, rather than the literal "any state but `parked`" wording, which would read as a contradiction.
- The empty-answer refusal runs before the state fetch: it needs no state, and refusing first spends no `gh` call.
