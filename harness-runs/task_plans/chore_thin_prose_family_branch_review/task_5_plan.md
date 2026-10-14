### Task 5 — Thin `skeptic-reviewer`'s intro, `## What you are NOT`, its own `## Resolved values` row and `## Invocation contract`

**Goal:** Cut the opening of `plugin/agents/skeptic-reviewer.md` to direct rules stated once:
- the adversarial charter without the escape anecdotes, each of which already survives inside the check it belongs to;
- the de-duplication rule without its restatements;
- the `<deploy_project_id>` row;
- two `## Invocation contract` cells;
- the downstream fix-loop paragraph.

**Depends on:** Task 1, which already deleted this file's delegated-fix sentence and rewrote its `**Re-dispatch on a failed meta-review.**` paragraph. Leave both exactly as Task 1 left them.

**Where this task stops.** It owns these parts of `plugin/agents/skeptic-reviewer.md` only:
- the role paragraph opening `You are the **Skeptic Reviewer**.`;
- the paragraph under `## What you are NOT`;
- the `<deploy_project_id>` row of `## Resolved values`;
- in `## Invocation contract`, the `Output` row and the paragraph opening `Downstream, the split output you write is walked`.

It does not touch:
- the frontmatter;
- the paragraph opening `**You report findings. You do not implement fixes.**`;
- any other `## Resolved values` row or the preamble, all frozen;
- the lead sentence above the dispatch block or the fenced dispatch block;
- any other key-table row;
- the paragraphs opening ``**You create `<findings_folder>` yourself`` and `**Your return is parsed, not read.**`;
- Task 1's re-dispatch paragraph;
- anything from `## Read first` on, which belongs to Task 6.

**Check before you cut the intro.** Each escape the intro lists must already sit in a check of `## Adversarial checks`. Confirm all four before deleting the list:
- the deploy-host typo that passes parity, in check 2's parity leg;
- the encryption write path never called, in check 1;
- the fabricated "prompt point 6", in check 3;
- the optimistic feedback misgraded as an intentional refinement, in check 4.

If one is missing, keep its anecdote in the intro and say so in your return.

**Frozen text in or next to this range** stays word for word:
- the run `Your `tools:` allowlist carries no `Edit`, … The only`;
- the whole `## Resolved values` preamble and every row except `<deploy_project_id>`;
- the key-table header and separator;
- the `index_path` row's `The caller supplies it; you never hardcode it.`;
- the `findings_folder` row;
- the whole paragraph opening ``**You create `<findings_folder>` yourself, and only when you have findings to write.**``;
- in `**Your return is parsed, not read.**`, the opening run `**Your return is parsed, not read.** The caller matches `verdict: PASS` — which` and the sentence opening `So the verdict line must be **exactly** one of those two strings`.

### Targets

- `plugin/agents/skeptic-reviewer.md` → the parts named above.

**Work:**

- [ ] **Intro.** Replace the role paragraph with:
  ``You are the **Skeptic Reviewer**, the **last automated review before QA**, and your posture is **adversarial**: assume the branch is wrong until you have personally verified otherwise. You are a second pass over ground the earlier reviewers already cover, run from the opposite posture. `branch-reviewer` mandates the caller check (check 1), the citation check (check 3) and the two-leg divergence test (check 4) at the same Must Fix grade, but it grades the diff *against* the plan and, when `phases.parity` is `true`, against `<reference_impl>`. You grade both as claims: that the reference is correct, that a cited "prompt point" or deferred-work marker exists and says what the code claims, that new code is reachable. **Your job is to distrust exactly those things.**``
- [ ] **`## What you are NOT`.** Replace its paragraph with:
  ``You are **not** a re-run of `branch-reviewer`'s routine pass (`${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`). Do not re-flag the routine conventions / parity / layering findings that `branch-reviewer`, `business-parity-reviewer` (`${CLAUDE_PLUGIN_ROOT}/agents/business-parity-reviewer.md`) and `architecture-reviewer` (`${CLAUDE_PLUGIN_ROOT}/agents/architecture-reviewer.md`) already filed — hardcoded styling / sizing / copy literals, unit size, wire-name mismatches, a missing required accompanying test, wire-type or mapping placement, simple field and threshold mismatches. **You emit only NET-NEW findings** — issues none of those reviewers actually *raised*. That is a de-duplication rule over their filed findings, not a charter fence: catching what `branch-reviewer`'s pass missed in checks 1, 3 and 4 is your job.``
- [ ] **`<deploy_project_id>` row.** Replace the row with:
  ``| `<deploy_project_id>` | config value | `deploy.target` — the deploy provider's environment or site the generated wrapper deploys to. Check 2 needs it: the identifier is also embedded in the runtime host the application calls, where its short and fully-qualified spellings are not interchangeable. |``
- [ ] **`## Invocation contract`.**
  - Replace the `Output` row with: ``| `Output` | Restates the de-duplication requirement — **net-new findings only** — as part of the contract. |``
  - Replace the paragraph opening `Downstream, the split output you write is walked` with: ``The per-item fix loop of `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The unit loop`, substitution row `C2.4`, reads your index's readiness list and your `finding_<N>.md` files by name: keep both byte-compatible with the shapes `## Findings format` fixes.``
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home:
  - **Charter:** last automated review before QA; adversarial posture; second pass over shared ground from the opposite posture; `branch-reviewer`'s three shared checks at the same Must Fix grade; the plan and reference as claims (reference correct, cited authorization real, new code reachable).
  - **De-duplication:** routine findings the three named reviewers filed are not re-flagged; net-new only; de-duplication, not a charter fence; checks 1, 3 and 4 missed by `branch-reviewer` are in scope.
  - **Contract:** `<deploy_project_id>` is `deploy.target`, used by check 2, with spellings not interchangeable; `Output` restates net-new only; row `C2.4` reads the readiness list and finding files by name, so both stay byte-compatible.

  Restore anything missing in its shortest form.

**Verification:**

- The wire and anchors survive. Run `git grep -n -F -e '<literal>' -- plugin/agents/skeptic-reviewer.md` once per literal below; each run prints at least one line:
  - `## What you are NOT`
  - `<deploy_project_id>`
  - `deploy.target`
  - `### C2.1 Generate the skeptic review`
  - `code_review_index: <code_review_path>`
  - `index_path: <skeptic_review_path>`
  - `findings_folder: <skeptic_review_findings_dir>`
  - `## The unit loop`
  - `` `C2.4` ``
  - `**You emit only NET-NEW findings**`
  - `**last automated review before QA**`
- The frozen texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `433f312c` (`git grep -l -F -e '<string>' 433f312c -- plugin/agents`). Compare the two lists with the `433f312c:` prefix removed; they must match.
  - Do this for each string: `yourself, and only when you have findings to write.**`, `**Your return is parsed, not read.**`, `So the verdict line must be **exactly** one of those two strings`, `The caller supplies it; you never hardcode it.`, `Where the per-finding `finding_<N>.md` files go.`, `and that omission is deliberate: it makes the read-only guarantee a tool-level one rather than a prose request`.
- If `harness-runs/scratch/branch_review_family_check.mjs` is present (Task 1 writes it), read its output for this file. Run `bash scripts/scratch-run.sh harness-runs/scratch/branch_review_family_check.mjs plugin/agents/skeptic-reviewer.md` as one plain foreground command; it prints no `FROZEN`, `LEAD`, `LITERAL` or `SHARED-BLOCK` line, and its last line is `PASS`. If the file is absent, the two checks above stand alone.
- `git diff -- plugin/agents/skeptic-reviewer.md` shows hunks only in the parts this task owns.
- `wc -w plugin/agents/skeptic-reviewer.md`, run before the first edit and again after the last, is lower the second time.
