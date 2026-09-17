### Task 4 — Move the `.claude/` write-wall measurement into `docs/analyze.md` §3 and re-point `docs/config.md` §3

**Goal:** Make `docs/analyze.md` → `## 3. What it may write` hold the full measured text of the README bullet opening **"Any write under a repository's own `.claude/` tree is a supervised action, and no permission entry moves that wall."** (under `### Measured while building that evidence, and not fixed here`). Merge it with that section's existing statement that `/harness-analyze` is a supervised, first-session command. Then point `docs/config.md` §3, which cites the README for this measurement, at the new home.

**Where this task stops.** This task edits `docs/analyze.md` §3 and one citation in `docs/config.md`. It does **not** touch `README.md`: Task 6 cuts the README bullet to one or two sentences plus a link to `docs/analyze.md` → `## 3. What it may write`. `ARCHITECTURE.md`'s citation of the same bullet is Task 7's. Do not rename the `## 3. What it may write` heading, because Tasks 6 and 7 link to it.

### Targets

- `docs/analyze.md` → `## 3. What it may write`, at the paragraph opening **"What that hand-off costs at run time, plainly."**
- `docs/config.md` → `## 3. \`stateDir\``, the paragraph opening **"It must not be a dot-directory."**

**Work:**

- [ ] `docs/analyze.md` §3: after the *"What that hand-off costs at run time, plainly."* paragraph, add one paragraph with a bold lead sentence of its own for the wall. It covers these points. The tool layer treats `.claude/**` as a sensitive path, and evaluates that **ahead of** the permission profile's allow entries. An unattended run's `--permission-mode acceptEdits` does not cover it, and **no `permissions.allow` entry can grant it**, so any fix premised on generating or hand-adding one is wrong before it starts. A first run of this command needs that write access because the conventions documents live there, so the command is bounded by the wall rather than owning it. Measured on Claude Code **2.1.237**: an unattended run completed with **exit 0 having written nothing**, reporting its own targets as blocked, while the identical invocation under a permissions bypass wrote all five documents. Silent success is the shape to expect, so run it interactively and check that the documents changed. Write the version out, because the README's "the same version" relied on the bullet above it.
- [ ] Same paragraph, the closed consequence, in two or three sentences. An unattended run's planner could once schedule a task targeting conventions documents, and such a task parks the run. Both ends are now shut. The corpus is rules-only (`plugin/agents/conventions-writer.md`), and the planner raises an invalidated rule in `## Corpus staleness` instead of scheduling it (`plugin/agents/task-plan-writer.md`). What that removed is the unattended exposure, not the wall.
- [ ] Merge, do not repeat: where the existing *"What that hand-off costs…"* paragraph already says the command is supervised and first-session, the new paragraph cites that and does not say it again.
- [ ] `docs/config.md` §3: replace *"(`README.md` → "Measured while building that evidence, and not fixed here")"* with `docs/analyze.md` §3. Keep the rest of the sentence, including its summary of the measured case, unchanged.

**Verification:**

- Read each sentence of the source bullet from `git show dev:README.md` and name where its fact now stands in `docs/analyze.md` §3 or a file it cites. A sentence with no home fails the task. `2.1.237`, `acceptEdits` and `exit 0` each appear in §3.
- The version is 2.1.237. In the `dev` README, "Measured on the same version" follows the slash bullet, whose own measurement opens *"Measured on Claude Code 2.1.237"*. That bullet's later 2.1.263 runs are described as neighbours re-run under the current slug, not as the wall's measurement. Both versions were already in the initial commit (`2c01123`), so history cannot separate them, and the sentence order is the evidence. The written text must name 2.1.237 and must not say "the same version".
- `git grep -n -F "Measured while building" -- docs/config.md docs/analyze.md` prints nothing.
- `grep -n -E "items? [0-9]+" docs/analyze.md docs/config.md` reports nothing new. The existing *"roadmap item 15's own acceptance criterion 5"* in §9 has a row and is untouched.
- `docs/analyze.md`'s section headings are unchanged: `grep -n "^## " docs/analyze.md` matches the `dev` version of the file.
