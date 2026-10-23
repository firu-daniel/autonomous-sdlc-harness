### 2. No case asserts that the worker marker never reaches a gate, the risk the story index ranks second

**File:** `cli/test/run-test-suite.test.mjs` (`STUB`) — "pwd > ${PWD_RECORD}; printf"; and the case `'the run form detaches: \`pending\` at once while the gate is held, and a later --wait collects'`.

**Problem.** The wrapper reads `RUN_TEST_SUITE_WORKER` and unsets it before anything else (`cli/templates/scripts/run-test-suite.sh` → "worker_marker=\"${RUN_TEST_SUITE_WORKER-}\""). The comment beside that line gives the reason: *"this repository's own suite spawns this wrapper with a gate label."* The story index's second **Top risks:** entry is *"The worker marker leaking into the suite"*: a leaked marker equal to `task_round_1` would make every fixture's run form act as a worker and run the gates in the foreground, so this repository's own Phase G would fail for no real defect. Task 1 checked it once in a scratch probe (`task_1_plan.md` → **Deviations from plan:**, *"A gate run under the label `task_round_1` saw `RUN_TEST_SUITE_WORKER` unset"*). No case in the suite asserts it, so moving or dropping the `unset` line would pass every test.

**Fix.** Do not add a line before line 88. `GATE_MARKER` must stay at lines 82–88, because `docs/work-report-research/test-fix-plan-writer.md` cites `cli/test/run-test-suite.test.mjs:83–85`. Extend the stub's existing line 56 in place:

```js
  `pwd > ${PWD_RECORD}; printf '%s\\n' "$$" > stub-pid.txt; printf '%s\\n' "\${RUN_TEST_SUITE_WORKER-unset}" > stub-env.txt`,
```

Then, in the detach case, after `const waited = await collect(dir);` and its `pass` assertions, add:

```js
  assert.equal(text(dir, 'stub-env.txt'), 'unset\n', 'the worker marker reached the gate');
```

Also add one clause to the file header's rule paragraph (lines 14–17), as part of an existing line so the line count does not change: the worker's marker never reaches a gate. Run the one file this fix edits: `npm test --workspace cli -- test/run-test-suite.test.mjs`, from the repository root, as one plain foreground command.
