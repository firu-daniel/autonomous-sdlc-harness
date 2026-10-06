### Task 11 — Reword `doctor`'s and `init`'s pull-request-setting messages for a pull request that opens at start

**Goal:** The CLI's own messages still say *"a completed run opens"* its draft pull request. After Tasks 4 and 5 the pull request opens when the run starts, and a run without the Actions setting or `HARNESS_GIT_TOKEN` loses its pull request from the start, not only at completion. Reword every such message so an adopter reads the true timing. The grading itself (warn, note or pass) does not change.

**Where this task stops.** Messages only, in `cli/src`, plus their assertions. No check's grading, no constant and no flag changes. The prose that describes these messages, `docs/cli.md` → the `remote-github` pull-request-setting paragraph and the `forge`-check bullet, is **Task 18's**, which quotes the wording this task writes. This task depends on no other: it changes strings that state behaviour Tasks 4–6 deliver.

### Targets

- `cli/src/doctor/checks.ts` — the `remote-github` pull-request-setting warnings and note (the three strings around `PR_CREATE_SETTING` that say *a completed run*), the doc comment *"`deliver` opens the pull"*, and the `forge` check's summary sentence (*"and a completed run opens a draft pull request"*).
- `cli/src/commands/init.ts` — the numbered step that opens *"A completed run opens a draft pull request with the job's token only once"*.
- `cli/test/doctor.test.mjs` — the two assertions quoting the old wording.

**Work:**

- [ ] `cli/src/doctor/checks.ts`, the `remote-github` strings: replace *a completed run may not be able to open its draft pull request* with *a run may not be able to open its draft pull request when it starts*, *a completed run opens its draft pull request with* with *a run opens its draft pull request with*, and *a completed run cannot open its draft pull request with the job's token* with *a run cannot open its draft pull request with the job's token*. Each remedy clause stays exactly as it is.
- [ ] `cli/src/doctor/checks.ts`, the doc comment and the `forge` summary: the doc comment names the `open` step at the run's start, with `deliver` opening one only when none is open at completion. The summary's *and a completed run opens a draft pull request* becomes *and a run opens a draft pull request when it starts, marked ready for review when it completes*.
- [ ] `cli/src/commands/init.ts`: the step's first sentence becomes *A run opens its draft pull request when it starts, with the job's token only once "…" is switched on under …*. The rest of the sentence (the `GIT_TOKEN_SECRET` alternative, the author cost, `USER_REVIEW_COMMAND`) is unchanged, and the output stays plain ASCII through `ctx.report`.
- [ ] `cli/test/doctor.test.mjs`: update the two assertions that quote *a completed run opens its draft pull request with HARNESS_GIT_TOKEN* and *a completed run opens a draft pull request* to the new wording above, keeping each assertion's grading check as it is.

**Verification:**

- `npm test --workspace cli -- test/doctor.test.mjs` passes, run once from the repository root as one plain foreground command.
- `bash scripts/typecheck.sh` passes.
- Grep `cli/src` for `completed run opens` and `completed run may not` and `completed run cannot` and find nothing.
