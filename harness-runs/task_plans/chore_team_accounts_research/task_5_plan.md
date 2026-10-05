### Task 5 — Link the document from the `README.md` and `llms.txt` documents lists and with one sentence each from `docs/remote-execution.md` and `docs/github-run-control.md`

**Goal:** Make the finished research reachable from the places the task prompt names: the two lists that index the documents under `docs/` — `README.md`'s for people and `llms.txt`'s for agents — and — one sentence each, no more — the two documents that describe the credentials a GitHub run uses.

**Depends on:** Task 4, which finishes `docs/team-accounts-research.md` with its `## Summary` (the sharing-and-usage table), `## 5. Options for the harness`, `## 6. Recommendation` and `## 7. Open questions`. The links below point at those headings, so they must exist; check each anchor against the finished file rather than this plan.

**Where this task stops.** It adds two list bullets and two sentences. It does not restate a finding, change any existing sentence, or act on the recommendation: `docs/remote-execution.md` and `docs/github-run-control.md` keep every statement they make today, including the ones the research document comments on (that document names them; these two only point at it). The story index's `## Scope register` lists every site the derivation reached and why the others are `no-change`.

### Targets

- `README.md` — `## Where to read more`, the bullet list of `docs/` documents.
- `llms.txt` — the bullet list of `docs/` documents.
- `docs/remote-execution.md` — `## 9. Credentials and billing`, the paragraph opening **"The terms."**
- `docs/github-run-control.md` — `## The GitHub entry point` → **4. The caveats:**, the bullet opening "Every run uses the repository's one credential secret and is billed to its owner".

**Work:**

- [ ] `README.md`: add one bullet to the `docs/` list under `## Where to read more`, directly after the `docs/github-run-control.md` bullet so the three GitHub documents sit together, in the list's own form — ``- [`docs/team-accounts-research.md`](docs/team-accounts-research.md) — `` followed by a clause naming what it covers: running the harness on GitHub for a team whose members each have their own Claude account — which credentials may be shared, whose usage each consumes, GitHub's options for per-member credentials, three options for the harness and a recommendation.
- [ ] `llms.txt`: add one bullet directly after the `docs/github-run-control.md` bullet, in that file's own form — `- [docs/team-accounts-research.md](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/team-accounts-research.md): ` and the same clause as the README bullet, shortened to the length of its neighbours. The target carries no `#` or `?` (`scripts/check-llms-txt.sh` → `THE CONTRACT`, rule 4), and the file must be tracked when gate 6c runs, which Tasks 1–4's commits already ensure.
- [ ] `docs/remote-execution.md` → `## 9. Credentials and billing`: append one sentence to the end of the **"The terms."** paragraph, pointing a team at [`team-accounts-research.md`](team-accounts-research.md) for whose credential a teammate's run may use and the options it weighs (link `#5-options-for-the-harness` if the heading is exactly `## 5. Options for the harness`).
- [ ] `docs/github-run-control.md` → **4. The caveats:**: append one sentence to the end of the first bullet ("Every run uses the repository's one credential secret and is billed to its owner …"), saying that in a team this means a teammate's run spends that owner's account, and pointing at [`team-accounts-research.md`](team-accounts-research.md) for why and for the alternatives.

**Verification:**

- `git diff -- README.md llms.txt docs/remote-execution.md docs/github-run-control.md` shows exactly two added bullets and two appended sentences, and no removed or reworded text.
- Every link added resolves: the file exists, and each `#anchor` matches a heading in `docs/team-accounts-research.md` as GitHub slugs it.
- Re-running the story index's two derivation commands reaches no site that the `## Scope register` does not list.
- `bash scripts/test.sh`, run without a pipe, fails no gate that does not also fail on the branch's base commit: gate 6a (*no machine paths*) is red in this self-adopted checkout by design (`scripts/run-gates.sh` → the comment above gate 6e), so compare its hits, and no hit may name a file this branch wrote. Gate 6c (*llms.txt links resolve on main*) passes with the new `llms.txt` bullet in it: `bash scripts/check-llms-txt.sh` exits 0 on its own.

**Deviations from plan:**

- The `**Verification:**` bullet asking for `bash scripts/test.sh` and `bash scripts/check-llms-txt.sh` (gates 6a and 6c) is *deferred to the Run gates phase*: under `unit_loop_core.md` → `## The test-run rule` a unit does not run `commands.test` or a gate script. What was run instead: `bash scripts/typecheck.sh` passed. The new `llms.txt` target has no `#` or `?`, and `docs/team-accounts-research.md` is tracked; both were checked by reading, not by running the gate.
- The `#5-options-for-the-harness` anchor in `docs/remote-execution.md` was checked by reading: `docs/team-accounts-research.md` has the heading `## 5. Options for the harness`, which GitHub slugs to that anchor. It was not checked by rendering the page.
