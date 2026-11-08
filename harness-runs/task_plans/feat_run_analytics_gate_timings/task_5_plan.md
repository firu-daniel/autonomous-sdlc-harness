### Task 5 — Widen `branch-status`'s schema check to 1 or 2 and update the run-analytics row of `AUTONOMOUS_FLOW.md`

**Goal:** Keep `/autonomous-sdlc-harness:branch-status` printing its three run-analytics lines for a run whose record now carries Gate rounds. Today it refuses any `schema` other than `1`. Also make the plugin's flow document's one-line description of the run analytics name what they now hold.

**Depends on:** Task 3. From that task on, `run-analytics.sh` writes `schema: 2`, with a top-level `rounds` array, exactly when the record carries a Run gates round, and `schema: 1` otherwise. `.run`, the only object `branch-status` reads, has the same keys and the same values under both (Task 2's `rollup` is unchanged). So the only change here is which schema values are accepted. The three printed lines and the fields they read are untouched.

**Where this task stops.** No plugin file gains a reader of `rounds`, and no new line is printed. Showing gate timings in `branch-status` is not part of this branch.

### Targets

- `plugin/commands/branch-status.md`: the `Run analytics` step's refusal sentence.
- `plugin/docs/AUTONOMOUS_FLOW.md`: the `Run analytics` table row.

**Work:**

- [ ] `plugin/commands/branch-status.md`: in the sentence beginning "A file that does not parse, or whose `schema` is not `1`", change `is not \`1\`` to `is neither \`1\` nor \`2\``. That is the whole edit. Add no rationale and touch no other sentence: the word count grows only by what the widened check needs.
- [ ] `plugin/docs/AUTONOMOUS_FLOW.md`: in the row "Run analytics — each headless session's time, cost and reliability, recorded after every session", extend the left cell to "… recorded after every session, with each finished Run gates round's gate and test-file seconds where the round wrote its own records". Leave the right cell, which names the script's header as the format of record, unchanged.

**Verification:**

- Re-derive the readers of the schema literal: `grep -rn "schema" plugin/commands/branch-status.md plugin/docs/AUTONOMOUS_FLOW.md`. The only schema statement in `branch-status.md` accepts `1` and `2`.
- Run `grep -rn "run-analytics.json" plugin`. No other plugin file states a schema value for that document, so this edit leaves no second reader behind.
- Neither file names a branch, a directory or a command of this repository as a literal: the edited cells keep `<state_dir>` / `<scripts_dir>`.
