### Task 7 — State the script, the allow rule and the new `doctor` arms in `docs/cli.md`, `docs/watcher.md` and `docs/guard-verification.md`

**Goal:** The developer documents say what is now true: the fence's opt-out answer is a shipped outer-loop script, its exact invocation is allow-listed in the committed `.claude/settings.json`, `doctor`'s `task-offer-rules` grades both, and the script-allowlist guard leaves the script allowed.

**Depends on:** Tasks 1–6, whose facts this task states and does not redefine:

- Task 1 — `task-offer-check.sh`, an outer-loop script (`create-if-absent`, mode `0755`, copied verbatim), row `agentInvocable: false`, no deny-list entry; run bare from the checkout root; prints the main checkout and exits 0 only when the offer may proceed, exit 1 silent for every other outcome, exit 2 on bad usage; reuses `harness-run-lib.sh` unchanged; reads no `HARNESS_MAIN_REPO`; `jq` on the clone arm only; refuses the accepted stricter clone case (planted trust files, an out-of-allow-list `.git/config` key). The main checkout's copy is write-protected in the unattended profile like every top-level outer-loop script; the profile gains no allow entry. A checkout that predates the script is silent; an older copy needs nothing (`init --force` upgrades it).
- Task 2 — `.claude/CLAUDE.md` item 4 names `bash <scriptsDir>/task-offer-check.sh`, produced by `scriptInvocation`.
- Task 3 — `.claude/settings.json` gains `permissions.allow: ["Bash(bash <scriptsDir>/task-offer-check.sh)"]` (exact, no `:*`) where no `permissions.allow` list exists; an existing list is kept and `init` warns, naming the rule to add by hand.
- Task 4 — `task-offer-rules` warns, never fails, when the fence names the invocation and the script is absent or the rule is missing; a project file that does not name it is graded as before.
- Task 6 — the guard's left-allowed set names the script; its code is unchanged.

**Where this task stops.** Dated records elsewhere (`docs/outer-loop-verification.md` §3, `docs/sandbox-verification.md`) are not edited. Any shell command an adopter is told to run goes in a fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*).

### Targets

- `docs/cli.md` → §3 (the outer-loop-scripts row and the `.claude/settings.json` row), §5 (*"Two families land in `scriptsDir`"*), §7 (the `task-offer-rules` row and the bullet opening *"**`task-offer-rules` is a warning in every state it can report**"*)
- `docs/watcher.md` → `## 2. The scripts` (the table and the paragraph *"**Why only the `yes` rows carry a profile entry …**"*)
- `docs/guard-verification.md` → the dated-entry run under `## 1.`, after the **2026-10-29** entry

**Work:**

- [ ] **`docs/cli.md`.** §3: the `.claude/settings.json` row's reason names the third key — the fence's exact allow rule — and that an existing `permissions.allow` list is kept, with `init` warning instead. §5: add `task-offer-check.sh` to the outer-loop family list and say, in the paragraph's own terms, that it is run by an interactive session's fence, is `agentInvocable: false` with no deny-list entry, and that its allow rule lives in the committed project settings rather than the unattended profile, which clause 1 of the fence excludes. State the predating-checkout and older-copy outcomes once here. §7: the `task-offer-rules` row and bullet gain the two new warning arms, their gate (the project file names the invocation) and their remedies.
- [ ] **`docs/watcher.md`.** Add a table row for `task-offer-check.sh` — what it does (the fence's opt-out answer, per the contract above), who runs it (an interactive session's change-request fence, bare from the checkout root), profile allow entry `no`. In the paragraph after the table, add it to the list the guard auto-allows deliberately and change *"Those seven"* to the new count, keeping the sentence's claim that `plugin/hooks/README.md` and the guard's comment name the same set.
- [ ] **`docs/guard-verification.md`.** Append one dated entry in the form of the existing ones: `fix_task_offer_check_script` changed only the `LEFT ALLOWED, DELIBERATELY` comment of `plugin/hooks/autonomous-script-allowlist-guard.sh` and `plugin/hooks/README.md`; the command that shows it (`git diff -U0 <merge-base> -- plugin/hooks/autonomous-script-allowlist-guard.sh`, with the merge base printed by a bare `git merge-base HEAD origin/dev` and its hash stated) and that every changed line begins `#`; the two decisions re-taken by hand on a throwaway fixture per `plugin/hooks/README.md` → `## Reproducing a decision by hand` — `bash <scripts_dir>/task-offer-check.sh` answers `allow`, the same with `| cat` appended answers nothing — each with its exact command and output; and that no latency row is re-taken because no decision path changed.

**Verification:**

- `git grep -n -F 'task-offer-check.sh' -- docs/cli.md docs/watcher.md docs/guard-verification.md` reaches §3 or §5 and §7 of `docs/cli.md`, the `docs/watcher.md` table row and paragraph, and the new dated entry.
- Every plugin command the added prose names is spelled `/autonomous-sdlc-harness:<name>`, never with a bare slash, and every command an adopter is told to run sits in a fenced block.
- No sentence in the three files quotes the #214 one-liner: `git grep -n -F 'worktree list --porcelain | sed' -- docs` prints nothing.
