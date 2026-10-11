### 1. `docs/development.md` §8's final-tree record points into this run's own artifacts and records run-transient state

**File:** `docs/development.md` (`## 8. The nightly supply-chain audit` → `### Measured on the branch's final tree`, and the `**Gate 10, and why it was not re-run in full.**` paragraph) — "see the story index's Manual setup", "Gate 11 on this branch: not yet run, because no Phase G log exists for the branch."

`docs/development.md` is a document of record that ships to `main`. Task 13's subsection is written in this run's own vocabulary rather than the project's:

- "not run by the flow — hand-run step, see the story index's Manual setup" points at `harness-runs/story_plans/chore_supply_chain_nightly_audit_story_plan.md` → `**Manual setup required:**`. That is a run artifact, and `scripts/publish-main.sh` → `removed_paths` strips `harness-runs` from `main`. So on `main` the pointer has no target. On `dev` it names no path either. `.claude/context/conventions.md` → `## Documents of record` says a rule read off `harness-runs/` describes a run, not this project.
- "That script is a gate script (gates 14a–14d), so no unit of the flow runs it" and "no token is built inline" explain the limits of this harness run (the unit loop's no-gate-scripts rule, the literal-command constraint). They say nothing about the project, and a maintainer reading §8 cannot act on them.
- "Gate 11 on this branch: not yet run, because no Phase G log exists for the branch." becomes false as soon as Phase G runs gate 11, and after the merge "this branch" refers to nothing. The sentence before it already says what gate 11 exercises.
- The heading "Measured on the branch's final tree" and the lead "each command below ran once" do not match the blocks under them. Two of those blocks record commands that did not run.

Recording a leg as not run is established practice in this document (the gate-12 rounds do it), so the not-run records stay. Only the run-internal wording and the stale-on-arrival sentence change.

**Fix:** edit `docs/development.md` as follows. Change nothing else in §8.

- [ ] Rename the heading `### Measured on the branch's final tree` to `### Measured on the final tree, 2026-10-11`.
- [ ] Replace its lead sentence `On 2026-10-11, at commit \`d81d81d7\`, under Node \`v22.23.2\`, npm \`10.9.8\` and \`uv 0.12.23\`, each command below ran once from the repository root. Each block holds the command, then the summary line it printed and its exit status.` with:
  `On 2026-10-11, at commit \`d81d81d7\`, under Node \`v22.23.2\`, npm \`10.9.8\` and \`uv 0.12.23\`, each command below was run once from the repository root, or is recorded as not run with its reason. Each block holds the command, then the summary line it printed and its exit status, or why it did not run.`
- [ ] In the block that follows `uvx zizmor@1.30.1 --no-config --format=plain .github`, replace the line `not run: GH_TOKEN was not set in the environment, and no token is built inline` with `not run: no GitHub token was available (GH_TOKEN unset)`.
- [ ] In the block that follows `node scripts/check-rendered-workflows.mjs --zizmor-online`, replace the line `not run by the flow — hand-run step, see the story index's Manual setup` with `not run: no GitHub token was available (GH_TOKEN unset)`.
- [ ] Replace the paragraph `That script is a gate script (gates 14a–14d), so no unit of the flow runs it, and this record is not a pass for the rendered-set online leg.` with:
  `So this record is not a pass for either online pass, over the rendered adopter workflows or over this repository's own \`.github\`. The \`zizmor-online\` job runs both.`
- [ ] At the end of the `**Gate 10, and why it was not re-run in full.**` paragraph, delete the sentence `Gate 11 on this branch: not yet run, because no Phase G log exists for the branch.` and add nothing in its place.

This fix edits prose only and asks for no test run.
