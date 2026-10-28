### 2. The `wrappers` leg table claims every result names the layer that answered, and CS4's line names none

**File:** `scripts/lib/sandbox-probe/core.sh` (`sp_leg_declare wrappers`), at "and every result names the layer that answered". Its restatement is `docs/development.md` → `## 5. Verifying a change`, the Gate 15 leg-table row `` | `wrappers` | CS4, P3, CW2, P1c, CW5, P1b, CW6 | ``, at the same phrase.

**Problem.** Task 1 changed the `wrappers` leg's declared expectation to end *"a measured call refused at the permission layer is not run, and every result names the layer that answered"*. The leg table is the probe's one declaration of what each leg expects. That claim holds for six of the leg's seven rows:

- P3, P1c and CW5 go through `sp__wr_push_held` / `sp__wr_commit_held`, and each appends `call answered by <layer>`.
- CW2 appends it inline.
- P1b carries `$SP__WR_E` from `sp__wr_push_held`.
- CW6's `sp__wr_cw6_grade` appends it on every graded arm.

CS4 does not. `sp__wr_cs4`'s pass line is `commit $before..$commit; push $push_ev; $refresh; clone = main = $clone_now`, and its commit and push `fail` lines name no layer either (`legs-wrappers.sh` → `sp__wr_cs4`, the `sp_result_line wrappers CS4 pass` call). A maintainer reading the rerun's CS4 line against this leg table finds the promised layer missing. CS4 needs none: its pass already requires the commit to have moved the ref and the push to have landed, which only a call that ran can do.

**Fix.** Narrow the clause to the rows that carry a layer. Edit both copies identically in one change. `cli/test/sandbox-probe-git-and-legs.test.mjs` compares them row for row, and the new text carries no `|`, tab or double quote.

In `scripts/lib/sandbox-probe/core.sh`, in the `sp_leg_declare wrappers` description string, replace

```
and every result names the layer that answered
```

with

```
and every P3, CW2, P1c, CW5, P1b and CW6 result names the layer that answered
```

In `docs/development.md`, in the Gate 15 leg-table row for `` `wrappers` ``, make the same replacement in its third cell.

Change nothing else in either line. No test file is edited by this fix, so it asks for no test run of its own.
