### Task 5 — Document `branch-protection` in `docs/cli.md` §7 and §6 and in `docs/config.md`

**Goal:** Make the documents that list `doctor`'s checks name `branch-protection` and say why it matters. The local protection of the protected branches is the harness's. The three git wrappers run outside the sandbox from the main checkout on the strength of that local protection, so the remote's protection is the adopter's, and this check is what tells them when it is missing. The docs must also correct the statements that `--check-github` changes only `remote-github`.

**Depends on:** Tasks 2 and 3. This task documents the check as built and changes no source.

- **Gating.** The check's id is `branch-protection`, and it sits after `forge` in the report. It asks GitHub only under `--check-github` and only with `forge: github`. A default run warns `not checked` and names the flag. Any other forge, unset included, warns `not checked`.
- **What it reads.** Per protected branch (`protectedBranches` unioned with `defaultBranch`), it reads the active ruleset rules first and classic branch protection only where those fall short. The rule types are `pull_request`/`update` (direct pushes), `non_fast_forward` (force pushes) and `deletion`. The classic fields are `required_pull_request_reviews` or `lock_branch`, `allow_force_pushes` and `allow_deletions`. The classic read needs admin access.
- **Grades.** It **passes** only when every branch is proven to block direct pushes, force pushes and deletion. It **warns** naming each branch and what is missing, or *cannot tell* with the reason (no `gh`, not logged in, a refused or timed-out read, an unread answer). A glob entry is reported as not checked. It **never fails**, every call is a read, and it changes no setting.

### Targets

- `docs/cli.md`: §7's opening paragraph, check table, severity bullets and `**\`--check-github\`**` paragraph, and one sentence in §6's `**Four scripts run outside the sandbox, each in one spelling.**` paragraph.
- `docs/config.md`: §5's `protectedBranches` and `forge` rows.

**Work:**

- [ ] `docs/cli.md` → `## 7. \`doctor\``:
  - **Check table.** Add the row `| \`branch-protection\` | every protected branch is covered on GitHub by a ruleset or branch protection that blocks direct pushes, force pushes and deletion (asked only under \`--check-github\`, with \`forge\` \`github\`) |` directly after the `forge` row, matching `CHECKS` order.
  - **Opening paragraph.** Where it says `--check-github` *"asks GitHub about the remote-execution setup"* and that it *"can"* move the exit status, say that it also asks whether the protected branches are protected there. Say that only `remote-github` can move the exit status: `branch-protection` only warns.
- [ ] `docs/cli.md` → the severity bullets: add a bullet after the `forge` one, opening **`branch-protection` never fails**. It states the grades above and why the line matters: the commit, push and refresh wrappers run outside the sandbox, and the remote's ruleset is the only protection a person at a terminal or a credential outside the run cannot get around. It points at §6's paragraph rather than restating it, and closes with the remedy: a ruleset under *Settings → Rules → Rulesets* with *Restrict deletions*, *Block force pushes* and *Require a pull request before merging*.
- [ ] `docs/cli.md` → the `**\`--check-github\`**` paragraph: replace *"turns on the `remote-github` check's `gh` queries and changes no other check"* so it names both checks. State `branch-protection`'s reads (rules, then classic only where needed, GETs only), and that with `forge` not `github` that check asks nothing. Keep the existing fenced `npx autonomous-sdlc-harness doctor --check-github` block. Any command this task adds sits in its own fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`, first rule).
- [ ] `docs/cli.md` → `## 6.`, the paragraph `**Four scripts run outside the sandbox, each in one spelling.**`: add one closing sentence. That protection is local, and whether GitHub protects the same branches is `doctor`'s `branch-protection` check's question (§7), asked under `--check-github`.
- [ ] `docs/config.md` → `## 5.`:
  - In the `protectedBranches` row, beside *"by `doctor`'s `protected-set` check"*, add that `branch-protection` asks GitHub, under `--check-github` with `forge` `github`, whether each branch of the effective set is protected there.
  - In the `forge` row, beside *"`doctor`'s `forge` check reports every state"*, add that `"github"` also lets `branch-protection` read GitHub's rulesets and branch protection under `--check-github`.
  - Use *ruleset* and *branch protection*, GitHub's terms (`harness-runs/lessons.md` → `## Adopter-facing documentation`, second rule), and never rename a key or a check id.

**Verification:**

- Re-run the story index's `## Scope register` derivation entries 1 and 2 from the checkout root. Every file they print is a register row, and every row marked `change` and owned by this task now names `branch-protection`. Grep `docs/cli.md` and `docs/config.md` for `branch-protection` and confirm one hit per such row.
- Grep `docs/cli.md` for `changes no other check` and confirm that every hit names both `remote-github` and `branch-protection`.
- The `docs/cli.md` §7 table's order matches `CHECKS` in `cli/src/doctor/checks.ts`: `branch-protection` follows `forge`.
- Grep the changed lines for a path on the machine that wrote them, and find none (`.claude/context/conventions.md` → `## The testing bar`, the self-containment bullet).

**Deviations from plan:**

- `docs/cli.md` → the `**\`--check-github\`**` paragraph's closing sentence *"With `execution.target` at `local` it asks nothing."* was also falsified by this branch: `BRANCH_PROTECTION_CHECK` (`cli/src/doctor/checks.ts`) never reads `execution.target`. Rewritten to scope it to `remote-github` and to say `branch-protection` does not read that key.
- `docs/config.md` → the `protectedBranches` row: the `branch-protection` sentence sits after *"A **glob** entry is not graded at all"* rather than directly beside *"by `doctor`'s `protected-set` check"*, so the glob sentence keeps qualifying `protected-set`; it adds that `branch-protection` reports a glob entry as not checked.
