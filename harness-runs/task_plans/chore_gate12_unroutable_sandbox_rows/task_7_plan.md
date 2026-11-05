### Task 7 — Test the new RJ2, SB2 and `source`-row grades

**Goal:** Hold `grade`'s new behaviour to `docs/sandbox-verification.md` → `## 10.` → **Reading a result.**:

- RJ2 passes on its refusal and fails when the branch passes the step, then prints one `source` line;
- SB2 passes only when both arms pass, and its `pause-note` arm is graded on what reached the bundle, never on a call's exit;
- SB3 and JS3N each print one `source` line carrying their `--list` note.

**Depends on:**

- **Task 4.** `g12_rj2_arm` runs JS1's refusal checks through `g12_refused_arm RJ2 profile .claude/settings.autonomous.json`. A refusal step concluding `success` is `fail`. `g12_grade_rj2` prints the folded line with JS1's departure (*read through status, not sync …*), then `row="RJ2" result="source"` with evidence beginning `cli/src/generators/writeProtection.ts protectedPaths`.
- **Task 5.** SB2 folds two arms:
  - `clarifications`: the save clause on leaf `/clarifications/<branch>/gate12-link.md`, the bundle, and the next job.
  - `pause-note`, its runs recorded under `arm: "pause-note"` and its token at `.tokens.SB2_PAUSE_NOTE`: a link or the token in its artifact is `fail`; expired is `expired`; `Save the state bundle` `success` with the skip line whose two fields are equal and end `/<stateDir>/PAUSE_PROGRESS.md` is `pass`; neither is `not run`.

  SB2 then prints `row="SB2" result="source"` naming `hr_remote_status_write`. Every `source`-route row (SB3, JS3N) prints `result="source"` with its `--list` note as evidence, and RJ3 still prints `not run` with `hand step: <note>`.

### Targets

- `cli/test/gate12-sandbox-round-grade.test.mjs`

**Work:**

- [ ] RJ2 cases, replacing the three that exist:
  - (a) the JS1-shaped refusal canned for the `profile` arm (refusal step `failure`, run `failure`, later steps skipped, no artifact, the step's own `::error::` line naming `.claude/settings.autonomous.json`, `remote-run.sh status` printing `state: failed`) is `pass`, followed by exactly one `source` line;
  - (b) the refusal step concluding `success` is `fail`, and the plain grade exits 4;
  - (c) the refusal step skipped is `not run`.

  Drop `NOT_LAUNCHING_*` and the launch-line extraction if nothing else uses them.
- [ ] SB2 canned answers: add a `pause-note` run to the state file, with `tokens.SB2_PAUSE_NOTE`, its `Save the state bundle` log line built from the extracted `SKIP_PREFIX` / `SKIP_SUFFIX` around `<root>/<stateDir>/PAUSE_PROGRESS.md` twice, and an artifact holding neither link nor token. Rewrite *"SB2 at its expected shape is not run …"* to expect SB2 `pass`, then one SB2 `source` line naming `hr_remote_status_write`, with SB4 still `pass`.
- [ ] SB2 `pause-note` cases:
  - (d) the pause token in its artifact's `PAUSE_PROGRESS.md` is `fail`, naming that file;
  - (e) no skip line and a clean artifact is `not run`, and the evidence file records the full `Save the state bundle` log;
  - (f) its artifact expired is `expired`;
  - (g) the `clarifications` arm alone failing keeps SB2 `fail` while `pause-note` passes.

  Keep the existing *"only the `remote-run.sh: save: skipped` form … is fail"* case meaning what it says, for the `clarifications` arm.
- [ ] Replace *"the hand rows each print not run with a hand step: note"* with two cases. RJ3 prints `not run` with `hand step: `. SB3 and JS3N each print exactly one `result="source"` line whose evidence equals that row's `--list` note, read from `bash scripts/gate12-sandbox-round.sh --list` output rather than retyped. Update the plain-grade case's expected map so SB2 is `pass` and SB3 and JS3N are `source`, counting only the non-`source` line per row. It still exits 0.
- [ ] Header: restate the rule. Every `hand` row prints `not run` with its note, and every `source` row prints one `source` line with its note. RJ2's refusal is its `pass`. SB2's `pause-note` arm is graded on the bundle's skip line and contents, never on the session's call. Update the shipped-strings list where an extracted string is added or dropped.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs` passes, run from the checkout root as one foreground command.
- Revert Task 5's `pause-note` skip-line check once, so the arm passes on a clean artifact alone. Case (e) fails, then the revert is undone. Record the observed failure in your return.
