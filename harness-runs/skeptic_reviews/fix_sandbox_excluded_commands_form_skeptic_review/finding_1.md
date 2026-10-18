### 1. The live excluded entry makes two unmeasured "stays sandboxed" claims load-bearing, and the owed re-run list omits both

**File:** `docs/sandbox-verification.md`, `## 3. The wrappers`, the paragraph beginning "**Owed a re-run.**" (the note this branch adds above the §3 table).

**Severity:** Must Fix.

**The problem.** Before this branch, both `sandbox.excludedCommands` entries matched nothing (P1a: `Bash(bash <s>:*)` → sandboxed in every case). So every claim of the form "*X* stays sandboxed" was true for every *X*, and no measurement ever tested one. This branch switches the entries to `bash <main>/scripts/<wrapper>.sh:*`, a prefix pattern that P1a and P2 measured to match. Two claims about what that pattern does *not* match now carry weight, and no row in `docs/sandbox-verification.md` measures either one against a matching entry:

1. **The assignment-prefix claim.** The branch records the `GIT_SSH_COMMAND` decision (task prompt goal 3: *"Measure whether an excluded call can ever receive it, and record the answer in the wrapper header"*) in `cli/templates/scripts/push-branch.sh`, in the paragraph "THE INHERITED GIT ENVIRONMENT IS DROPPED". Its premise is the pre-existing sentence that an excluded command's environment is "not one a sandboxed command can set — an assignment prefix or a compound is a different command string, which stays sandboxed". The branch's added sentence cites only P1a, which measured a **direct** call (`bash <s>:*` → unsandboxed with an argument; "An excluded command inherits none of the sandbox's proxy variables"). No row runs `GIT_SSH_COMMAND=<value> bash <main>/scripts/push-branch.sh <worktree>`. If the matcher strips or ignores a leading assignment, a sandboxed agent picks the `GIT_SSH_COMMAND` value, and that value runs **unsandboxed** with full access. "Keep `GIT_SSH_COMMAND`" is then an arbitrary-command escape, not a convenience. So goal 3's "can ever receive it" is answered only for the one call shape that cannot carry it.
2. **The compound claim.** `docs/cli.md` §6 ("so does a call that compounds the excluded spelling with anything else: every command in a call must match, and a `cd`, a `$(…)`, a subshell or a file redirect keeps the call sandboxed") and the profile `_README` line "TWO COMMANDS RUN OUTSIDE THE SANDBOX" ("as does a call that compounds the excluded spelling with anything else") both state this as fact. Since P1/P1a, no measurement has had a matching entry to test it against. A compound such as `bash <main>/scripts/push-branch.sh <wt>; bash <scriptsDir>/scratch-run.sh <file>` has every piece allow-listed. If it were excluded as a whole, the scratch file would run unsandboxed.

**Why a consumer does the wrong thing.** The owed-re-run note is the list the maintainer follows when re-running the rows on the regenerated profile. Clearing it removes the note (story plan, Manual setup step 2: "Then remove the owed-re-run note Task 4 adds"). The note names P1, P3, R0–R4, C1, C2, K2, L1 and L2. None of these is an assignment-prefix call or a compound call. A maintainer who does exactly what the note says clears it without ever testing either boundary. The wrapper header, `docs/cli.md` §6 and the `_README` would then keep presenting both claims as settled.

**Proof.**
- `grep -n -i -e assignment -e compound docs/sandbox-verification.md` finds only line 42 (a probe discarded *because* a compound changes which rules match) and no measurement row.
- P1a's Observed cell lists exactly four entry forms, each called directly, with or without an argument.
- P2 is a direct call.
- C1/C2/K2 test the wrapper's own target refusals, not the matcher.

**Fix.** In `docs/sandbox-verification.md`, in the `## 3. The wrappers` paragraph beginning `**Owed a re-run.**`, append these sentences at the end of that paragraph, after "which is the case their refusals exist for.":

> Two boundaries the corrected entry makes load-bearing have never been measured against a matching entry, and are owed new rows beside P1a before this note is removed: an assignment prefix, `GIT_SSH_COMMAND=<probe> bash <main>/scripts/push-branch.sh <worktree>`, which `push-branch.sh`'s header keeps `GIT_SSH_COMMAND` on the ground that it stays sandboxed; and a compound, `bash <main>/scripts/push-branch.sh <worktree>; <a second allow-listed command>`, which `docs/cli.md` §6 and the profile's `_README` state stays sandboxed. If either runs unsandboxed, the `GIT_SSH_COMMAND` decision and the compound sentence are wrong and must be reopened.

Change no other line. Leave every measured cell, the wrapper headers, `docs/cli.md` and the template `_README` unchanged: the measurement is a manual step, and this fix only makes it owed. No test file is edited, and no suite is run by this fix.
