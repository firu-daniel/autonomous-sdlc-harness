# Plan-review rounds

## Resolved values

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `devscene/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<findings_folder>` | derived at runtime | The reviewer's own findings folder, as its dispatch names it. |
| `<iteration>` | derived at runtime | The round number the dispatch names (`iteration:`). In the fix-plan loop it is the round index `<k>`. |
| `<review_mode>` | derived at runtime | The dispatch's `review_mode:` value — `full` or `converging`. |
| `<revision_note>` | derived at runtime | The dispatch's `revision_note:` value — the path of the writer's revision note for the round under review. |
| `<branch>` | derived at runtime | The branch the dispatch names. |
| `<N>` | derived at runtime | The fix-plan loop's user-review round, as the dispatch names it. |
| `<k>` | derived at runtime | The fix-plan loop's round index within user-review round `<N>`, as the dispatch names it. |

**Placeholder resolution.** Every token above but `<state_dir>` is a dispatch value of the citing loop; each core owns its keys and every `<state_dir>` expansion, and this file names none. Every other `<…>` name here is defined by this file's own text at its use site.

## Who may cite this

These documents point at a section of this file:

- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-reviewer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/architecture-reviewer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/business-parity-reviewer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/user-review-fix-plan-writer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/skeptic-reviewer.md`

A citer **points and never restates**, and no plugin asset beyond this list points at this file. A new citer joins this list. An edit that rewords or moves a heading updates every roster member in the same change. A document outside the plugin cites this file by its repo-relative path and is not a roster member.

## The round file

A reviewer writes `<findings_folder>/review_<iteration>.md` every round, **`PASS` included**, creating the folder itself on its first file. If `review_<iteration>.md` is already present it is from an interrupted round: review again in the mode the dispatch names, and replace it.

- Line 1: `# <title> — round <iteration>`, `<title>` being the reviewer's own (`Task plan review`, `Architecture review`, `Business parity review`).
- Then, before any section, exactly one line `verdict: PASS` or `verdict: FAIL` and exactly one line `review_mode: full` or `review_mode: converging`.
- On `PASS` the file holds only those lines plus any `## Should Fix`, `## Nice to Have` and `## Incidental findings (not gating)` sections.

Return on `PASS`:

```
verdict: PASS
findings_file: <full_path>
```

Return on `FAIL`: the reviewer's existing three lines — `verdict: FAIL`, `findings_file: <full_path>`, `must_fix_count: <N>`.

## The Must Fix entry

Each Must Fix keeps its title naming the target file and its `**Fix:**` line, and carries two more lines:

- `**Raised against:**` — a short verbatim quote of the text the finding was raised against.
- `**Must hold:**` — the defect stated as the property the target file must satisfy, never as a text replacement.

## Converging mode

Under `review_mode: converging`, read in this order:

1. Your own `review_<iteration − 1>.md`, and the revision note at `revision_note:`.
2. Where the branch history carries the previous round's commit — the most recent commit whose subject is `chore: Plan round <iteration − 1> for <branch>` (task plan) or `chore: Fix plan <N> round <iteration − 1> for <branch>` (fix plan) — find it with one plain `git log -1 --format=%H -F --grep="<subject>"`, then read the plan's diff since it, `git diff <sha> -- <story_path> <task_files_dir>`, plus `git status --porcelain -- <task_files_dir>` for new files. `<story_path>` is the plan's index and `<task_files_dir>` its per-item folder, as the dispatch names them.
3. The current plan, at the files those point to.
4. Another reviewer's findings file **only** for a finding the revision note says changed text inside your own lens, at the path the note gives.

Check only:

- each of your own previous Must Fix items is resolved;
- every change the writer made is sound within your own lens, including text that references or is referenced by the changed text;
- the `## Rejected findings` entries, under the recorded-rejection rule and `## A rejection recorded under precedence`.

Do not re-review the rest of the plan. A rule of your own that assumes a whole-plan sweep applies to the text the round's changes reach; your own definition names that variant.

**Fallback:** when your own previous file or the revision note is absent, review `full` this round and write `review_mode: full`.

## Incidental findings — where they go and who reads them

Anything a converging reviewer notices outside the scope `## Converging mode` sets goes under a heading spelled exactly `## Incidental findings (not gating)`. It never counts toward the verdict, the reviewer does not go looking for it, and a round whose only findings are incidental is a `PASS`.

The end-of-branch reviewers read every such section in the planning rounds' files — the three task-plan gate folders and the two user-review gate folders, as their own definitions list them — and treat each entry as a **lead to verify against the diff**, never as a finding in itself.

## A rejection recorded under precedence

A writer that resolves two incompatible findings by precedence — task plan: business parity, then architecture, then plan structure; fix plan: business parity, then architecture — records the losing one under `## Rejected findings` as:

`- **<reviewer> <n>** (rejected round <i> — precedence: <winning reviewer> <m>) — <why the two cannot both hold>`

This is the one exception to *"`call stands` is unavailable for a Must Fix"*. The losing reviewer tests only whether the two findings are genuinely incompatible and whether the winning one still stands in the current plan. When both hold, the entry is closed; otherwise it re-raises the finding once, engaging the recorded reason.

## The writer's revision

The round's prompt names every findings file of the round and the revision note path.

1. Group the round's Must Fix items by target file across every findings file. Read every finding on a file against that file's **unchanged** text before the first edit to it.
2. Resolve incompatible findings by `## A rejection recorded under precedence`.
3. Each Should Fix of the round is applied, or recorded under `## Rejected findings` with its reason; none is held for a go-ahead the loop does not relay.
4. Never act on an `## Incidental findings (not gating)` entry.
5. Write the revision note **last**, at the path the prompt names:

```
# Revision note — round <iteration>
- <reviewer> <n> (<findings file path>) — files: <files changed> — <resolved | resolved by <reviewer> <m> | rejected — see ## Rejected findings>
Unrequested changes: <every file changed that no finding asked for, or none>
```

One line per finding. A user-feedback revision writes one line per feedback item, its reviewer field `user`.
