### 3. The closing check's deliberate-leftover list misses three kept lines, so its post-cutover invariant cannot hold

**File:** `harness-runs/task_plans/chore_devscene_adopter_layout/task_35_plan.md` — the `**Verification — the closing check:**` bullet, item `(e) a deliberate leftover:`

The task prompt's *Done when* says *"The report lists any deliberate leftovers."* The cutover record's step 5 tells the maintainer to re-run the closing check and expect that *"it prints only (d) and (e)"*. When it ran, the closing check printed three hits that neither (a)–(d) nor (e) covers (Task 35's own deviation note, *"it printed three paths that fall outside (a)–(e)"*). Two of them are correct to keep, and the plan's own rules say so:

- `cli/templates/scripts/remote-run.sh`. Its header line `# remote-run.sh — every call from this machine to GitHub for a harness run: the` and its comment `` a listed `devscene run <b>` run is what proves a harness run. `` both use *"harness run"* as a noun phrase, which the story's spelling-table row 12 keeps (*"Prose using "harness run" as a noun phrase … is not a title and stays"*). After the cutover, `scripts/remote-run.sh` becomes a byte copy of this template, so it prints the same two lines.
- `docs/rag-extraction-research/07-extraction-plan.md`, the line *"straightedge's `.claude/CLAUDE.md` still carries the `harness:setup-pending` block"*. It records what another repository's file contained when it was measured. Respelling it would make the record false, which is exactly the reason the plan kept the two lines of `docs/rag-extraction-research/reviews/07-extraction-plan.md` (story `## Context` → *What keeps its current spelling*, the `07-extraction-plan.md` bullet).

The third hit, `githooks/pre-push`, is Finding 2 and goes away once that fix lands.

The list is incomplete, so a maintainer who follows the cutover record will see its invariant fail on lines the plan meant to keep.

**Fix:** extend item `(e)` of the closing-check bullet in `task_35_plan.md` with the three kept lines, using the form the item already uses. Append these to its list:

```markdown
`cli/templates/scripts/remote-run.sh` and, after the cutover, `scripts/remote-run.sh` (the header's *"for a harness run: the"* and the *"is what proves a harness run."* comment, row 12 noun-phrase prose), and `docs/rag-extraction-research/07-extraction-plan.md` (the *"still carries the `harness:setup-pending` block"* line, a recorded observation of another repository's file)
```

Change nothing else in that file. Do not touch the `## Cutover record` or `## Paste record` steps, or the `**Deviations from plan:**` notes.
