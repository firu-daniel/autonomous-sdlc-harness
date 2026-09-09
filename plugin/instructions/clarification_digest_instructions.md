# Clarification digest — committing what a park asked and how it was answered (Phase D, best-effort)

## Resolved values

The tokens below are neither Mode-contract **bindings** (this file declares none — the `**Placeholder resolution.**` note below states where the ones it *uses* come from) nor ordinary **path placeholders** (`<branch>`, and the locally-defined counters `<n>` / `<N>`): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the repo-relative directory the generated wrapper scripts live in. The two scripts this file names by path, `commit-on-branch.sh` in `## Commit mechanics` and `push-branch.sh` in `## Push`, are outer-loop scripts rather than generated wrappers — they are named by their destination path, and the item that delivers them settles it. |

---

The **last of Phase D's artifact writes** — it follows the improvement-observations intake — and best-effort, for the two autonomous flows (the autonomous task flow and the autonomous user-review-fix flow). The park-and-ask clarification channel is machine-local: its question and answer files go with the working copy, so a park's diagnosis and the operator's ruling are destroyed when that copy is removed. This step writes the copy that survives — one committed block per clarification the branch parked on, at `<state_dir>/clarification_digests/<branch>.md`.

This file is the canonical policy. A flow **activates** it by adding one `Override J` (see `## Activation`); this file is otherwise inert.

**What the activating flow's Override J supplies.** This file states everything that is fork-independent. Each activating Override states only what its own fork binds:

1. The exact Phase-D placement point, and **which flow-progress ledger entry the write must precede** (this step has no `[ ]`/`[x]` flip of its own, so it must land before the flip that would let a resume skip past it).
2. The emission of the D.2 Done-summary bullet (`## Surfacing it in the Done summary`).

**Placeholder resolution.** Per `${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Bindings vs. path placeholders`, the `<branch>` path placeholder and the `$REPO_ROOT` shell value resolve from the **activating flow's own entry core `## Setup`** and that flow's `<repo_root>` binding — never from the immediate citing file, and never from this file. If a placeholder here is unresolved, you arrived without your entry core's `## Setup` — go read it.

## What is digested

- **The source set** is every `question_<n>.md` under `$REPO_ROOT/<state_dir>/clarifications/<branch>/` **and** every one under that directory's `answered/` archive. Read **both**: by the consume-then-archive ordering in `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`, an earlier park's pair is already archived while the pair that resumed *this* session is still at the top level. That section is the one definition of the channel's directory, filenames and question/answer pairing; resolve each pair by its rule and restate none of it here.
- **Derived from files on disk, never from session memory.** That is what makes this class fully reproducible on a resumed session and on a later round, unlike the freely-observed class of the intake beside it.
- **A question whose paired answer file is absent still takes an entry**, saying so — `## The entry format` gives the two fields their arms for that case. The run reached Phase D, so the block was resolved out of band, and dropping it is the silence this step exists to remove.
- **This opens no reviewer findings file and reads no review artifact.** Both orchestration cores' *"Do NOT read the contents of any reviewer findings file. The path is enough."* is untouched and needs no exception here.

## The entry format

One block per `question_<n>` in the source set, keyed by that index, in this shape:

```markdown
## question_<n> — <one-line problem statement, the decision this park needed>
- **raised by:** the agent or phase the question names
- **asked:** the decision needed, and the options the run was choosing between
- **answered:** the operator's ruling, quoted verbatim from its answer file — or, where no `answer_<n>.md` exists on disk, exactly `no answer file on disk — resolved out of band`, and nothing else: the fact that the run continued is the record, and an account of *how* it continued is the paraphrase the rule below forbids
- **carries beyond this branch:** what that ruling settles which outlives this branch — a rule about the project's own conventions corpus, an inventory of claims the branch falsifies, a standing decision — or `nothing beyond this branch`; on an absent answer this is `nothing beyond this branch`, since there is no ruling to carry
```

- **The heading is the key.** `question_<n>` is the block's identity and is never re-worded, re-numbered or reordered by a later run: it is the index of the source file the block was derived from, so it cannot drift from what is on disk, and the channel section cited in `## What is digested` is what keeps it unique for the branch's whole lifetime, `answered/` archive included. Read the existing file before appending and **skip any block whose `## question_<n>` prefix is already present** — that comparison, and nothing about the prose after it, is what `## Where it is written`'s append-only rule and `## Ledger / resume`'s byte-unchanged re-entry are decided by.
- **Enumerated content is carried verbatim**, from either file: a table, a list, an inventory. That is the diagnostic work a discarded exchange destroys, and a one-line gist of it is not a record of it.
- **Prose diagnosis is summarised to what a later reader must act on.** The block is a record, not a re-argument.
- **A ruling is never paraphrased, and never edited by a later run.** A later disagreement is a new question, parked and answered like the first.

## Where it is written

The digest is `<state_dir>/clarification_digests/<branch>.md` — **one per branch**, so no two runs ever touch the same file.

**Write mechanics — absolute write, repo-relative commit**, the split `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## Where it is written` states and this file does not restate: create the file with the file tool at `$REPO_ROOT/<state_dir>/clarification_digests/<branch>.md`, then pass the repo-relative `<state_dir>/clarification_digests/<branch>.md` to the commit wrapper. Create the directory first if it is absent — a plain `mkdir -p` is enough, and it is needed on a repository upgraded without an `init` re-run, where `doctor`'s `artifact-tree` check warns that the family is missing.

- **Append-only.** A later round or a resumed session reads the file first and appends only the blocks whose `## question_<n>` key it does not already carry (`## The entry format` → **The heading is the key.**); a block already present is left exactly as it stands and nothing already written is re-derived.
- **Skipped entirely when the branch parked on nothing** — no file, no empty commit, no error, no Done-summary bullet. The step is reached only by a run that gets to Phase D, so a park that is never answered is never digested: absence therefore reports "nothing to digest **on a run that finished**", never "this branch never parked."
- **Best-effort — never a gate.** Any failure (write error, wrapper refusal, push failure) is logged and the flow proceeds to its D.2 Done summary unchanged; it never blocks "branch ready for review," and it never walks away from a failed commit (`## Commit mechanics`).

## Commit mechanics

**Direct wrapper, never a `committer` dispatch, and never a bare `git add` / `git commit` to make this commit** — the canonical rule for a non-readiness artifact is `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §1.6, and the reasoning plus the **four wrapper exit codes with their per-code revert and re-stage duties** are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## Commit mechanics`. They apply here unchanged, with this file's own path and subject substituted. Pass the digest as the single explicit path, and keep the fixed subject `chore: Record clarification digest for <branch>` verbatim — **the same subject in both flows**, stated once here so neither activating fork can drift it:

```zsh
bash <scripts_dir>/commit-on-branch.sh --repo "$REPO_ROOT" \
  "<state_dir>/clarification_digests/${branch}.md" \
  -- "chore: Record clarification digest for ${branch}"
```

## Push

The push follows the commit **immediately**, as a **plain, single-statement** Bash command, using the same session-start `$REPO_ROOT`:

```zsh
bash <scripts_dir>/push-branch.sh "$REPO_ROOT"
```

> ⚠️ **No exit-code gate.** Why an `if …; then … fi` wrapper is a headless stall, and why no gate is needed, is canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## Push` and applies here as written.

## Ledger / resume

This step runs **inside the activating flow's Phase D re-runnable region** and gets **no** flow-progress-ledger entry — do **not** add a `[ ]`/`[x]` flip for it. It must land **before** that flow's terminal Phase-D ledger flip, which the activating Override names: that flip is the run's last ledger entry, so a pause taken after it resumes into a Phase D that resume-from-ledger skips entirely.

A resumed session re-enters this step and **re-derives the same blocks from the same files** — it remembers nothing from the pre-pause session and needs to. It appends only the blocks whose `## question_<n>` key the file does not already carry, so the common re-entry — every key already present — appends nothing, leaves the file byte-unchanged and takes wrapper **exit 3** (nothing to commit; the unconditional push is then a harmless no-op). That is a normal outcome, not an error.

## Surfacing it in the Done summary

When blocks were written, the run's D.2 Done summary carries one additional bullet:

`📋 <N> clarification(s) digested → <state_dir>/clarification_digests/<branch>.md`

`<N>` is the number of blocks **this session wrote** — never the file's total, and never an earlier session's or round's blocks. **Omit the bullet entirely when this session wrote none**: a branch that parked on nothing, or a re-entry that appended nothing (the exit-3 case above). Neither core's D.2 bullet list is edited to add it — the **activating Override** states that its own fork emits this bullet.

## Activation (wired via Override J — recorded here for reference)

This policy is activated by **`Override J`** in both autonomous flows, which run it at **Phase D — after that flow's `Override I` improvement-observations intake, and before its D.2 Done summary**:
- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → `## Override J — clarification digest (autonomous fork only)` — task flow.
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md` → `## Override J — clarification digest (autonomous fork only)` — fix flow.

Each activating fork adds exactly one; **do not add a second activation point in a fork.** Until a fork adds one, nothing runs this file.
