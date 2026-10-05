### Task 2 — Check the allow-list in `remote-run.sh` → `authorise_actor` and the trigger, a `repository_dispatch` sender included

**Goal:** Make `authorise_actor` accept a person only when they hold `write` or `admin` **and** `HARNESS_RUN_ACTORS` admits them. Make the trigger's `repository_dispatch` path refuse a person the list does not admit. Every existing script suite keeps asserting today's behaviour by setting the list to `*`.

**Depends on:** Task 1, for the name only. `cli/src/remote/githubActions.ts` exports `RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS'`, which this script mirrors byte for byte. Nothing here imports TypeScript.

**Where this task stops.**
- **Task 3** rewrites the refusal *replies* of `control`, the close path and `collect`, and adds those paths' own allow-list cases. After this task, those paths already refuse through `authorise_actor`'s new status `5`, through their existing non-zero / `*)` arms.
- **Tasks 4 and 5** pass the variable into the workflows. Until they land, a job reads it as unset.
- No workflow file is edited here.

### Targets

- `cli/templates/scripts/remote-run.sh`: a new helper, `authorise_actor`'s new arm, the trigger's dispatch check and refusal arm, and the header paragraphs named below.
- `cli/test/remote-trigger.test.mjs`: the environment builders and new cases.
- `cli/test/remote-control.test.mjs`, `cli/test/remote-control-close.test.mjs`, `cli/test/remote-control-review.test.mjs`, `cli/test/remote-collect.test.mjs`: one line in each environment builder.

**The list's grammar** (story index `## Context`, restated):
- **Parsing.** `HARNESS_RUN_ACTORS` is split on `,`, each entry trimmed, empty entries dropped.
- **Matching.** Case-insensitive.
- **`*`.** An entry `*` admits every writer.
- **No entries.** No entries counts as unset. An unset list admits the repository owner alone when the event file's `.repository.owner.type` is `User`, the owner being `.repository.owner.login`. Otherwise it admits nobody: an `Organization`, or a field that is missing or unreadable. That case fails closed.
- **Portability.** Lowercase with `tr '[:upper:]' '[:lower:]'`, never `${x,,}`: the script's tests run under the bash 3.2 floor too.

**Work:**

- [ ] **The helper and the new arm.** Add a helper beside `trigger_bot_listed`: `run_actor_listed <login>`.
  - It returns 0 when the list admits `<login>` under the grammar above, and 1 otherwise.
  - On 1 it sets `RUN_ACTORS_WHY` to one sentence. The three forms:
    - list set: *"@<login> is not on the repository variable HARNESS_RUN_ACTORS, the allow-list of who may start, command, answer or review a run."*
    - unset, `User` owner: *"@<login> is not the repository owner, and the repository variable HARNESS_RUN_ACTORS is unset, which admits the owner, @<owner>, alone."*
    - unset, any other owner: *"the repository variable HARNESS_RUN_ACTORS is unset, and this repository has no single owner to admit (its owner is <type or 'unreadable'>), so it admits nobody until it names the logins allowed, or * for every writer."*
  - It reads the owner from `$GITHUB_EVENT_PATH` with `jq`, as data, never shell source, and only when the list is unset. A missing event file means unset-and-unreadable, which refuses.

  Then add the arm to `authorise_actor`, **after** the permission call succeeds with `admin|write`. A person who passes the permission check but fails `run_actor_listed` returns **status 5**, with `AUTH_WHY="$RUN_ACTORS_WHY"`. The order stays: shape (1), bot list (2, unchanged; bots never consult `HARNESS_RUN_ACTORS`), permission call failed (4, still fail-closed), permission not write (3), then list (5). Update the function's comment to list status 5 and say why the list comes after the permission call: a non-writer's refusal keeps naming write access, and the list refusal is kept for a writer the maintainer has not named.
- [ ] **The trigger.**
  - **Issue path.** In `trigger`'s `case "$status"` after `authorise_actor`, add an explicit `5)` arm before `*)`. It calls `trigger_refuse "$AUTH_WHY"` with a way on: add the login to the comma-separated `HARNESS_RUN_ACTORS`, or set `*` for every writer, then re-apply the label.
  - **Dispatch path.** Read `.sender.login` and `.sender.type` with `event_field`. When the list is not `*`:
    - a `User` sender that `run_actor_listed` refuses is refused with `trigger_refuse` (step summary, no `gh` call, no permission call);
    - an empty or missing sender type is refused too, because it fails closed;
    - a non-`User` sender is unchanged.

    Place this check after the `HARNESS_REMOTE_STOP` and forge/target refusals, so a disabled trigger still asks nothing.
- [ ] **The header paragraphs**, in the same edit:
  - the `trigger` environment list: add `HARNESS_RUN_ACTORS` with one line of meaning, and the event-file owner fields;
  - the refusal order (`Refusals 4 to 6 are authorise_actor`): add the list refusal as item 7, and make it *"Refusals 4 to 7"*;
  - the `repository_dispatch` sentence *"the token holder is the authority, and refusals 3 to 6 do not apply"*: state the new `User`-sender list check and its fail-closed case;
  - `MIRRORS OF cli/src/remote/githubActions.ts`: add `HARNESS_RUN_ACTORS mirrors RUN_ACTORS_VARIABLE`.
- [ ] **`remote-trigger.test.mjs`.**
  - Add `HARNESS_RUN_ACTORS: '*'` to both the `trigger` and the `dispatch` environment builders, beside `HARNESS_TRIGGER_ALLOWED_BOTS: ''`, so every existing case keeps today's meaning.
  - Add these cases. Each overrides the variable and, where the case needs one, adds `repository: { owner: { login, type } }` to the event:
    - (a) a `write` labeller not on `'bob, carol'` is refused: the comment names `HARNESS_RUN_ACTORS`, no `workflow run` is sent, and the permission call **was** made;
    - (b) the labeller written as `' Alice ,bob'` starts a run;
    - (c) unset, owner `{login: 'alice', type: 'User'}`: `alice` starts, and a `write` `bob` is refused with a comment naming `@alice`;
    - (d) unset, owner type `Organization`: a `write` labeller is refused, and the comment says to set the list or `*`;
    - (e) unset, with no `repository` in the event: refused;
    - (f) a `read` labeller listed in the variable is still refused, naming write access;
    - (g) a dispatch whose sender is a `User` not on the list is refused in the step summary, with no dispatch; a listed `User` sender starts; a `Bot` sender starts under a non-`*` list.
  - Extend the file's header *"The rule these tests exist to enforce"* with the allow-list.
- [ ] **The other four suites.** Add `HARNESS_RUN_ACTORS: '*'` beside `HARNESS_TRIGGER_ALLOWED_BOTS: ''` in each environment builder of `remote-control.test.mjs`, `remote-control-close.test.mjs`, `remote-control-review.test.mjs` and `remote-collect.test.mjs`. Change nothing else there; Task 3 adds their own cases.

**Verification:**

- Run the five edited test files from `cli/`, one by one, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3), with `npm test -- test/<name>.test.mjs`. Every existing case still passes under `*`, and cases (a)–(g) pass.
- `bash -n cli/templates/scripts/remote-run.sh` parses. Grep the script for `,,}` and `^^}`, and find no lowercase or uppercase expansion.
- Grep the script for `HARNESS_RUN_ACTORS`. Every occurrence is in the header, in `run_actor_listed`, or in a refusal's way-on text. No second parser of the list exists.

**Deviations from plan:**
- `bash -n cli/templates/scripts/remote-run.sh` was refused by the permission layer in this session (twice, absolute and relative path). The parse claim rests on execution instead: the five edited suites run the script under `bash` and passed (trigger 37/37, control 66/66, control-close 14/14, control-review 31/31, collect 10/10).
- The dispatch path's "list is not `*`" test for an empty sender type is `run_actor_listed ""`, which `run_actor_listed` documents as admitted by `*` alone, so the trigger holds no second parser of the list. Its refusal reason names no variable; the variable is in the way-on text.
- One case beyond (a)–(g): a dispatch whose sender carries no type is refused under a non-`*` list, covering the fail-closed sub-bullet.
- `authorise_actor`'s comment says "the run-actor list" rather than the variable name, and `run_actor_listed`'s comment names no `${x,,}` literal, so the two verification greps hold.
