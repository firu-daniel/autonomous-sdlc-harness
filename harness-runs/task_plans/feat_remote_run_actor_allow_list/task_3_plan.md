### Task 3 — Name the allow-list in the control, close and collect refusals, and test each path against it

**Goal:** A comment command, an answer, a review, a close or a review round's collection by a writer the list does not admit is refused. The refusal names `HARNESS_RUN_ACTORS` and the way on. The suites for those four paths drive that refusal.

**Depends on:** Task 2. In `cli/templates/scripts/remote-run.sh` it added:
- `run_actor_listed <login>`: 0 admitted, 1 refused, with `RUN_ACTORS_WHY` set;
- `authorise_actor` status **5**: a person with `write` or `admin` whom the list does not admit, with `AUTH_WHY` holding the sentence;
- `HARNESS_RUN_ACTORS: '*'` in every environment builder of the four suites below.

This task consumes that contract and does not change it.

**Where this task stops.**
- The `trigger` arm and the `repository_dispatch` check are Task 2's.
- Passing the variable into `harness-control.yml` is Task 5's, and into `harness-run.yml`'s `collect` job is Task 4's.
- **A branch deletion stays screened for bots only.** Deleting a branch already needs write access, the run's branch is gone, and a stop spends no credential (story index, *A close is screened, a branch deletion is not*). Do not add a list check to the `CLOSE_KIND = deleted` arm. State the reason in its header line instead.

### Targets

- `cli/templates/scripts/remote-run.sh`: `control`'s command-path refusal reply, and the header paragraphs for `control`, the close and `collect`.
- `cli/test/remote-control.test.mjs`, `cli/test/remote-control-review.test.mjs`, `cli/test/remote-control-close.test.mjs`, `cli/test/remote-collect.test.mjs`: new cases.

**Work:**

- [ ] **`remote-run.sh`, the command path.** In `control`, the `control_refuse` after `authorise_actor` fails carries the way-on sentence *"Only a collaborator with write, maintain or admin access, or a bot listed in the repository variable `HARNESS_TRIGGER_ALLOWED_BOTS`, commands a run."* Make it: *"Only a collaborator with write, maintain or admin access whom the repository variable `HARNESS_RUN_ACTORS` admits (when unset, the repository owner alone), or a bot listed in `HARNESS_TRIGGER_ALLOWED_BOTS`, commands a run."* The reason line is already `AUTH_WHY`, which names the list for status 5. The review path shares this refusal, so a review by an unlisted writer gets the same reply.
- [ ] **`remote-run.sh`, the header.** Update three paragraphs:
  - **`control`.** In its refusal order, item 3 (*"`authorise_actor` fails: `AUTH_WHY`, and who may command a run"*), add the allow-list.
  - **`collect`.** In the paragraph that says *"every author `authorise_actor` accepts"*, add the allow-list. Also say that an author the list refuses has their items dropped with one line, as any refused author's are, while a failed permission call (status 4) still fails the collection.
  - **The close.** Say that a close by a writer the list refuses is ignored with one line, and that a deletion screens bots only, with the reason above.
- [ ] **`remote-control.test.mjs` and `remote-control-review.test.mjs`.** Override `HARNESS_RUN_ACTORS` per case:
  - `remote-control.test.mjs`:
    - a `write` commenter not on `'alice'` is refused with exit 2;
    - the reply names `HARNESS_RUN_ACTORS`;
    - no dispatch is sent;
    - a commenter written as `' ALICE '` with `'alice'` set is obeyed.
  - `remote-control-review.test.mjs`: a `changes_requested` review by an unlisted writer places no round and is refused naming the list.
- [ ] **`remote-control-close.test.mjs`.** A close of the run's issue by an unlisted `write` user sends no `stop`, and logs the ignore line naming the list. The same close by a listed user stops the run. A branch deletion by an unlisted user still stops it, which asserts the deliberate boundary above.
- [ ] **`remote-collect.test.mjs`.** With `HARNESS_RUN_ACTORS='alice'`, pending reviews from `alice` and from a `write` `bob`:
  - the round carries `alice`'s items only;
  - the output has the `dropped … item(s) by @bob` line naming the list;
  - `alice`'s round is still dispatched.

  Also extend the file's header rule to say a refused author includes one the list refuses.

**Verification:**

- Run the four edited test files from `cli/`, one by one, with `npm test -- test/<name>.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). The new cases pass, and every existing case still passes under the `'*'` default Task 2 set.
- `bash -n cli/templates/scripts/remote-run.sh` parses.
- Grep the script for the old way-on sentence's fragment `or a bot listed in the repository variable`. Each remaining occurrence also names `HARNESS_RUN_ACTORS`, or is the trigger's bot refusal, which is about bots alone.
