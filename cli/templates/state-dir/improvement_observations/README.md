# improvement_observations/

One `<state_dir>/improvement_observations/<branch>.md` per branch, holding the harness and workflow problems the runs on that branch actually hit. One file per **branch**, not per run: a later hands-on-review fix round on the same branch appends beneath its own `#` round label rather than overwriting, and a resumed session appends only what that session itself observed, so a branch that went through a fix cycle carries several blocks in one file. The first, unlabelled block is always the delivery run's.

Each block is written by the run's own orchestrator — the only participant that sees a run end to end, which is why the observations would otherwise die with the session — once, near the end of the run, after that run's statistics land and before it reports itself done. **No agent reads it back**, the one exception being a resumed session checking its own file so it does not re-append a block it already wrote. A human folds each intake into the triage ledger at the root of this tree, `<state_dir>/improvement_suggestions.md`, on the default branch; that fold is this directory's only reader, and nothing in the flow keys off the file.

The file is committed and pushed by the run itself, on the run's own branch, near the end of the run's closing phase, with only that run's clarification digest (`<state_dir>/clarification_digests/<branch>.md`) written after it. The step is best-effort and never a gate: a run that observed nothing writes nothing at all, and a write, commit or push that fails is logged while the run finishes unchanged. So an **absent** file means nothing was observed, not that the step failed.

The mistake worth naming is reading the per-branch split as an accident and consolidating it into one shared file. Every parallel run appending to one target at the end of its work is among the most reliable merge-conflict generators there is, and it would re-serialise exactly the parallel runs this tree exists to allow. The intakes are meant to come together at triage — shared, human, and on the default branch — and nowhere earlier.

One block, illustrative rather than real, in the shape every entry takes — as the intake file for the branch `feat/recent_searches_panel` would carry it. The format and the seven category names are fixed by `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## The entry format`; what belongs here is a harness or workflow problem the run hit, never a defect in the work the run was shipping:

```markdown
## The type-check wrapper is gated in a sibling working copy, so two tasks shipped unverified
- **category:** tooling-gap
- **evidence:** the profile entry for the wrapper matches the main checkout's path only, so both dispatches that ran it were denied; both tasks were committed on a review reading alone.
- **cost this run:** two of five tasks carry no type-check result.
- **hypothesis:** (guess) the entry predates runs executing outside the main checkout.
```

Every path an entry names — quoted command output included — is repo-relative: written relative to the checkout it sits in, never with the machine's home directory or a checkout's root in front of it, because this file is committed and merged into the default branch, where a path from one machine means nothing to any other reader and discloses that machine's layout. The run checks the written file for those locations before it commits it, and rewrites any it finds. The rule is `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## The entry format`'s; the check is that file's → `## Commit mechanics`'s.
