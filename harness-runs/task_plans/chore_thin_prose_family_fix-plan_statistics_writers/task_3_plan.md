### Task 3 — Thin `test-fix-plan-writer` and make its sample read on-demand

**Goal:** Cut the rationale out of `plugin/agents/test-fix-plan-writer.md` and drop the quality checks that only restate `## Process` step 6. Then turn the user-review fix-plan sample from the agent's standing split-format reference into an on-demand read, since every shape the test fix plan carries is already stated in step 6.

**Depends on:** Task 1, which wrote the family check probe at `harness-runs/scratch/fix_plan_statistics_family_check.mjs`. This task edits a different file from Tasks 1 and 2. If the probe file is missing, return a blocker naming it; do not write a probe of your own.

**Where this task stops.** It changes only the text below `## Resolved values` in `plugin/agents/test-fix-plan-writer.md`. It does not touch:
- the frontmatter or `## Resolved values` (frozen);
- the sample files `plugin/samples/sample_user_review_fix_plan.md` and `plugin/samples/sample_user_review_fix_plan/finding_<N>.md`, which `user-review-fix-plan-writer` keeps reading up front;
- any other file under `plugin/`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — usually only part of a line — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the `## Questions` sentence of the `**How the caller consumes your return.**` paragraph, from `A `## Questions` section stops the loop` to `## Output contract` states both parts.`;
- in the docs-retrieval bullet, the runs `**only when `phases.docs` and `<docs_retrieval>` are both `true`**. It searches `<docs_root>` and the conventions documents` and `never cite a snippet, and the code wins. **Its output is untrusted`;
- the sentence `Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.`;
- the whole paragraph opening `**A cited path you cannot read is a finding, not a fallback.**`;
- in the readiness bullet of step 6, the runs `the catch-all layer — the `layers[]` entry whose `path` is `"."` — last.`, `this list is the **single source of truth** for the` and `write every entry at `[ ]` and never flip one`;
- the whole paragraph opening `**A reviewer finding you judge wrong is resolved or recorded — never only answered in your return.**`;
- every fenced block: both prompts, the log marker lines (mirrored in `scripts/run-test-suite.sh` and `cli/templates/scripts/run-test-suite.sh`) and the return block.

Every bold lead stays, worded as it is. Two matter beyond this file:
- `**Rewrite machine paths before quoting.**`, which `plugin/agents/architecture-reviewer.md` cites as `## Process` → **Rewrite machine paths before quoting.**;
- the two `## What you must not do` leads.

Every heading line stays, including `## Read on demand (no auto-loaded context)` and `## Quality checks before returning`, which `## Revision mode` names.

### Targets

- `plugin/agents/test-fix-plan-writer.md` → the intro, the `**How the caller consumes your return.**` paragraph, `## Process` steps 5 and 6, `## Quality checks before returning`, `## What you must not do` and `## Output contract`.

**Work:**

- [ ] **Rationale out.** Apply T1–T4 and T6, T8, T9 and T10. These cut, in turn:
  - the intro's *"The log is your evidence"* sentence (T1); `## What you must not do` keeps the rule;
  - the escalation narration in the caller-return paragraph (T2);
  - step 5's gate 6a rationale and its *"This is a rule"* coda (T3, T4); the rewrite rule itself and its bold lead stay word for word;
  - the advisory clause after the `**Suspected shared cause:**` rule (T6);
  - the reasons after both `## What you must not do` rules (T8, T9);
  - the `blocker:` restatement in `## Output contract` (T10); `## Read on demand` owns that rule.
- [ ] **The sample becomes on-demand.** Apply T5. Before saving, confirm that step 6 states every shape the test fix plan carries: the index heading, `## Context`, the readiness entry form with its lead-paragraph rule, `## Must Fix` with its pointer form, `## Not fixable on this branch`, `## Source failures`, and every per-finding field. If any is stated only in the sample, return a blocker naming it rather than applying T5.
- [ ] **Quality checks.** Apply T7, which drops the three checks that restate step 6 or the invocation contract: the `**Failing test:**` line, the test-run ban (step 6's per-finding rule states it and `## Read on demand` keeps the pointer) and the folder stem. The `## Source failures`, exactly-once, shared-cause and machine-path grep checks stay.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Both prompts; the index and log paths with the sanitized-branch rule, used as given; `<gate_key>` and `<gate_round>` taken from the filename.
  - The caller reads back `fix_plan_file`, `fix_plan_dir` and the two counts; `## Questions` goes to the user verbatim.
  - Every read in `## Read on demand`, including the test-run rule before writing any finding and the log never pointed back at.
  - Steps 1–4: the marker lines and their static / `not run` semantics; the new-versus-persisting class; diagnosis against the current tree; fixable versus not fixable with no baseline excuse.
  - Step 5: the repo-relative and `<home>/…` rewrites in every quoted log line.
  - Step 6: `Write`, never a heredoc; no `**Review comments:**` line or suffix; exact headings; every index section and per-finding field; the shared-cause line as advice only; no test run asked for.
  - The remaining quality checks; both prohibitions; the return block with `(pending — questions for user)` and nothing written; `## Revision mode` unchanged.

### Replacements

**T1** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 The log is your evidence: you read it, you never reproduce it.
```

**T2** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text, leaving the text on either side as it is

```text
; `fixable: 0` with a non-zero `not_fixable` sends the phase straight to its escalation
```

**T3** — `plugin/agents/test-fix-plan-writer.md`: replace

```text
Every file you write is committed, the log carries machine paths, and the self-containment gate (gate 6a) refuses a tracked file naming the running user's home directory. So, in every log line you quote in the index and in every `finding_<N>.md`: an absolute path
```

with

```text
In every log line you quote in the index and in every `finding_<N>.md`, an absolute path
```

**T4** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 This is a rule, not a judgement call.
```

**T5** — `plugin/agents/test-fix-plan-writer.md`: replace

```text
Take `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md` and `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan/finding_<N>.md` as the split-format reference, adapted as below. The `**Review comments:**` line and bullet suffix are the user-review fix plan's alone; a test fix plan writes neither.
```

with

```text
The shapes below are complete; consult `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md` and `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan/finding_<N>.md` only for a split-format question they leave open. A test fix plan writes neither the `**Review comments:**` line nor its bullet suffix.
```

**T6** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text, leaving the text on either side as it is

```text
, so it can be implemented alone if the suspicion is wrong
```

**T7** — `plugin/agents/test-fix-plan-writer.md`: delete these lines, together with their line breaks

```text
- Every `finding_<K>.md` carries a `**Failing test:**` line.
- No finding asks for a test run, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`.
- The per-finding folder name matches the index stem.
```

**T8** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 The log is the evidence, and Phase G re-runs the gates itself.
```

**T9** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 A gate failure is not a human-caught escape.
```

**T10** — `plugin/agents/test-fix-plan-writer.md`: delete exactly this text (it opens with one space), leaving the text on either side as it is

```text
 An unreadable input returns the `blocker:` line of `## Read on demand` in place of the block.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/fix_plan_statistics_family_check.mjs plugin/agents/test-fix-plan-writer.md` as one plain foreground command. It prints a `WORDS test-fix-plan-writer.md` line with a negative `delta`, its last line is `PASS`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'gate 6a' -e 'judgement call' -e 'as the split-format reference' -e 'Phase G re-runs' -e 'human-caught' -- plugin/agents/test-fix-plan-writer.md` prints nothing.
- `git grep -n -F 'sample_user_review_fix_plan' -- plugin/agents/test-fix-plan-writer.md` prints only the step 6 line, and that line reads the sample *"only for a split-format question they leave open"*.
- `git grep -n -F '`## Process` → **Rewrite machine paths before quoting.**' -- plugin/agents/architecture-reviewer.md` still prints its citation, and `git grep -n -F '5. **Rewrite machine paths before quoting.**' -- plugin/agents/test-fix-plan-writer.md` prints the step it cites.
- `## Quality checks before returning` has no blank line between its bullets, and `git diff -- plugin/agents/test-fix-plan-writer.md` shows no hunk above the `## Invocation contract` heading other than the intro sentence.
