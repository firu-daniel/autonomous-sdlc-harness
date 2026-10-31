# Architecture review — iteration 2

Reviewed: `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan_2.md` and `finding_1.md` through `finding_4.md`, against `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review_2.md`, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

What holds:
- **Placement.** The guard goes in `plugin/hooks/` and is registered in `plugin/hooks/hooks.json`. Its suite goes in `cli/test/`, which already has a precedent: `cli/test/main-root-fallback.test.mjs` drives `plugin/hooks/lib/harness-config-lib.sh` the same way. The `writeProtection.ts` and template-watcher comments stay in `cli`. The self-adopted `scripts/` copy, `docs/`, `ARCHITECTURE.md` and the hand-run check script stay in `general`.
- **Layer tags.** Every `_(layer: …)_` tag matches its finding's fix-target paths.
- **Coupling.** `cli/src` names the new guard only inside a doc comment, which `## The layers` allows.
- **The library monopoly.** The guard resolves no repository and reads no configuration, so not sourcing `plugin/hooks/lib/harness-config-lib.sh` is correct.
- **Deviations the review licenses.** The `deny` output, failing closed with `deny`, and the exception to the jurisdiction rule are all licensed by the review's item 1 ("It refuses a call…", "It fails closed on input it cannot parse", "every session that loads the plugin"). The index declares them, and its manual follow-up names the `.claude/` sentences they make untrue.
- **The test-run rule.** No finding asks for a test run it forbids. The ledger's `## Trust checks` and `## Evidence and measurement` lessons are honoured.

Two Must Fix items, both about what the new guard owes `.claude/context/conventions.md`.

## Must Fix

1. **The new guard carries no top-level string filter, and the plan does not argue the exception.** Offending file: `finding_1.md`, step 2 ("Read `.tool_name`, `.cwd` and the target path in one `jq` call") and step 3 (the `## Prerequisites` bullet). Rule: `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A guard hook*: "Its `hooks.json` registration, its own self-verifying top-level string filter, its row in `plugin/hooks/README.md`'s outcome table, and a reproduce-by-hand invocation that works."

   The guard is self-verifying: it is silent on any path outside the trio. But it runs `jq` on every `Edit`, `Write` and `NotebookEdit` call, in every session that loads the plugin, with no cheap string test first. `plugin/hooks/README.md` → `## Prerequisites` records the one sanctioned way to skip that filter: "Five of the six run a cheap top-level string filter … `allow-qa-credentials-read.sh` is the exception and cannot be otherwise". The exception is argued, and its per-call cost is recorded in that guard's header under **WHAT THAT COSTS, AND WHY THE COST IS ACCEPTED RATHER THAN UNNOTICED**.

   Here, an exception is probably required. A name-substring prefilter would let a non-JSON payload through silently, against the review's "Malformed hook input is refused". It would also miss the symlinked-leaf case `<repo>/innocent`. But the plan neither plans a filter nor records why there is none. Step 3 would also leave the README's "Five of the six" sentence describing a six-guard set.

   **Fix:** In `finding_1.md`:
   - **Step 2.** Add a header paragraph to `git-trust-file-guard.sh`, in the existing guards' capitalised-heading style (e.g. `NO TOP-LEVEL STRING FILTER, DELIBERATELY`). It must:
     - state that the guard has no filter;
     - give the two reasons: an unparseable payload must be refused rather than silenced, and a symlinked leaf carries no trio name in its path;
     - state what it costs per file-tool call: one `jq`, plus the `cd -P` / `pwd -P` subshell, plus `readlink` on the symlinked-leaf branch only. Label this *derived*, since the measured latency is owed (Finding 2, step 6).
   - **Step 3.** Rewrite the README `## Prerequisites` sentence "Five of the six run a cheap top-level string filter…" so that it:
     - covers seven guards;
     - names `git-trust-file-guard.sh` as the second guard with no filter;
     - points at that header paragraph;
     - says its cost falls on file-tool calls, not on Bash calls.

2. **The `readlink` exception breaks the conventions' binary rule, the review does not license it, and the index's manual follow-up leaves that rule out.** Offending files: `finding_1.md`, step 2 (sub-step 4, "A symlinked leaf … resolve it with `readlink` … This is the one use of a binary beyond `git` and `jq`"), and the index's `## Context` → **Manual follow-up, not in this list.** Rule: `.claude/context/conventions.md` → `## The stack, in the words the rules below use`: "the only external binaries a guard may need are `git` and `jq` 1.5 or newer (`plugin/hooks/README.md` → `## Prerequisites`)".

   The review's item 1 asks for normalisation of "`..`, symlinked parents, a trailing `/`". `cd -P` / `pwd -P` covers all three with builtins. The symlinked leaf and the `readlink` it needs are the plan's own addition, and the review authorises neither. The index raises the binary under **Decisions the user may want to revisit**, so the user can rule on it at approval. But the manual follow-up lists only the "it emits `allow` or nothing" and "Exactly one guard … may answer `deny`" sentences and the `plugin.md` routing row. If the user keeps `readlink`, `.claude/context/conventions.md` would still state a binary rule the shipped guard breaks, and nothing would record that it needs a hand edit. A rule the conventions document states and the code silently breaks is what `## Plugin asset authoring` and the `stale-rule` route exist to prevent.

   **Fix:** Pick one of these, and say in the index which one was chosen:
   - **(a) Drop `readlink`.** In `finding_1.md` step 2, handle an existing symlinked leaf with builtins only, and fail closed. For example, refuse a file-tool call whose target is an existing symbolic link (`[ -L ]`), with a reason saying the guard cannot resolve a link's target without a binary beyond `git` and `jq`. Record that cost in the header and in the README's outcome row. Update the symlinked-leaf test case's expected reason to match.
   - **(b) Keep `readlink` as a user decision.** Add a third bullet to the index's **Manual follow-up, not in this list.**: `.claude/context/conventions.md` → `## The stack, in the words the rules below use` → "the only external binaries a guard may need are `git` and `jq`", which must name `readlink` as `git-trust-file-guard.sh`'s exception once Finding 1 lands. Keep the item under **Decisions the user may want to revisit**.

## Should Fix

1. **`plugin/hooks/README.md` → `## Prerequisites` keeps saying "If `jq` is missing, **every guard exits 0 silently**".** Finding 1 makes that untrue: the new guard refuses every file-tool call when `jq` is missing. Step 3 updates the `## Fail closed` paragraph after the table but not this sentence, which is the one a person debugging silent guards reads first. In `finding_1.md` step 3, add: rewrite that sentence to say the six command guards go silent, and `git-trust-file-guard.sh` refuses every `Edit`, `Write` and `NotebookEdit` call. Then cover the too-old-`jq` case for the new guard in the same paragraph. (Source: `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`: "Silence is a decision, and it is written down before it is relied on.")

2. **`## Fail closed` claims every cell is measured in `docs/guard-verification.md` §2.3.** The paragraph after the table reads "Every cell of that column, of the two beside it … is measured … in `docs/guard-verification.md` §2.3". Finding 1 adds a row to that table, and Finding 2 step 6 records the new guard's decision matrix elsewhere (§2.6, or `### What a later change owes this section`). Either have Finding 2 step 6 add the new guard's fail-closed cells to §2.3, labelled as reproduced decisions, or have Finding 1 step 3 narrow the README's claim to the six command guards and point at where the seventh's rows live. (Source: `.claude/context/plugin.md` → "A change to any guard or to the library re-measures itself in `docs/guard-verification.md`".)

## Nice to Have

_None._
