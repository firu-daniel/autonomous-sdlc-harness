### 3. The command-refusal reply says an unset list admits "the repository owner alone", which contradicts its own reason in an organisation-owned repository

**File:** `cli/templates/scripts/remote-run.sh` (`verb_control`) — "whom the repository variable \`HARNESS_RUN_ACTORS\` admits (when unset, the repository owner alone)"

When `authorise_actor` refuses a commenter or a reviewer, `verb_control` replies with two parts: `AUTH_WHY`, then a fixed sentence saying who may command a run. That fixed sentence says an unset list admits "the repository owner alone". In an organisation-owned repository, `AUTH_WHY` is the `run_actor_listed` sentence instead: *"the repository variable HARNESS_RUN_ACTORS is unset, and this repository has no single owner to admit (its owner is Organization), so it admits nobody until it names the logins allowed, or * for every writer."* So one reply says both "admits nobody" and "admits the repository owner alone".

An organisation admin reading that reply may take "the repository owner" to mean the organisation's owners, and retry. That retry is refused again.

**Fix:**

- [ ] In `verb_control`, replace the second argument of the `authorise_actor` refusal's `control_refuse` call with:

  ```bash
      "Only a collaborator with write, maintain or admin access whom the repository variable \`HARNESS_RUN_ACTORS\` admits (when unset, the owner alone of a repository a personal account owns, and nobody in an organisation-owned one), or a bot listed in \`HARNESS_TRIGGER_ALLOWED_BOTS\`, commands a run."
  ```

- [ ] In `cli/test/remote-control.test.mjs` → the test `a write commenter HARNESS_RUN_ACTORS does not admit is refused naming the list`, change the second `assert.match` on `reply.body` to the new wording:

  ```js
  assert.match(reply.body, /whom the repository variable `HARNESS_RUN_ACTORS` admits \(when unset, the owner alone of a repository a personal account owns, and nobody in an organisation-owned one\)/);
  ```

  `cli/test/remote-control-review.test.mjs` matches only the prefix `whom the repository variable `HARNESS_RUN_ACTORS` admits`, so it needs no change.

The only test file this fix edits is `cli/test/remote-control.test.mjs`, so that is the only test it runs.
