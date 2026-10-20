### Task 8 — Move the five instruction files that declare `<MAIN_REPO>` to the canonical row, with "run copy" wording

**Goal:** Give the five instruction documents that declare `<MAIN_REPO>` in `## Resolved values` the one byte-identical resolution row, so each resolves the main checkout from the launcher's anchor first and from today's first `git worktree list` entry second. Move their run's-own-copy prose to **run copy** in the same pass.

**Depends on:**

- **Task 1**, which allow-lists the read as the exact profile rule `Bash(printenv HARNESS_MAIN_REPO)`, so the bare call below matches.
- **Task 3**, which exports `HARNESS_MAIN_REPO` to every session the watcher launches.

Until a launcher sets it, the read prints nothing and the fallback answers exactly as today.

**The canonical row — paste it byte for byte; the other three files that carry it (Tasks 9, 11, 13) carry the same bytes:**

```
| `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |
```

**The wording rule.** Prose that means the run's own copy says **run copy**, with articles fitted to the sentence. Keep:

- a sentence about a linked worktree as such — `git worktree`'s behaviour, a `.git` pointer, a worktree record;
- every name — `<worktree_glob>`, `create-worktree.sh`, `setup-worktree.sh`, the registry field `worktree`, permission rules such as `Write(/<worktree_glob>/**)`;
- every heading another file cites;
- text inside a fenced block or a quoted command.

The shared phrases take these fixed replacements, the same in every file that carries them:

| Phrase today | Becomes |
|---|---|
| `the run's **own worktree**` | `the **run copy**` |
| `the run's own worktree` | `the run copy` |
| `From a worktree, the script-allowlist guard` | `From a run copy, the script-allowlist guard` |
| `naming the same worktree root` | `naming the same run-copy root` |
| `The worktree root this run executes in` | `The run-copy root this run executes in` |
| `worktree branch` | `run branch` |

### Targets

- `plugin/instructions/dispatch_discipline_instructions.md`
- `plugin/instructions/task_plan_writing_instructions_autonomous.md`
- `plugin/instructions/autonomous_pause_and_ledger.md`
- `plugin/instructions/improvement_observations_instructions.md`
- `plugin/instructions/clarification_digest_instructions.md`

**Work:**

- [ ] **`dispatch_discipline_instructions.md` and `clarification_digest_instructions.md`.** Replace each file's `<MAIN_REPO>` row with the canonical row. Apply the shared-phrase table to the `<repo_root>` row, the commit-and-push paragraph's two shared sentences, and *"so the record lands in **this** worktree"* (dispatch discipline), which becomes *"in **this** run copy"*. In the digest file, *"go with the working copy"* becomes *"go with the run copy"*.
- [ ] **`task_plan_writing_instructions_autonomous.md`.** Replace the row. Apply the shared phrases to every *"Push the worktree branch"* / *"pushes the worktree branch"*, both *"From a worktree"* sentences, and the clarification channel's *"inside the run's own worktree (so it is per-worktree …)"*, which becomes *"inside the run copy (so it is per-run-copy …)"*, and *"What does survive the working copy"*. `## Clarification channel — file format (canonical, single source of truth)` keeps its heading and its file-name shapes byte for byte.
- [ ] **`autonomous_pause_and_ledger.md`.** Replace the row. Apply the rule to the `<repo_root>` row, the `<worktree_glob>` row's description (*"the sibling-worktree pattern an autonomous run's per-branch worktrees match"* becomes *"the sibling pattern an autonomous run's run copies match"*), the ledger's *"in the run's own worktree"* and *"survive a worktree recreate … recreate a worktree"*, §1.6's *"the worktree's own copy stays sandboxed"* and *"From a worktree"*, the clean-tree check's prose naming *"the worktree root"*, and *"non-protected worktree branch"*. Keep *"cannot write a linked worktree's record"*: git's own behaviour. Keep `git -C <worktree-root> status` and every quoted rule as quoted commands.
- [ ] **`improvement_observations_instructions.md`.** Replace the row and apply the shared phrases. Then:
  - **Machine-path check — before every wrapper call.** — keep the `git worktree list --porcelain` enumeration, and name `<MAIN_REPO>` (resolved by the row) as one more needle: *"every line beginning `worktree ` in `git worktree list --porcelain` gives a checkout root, `<MAIN_REPO>` is one more, and this run's `$REPO_ROOT` is among them"*. This line is the one stated exception to the anchor closure, because it enumerates every checkout root rather than resolving the main one (story index scope register row 35).
  - The labels `(main checkout)` / `(worktree of <other branch>)` are a wire written into intake files, so they stay byte for byte. The `.git` pointer example stays.
  - Prose such as *"gated in the worktree"*, *"not matching the worktree"*, *"worktree agents resolving `<state_dir>/`"* and *"in **this worktree**"* moves to run copy.
  - *"in a worktree runs sandboxed, where it cannot write the worktree's record"* keeps "worktree's record".
- [ ] **Close.** Run `grep -n 'worktree list' <each of the five files>`. Every line printed carries `printenv HARNESS_MAIN_REPO`, except the machine-path enumeration above.

**Verification:**

- `grep -c -F '| `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |' <file>` prints `1` for each of the five files.
- `grep -rn 'worktree list' plugin/instructions/dispatch_discipline_instructions.md plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/autonomous_pause_and_ledger.md plugin/instructions/improvement_observations_instructions.md plugin/instructions/clarification_digest_instructions.md`: every hit carries `printenv HARNESS_MAIN_REPO` or is the machine-path enumeration.
- `grep -n -i 'worktree' <each file>`: every remaining hit is a name, a quoted rule or command, a `.git` pointer or record, the intake label wire, or the enumeration. Read each and record any judgement call in the deviation notes.
- `grep -rn -F "From a worktree, the script-allowlist guard" plugin/instructions` prints no line from these five files.
- **Deviations from plan:**
  - `improvement_observations_instructions.md` → `## Commit mechanics` → *"A raw `git commit` — or a bare `git add` — in a worktree runs sandboxed, where it cannot write the worktree's record"* is kept whole, not only its "worktree's record": the sentence states git's behaviour in a linked worktree, which the keep list covers.
  - `autonomous_pause_and_ledger.md` §1.6: *"the worktree's own copy stays sandboxed"* became *"the run copy's own scripts stay sandboxed"* — "the run copy's own copy" does not read, and the referent is the two wrappers just named.
  - Judgement calls beyond the listed phrases, all meaning the run's copy: §1.1 user-review paragraph *"the same branch/worktree"* → *"the same branch/run copy"*; *"only the working copy's index did not take"* → *"only the run copy's index did not take"*; *"the watcher's worktree-reuse check"* → *"the watcher's run-copy reuse check"* (no other file quotes it: `grep -rn -i 'worktree-reuse\|worktree reuse' plugin docs cli/templates ARCHITECTURE.md` printed only this line); *"worktree agents resolving"* → *"agents in a run copy resolving"*; *"or a sibling worktree —"* → *"or a sibling run copy —"*.
  - The machine-path enumeration drops *"(the first is the main checkout; …)"* for the plan's text, so the main checkout's needle comes from the row rather than from list order.
  - Verification ran: the canonical-row `grep -c -F` printed `1` for each of the five files; the `worktree list` grep's only hit without `printenv HARNESS_MAIN_REPO` is the machine-path enumeration; the `From a worktree, the script-allowlist guard` grep prints no line from these five files (its remaining hits are in four autonomous forks owned by Tasks 11 and 12); `bash scripts/typecheck.sh` printed `PASS: typecheck`.
