`feat_forge_run_control_pr_at_start` lands the design changes the operator decided during Gate 12 round 6 (2026-10-02, CLI 0.6.0, `firu-daniel/harness-gate12`) for run control from GitHub. They are roadmap item 19 (`docs/development.md` → `## 6.`). The round's defects were fixed first, in `fix_forge_run_control_gate12_findings`. Its decisions for items 1 (the `status` command), 8 (the issue's link to the pull request), 9 (the `wrong-ref` job) and 10 (the answer form) stand, and are in `docs/github-run-control.md`. This branch revisits item 8 only as far as opening the pull request at start makes possible (see *Item 8, revisited*). The items keep the operator's working numbers from round 6.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Where an item says *decided*, the behaviour is fixed by the operator and only the mechanism is open.

---

### Item 4 — Open the draft pull request when the run starts; flip it to ready on completion — Medium (design, decided)

- **What:** today `deliver` opens the draft pull request only once the run **completes** (`docs/github-run-control.md` §4–§5). Lifecycle comments use the target rule "PR if one exists, else the issue", so the whole first run is worked on the issue, and the conversation moves to the pull request only after completion.
- **Decision (operator, 2026-10-02):** open the draft pull request when the run starts. A user can already open a pull request from the run's branch by hand, and it is then recognised as the run's (§2 *Which pull requests count*, §4 *A locally executed run gets none*). Opening it at start makes the job do what a user can already do.
- **The fix:**
  - Open the draft pull request (body `Started from #<n>.` plus the commands text) right after the task-prompt commit is pushed: in `start` or the trigger, or at the top of the first `harness run` job. Use the same token rules and the same one ready-PR retry as `deliver`. `deliver` then only reuses the open pull request.
  - **Recognition before the ledger exists.** `forge_recognised` reads the flow-progress ledger at the branch tip, and that ledger is not on `origin` until the flow's first committer push. So a pull request opened at start is not a lifecycle target until then. Decide how a pull request the harness opened is recognised before the ledger lands (for example, the task prompt at the tip, or the `pull-request` marker in its body). Say what that changes for `control_check_branch`.
  - **`completed` goes on the pull request always, and also on the source issue when one exists** (decided). Both get `sdlc-harness: done`. Generalise the target rule: every lifecycle comment goes to the pull request, and the source item (the issue, or a link back to an external ticket) gets `launched` and `completed`. A comment command on the issue keeps working, because it resolves the branch from the `started` comment.
  - **Draft state follows the run (decided).** At start the pull request is a draft. On `completed` the job marks it ready (`gh pr ready <pr>`). When a user-review round starts it turns it back to draft (`gh pr ready <pr> --undo`), and that round's `completed` marks it ready again. A park, a pause or a stop leaves it a draft. Flipping needs `pull-requests: write`. On a plan without drafts (the one-retry fallback), skip the flip and say so in `completed`. A pull request a person marked ready while a run is working is left alone until the next transition. A refused flip is one warning line, never a failure.
  - A run that fails, or is stopped for good, leaves an open draft pull request. The `failed` and `stopped` comments say so (close it, or resume). Closing it stops the run, as `fix_forge_run_control_gate12_findings` made it.
  - Update §4 (*When it opens*, and the "person's step" sentence), the §5 table (with a draft-state column) and the `completed` row, Gate 12 (xiv) legs (d)/(e) to check `isDraft` at each transition, and the stub suites.

### Item 8, revisited — The issue links the pull request from the moment it opens — Low (decided)

- **What:** `docs/github-run-control.md` §4 → *"The issue's link to the pull request is the `completed` comment's URL"*. Round 6 measured that, with the job's token, neither the pull request's `Started from #<n>.` nor a comment naming the pull request puts a `cross-referenced` event on the issue's timeline (§8, *Verified in Gate 12 round 6*). So the native backlink is not available by either direction of mention, and the only link on the issue is a comment the harness posts there. Today that comment comes at the end of the run.
- **Decision (operator, 2026-10-05):** once item 4 opens the pull request at start, the issue gets that link at start too, in a comment the job posts on the issue. The pull request side already links the issue through its body's `Started from #<n>.`.
- **The fix:**
  - When the pull request opens, the issue's comment names it (`#<pr>` and its URL). If the pull request opens before `launched` is posted to the issue, `launched` carries it and no extra comment is posted. Otherwise post one short comment on the issue when it opens, with the same hidden marker and a distinct `event=`. Decide which, from where item 4 opens the pull request.
  - A run started without a source issue (from a pull request, or locally) posts nothing here.
  - The `completed` comment keeps naming the pull request, as it does now.
  - Item 6's first phase comment (planning) goes on the pull request, not the issue, so it cannot carry this link. It may repeat `Started from #<n>.` only if the plan finds a reason to; the body already says it.
  - **Proposal, not decided — the issue's Development panel.** `fix_forge_run_control_gate12_findings` proposed linking through the issue's Development panel, because the branch could be created linked to the issue (GraphQL `createLinkedBranch`) before anything is pushed. Accept or drop it in this plan; it is not part of roadmap item 19. If accepted, verify it against GitHub's documentation and add a §8 row.
  - Update §4's *issue's link* paragraph, the §5 table row for the comment that carries the link, Gate 12 (xiv) leg (a) or (d) to check the issue names the pull request before the run completes, and the stub suites.

### Item 13 — Inline review threads a round addressed are left unresolved when the round completes — Medium (decided)

- **What:** review round 1 on pull request #9 fixed both inline comments it collected (`src/invoiceInput.ts:18`, `src/invoiceLines.ts:20`), and both threads stayed unresolved after the round's `completed` comment. Only inline review **threads** can be resolved. A review's summary body has no thread.
- **Expected (operator, 2026-10-02):** when a round completes, every inline thread whose comment the round collected (the round file's marker `comments=<id,…>`) and whose finding the fix plan **implemented** gets a reply and is resolved.
- **The fix:**
  - At `completed` for a user-review round, find each collected comment's thread: GraphQL `pullRequest.reviewThreads`, matched by a comment's `databaseId`.
  - Read the fix plan's verdict for the finding that comment became. **The fix plan records no comment id per finding today**, so the `user-review-fix-plan-writer` contract (`plugin/agents/user-review-fix-plan-writer.md`) and its fixtures must record which collected comment ids each finding came from. That is a plugin-corpus wire, so grep every reader before changing it.
  - **Fixed:** reply naming the commit ("Addressed in `<sha>`."), then `resolveReviewThread`. **Invalid or out of scope:** reply with the reason and leave the thread unresolved. A thread the reviewer already resolved, or replied to after the round was collected, is left alone. Never dismiss the reviewer's *Changes requested* review.
  - Use the job token (`pull-requests: write`). Verify that `resolveReviewThread` accepts it, and add a §8 row. A refused resolve is one warning line.
  - Update §2/§5, Gate 12 (xiv) leg (e) (check the threads are resolved after the round completes), and the stub suites.

### Item 6 — Short phase-progress comments on the pull request while a run works — Low (granularity decided)

- **What:** between `launched`/`resumed` and `completed`, a run posts nothing for tens of minutes. §5's *The budget is silent* keeps chained continuations quiet on purpose.
- **Decided (operator, 2026-10-02):** only the four big phases, **planning**, **implementation**, **branch review** and **Done**, for both engines (for a user-review round: fix plan, fix implementation, branch review, Done). Branch review covers every end-of-branch review together with its fixes, and is posted once all of that is through. Nothing is posted for sub-steps (A2g, Bm, C2g/C2m/C2f, the Run gates on their own) or for chained budget continuations. Labels are unchanged (`sdlc-harness: running` throughout).
- **Open, for this plan to decide:**
  - **Source of truth:** derive the events from the flow-progress ledger's ticks. The autonomous forks push every commit (`plan_orchestration_instructions_autonomous.md` → `<committer_push>`), so the job's own checkout carries each tick as it lands. The supervision loop in `autonomous-watcher.sh` → `run_job` can read it without any new state, and `report` posts.
  - **Volume:** one comment per boundary, or one status comment edited in place (a checklist that ticks over). This decides whether the phase lines need the hidden marker and a distinct `event=`.
  - **Opt-out:** a configuration switch (for example `forge.progressComments`), default on or off. A new key follows the four-place contract (`schemas/harness.config.schema.json`, `cli/src/config/model.ts`, `cli/src/config/check.ts`, `docs/config.md` §5).
  - **Docs and tests:** a §5 table row, and a Gate 12 (xiv) leg that checks the comments.

### Proposal, not decided — carried from the round's open question, item 10

`fix_forge_run_control_gate12_findings` decided on option (d), a ready-to-copy answer block, and recorded (c) as *not now*. It proposes, for the maintainer to accept or drop, that once the pull request exists from the start option (c) is weighed again. This is not part of roadmap item 19. If accepted: reconsider option (c): each question posted as a pull-request review comment, answered by a threaded reply (`pull_request_review_comment: created`, `in_reply_to_id`). Weigh it against §2's reason for not listening to that event. On an issue the current form stays.

### Acceptance criteria

- **Item 4:** the draft pull request opens with the run, and its draft state follows the run (draft while working, ready on `completed`, back to draft for a round). `completed` is posted on the pull request and on the source issue. The §5 target rule and table are rewritten to match.
- **Item 8:** a run started from an issue names its pull request on that issue as soon as the pull request opens, not only at `completed`.
- **Item 13:** at a round's `completed`, every collected inline thread whose finding was implemented gets a reply naming the commit and is resolved. Threads for invalid or out-of-scope findings get the reason and stay open. The review state is never dismissed.
- **Item 6:** one short comment per main phase (planning, implementation, branch review, done) on the pull request, in the volume the plan decides, with sub-steps and budget continuations silent.
- **Docs and tests:** `docs/github-run-control.md` (§2, §4, §5, §8) and `docs/remote-execution.md` state the new behaviour. Gate 12 (xiv) in `docs/development.md` gains `isDraft` at each transition, the issue's early link to the pull request, resolved threads and phase comments. Every new behaviour resting on an unverified GitHub fact gets a §8 row, and the full test suite passes.
