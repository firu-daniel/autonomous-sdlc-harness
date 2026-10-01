# Review plan meta-review — iteration 1

Both Must Fix items from iteration 0 are closed. The index now gives the `plugin` layer a clean pass, checking it against four `.claude/context/plugin.md` rules, and it names five ledger rules with the site that satisfies each. Finding 4's snippet now keeps the optional-chained arm.

The structure is clean:
- Context, then the readiness list, then Must, Should and Nice, then the call-out section, in that order.
- The readiness heading is byte-exact.
- 8 readiness entries, 8 index pointers and 8 `finding_<N>.md` files correspond 1:1.
- The unsuffixed index matches its unsuffixed folder.

Every cited site and quoted substring resolves on the branch tip. That covers:
- the `# FORK PULL REQUESTS.` header sentences;
- `docs/github-run-control.md` §6 line 258 and the "**Nothing from a pull request's head runs.**" paragraph;
- `docs/remote-execution.md` §11's two paragraphs;
- `HARNESS_TRIGGER_LABEL`, which is mapped only in `harness-trigger.yml`;
- `forge_issue_var`'s `' by @'*)` arm;
- the `Forge-agnostic` pointer in `ARCHITECTURE.md` §8, which has no target left in `README.md`;
- `REMOTE_GITHUB_CHECK`'s two `!allowed` arms;
- the Unicode-arrow `forbidden` text in `verb_deliver`;
- `deliver_pr_body`'s four-verb `printf`;
- the exit-map line 1;
- the three-way `jq` heading in `control_review_round`.

The claims match the code and the cited research (C2's merge-commit quote, the `ref=refs/pull/2/merge` log). No finding asks for a forbidden test run, and none carries a gate that names a phase at or after Phase C.

## Must Fix

1. **The index's ledger paragraph says the diff exercises five ledger rules, but it skips two ledger sections the diff plainly exercises.** Refers to "Structure". The file is the index, `harness-runs/code_reviews/feat_forge_run_control_code_review.md`, in the `**Lessons ledger.**` paragraph of `## Context`.
   `harness-runs/lessons.md` has two sections the index never mentions.
   - **`## Adopter-facing documentation`.** The diff adds `docs/github-run-control.md`, a new adopter document whose readers type `@sdlc-harness …` commands. It also edits `README.md`, `docs/github-issue-trigger.md`, `docs/remote-execution.md`, `docs/config.md` and `docs/cli.md`. Two rules apply:
     - every command sits in its own fenced block;
     - adopter-facing surfaces use adopter vocabulary, never internal terms.
   - **`## Evidence and measurement`.** The new and edited documents justify decisions with measurements and mark others as unmeasured. Three rules apply:
     - a figure from a stub is never a justification;
     - "not yet measured" ships the seam that will measure it;
     - a decision rule's outcome is a proposal.

     Examples in the diff:
     - `docs/github-run-control.md`'s size bound rests on S6, which "measured the bound on an issue comment; on a pull request's conversation it is unverified".
     - The Gate 12 rows in `docs/github-issue-trigger.md` record a fix that is "not yet re-observed on GitHub".
     - `ROADMAP.md` is edited.

   The index presents its five rules as the whole set ("The diff exercises five ledger rules. All five hold"). A reader therefore cannot tell whether these two categories were checked or skipped. This is the same gap iteration 0 raised, and it is still open for the categories that list missed.

   This meta-review spot-checked the fenced-command rule in `docs/github-run-control.md`, and it holds: each `@sdlc-harness` verb and the `git pull --ff-only` are in their own fences. So a clean-pass rationale may be all that is owed.

   **Fix:** In the index's `**Lessons ledger.**` paragraph, change "five ledger rules" to the real count. Add one bullet for each of the two missing sections that names the rule and the site that satisfies it. For example, "`## Adopter-facing documentation`, the fenced-command rule: every comment command in `docs/github-run-control.md` §1 and §3 is in its own fence". If a rule does not hold, record it as a new `finding_9.md` instead, with its index pointer and a readiness entry carrying its `_(layer: …)_` tag.

## Should Fix

1. **Finding 6's fix changes what every harness-opened pull request's body says, but its test step resolves to no test.** Refers to review finding #6. The file is `harness-runs/code_reviews/feat_forge_run_control_code_review/finding_6.md`.
   The test sub-step only applies if `cli/test/remote-deliver.test.mjs` already asserts the old sentence. It does not: no `While a round is running` string appears anywhere under `cli/test/`. Followed literally, the fix adds `clear` to the body and changes the sentence with no case covering either. That is weaker than `.claude/context/conventions.md` → `## The testing bar` and `.claude/context/cli.md` → `## What "done" means here` ask for.
   **Fix:** In `finding_6.md`, make the test sub-step unconditional. In `cli/test/remote-deliver.test.mjs`, beside the case that asserts `/\nStarted from #7\.\n/` on `made[0].body`, assert that the body names each of `` `@sdlc-harness answer <n>` ``, `` `@sdlc-harness pause` ``, `` `@sdlc-harness resume` ``, `` `@sdlc-harness stop` `` and `` `@sdlc-harness clear` ``, and that it does not contain `While a round is running`. Then run that one file from `cli/` with `npm test -- test/remote-deliver.test.mjs`.
