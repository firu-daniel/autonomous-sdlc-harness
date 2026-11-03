# Review plan meta-review — iteration 0

## Must Fix
1. **Missed check: the diff touches the `plugin` layer, and the review shows no finding or clean-pass rationale drawn from `.claude/context/plugin.md`.** Refers to "Structure" (missed check). The file to change is the index, `harness-runs/skeptic_reviews/fix_linux_detached_gate_run_skeptic_review.md` (`## Context` → **Checked and clear:**).
   With the run artifacts excluded, `git diff origin/dev...HEAD --name-only` lists eight paths under the `plugin` layer's path `plugin`:
   - `plugin/docs/AUTONOMOUS_FLOW.md`;
   - `plugin/instructions/mode_contract.md`;
   - `plugin/instructions/plan_orchestration_instructions_core.md`, `…_autonomous.md` and `…_semi_autonomous.md`;
   - `plugin/instructions/user_review_fixes_instructions_core.md`, `…_autonomous.md` and `…_semi_autonomous.md`.

   These are Tasks 5 and 6: the new `<gate_launcher>` mode-contract binding, G.1 step 2's branch on the launcher's line, the stop-condition and no-verdict-line edits, and the autonomous flow document's Run gates row.

   The Context's **Reviewed:** list says the review read "Phase G's G.1 step 2 and the `<gate_launcher>` bindings in the cores and the four forks". But none of the **Checked and clear:** bullets covers that layer:
   - Check 1 (wiring) is about library and probe functions.
   - Check 3 (citations) is about `docs/sandbox-verification.md` rows.
   - Check 4 (divergences) is about intentional divergences.

   Finding 1 is tagged `_(layer: cli, general)_` and touches no `plugin` file. The **De-duplicated against:** paragraph cites the code and architecture reviews' applied findings. It does not say that either review gave the `plugin` layer a clean pass, so it is no rationale for this review's silence. The same gap was raised against earlier skeptic reviews on `feat_forge_run_control`, `feat_forge_run_triggers` and `fix_remote_job_permission_profile`.

   This meta-review spot-checked the binding and found it consistent. Both cores that run Phase G name `<gate_launcher>`, `mode_contract.md` carries its row, and all four forks bind it: the two autonomous forks to the literal launcher spelling, the two semi-autonomous forks to `none`. So what is missing is the review's own record, not a new defect.

   **Fix:** In the index only, add a **Check (plugin layer)** bullet under **Checked and clear:**. Draw it from `.claude/context/plugin.md` and name the eight files. At minimum, it must record each of these as holding:
   - `## Cores, forks and the single-owner rule`, rule 1: every fork binds the `<gate_launcher>` that its core declares. Rule 4: the cores carry no literal launcher spelling, slash-command name or absolute path. The spelling lives in the autonomous forks only.
   - `## Registries — a name routed to an implementation`: `mode_contract.md` → `## Binding vocabulary` carries the new binding's row.
   - `## Wires: dispatch in, return out` and `## Writing agent prose` → *Never paraphrase a wire literal or a cited anchor*: G.1 step 2's `pending` / `in-session` literals and its refusal branch match the launcher's header exit map (`cli/templates/scripts/launch-sandboxed-gates.sh`, `Exit map`), and the stop-condition text names the launcher's stderr refusal without restating another core.

   If any of these does not hold, add it as a new `finding_2.md` in `harness-runs/skeptic_reviews/fix_linux_detached_gate_run_skeptic_review/` instead, with its site anchor, its `### 2. …` pointer under the right severity section, and its readiness entry tagged `_(layer: plugin)_`. Leave `finding_1.md` as it is for this Must Fix. This meta-review checked its site anchors against the tree, and every one resolves:
   - `lsg_bwrap_args_var`'s `.git` block;
   - the header bullets under `# THE BWRAP VECTOR`;
   - the `local` line that already declares `rel` and `c`;
   - `expectedVector`'s `.git` line and case `(l)`;
   - residual 13's two bullets in `docs/cli.md`;
   - `BUILTIN_PATHS`;
   - `hr_run_protected_rel_paths`.

## Should Fix
1. **Finding 1 overstates what the record establishes about the built-in list.** Refers to review finding #1, file `harness-runs/skeptic_reviews/fix_linux_detached_gate_run_skeptic_review/finding_1.md` (**Problem.**).
   The Problem paragraph says Claude Code's sandbox write-protects "a fixed set of paths … whatever the profile says". It also says that inside the sandbox "each of these paths was a read-only `/dev/null` placeholder", and attributes that reading to the cited paragraph (AP7's session, 2026-10-30, Claude Code 2.1.314). The record does not support either statement as written:
   - That paragraph records only that sandboxed `git status` listed the 21 paths as untracked, and it closes with *"This is one session's reading, not Claude Code's definition of the list."*
   - The read-only `/null` mount reading is the 2026-10-31 re-measure on Claude Code 2.1.316. It sits in `docs/sandbox-verification.md` §6, in the bullet **Claude Code's built-in protected paths in a run copy:**, which also says *"Claude Code's own list is not readable from a run"*.
   - `scripts/sandbox-absent-path-check.sh` → the comment above `BUILTIN_PATHS` says the same.

   Fix step 7's residual text already hedges this correctly ("the one session's reading"). **Fix:** In `finding_1.md`, reword the Problem paragraph to call the list one session's reading rather than a fixed set. Cite the §6 bullet, with its 2026-10-31, 2.1.316 reading, for the read-only `/null` mounts.

2. **Case `(m)`'s pinning assertion holds only for an absent root-level path.** Refers to review finding #1, file `finding_1.md`, fix step 5.
   For a present path the vector carries `--ro-bind <p> <p>`, so `argv.indexOf(p)` finds the source position, and `--ro-bind` sits at `i - 1`, not `i - 2`. The assertion passes today only because the `init` fixture has no `.bashrc`, `.gitmodules` or `.vscode`. A fixture that gains one would report a pinned path as "not pinned". **Fix:** In `finding_1.md` step 5, accept both shapes: either `argv[i - 1] === '--ro-bind'` with `argv[i + 1] === p`, or `argv[i - 2] === '--ro-bind'` with `argv[i - 1] === '/dev/null'`. Alternatively, assert that the fixture holds none of the three before it checks them.
