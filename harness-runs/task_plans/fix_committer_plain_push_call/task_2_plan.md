### Task 2 — Copy the "once, alone" rule into `autonomous_pause_and_ledger.md` §1.6

**Goal:** Give the orchestrator-side wrapper calls the same rule, in the same words, at the one place every orchestrator commit point already cites for them. That place is `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch`. Also remove the one clause there that permits joining a wrapper call to another statement.

**Depends on:** Task 1, which adds this definition sentence to `plugin/agents/committer.md` → `### Standard procedure` step 4, byte-for-byte:

`**Once, alone** means its own Bash call holding that one command and nothing else — no `cd`, `;`, `&&`, `||`, pipe, `echo "exit $?"`, `$(…)` or shell variable before or after it.`

This task carries that sentence unchanged, per `.claude/context/plugin.md` → `## Writing agent prose` ("a block several agents carry is one wording, copied byte-for-byte"). Task 3's source guard compares this copy with Task 1's after collapsing whitespace. Wrap the sentence across lines to match §1.6's hard-wrapped paragraphs if needed, but change none of its characters. This task does not touch `committer.md`, and it does not touch the fork files that cite §1.6. Each of those already issues the push "as its **own** Bash call", and the story index `## Scope register` records why each is `no-change`.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md` — `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch` only.

**Work:**

- [ ] In §1.6's first paragraph, directly after the sentence that ends with "`bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`." (before "Both name `<MAIN_REPO>`'s copy"), insert `Call each wrapper once, alone.` followed by the definition sentence quoted above.
- [ ] In the ⚠️ paragraph, change "plain and newline-separated single statements do not — but" to "plain single statements do not — but". The new rule bars a newline-joined call, and the old clause would permit one. Leave the rest of that sentence as it is.
- [ ] Change nothing else in §1.6 or anywhere else in the file. The heading text is a cited anchor (`${CLAUDE_PLUGIN_ROOT}/agents/committer.md` → `## Resolved values` cites "§1.6", and many forks cite it too), so keep it byte-identical.

**Verification:**

- `git diff plugin/instructions/autonomous_pause_and_ledger.md` shows changes only inside `### 1.6`: the two inserted sentences and the one removed phrase "and newline-separated".
- `grep -c 'newline-separated' plugin/instructions/autonomous_pause_and_ledger.md` returns no hit inside §1.6. Read any hit elsewhere in the file to confirm it is unrelated.
- With line breaks collapsed to spaces, §1.6 contains the definition sentence exactly as `plugin/agents/committer.md` step 4 carries it. Check this by reading both copies side by side. Task 3 makes the check automatic.
- The §1.6 heading line is byte-unchanged: `grep -nF '### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch' plugin/instructions/autonomous_pause_and_ledger.md` still hits.
