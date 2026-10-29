# Review plan meta-review — iteration 0

## Must Fix
1. **Missed check: the diff touches the `cli` layer and the review shows no check drawn from `.claude/context/cli.md`** — refers to "Structure" (missed check). Offending file: the index `harness-runs/skeptic_reviews/feat_sandbox_probe_linux_legs_skeptic_review.md` (`## Context` → `**What was verified first-hand.**`).
   I ran `git diff origin/dev...HEAD --name-only` with the run artifacts excluded. It puts 33 paths under the `cli` layer's path `cli`:
   - four new suites: `cli/test/sandbox-probe-platform.test.mjs`, `sandbox-probe-refusal-leg.test.mjs`, `sandbox-probe-glob-registry-legs.test.mjs` and `sandbox-probe-detached-loopback-legs.test.mjs`;
   - seven modified suites: `sandbox-probe-gates-legs`, `-git-and-legs`, `-judge`, `-protection-legs`, `-remote-legs`, `-shell` and `-wrappers-legs`;
   - 22 new stream fixtures under `cli/test/fixtures/sandbox-probe/`.

   The general missed-checks rule says every touched layer needs at least one finding, or an explicit clean-pass rationale, drawn from that layer's conventions document. The review has neither for `cli`:
   - The Context mentions the layer only in its scope list ("**The suites** under `cli/test/`").
   - Every bullet under **What was verified first-hand** is about the probe's shell libraries or the record's citations.
   - Finding 1 is tagged `general`.
   - The **De-duplicated against** paragraph covers only the findings the code review and the architecture review raised. It does not say those reviews' `cli` clean pass covers this review.

   The `.claude/context/cli.md` → `## What "done" means here` rules and the `.claude/context/conventions.md` → `## The testing bar` rules apply to these suites, and the diff is enough to judge them:
   - each test file opens with the rule it exists to enforce, and says which documented behaviour it leaves out and why;
   - no fixture is created inside this checkout, so every case directory comes from a `mkdtemp` under `os.tmpdir()` and is removed in process;
   - no test reaches the network or launches the agent CLI;
   - assertions are made against the stated contract.

   I spot-checked these and they appear to hold. The four new suites each carry a `The rule these tests exist to enforce` header and one `mkdtemp(join(tmpdir(), …))`. The review just does not record the check.

   **Fix:** In the index `harness-runs/skeptic_reviews/feat_sandbox_probe_linux_legs_skeptic_review.md`, add one bullet for the `cli` layer under `## Context` → `**What was verified first-hand.**`. It must:
   - name the four new and seven modified `cli/test/sandbox-probe-*.test.mjs` suites and the new `cli/test/fixtures/sandbox-probe/*.jsonl` stream fixtures;
   - cite `.claude/context/cli.md` → `## What "done" means here` and `.claude/context/conventions.md` → `## The testing bar`;
   - say, rule by rule (the four rules listed above), how each was verified and that it holds. One way is to name the header line and the `mkdtemp` site of each new suite. Another is to confirm that the Linux fixture cases run once with `SANDBOX_PROBE_UNAME=Linux` and once without, as the story plan's first `Top risks:` entry requires.

   If any rule does not hold, add a new `finding_2.md` in `harness-runs/skeptic_reviews/feat_sandbox_probe_linux_legs_skeptic_review/` instead. Give it a site anchor, a `### 2. …` pointer under the right severity section of the index, and a readiness entry tagged `_(layer: cli)_`. Leave `finding_1.md` unchanged. I checked its claims against the tree and they are accurate:
   - both footprint sentences are quoted verbatim;
   - `sp__rg_session`'s `local dir="$1" reg="$SP_REGISTRY" sib=…` line, `sp__rg3_session`'s `c_mv="mv $dir $dir.aside"` and `sp_leg_registry`'s `dir="${SP_REGISTRY%/*}"` resolve;
   - the `run)` arm's `sp_leg_linux_only` skip resolves;
   - the `**The run registry.**` paragraph resolves;
   - no `cli/test` suite asserts on the sentence.
