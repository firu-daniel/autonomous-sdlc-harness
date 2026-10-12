### Task 22 — Correct the unlisted-call statements in the agents, the flow docs and the plugin scripts README

**Goal:** Under the `dontAsk` mode the generated profile now ships, a call the profile neither allows nor denies, or that hits an `ask`, is **refused at once**. The committer, the interactive-test agent, the two flow documents and the plugin scripts README still say it stalls. Rewrite each consequence clause minimally, keeping the rule it supports. These are scope register rows 98–100, 109, 122, 158 and 160.

**Depends on:**

- Task 15 — the default mode and the story's canonical restatement. State the default only, and do not add the `acceptEdits` override clause.
- Task 10 — it edits `plugin/agents/committer.md` first (the push sub-steps, `## Resolved values`). This task edits none of the lines Task 10 wrote.
- Task 21 — it writes the clause *"evaluated before any `allow`, and refused in an unattended run"* into the three commands' `<protected_branches>` rows. This task uses those exact words for the same fact.

**Where this task stops.** The whiteboard's *"5. The sandbox"* row stays (register row 40), and so does its line-7 stall watchdog mention. `plugin/scripts/README.md` 21 is a dated measurement (*"nothing stalled"*) and stays. No agent's frontmatter or `tools:` allowlist changes.

### Targets

- `plugin/agents/committer.md` — 80, 113.
- `plugin/agents/qa-tester.md` — 120.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` — 83, and **Capability is withheld by basename, not by hope.** (*"evaluated before any `allow`, and unanswerable in an unattended run"*, row 160).
- `plugin/docs/AUTONOMOUS_FLOW.md` — 254, and **2. The best-effort convenience layer.** (*"evaluated before any `allow`, and unanswerable in an unattended run"*, row 158).
- `plugin/scripts/README.md` — 15, 22.

**Work:**

- [ ] `committer.md`:
  - 80 *"the invocation is silenced, and unattended that is a stall rather than a refusal"* → and unattended that is a refusal;
  - 113 *"the headless trap that stalls an unattended run on a permission prompt"* → that an unattended run refuses.

  Every return field and wire string stays byte-stable. Run `grep -rn 'pushed: ' plugin` before and after; the result set must be unchanged.
- [ ] `qa-tester.md` 120 *"an un-granted tool **stalls** the whole run instead of erroring"* → an un-granted tool is **refused**. The tool is loaded but not allowed, so the mode decides it. Keep the instruction to read the profile the run was launched with.
- [ ] `AUTONOMOUS_FLOW_WHITEBOARD.md` 83, the bullet **Allow-list completeness is load-bearing in a way it is not interactively.**:
  - *"an un-allowed, un-denied tool call **stalls** rather than prompting, so a permission gap is an outage rather than a question"* → is **refused** rather than prompting, so a permission gap is a missing step rather than a question.
  - Keep the bold lead.
  - The next bullet, **Capability is withheld by basename, not by hope.**: *"evaluated before any `allow`, and unanswerable in an unattended run"* → *"evaluated before any `allow`, and refused in an unattended run"*. In `AUTONOMOUS_FLOW.md` **2. The best-effort convenience layer.**, the same clause gets the same words. These are the words Task 21 writes in the three commands' `<protected_branches>` rows.
- [ ] `AUTONOMOUS_FLOW.md` 254 and `plugin/scripts/README.md` 15 *"What a missing entry costs is a **silent stall** rather than a refusal"* → *"What a missing entry costs is a **refusal** at the first helper the run reaches"*. In `scripts/README.md` 15, also correct *"parks with no …"*. In 22, *"so this class's stall is unexercised rather than disproved"* → this class's failure.

**Verification:**

- Re-run derivation entry G's two commands with `-n` in place of `-l` and the five targets as the pathspec. Every remaining hit must be a line a `no-change` row keeps for these files: `AUTONOMOUS_FLOW_WHITEBOARD.md` 7 and its watchdog lines (row 161), `AUTONOMOUS_FLOW.md`'s watchdog row and park paragraph (row 159), and `plugin/scripts/README.md` 21.
- `git grep -n -F 'and unanswerable in an unattended run' -- plugin` prints nothing once this task and Task 21 have landed.
- `committer.md` and `qa-tester.md` frontmatter are unchanged: `name`, `description`, `tools` and `model` only.
- The flow doc and the scripts README state the missing-entry cost in the same words. Check with:

  ```
  git grep -n -F 'costs is a **refusal**' -- plugin
  ```

  It hits both files.
