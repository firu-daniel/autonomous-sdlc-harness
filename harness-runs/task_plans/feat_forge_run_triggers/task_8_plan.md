### Task 8 — Extend `remote-run.sh trigger` to a `repository_dispatch` event

**Goal:** Prove the adapter shape with a second event at almost no cost (task prompt, goal 5, and *Out of scope*'s *"unless one costs almost nothing once the shape exists"*). A `repository_dispatch` of type `harness-task`, sent by anything holding a token with Contents write (a Jira Automation rule's **Send web request**, a script, another tracker's relay), starts a task run through the same `start`. Its `client_payload` carries the title and the task text. This is the route Task 20's document gives for Jira, and the one a GitLab webhook relay would call (research T6).

**Depends on:** Task 7, which creates the `trigger` verb, its refusal order, its snapshot writer, its bounded run-URL lookup and its call of `start`. Task 7's refusals report by issue comment, and this task gives them a second reporting target, the step summary, and which owns `cli/test/remote-trigger.test.mjs`. This task adds a second event arm to both. It also uses Task 1's `TRIGGER_DISPATCH_EVENT_TYPE` = `harness-task`, mirrored byte for byte and declared in the header's mirror list.

**Where this task stops.** A dispatch event has no issue, so there is no comment and no label. Its feedback goes to the job's step summary. It has no labeller to check: GitHub requires a fine-grained token with Contents write, or a classic token with `repo`, to send one (T6), so the token holder is the authority, and the header says so. No Jira-specific code exists anywhere; the Jira rule's shape is documentation (Task 20).

### Targets

- `cli/templates/scripts/remote-run.sh` — the `repository_dispatch` arm of `trigger`, its header lines and REPRO.
- `cli/test/remote-trigger.test.mjs` — dispatch-event cases.

**Work:**

- [ ] **The arm.**
  - `GITHUB_EVENT_NAME` `repository_dispatch` reads `.action` (GitHub puts the `event_type` there), `.client_payload.title`, `.client_payload.body // ""` and `.client_payload.source // ""` with `jq -r`.
  - An `.action` other than `harness-task` is ignored: one line, exit 0.
  - A missing or empty `title` is a refusal, exit 2, naming the payload shape `{"event_type": "harness-task", "client_payload": {"title": …, "body": …, "source": …}}`.
- [ ] **The shared gates, minus the labeller.** Apply Task 7's refusals 1 (`HARNESS_REMOTE_STOP`) and 2 (`forge` and `execution.target`), then derive with fallback `task_<GITHUB_RUN_ID>`. The snapshot shape is Task 7's, except the provenance sentence:

  ```
  Started by a repository_dispatch event of type `harness-task`<, from <source> when source is set> at <UTC ISO-8601 time>.
  ```

  Then call `start` exactly as Task 7 does.
- [ ] **Feedback.** Every outcome (started with branch and run URL looked up under Task 7's same bound, refused with its reason, or start failed) is appended as a short Markdown block to `GITHUB_STEP_SUMMARY` when that variable is set, and printed to stdout either way. Exit codes are Task 7's.
- [ ] **Header**: extend `trigger`'s paragraph with the dispatch arm, its payload contract, the `client_payload` limits it lives within (at most 10 top-level properties and under 64 KB, T6, so a longer task text does not fit) and the authority statement above. Add one REPRO line for a dispatch event.
- [ ] **`remote-trigger.test.mjs`**: add cases.
  - A `harness-task` dispatch with a title and a body → one `workflow run` for the derived branch, the committed prompt carrying the body and the dispatch provenance line, a step-summary file naming the branch, and no `issue comment` or `issue edit` call.
  - An `.action` of `something-else` → exit 0 and no `gh` call.
  - A payload without `title` → exit 2 and no `workflow run`.
  - An emoji-only title → `task_<GITHUB_RUN_ID>`.

**Verification:**

- `npm test -- test/remote-trigger.test.mjs` from `cli/` passes, with every Task 7 case unchanged.
- `grep -n "harness-task" cli/templates/scripts/remote-run.sh` shows the literal once in code and once in the header's mirror declaration.

**Deviations from plan:**

- The dispatch fields are read through Task 7's `event_field` (`jq -j` with a byte-keeping sentinel) rather than bare `jq -r`, so a body's trailing newlines survive exactly as the issue arm's do; the `// ""` defaults are as planned.
- The empty-`title` refusal runs before refusals 1 and 2, as part of the arm; its way-on names the payload shape through `TRIGGER_DISPATCH_EVENT_TYPE`, so the literal stays at the two sites the grep verification names (the constant and the mirror line, which now carries the value). The header and REPRO spell the event type as `TRIGGER_DISPATCH_EVENT_TYPE` for the same reason.
- A step summary that cannot be appended is one `::warning::` line and does not change the exit code (the issue arm's un-postable comment is 3): the dispatch arm prints every outcome to stdout either way, so its feedback is not lost.
