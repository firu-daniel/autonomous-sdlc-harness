### Task 3 — Move the slash-spelling measurement into `docs/development.md` §6

**Goal:** Make `docs/development.md` → `## 6. The roadmap this tree defers to` hold the full measured text of the README bullet opening **"Every documented `/autonomous-sdlc-harness:…` slash spelling is interactive-only."** (under `### Measured while building that evidence, and not fixed here`). Merge it into the paragraph that already covers first-message command matching, the one opening **"A third debt belongs to no row at all"**, so the measurement is stated once and that paragraph no longer sends its reader to the README for it.

**Where this task stops.** This task edits only that one paragraph of `docs/development.md`. It does **not** touch `README.md`: Task 6 cuts the README bullet to one or two sentences plus a link to `docs/development.md` → `## 6. The roadmap this tree defers to`. It also does not touch §6's item 9 row, which is Task 7's, or §5, which is Task 9's. Keep the paragraph's bold lead sentence byte-identical, because Tasks 1, 2 and 7 point readers at "the third-debt paragraph" by it.

### Targets

- `docs/development.md` → `## 6. The roadmap this tree defers to`, the paragraph opening **"A third debt belongs to no row at all"**.

**Work:**

- [ ] Replace the sentence *"The root `README.md` measures that exact path under `### Measured while building that evidence, and not fixed here`: on Claude Code 2.1.237, …"* with the measurement stated in place, not cited. Merge it with what the paragraph already says rather than repeating it: the paragraph already has the 2.1.237 `Unknown command` result, the former-slug note and the picker versus first-message distinction.
- [ ] Carry over what the paragraph lacks, verbatim in substance and with each version attached. `claude plugin details autonomous-sdlc-harness@autonomous-sdlc-harness` reports the plugin's entries as **Skills (20)**, and asking for the skill **by name** works first time. The `claude -p` leg was measured under the former slug `harness` and has not been re-run since the rename. What it establishes is slug-independent. On Claude Code 2.1.263, under the current slug: `claude plugin details …` runs, exits 0 and reports **Skills (20)** with `harness-analyze` among them. In an **interactive** session, `/autonomous-sdlc-harness:harness-analyze` resolves in the `/` picker and runs, while bare `harness-analyze` has no picker entry of its own and is fuzzy-matched onto the prefixed one. That is the picker path, not the first-message path.
- [ ] State the adopter consequence in one sentence, without an `item <N>` phrase: the README quick start's `/harness-analyze` step is interactive by construction, and typed into a headless session it gets a refusal with no explanation.

**Verification:**

- Read each sentence of the source bullet from `git show dev:README.md` and name where its fact now stands in this paragraph. A sentence with no home fails the task. The figures `2.1.237`, `2.1.263` and `Skills (20)` each appear in the paragraph.
- `git grep -n -F "Measured while building" -- docs/development.md` prints nothing.
- `grep -rn -E "items? [0-9]+" docs/development.md` reports no number the `dev` version of the file did not already report.
- The paragraph's dated sweep figures ("**80** files when it was last run, on 2026-09-07") are left as they are. The paragraph itself says to re-derive them at sweep time, and this task is not that sweep.
