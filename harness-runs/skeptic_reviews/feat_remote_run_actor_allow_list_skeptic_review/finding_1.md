### 1. A re-run of a trigger or control job lets an unlisted writer spend the credential, because the scripts check the event's original sender

**Files:**
- `cli/templates/scripts/remote-run.sh`: `verb_trigger`, at the comment "# A dispatch's `User` sender is held to the allow-list with no permission"; `verb_control`, at `authorise_actor "$CONTROL_ACTOR" "$CONTROL_SENDER_TYPE" || status=$?` directly after the `forge`/`target` refusal; `run_actor_listed`, which the new function sits beside.
- `cli/test/remote-trigger.test.mjs`: `triggerFixture`'s `trigger:` and `dispatch:` builders, and the test `a dispatch whose sender carries no type fails closed unless the list is *`.
- `cli/test/remote-control.test.mjs`: `controlFixture`'s `control:` builder, and the test `HARNESS_RUN_ACTORS entries are trimmed and matched case-insensitively`.
- `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, the paragraph starting "The **Run workflow** form, `gh workflow run` and a re-run reach no comment check".
- `docs/remote-execution.md` → `## 11. Security`, the paragraph starting "**Who can spend the credential.**"

**The problem.** The task prompt names a re-run as a route that must not spend the owner's credential. Its `## Why` says: *"They can do it through the trigger, the comment commands, a review round, the **Run workflow** form, `gh workflow run` or a re-run."* Its goal item 4 says: *"A person's dispatch or re-run carries that person's login in `triggering_actor`. That login must be on the list."*

The branch screens `github.triggering_actor` only in `harness-run.yml`'s `run` and `collect` jobs. A re-run of a **`harness-trigger.yml`** or **`harness-control.yml`** run gets past that gate, and nothing else checks it:

1. A re-run replays the original event. G2 quotes GitHub: *"Re-runs use the privileges of the actor who initially triggered the workflow"* and *"the same `GITHUB_SHA` … and `GITHUB_REF` … of the original event"*. The prompt's measured table (row *"Re-run by `expause-admin` of a run first started as `firu-daniel`"*) shows `actor` staying `firu-daniel`. So the event file still names the original labeller or commenter.
2. `verb_trigger` reads `.sender.login` / `.sender.type` and `.issue.state` from that event file. `verb_control` reads `CONTROL_ACTOR` and `CONTROL_SENDER_TYPE` from it the same way. `authorise_actor` → `run_actor_listed` therefore checks the **original** actor, whom the list admits. Neither script reads `GITHUB_TRIGGERING_ACTOR` or `GITHUB_RUN_ATTEMPT`: `grep -n -E 'GITHUB_RUN_ATTEMPT|GITHUB_TRIGGERING_ACTOR|triggering_actor' cli/templates/scripts/remote-run.sh` returns nothing.
3. Each script then dispatches `harness-run.yml` with `GH_TOKEN: ${{ github.token }}`. The run's `triggering_actor` is `github-actions[bot]`, which the gate step passes by design (`THE RUN-ACTOR GATE`: *"`github-actions[bot]` passes"*).

**What happens.** With `HARNESS_RUN_ACTORS` unset in a user-owned repository, writer `bob` is not on the list.

- **Trigger re-run.** `bob` re-runs any trigger run the owner started by labelling an issue in the last 30 days. The payload still says `state: open` and `sender: owner`, so the run passes. `hr_derive_branch` gives the taken name a suffix (`<branch>_2`), and `start` dispatches a new run on the owner's subscription.
- **Control re-run.** `bob` re-runs the control job of an owner's `@sdlc-harness resume` comment while the run is `paused`. `control_resume` → `control_resume_dispatch` dispatches the resume.

Either way the run is spent on the owner's subscription, which is exactly what the branch exists to prevent. Re-running a workflow needs only write access, which `bob` has.

**Why this is not covered by the documented residual risk.** The residual risk is a writer who **edits a workflow** (G7). This route edits nothing: it uses GitHub's **Re-run** button on the shipped workflows. Two docs on this branch also state the opposite of what happens:

- `docs/github-run-control.md` §6 says re-runs *"reach no comment check"*, and that the run job's gate covers them.
- `docs/remote-execution.md` §11 says *"Only the people the allow-list `HARNESS_RUN_ACTORS` admits"* can spend the credential.

**Fix.**

- [ ] In `cli/templates/scripts/remote-run.sh`, directly after `run_actor_listed`'s closing `}`, add:

  ```bash
  # rerun_actor_listed — 0 unless this job is a re-run (GITHUB_RUN_ATTEMPT above
  # 1) whose GITHUB_TRIGGERING_ACTOR is neither `github-actions[bot]` nor
  # admitted by run_actor_listed; then 1, with RUN_ACTORS_WHY naming the
  # re-runner. A re-run replays the original event, whose sender is the person
  # who first acted, so authorise_actor alone would check the wrong account.
  rerun_actor_listed() {
    local attempt="${GITHUB_RUN_ATTEMPT-}" who="${GITHUB_TRIGGERING_ACTOR-}"
    RUN_ACTORS_WHY=""
    case "$attempt" in ''|*[!0-9]*) return 0 ;; esac
    [ "$attempt" -gt 1 ] || return 0
    [ "$who" != 'github-actions[bot]' ] || return 0
    run_actor_listed "$who" && return 0
    RUN_ACTORS_WHY="this job is a re-run by @${who:-(no actor)}, and the re-runner is checked rather than the event's sender: $RUN_ACTORS_WHY"
    return 1
  }
  ```

- [ ] In `verb_trigger`, directly after the `forge`/`target` refusal's `fi` and before the comment "# A dispatch's `User` sender is held to the allow-list with no permission", add:

  ```bash
    # A re-run replays the event's sender; the re-runner is held to the list.
    if ! rerun_actor_listed; then
      trigger_refuse "$RUN_ACTORS_WHY" \
        "Only a person the repository variable \`HARNESS_RUN_ACTORS\` admits may re-run this job; one of them can $retry_then."
    fi
  ```

- [ ] In `verb_control`, directly after the `forge`/`target` refusal's `fi` and before `status=0` / `authorise_actor "$CONTROL_ACTOR" "$CONTROL_SENDER_TYPE"`, add the following. A close never reaches this point, because `control_close` exits before it.

  ```bash
    if ! rerun_actor_listed; then
      control_refuse "$EXIT_REFUSED" "${RUN_ACTORS_WHY%.}" \
        "Only a person the repository variable \`HARNESS_RUN_ACTORS\` admits may re-run this job; one of them can comment again."
    fi
  ```

- [ ] In the script header, in the `trigger` paragraph, directly after the line `# Refusals 4 to 7 are \`authorise_actor\`, the one actor check \`control\` reuses.`, add:

  ```
  # Before them, after refusal 2, a re-run (GITHUB_RUN_ATTEMPT above 1) whose
  # GITHUB_TRIGGERING_ACTOR is not `github-actions[bot]` and is not admitted by
  # `HARNESS_RUN_ACTORS` is refused (`rerun_actor_listed`), on both event kinds:
  # a re-run replays the event, so its sender is whoever first acted.
  ```

  In the `control` refusal list, directly after the entry `#   2. \`forge_on\` fails — before any authorisation, so a disabled coupling asks` and its continuation line, add:

  ```
  #      then a re-run whose GITHUB_TRIGGERING_ACTOR `rerun_actor_listed`
  #      refuses, before the event's own actor is checked
  ```

- [ ] In `cli/test/remote-trigger.test.mjs`, add `GITHUB_RUN_ATTEMPT: ''` and `GITHUB_TRIGGERING_ACTOR: ''` to the env object of both the `trigger:` and the `dispatch:` builder, beside `HARNESS_RUN_ACTORS: '*'`. A CI re-run's own environment must not reach the fixtures. Then, after the test `a dispatch whose sender carries no type fails closed unless the list is *`, add:

  ```js
  test('a re-run by a person HARNESS_RUN_ACTORS does not admit is refused, whoever the event names', async (t) => {
    const rerun = { HARNESS_RUN_ACTORS: 'alice', GITHUB_RUN_ATTEMPT: '2' };

    const f = await triggerFixture(t);
    const calls = assertRefused(f, await f.trigger({}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'bob' }), /re-run by @bob/);
    assert.deepEqual(permissionCalls(calls), []);

    const g = await triggerFixture(t);
    const listed = await g.trigger({}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'Alice' });
    assert.equal(listed.status, 0, `${listed.stdout}\n${listed.stderr}`);
    assert.equal(dispatches(g.calls()).length, 1);

    const h = await triggerFixture(t);
    const bot = await h.trigger({}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'github-actions[bot]' });
    assert.equal(bot.status, 0, `${bot.stdout}\n${bot.stderr}`);
    assert.equal(dispatches(h.calls()).length, 1);

    const d = await triggerFixture(t);
    const dispatched = await d.dispatch(
      { action: 'harness-task', client_payload: { title: TITLE, body: 'x' }, sender: { login: 'helper[bot]', type: 'Bot' } },
      { ...rerun, GITHUB_TRIGGERING_ACTOR: 'bob' },
    );
    assert.equal(dispatched.status, 2, `${dispatched.stdout}\n${dispatched.stderr}`);
    assert.deepEqual(dispatches(d.calls()), []);
    assert.match(d.summary(), /re-run by @bob/);
  });
  ```

- [ ] In `cli/test/remote-control.test.mjs`, add `GITHUB_RUN_ATTEMPT: ''` and `GITHUB_TRIGGERING_ACTOR: ''` to the `control:` builder's env object, beside `HARNESS_RUN_ACTORS: '*'`. Then, after the test `HARNESS_RUN_ACTORS entries are trimmed and matched case-insensitively`, add:

  ```js
  test('a re-run of a command by a person HARNESS_RUN_ACTORS does not admit is refused', async (t) => {
    const rerun = { HARNESS_RUN_ACTORS: 'alice', GITHUB_RUN_ATTEMPT: '2' };

    const f = await controlFixture(t);
    const result = await f.control('@sdlc-harness pause', {}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'bob' });
    assertRefused(f, result, /re-run by @bob/);
    assert.deepEqual(permissionCalls(f.calls()), []);

    const g = await controlFixture(t);
    const listed = await g.control('@sdlc-harness pause', {}, { ...rerun, GITHUB_TRIGGERING_ACTOR: 'alice' });
    assert.equal(listed.status, 0, `${listed.stdout}\n${listed.stderr}`);
    assert.deepEqual(dispatches(g.calls()).map((call) => call.line), [PAUSE_DISPATCH]);
  });
  ```

- [ ] In `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, find the sentence starting "The **Run workflow** form, `gh workflow run` and a re-run reach no comment check, so". Replace its opening clause, up to "so", with: "The **Run workflow** form and `gh workflow run` reach no comment check, and a re-run replays its event's original sender, so". Leave the rest of the sentence unchanged. Directly after that sentence, add: "A re-run of a trigger or control job is held to the list by its re-runner too: `remote-run.sh` refuses one whose `GITHUB_TRIGGERING_ACTOR` the list does not admit, before it checks the event's own actor."

- [ ] In `docs/remote-execution.md` → `## 11. Security`, in the **Who can spend the credential.** paragraph, directly after the sentence ending "`github-actions[bot]`, which every harness dispatch names, passes.", add: "A re-run of a trigger or control job replays the original event, whose sender the list already admitted, so `remote-run.sh` also holds that job's `GITHUB_TRIGGERING_ACTOR` to the list on any attempt after the first."

The test files this fix edits are `cli/test/remote-trigger.test.mjs` and `cli/test/remote-control.test.mjs`, so those are the only suites it runs.

**Deviations from plan:**
- The `cli` layer dispatch landed the script and the two test-file items. The two `docs/` items (`docs/github-run-control.md` §6 and `docs/remote-execution.md` §11) are outside the `cli` path scope and were not edited here; they need the `general` layer's dispatch.
- The `general` layer dispatch landed both `docs/` items as written. It edited no test file, so the two suites named above were not run by it — deferred to the Run gates phase.
