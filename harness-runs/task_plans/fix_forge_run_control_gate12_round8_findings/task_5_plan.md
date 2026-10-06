### Task 5 — `control`'s reply after a dispatch records the engine in its marker

**Goal:** Every comment that accompanies a dispatch also records which engine that dispatch named, on the issue or pull request. A later reader can then recover the engine of a run whose job never ran. Gate 12 round 8, finding 3: after round 4's job was never started, `@sdlc-harness resume` was refused with *"the run … records no engine, and the harness does not guess one"*, because the engine is recorded only in the job's own bundle.

**Why only `control`'s replies.** Two dispatching comments already identify their engine by their event:
- the trigger's `started` comment is always engine `task`;
- a `round` comment is always engine `user_review`.

Neither marker may change. `control` finds an issue's branch by the `started` marker's exact bytes (`remote-run.sh` header → `THE BRANCH.`). The one dispatching comment whose engine varies is `control`'s own reply after `resume`, `clear` or `answer`, which dispatch `--engine "$CS_ENGINE"`.

**Depends on:** Task 4, the previous task to edit `cli/templates/scripts/remote-run.sh`.

**Where this task stops.** This task only writes the field. Reading it, to give a never-started run its engine, is **Task 7's**, which `**Depends on:**` this task and parses exactly the form below.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - `forge_marker`;
  - `forge_comment`;
  - `control_post`;
  - the post-dispatch replies in `control_resume_dispatch` and `control_answer`;
  - the header's control reply paragraph, the one ending "Every reply goes to the item the comment was typed on, opens `@<login>`, and carries the `reply` marker".
- `cli/src/remote/githubActions.ts`: the `COMMENT_MARKER` doc comment only. This module owns the marker, and `remote-run.sh` mirrors it (header → `COMMENT_MARKER mirrors COMMENT_MARKER`). No constant value changes.
- `cli/test/remote-control.test.mjs`: assertions on the dispatching replies' marker.

**Work:**

- [ ] **The marker form, the wire Task 7 reads.** `forge_marker <event> <branch> [<question> [<engine>]]` prints:
  - `<!-- sdlc-harness event=<event> branch=<branch> -->` with neither optional value, byte for byte as today;
  - ` question=<n>` before ` -->` when `<question>` is non-empty, as today;
  - ` engine=<engine>` last, before ` -->`, when `<engine>` is non-empty.

  So a dispatching reply's marker reads exactly `<!-- sdlc-harness event=reply branch=<branch> engine=<task|user_review|docs> -->`. `forge_comment <number> <event> <branch> <body_file> [<question> [<engine>]]` passes both through.
- [ ] **`control_post`.** It reads a job-global, `CONTROL_REPLY_ENGINE`, empty by default, and passes it as `forge_comment`'s `<engine>`, with an empty `<question>`. Set the global to `CS_ENGINE` only after a dispatch child exited 0:
  - in `control_resume_dispatch`, which serves `resume` and `clear`, before its `control_post "$done_text"`;
  - in `control_answer`, before its post-dispatch replies, both the "still need an answer" `control_reply` and the "every open question is answered" `control_post`.

  A refusal is never posted with an engine: `control_refuse` runs before any dispatch, or after a failed one, where the global is still empty.
- [ ] **The header paragraph.** After "carries the `reply` marker", add that a reply posted after a successful dispatch adds ` engine=<engine>` to that marker. It is the engine the dispatch named, so a run whose job never ran can still be resumed with it.
- [ ] **The owner's doc comment.** In `cli/src/remote/githubActions.ts`, change the line `COMMENT_MARKER`'s doc comment documents from `<!-- sdlc-harness event=<event> branch=<branch>[ question=<n>] -->` to `<!-- sdlc-harness event=<event> branch=<branch>[ question=<n>][ engine=<engine>] -->`, and state that `engine=` is carried only by a `reply` posted after a successful dispatch. Change no constant value: `COMMENT_MARKER` stays `'<!-- sdlc-harness'`, so the shell mirror and every prefix match are untouched. The owner and the shell header then state one form.
- [ ] **`remote-control.test.mjs`.**
  - A successful `resume` of a paused run whose bundle names `task`: the reply's last line is exactly `<!-- sdlc-harness event=reply branch=feat_x engine=task -->`.
  - A successful `answer`: the same, with the bundle's engine.
  - A refused `resume`, for example on a running run: its marker is `<!-- sdlc-harness event=reply branch=feat_x -->`, with no `engine=`.

  The suite's `replies` filter matches `/<!-- sdlc-harness event=reply /`, so it keeps working. Grep `cli/test` for an exact `event=reply branch=feat_x -->` on a dispatching path and update it. `remote-collect.test.mjs`'s failure-comment assertion is not a dispatching reply, and stays.

**Verification:**

- `npm test --workspace cli -- test/remote-control.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- Grep `cli/src` for `question=<n>]`: every hit is followed on the same line by `[ engine=<engine>]`, and `COMMENT_MARKER`'s value is still `'<!-- sdlc-harness'`.
- Grep `remote-run.sh` for `forge_marker started` and for the trigger's `forge_marker "$event" "$branch"`: both still print the marker with no `engine=`.
