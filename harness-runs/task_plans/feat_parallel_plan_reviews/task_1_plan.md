### Task 1 — Judge a round's plan freshness against every present round file in `fw_round_evidence`

**Goal:** Make the gate library's round evidence answer the question the parallel resume asks — *does any plan change postdate the round's **earliest** review file?* — instead of judging against the first gate in gate order whose file exists, which has no meaning once a round's gates run together.

**Where this layer stops.** This task changes one answer of the library and its own suite. It decides nothing: which gates `start` dispatches from this evidence is the walker's (**Task 3**), which reads the `plan:` line exactly as before — `not-newer` is the only value that lets a round continue with its missing gates.

### Targets

- `cli/templates/scripts/lib/flow-walker-gates.sh` → `fw_round_evidence`, its header comment and the header's `REPRO` lines for it.
- `cli/test/flow-walker-gates.test.mjs` → `fw_round_evidence reports a round literally` — the accompanying test of the changed function.

**Work:**

- [ ] `fw_round_evidence`: judge `plan:` against **every** pair whose round-`R` file exists, not the first. Print `plan: unknown` when no round-`R` file exists **or any** existing one has no commit (`git rev-list -1 HEAD -- <file>` empty); otherwise `plan: newer` when, for **any** existing file, a commit after that file's last commit touches a plan path (`git rev-list <c>..HEAD -- <plans>` non-empty), or when an uncommitted or untracked change touches one (`git --no-optional-locks status --porcelain -- <plans>`, as today); else `plan: not-newer`. Checking every file is the same as checking the earliest, with no commit-order comparison to get wrong. Keep the output order, the `round: none` shape, the exit-2 cases and the bash 3.2 / no-`jq` floors exactly as the header states them.
- [ ] Restate the function's comment block (*"`plan:` is judged against the first pair whose round-R file exists"*) and the header's `round evidence` `REPRO` lines to the new rule; nothing else in the header changes.
- [ ] `flow-walker-gates.test.mjs`: add a sub-case under `fw_round_evidence reports a round literally` — two gate files of round `R` committed in two commits, then a commit touching the plan **between** them: the call prints `plan: newer` (the old first-file rule, judging the later-committed first pair, would print `not-newer` — put the earlier commit on the second pair so the case tells the two rules apart). Add a second sub-case: one round file committed and one present but uncommitted prints `plan: unknown`. Keep every existing sub-case passing as written, re-pinning only an expectation the new rule changes, with the changed literal's reason in a comment.

**Verification:**

- `npm test --workspace cli -- test/flow-walker-gates.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- `grep -n "first pair" cli/templates/scripts/lib/flow-walker-gates.sh` finds nothing.
