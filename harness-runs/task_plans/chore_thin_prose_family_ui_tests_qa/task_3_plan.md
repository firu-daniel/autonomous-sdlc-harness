### Task 3 — Thin `ui-tests-plan-writer`'s `## Process` and `### Test data`

**Goal:** Cut `## Process` and `### Test data — the QA accounts (use this when wording account preconditions)` of `plugin/agents/ui-tests-plan-writer.md` to direct rules stated once, keeping every rule `ui-tests-plan-reviewer` grades a plan by.

**Depends on:** Task 1, which writes `harness-runs/scratch/ui_tests_qa_family_check.mjs`. Task 2 edits the sections above this range, and Task 4 those below it.

**Where this task stops.** It changes only these parts of `plugin/agents/ui-tests-plan-writer.md`:
- `## Process` step 1, and in step 3 the UI-steps, expected-attributes and expected-network bullets;
- in `### Test data`: the two paragraphs between the blockquote and the first bullet (merged into one), the cross-account and per-account bullets, the sequential-peer and bootstrap sub-bullets, the failed-backend sub-bullet, and the clarification bullet.

It does not touch step 2, step 3's lead, precondition, console and capability bullets, step 4, the blockquote, or the `**Design around the single-session and sparse-seed limits before declaring a behaviour untestable — these are the default tools, not edge cases.**` bullet. No frozen text falls inside this range.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c`, and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Rules this range owns, which the reviewer grades** (`plugin/agents/ui-tests-plan-reviewer.md` → `### Asserted attribute values agree with the source`, `### Test-attribute convention parity (Must Fix)`, `### Backend-name parity (Must Fix)`, `### Capability/MCP correctness (Must Fix)`). Each stays stated here once:
- every locator is one the story/task files say exists;
- an expected literal is read off its authority — the call site for an attribute that exists, the introducing task file for one a task on this branch adds — and never inferred, and an attribute neither names is a `## Questions` item;
- every expected network name comes from the story/task files;
- sign-in goes only through `<auth_provider>`, never a third-party pop-up;
- a test that needs a real backend failure is not authored.

`plugin/agents/ui-tests-plan-writer.md` → `### Capability guidance` (Task 2) states the failed-backend rule; R9 points at it rather than restating it.

### Targets

- `plugin/agents/ui-tests-plan-writer.md` → `## Process` and `### Test data — the QA accounts (use this when wording account preconditions)`, the parts named above.

**Work:**

- [ ] **Process.** Apply R1–R4.
  - Step 1 points at `## Read first` instead of re-listing the inputs.
  - The steps bullet loses the "*Replace with your project's login locators*" scaffolding and states the sign-in rule directly.
  - The expected-attributes bullet states the literal-authority rule once.
- [ ] **Accounts.** Apply R5–R6. The two paragraphs before the bullets merge into one statement of the credentials-file shape; the account index stays the slot the qa-tester reserves, and no key's value is ever restated.
- [ ] **Techniques and clarifications.** Apply R7–R10.
  - The sequential-peer and bootstrap techniques keep every case they cover: peer sign-in, `**Depends on:**` or a step block, bootstrap through the UI, seeding a peer or gated surface, no empty-surface carve-out.
  - The clarification bullet absorbs the uncreatable-data list from `## Clarification questions`, which Task 4 deletes. It adds *a group membership none of them holds* and *a stored value*, and the rule never to drop the test silently.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm every rule listed under **Rules this range owns** above, plus each technique's edge cases, still has a home. Restore anything missing in its shortest form.

### Replacements

**R1** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
1. **Read the inputs.** Internalize the branch requirement (task prompt), the shared framing (story `## Context`), and what each task adds/changes (per-task files). On an augment round, also read the user-review fix plan and the existing UI-test plan. **Then apply the No-UI determination above:** if the branch (including any fix-plan behaviour on an augment round) obviously renders nothing, write **no files** and return the no-UI contract (`no_ui: true`, `tests_count: 0`) — stop here, skip the remaining steps.
```

with

```text
1. **Read the inputs** `## Read first` names — on an augment round, the fix plan and the existing UI-test plan too. **Then apply the No-UI determination above**; when it fires, stop here.
```

**R2** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with three spaces)

```text
   - an **ordered list of UI steps** phrased in identity-attribute terms, the attribute name taken from the surface layer's conventions document (e.g. where it names `data-qa-id`, "click `[data-qa-id="submit-control"]`") — every locator you reference must be one the story/task files say exists (if it does not, flag it — see `## Quality checks before saving`). **Auth steps:** automated QA signs in **only** through the sign-in route `<auth_provider>` names, which is the one the toolset can actually drive. A route that hands off to a third-party pop-up window **cannot** be driven and must never appear in a step. *Replace with your project's login locators* — the identity-attribute values of that route's input controls and its submit control, read off the surface layer's conventions document; phrase every "sign in" step as filling those controls and activating submit;
```

with

```text
   - an **ordered list of UI steps** phrased in identity-attribute terms, the attribute name taken from the surface layer's conventions document (e.g. where it names `data-qa-id`, "click `[data-qa-id="submit-control"]`") — every locator must be one the story/task files say exists (`## Quality checks before saving` says what to do when one does not). **Auth steps:** sign in **only** through the sign-in route `<auth_provider>` names, never a route that hands off to a third-party pop-up window. Phrase every "sign in" step as filling that route's input controls and activating its submit control, their identity-attribute values read off the surface layer's conventions document;
```

**R3** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with three spaces)

```text
   - the **expected status / value attributes** after each step (e.g. the status attribute reading `"loading"` then `"ready"`) — **where the attribute already exists, read every expected literal off the call site in the application source that writes it**, found by grepping the surface-owning layer's `path` from `<layer_path_map>` (that layer's own test-attribute helper makes this a grep). **Where it does not exist yet** — the planning-flow write loop converges *before* the hand-off to implementation, so an attribute a task on this branch introduces has no call site — read the literal off the task file that introduces the control, the same authority the locator bullet above uses. Never infer a literal from what the step ought to produce. An attribute neither a call site nor a task file names is a `## Questions` item — the same route `## Quality checks before saving` gives for a missing locator — never a guess written into an assertion;
```

with

```text
   - the **expected status / value attributes** after each step (e.g. the status attribute reading `"loading"` then `"ready"`). **Read every expected literal off its authority, never infer it from what the step ought to produce:** where the attribute already exists, the call site in the application source that writes it, found by grepping the surface-owning layer's `path` from `<layer_path_map>`; where a task on this branch introduces it (the write loop converges *before* implementation, so it has no call site yet), the task file that introduces the control. An attribute neither names is a `## Questions` item, never a guess written into an assertion;
```

**R4** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with three spaces)

```text
   - the **expected network call** — the external call or stored query the step fires, **pulled from the story/task files** so the qa-tester can assert it via its network-inspection capability;
```

with

```text
   - the **expected network call** — the external call or stored query the step fires, named in the story/task files;
```

**R5** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
When a precondition involves more than one QA account, sign in as the right one through the `<auth_provider>` route — the same auth-step rule as the Steps bullet above.

*Replace with your project's QA accounts and surfaces.* The shape to keep is: the gitignored file at `<repo_root>/<qa_creds_path>` holds this project's test accounts — one block each, however many there are — distinguished by an **account index in the key name**; the exact key-name prefix convention is stated in that file's own header comments, and the index is the slot the qa-tester reserves. State that shape in a precondition; never restate a key's value.
```

with

```text
The gitignored file at `<repo_root>/<qa_creds_path>` holds this project's test accounts, one block each, distinguished by an **account index in the key name** (its header comments state the prefix convention; the index is the slot the qa-tester reserves). A precondition names the account by that index, and the account signs in through the `<auth_provider>` route; never restate a key's value.
```

**R6** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- **Cross-account visibility rules** — which account pairs can reach which gated surface, and how each state that surface can be in is expected to read — are single-sourced in `.claude/qa_test_scenarios.md`, and are optional there: a project that states none has none. Apply them when wording preconditions; do not restate them here.
- **Per-account values** (which keys exist, who holds which rights toward whom) are single-sourced in `<qa_creds_path>`'s own per-account comments — let the qa-tester read the live values there; do not restate them in the plan.
```

with

```text
- **Cross-account visibility rules** — which account pairs can reach which gated surface, and how each state that surface can be in is expected to read — are in `.claude/qa_test_scenarios.md` (optional there: a project that states none has none). Apply them when wording preconditions; never restate them.
- **Per-account values** (which keys exist, who holds which rights toward whom) are in `<qa_creds_path>`'s per-account comments; never restate them in the plan.
```

**R7** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with two spaces)

```text
  - **Cross-account effect → a sequential peer test** — only where this project has more than one account. Interactive QA can't run two accounts at once, but you don't need to: author the test to act as the acting account (asserting the live/optimistic result from *that* session), then **sign out and sign in as the peer** to confirm the write persisted and is visible across accounts. Use a `**Depends on:**` link or an explicit step block; pick the acting/peer pair from the rights relationships this project documents, so the acting account can reach the peer's gated surface. Do **not** treat "can't watch the peer's live snapshot" as a blocker.
```

with

```text
  - **Cross-account effect → a sequential peer test** — only where this project has more than one account. Author the test to act as the acting account (asserting the live/optimistic result from *that* session), then **sign out and sign in as the peer** to confirm the write persisted and is visible across accounts, through a `**Depends on:**` link or an explicit step block. Pick the acting/peer pair from the rights relationships this project documents, so the acting account can reach the peer's gated surface. "Can't watch the peer's live snapshot" is not a blocker.
```

**R8** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with two spaces)

```text
  - **Needs more data than the seed → a UI bootstrap step.** When the behaviour needs data the seed lacks **but a QA account can create it through the app** (the canonical case: **pagination / load-more** needs more items than one page), write explicit setup steps that add the items through the normal UI action, then close/reopen (or reload) the surface so the next-page request becomes reachable — instead of skipping the test or asking for a richer seed. When the QA accounts can write each other's data, also seed a **peer / gated surface** by adding a setup step that signs in as an account that *can* write it (e.g. seed a gated surface by posting as its owner, or as an account that already holds the rights gating it) before running the test as the target account — do **not** author an "empty-surface carve-out" (assert-fetch-only) when the surface can simply be seeded so the populated-list assertion runs for real.
```

with

```text
  - **Needs more data than the seed → a UI bootstrap step.** When a QA account can create the missing data through the app (the canonical case: **pagination / load-more** needs more items than one page), write setup steps that add it through the normal UI action, then close/reopen (or reload) the surface so the next-page request is reachable — never skip the test or ask for a richer seed. When the QA accounts can write each other's data, seed a **peer / gated surface** the same way: a setup step signs in as an account that *can* write it (its owner, or an account already holding the rights gating it) before the test runs as the target account. Never author an "empty-surface carve-out" (assert-fetch-only) for a surface that can be seeded.
```

**R9** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with two spaces)

```text
  - **Needs a backend operation to fail → not automatable; do not author it.** A behaviour that only shows on a **failed** backend call (e.g. a failed send removing its optimistic entry) cannot be driven: request-mocking is not reliably exposed and network-condition / offline emulation is unavailable (see `### Capability guidance` above). Do **not** author such a test — note the coverage gap; if a run reaches the behaviour it is reported `blocked`.
```

with

```text
  - **Needs a backend operation to fail → not automatable; do not author it.** `### Capability guidance` states the rule.
```

**R10** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- Raise a `## Questions` clarification **only** when the data is **genuinely not creatable** through the UI (an account beyond the documented set, an elevated-rights account, a peer holding rights the documented accounts don't have, or backend state no QA action can produce). Sparse-but-creatable data and cross-account verification are **not** clarifications — design them in (see the clarification discipline below).
```

with

```text
- Raise a `## Questions` clarification **only** when the data is **genuinely not creatable** through the UI — an account beyond the documented set, an elevated-rights account, a peer holding rights the documented accounts don't have, a group membership none of them holds, or a stored value or backend state no QA action can produce. Never invent such data or assume it exists. Sparse-but-creatable data and cross-account verification are **not** clarifications: design them in, and never silently drop the test.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/ui-tests-plan-writer.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e "Replace with your project's" -- plugin/agents/ui-tests-plan-writer.md` prints nothing.
- `git grep -n -F -e '("QA techniques")' -- plugin/agents/ui-tests-plan-writer.md` prints one line. `.claude/qa_test_scenarios.md` and its template `cli/templates/claude/qa_test_scenarios.md` carry the section under that name.
- `git diff -- plugin/agents/ui-tests-plan-writer.md` shows hunks only between `## Process` and `## Split output spec (mirror the `task-plan-writer` exactly)`.

- **Deviations from plan:** The third verification bullet's claim that `.claude/qa_test_scenarios.md` carries the `QA techniques` section could not be checked as written: `.claude/qa_test_scenarios.md` does not exist in this checkout (`git ls-files | grep qa_test_scenarios` lists only `cli/templates/claude/qa_test_scenarios.md` and `examples/notes-app/.claude/qa_test_scenarios.md`). The template carries `## QA techniques — work around single-session and sparse-seed limits`; the `("QA techniques")` grep on the agent prints one line. The agent's `.claude/qa_test_scenarios.md` citation is an adopter path, so no edit was made.
