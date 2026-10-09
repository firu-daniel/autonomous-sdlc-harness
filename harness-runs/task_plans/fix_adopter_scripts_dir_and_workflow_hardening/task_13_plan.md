### Task 13 — Fix the `typos` hits in the plugin corpus and restate the `<scripts_dir>` default rows

**Goal:** Under `plugin/`, the only `typos 1.51.1` hits left are the three deliberate ones the story index lists:
- `ines`, inside the regex `[Ll]ines?` in `plugin/agents/docs-reviewer.md`;
- `Ein`, the `git grep -Ein` flags in `plugin/instructions/mode_contract.md`;
- `fo`, the `--fo` option-prefix example in `plugin/hooks/lib/harness-config-lib.sh`.

Separately, the two `## Resolved values` rows that say "Default `scripts/`" state the new split: an absent key means `scripts/`, and `init` writes `harness-scripts/`.

**Where this task stops.** It adds no placeholder and renames no heading, field or wire string.
- **The hooks.** The three hook edits are comment-only: no guard's decision changes and no matrix cell in `docs/guard-verification.md` moves. They still owe a record there, because the rule binds *any* change to a guard (`.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`; `plugin/hooks/README.md`, closing paragraph: "…which is also where a change to any guard or to the shared library records its own re-measurement"). A comment-only edit is recorded, not exempted — the precedent is `docs/guard-verification.md` → `### 3.8 Recorded as changing no decision`, whose FAIL-CLOSED-header row records a comment and reason-text edit to these same guards.
- **That record is Task 17's, not this task's.** `docs/guard-verification.md` sits in the `general` layer, so this task writes nothing there. Task 17 appends the §3.8 row naming `git-commit-branch-guard.sh`, `autonomous-protected-branch-guard.sh` and `autonomous-script-allowlist-guard.sh`, the comment lines changed ("payload unparseable" → "payload unparsable" in the first two; "got mis-split into fragments" → "got split wrongly into fragments" in the third), and, as its licensing check, `git diff -U0 -- plugin/hooks` showing only `#` lines. So the hook comment wording below is the wording Task 17 quotes: change it only together with that row.
- **The other layers.** The CLI side is Tasks 11 and 12's.

### Targets

- `plugin/agents/layer-reviewer.md`
- `plugin/agents/task-plan-writer.md`
- `plugin/agents/docs-reviewer.md`
- `plugin/agents/review-plan-reviewer.md`
- `plugin/agents/task-plan-reviewer.md`
- `plugin/agents/ui-tests-plan-reviewer.md`
- `plugin/agents/skeptic-reviewer.md`
- `plugin/instructions/plan_orchestration_instructions_core.md`
- `plugin/instructions/autonomous_pause_and_ledger.md`
- `plugin/instructions/docs_orchestration_instructions_autonomous.md`
- `plugin/hooks/git-commit-branch-guard.sh`
- `plugin/hooks/autonomous-protected-branch-guard.sh`
- `plugin/hooks/autonomous-script-allowlist-guard.sh`

**Work:**

- [ ] **The two `<scripts_dir>` rows** (story index → `## Scope register`, rows 4 and 5). In `plugin/agents/layer-reviewer.md` and `plugin/agents/task-plan-writer.md` → `## Resolved values`, replace "Default `scripts/`." with: "A configuration that omits the key means `scripts/`; `init` writes `harness-scripts/` into one it generates."
  - **What stays.** The cell keeps naming the adopter's **key** (`scriptsDir`), never this repository's value (`.claude/context/plugin.md` → `## A worked example`).
  - **The rest of the row** in `task-plan-writer.md` stays byte-identical: its prose about wrappers and the deny-listed basenames.
- [ ] **"mis-titled" becomes "mistitled"** in the three plan-reviewer agents: `review-plan-reviewer.md` ("a mis-titled section (e.g. …"), `task-plan-reviewer.md` and `ui-tests-plan-reviewer.md`. Grep `plugin/` for `mis-titled` first and take the whole result set.
- [ ] **The other `mis-` words.**
  - **"mis-graded" becomes "misgraded"** in `skeptic-reviewer.md`, in its frontmatter `description:` and in the two-leg-test bullet, and in `plan_orchestration_instructions_core.md`'s phase description, which restates the skeptic's remit in the same words. Change the three together, because the description is what a dispatcher selects on and the core quotes it.
  - **Elsewhere:** "mis-marked" becomes "mismarked" (`docs-reviewer.md`), "mis-seeded" becomes "misseeded" (`autonomous_pause_and_ledger.md`), and "mis-resolves" becomes "misresolves" (`docs_orchestration_instructions_autonomous.md`).
  - **A replacement that reads badly** is rephrased rather than joined, for example "wrongly seeded".
- [ ] **The hook comments.** "payload unparseable" becomes "payload unparsable" in the outcome tables of `git-commit-branch-guard.sh` and `autonomous-protected-branch-guard.sh`. "got mis-split into fragments" becomes "got split wrongly into fragments" in `autonomous-script-allowlist-guard.sh`. Each edit is inside a `#` comment line.
- [ ] **Leave the three deliberate hits** — `ines`, `Ein` and `fo` — byte-identical.

**Verification:**

- **The spelling probe.** A probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh <probe>`, runs `uvx --from typos@1.51.1 typos --format brief plugin`. The only hits are the three deliberate ones above.
- **The replaced spellings are gone.** `git grep -nE 'mis-(titled|graded|marked|seeded|resolves|split)|unparseable' -- plugin` returns nothing.
- **The hooks are comment-only.** `git diff -U0 -- plugin/hooks` shows only lines starting with `#`, so each guard's decision bytes are unchanged.
- **The two rows.** `git grep -n 'Default \`scripts/\`' -- plugin` returns nothing, and the two rows carry the new sentence.
- **The manifest gate** (`docs/development.md` → `## 5. Verifying a change`, **Gate 1**) runs at Run gates. The frontmatter edit is inside the `description:` value, and the frontmatter's keys are unchanged.
