### 2. The Task 1 commit subject is not a bare imperative sentence

**Where:** commit `25be2c2` on `feat_note_updated_at` — the subject line
`Task 1 — Add optional updatedAt to NoteRecord and widen its guard`. The rule it breaks is in
[.claude/context/conventions.md](../../../.claude/context/conventions.md) → `## Commit-message policy`.

**The problem.**

`.claude/context/conventions.md` (`## Commit-message policy`) states the form for a commit touching this
project's own source:

> **Subject-prefix vocabulary: none for this project's own commits.** A commit touching `src/`, `test/`,
> `tools/`, `index.html`, `styles.css` or a toolchain manifest has **no type prefix** — no `feat:`, no
> `fix:`, no `chore:`. **The subject is a bare imperative sentence**: `Ignore this project's build output
> and dependency tree`.

`Task 1 — Add optional updatedAt to NoteRecord and widen its guard` is not a bare imperative sentence.
It opens with a noun phrase naming a plan item and reaches the imperative only after an em dash. The
`chore:` prefix is reserved for the harness's own artifact commits, and the document says so explicitly
— "a prefix in a subject is the signal that the commit carries a flow artifact rather than code" — so
a code commit that leads with its own non-imperative identifier blunts exactly the signal the policy
exists to keep sharp.

This is visible only at branch level, which is why it survived to here. The branch has six code commits
and the other five are in the correct form, appending the plan reference as a trailing parenthetical
instead:

```
Style .note__edited and hide its never-edited state (Task 6)
Pin the mapper boundary and stamping rule in notesService tests (Task 5)
Pin the widened isNoteRecord guard in the store suite (Task 4)
Render the note row's Edited line, published as note-edited (Task 3)
Carry updatedAt on Note and stamp it in editNote alone (Task 2)
Task 1 — Add optional updatedAt to NoteRecord and widen its guard      <- the odd one out
```

A reviewer looking at one commit sees nothing wrong; the inconsistency only exists across the set. No
consumer decision turns on it and nothing about the code is affected, so this is graded Nice to Have.

**The fix.**

Reword the subject of `25be2c2` to the imperative form, matching its five siblings. Keep the trailing
`(Task 1)` parenthetical so the six read as one series:

```
Add optional updatedAt to NoteRecord and widen its guard (Task 1)
```

That is 65 characters, inside the 72-character cap the policy sets, and it carries no body, no trailing
period and no attribution trailer — the policy forbids the last of those outright.

This is history rewriting, and it is safe here in the sense that matters for other people's copies:
`git remote -v` returns nothing and `git rev-parse --abbrev-ref @{u}` reports no upstream, so the
branch exists only in this checkout and no rewrite can invalidate anyone else's clone. `25be2c2` is
`HEAD~8`; it is the sixth **code** commit back, the three above it being `chore:` artifact commits.
Re-derive that number at fix time (`git rev-list --count 25be2c2..HEAD`) rather than trusting it —
every phase that closes appends another artifact commit and moves it.

**When to do this — it is the last thing done on the branch, and never anything else.** Rewording
`25be2c2` replays all eight descendants, including the harness's own `chore: Flow progress …` artifact
commits, onto a new base. `sdlc-harness/flow_progress/feat_note_updated_at_progress.md` still has
`Bg`, `Bm`, `C`, `C2*`, `E` and `D` open, and this code review is not yet committed; each of those
phases appends commits, so a rewrite performed between two of them rewrites history that a later
phase is still writing into. Do it **after phase D (`Branch statistics committed & pushed`)**, when
nothing further will append, or do not do it at all — the item is graded Nice to Have precisely
because it is worth less than the disruption of taking it mid-flow. A fix loop reaching this item
before `D` closes should leave it unticked and carry it forward rather than actioning it.

Sub-steps (all of them gated on the paragraph above):

- [ ] Confirm phase `D` in `sdlc-harness/flow_progress/feat_note_updated_at_progress.md` is closed and
      no further commit is expected on the branch. If it is not, stop here and leave this item open.
- [ ] Confirm the working tree is clean (`git status --porcelain` returns nothing) before starting.
- [ ] Reword the subject of `25be2c2` to
      `Add optional updatedAt to NoteRecord and widen its guard (Task 1)`, leaving its tree, its author
      and every other commit on the branch untouched. Because interactive rebase is unavailable in this
      environment, do it non-interactively — for example, check out the commit, `git commit --amend -m`
      with the new subject, and replay the descendants onto the amended commit with
      `git rebase --onto <amended> 25be2c2 feat_note_updated_at`.
- [ ] Verify with `git log main..HEAD --format='%s' | grep -v '^chore:'` that all six code subjects now
      begin with an imperative verb, and that the reviewed diff is unchanged — byte-identical to what
      it was before the rewrite — using the **same exclusion pathspec this review was conducted
      under**:

      ```
      git diff main...HEAD --stat -- ':(top,exclude)sdlc-harness/*feat_note_updated_at*' ':(top,exclude)sdlc-harness/docs_catalog/reviews/*'
      ```

      That must report **8 files, 211 insertions and 8 deletions** — the same reviewed diff the
      index's Context paragraph describes as "8 files and 211 insertions". Do **not** use the bare `git diff main...HEAD --stat` against those
      numbers: this branch carries its own run artifacts under `sdlc-harness/` as committed files
      inside `main...HEAD`, so the unfiltered command reports a much larger total — 25 files and 1099
      insertions at the time this finding was written — and that total grows with every phase that
      appends an artifact commit. If you would rather check the unfiltered diff, the invariant is a
      comparison and not a constant: capture its `--stat` output immediately *before* the rewrite and
      require the output after the rewrite to be byte-identical to that capture, rather than to any
      number written here.

## Disposition

Closed as **dispositioned, not fixed**. The subject of `25be2c2` is unchanged and the finding's own gate
is the reason. Recorded 2026-09-07, on the escalation answer the dispatch carried: this run closes the
item as dispositioned rather than performing the rewrite or halting the flow on it.

- **(a) Attempted.** Reword the subject of `25be2c2` on `feat_note_updated_at` to
  `Add optional updatedAt to NoteRecord and widen its guard (Task 1)` and replay its descendants, per
  the sub-steps above. Target paths: no file — the change is to commit metadata on this branch alone.
  The first sub-step is the gate, and it fails: `sdlc-harness/flow_progress/feat_note_updated_at_progress.md`
  has `C`, `C2g`, `C2m`, `C2f`, `E` and `D` unticked, so phase `D` is not closed and further commits are
  expected. No file was written for this item other than this section.

- **(b) The refusal, quoted.** It is this finding's own timing gate, not a tool-layer refusal — stated
  here rather than paraphrased, from `**When to do this — it is the last thing done on the branch, and
  never anything else.**` above:

  > Do it **after phase D (`Branch statistics committed & pushed`)**, when nothing further will append,
  > or do not do it at all — the item is graded Nice to Have precisely because it is worth less than the
  > disruption of taking it mid-flow. A fix loop reaching this item before `D` closes should leave it
  > unticked and carry it forward rather than actioning it.

  The secondary refusal is the run's permission profile, which puts the fix's own mechanism behind an
  interactive prompt — see (c).

- **(c) Why nothing reachable inside this run lifts it.** Two independent reasons, either alone
  sufficient. First, the gate is a property of *where in the flow this dispatch sits*, and no later
  point in this flow satisfies it: `C2g`/`C2m`/`C2f` (skeptic review and its fixes), `E` (QA) and `D`
  (branch statistics) each append commits after this fix loop, and `D` is the last of them — so the
  only moment the gate admits is after the flow this dispatch belongs to has ended. Deferring within
  this dispatch does not reach it. Second, I read the run's permission profiles —
  `.claude/settings.json` and `.claude/settings.local.json` carry no `permissions` entries;
  `.claude/settings.autonomous.json` carries `defaultMode: acceptEdits` and places
  `Bash(git checkout:*)`, `Bash(git rebase:*)` and `Bash(git reset:*)` under **`ask`**, while allowing
  `Bash(git commit:*)`. Every mechanism the sub-steps name (check out the commit, `git commit --amend`,
  `git rebase --onto`) therefore stalls on an interactive prompt in an unattended run, and the only
  configuration that would change that is an edit to the run's own permission profile — which this
  agent does not make, and which no dispatched instruction can authorize.

- **(d) Drafted remedy for an operator — one paste, to run after phase `D` closes and not before.**
  Run from the root of the checkout holding `feat_note_updated_at`, with a clean working tree. It
  captures the reviewed diff before and after and refuses to leave the branch rewritten if they differ.

  ```sh
  set -e
  git status --porcelain | grep -q . && { echo "working tree dirty; stop"; exit 1; }
  PRE=$(git diff main...HEAD --stat -- ':(top,exclude)sdlc-harness/*feat_note_updated_at*' ':(top,exclude)sdlc-harness/docs_catalog/reviews/*')
  git checkout --detach 25be2c2
  git commit --amend -m 'Add optional updatedAt to NoteRecord and widen its guard (Task 1)'
  git rebase --onto HEAD 25be2c2 feat_note_updated_at
  POST=$(git diff main...HEAD --stat -- ':(top,exclude)sdlc-harness/*feat_note_updated_at*' ':(top,exclude)sdlc-harness/docs_catalog/reviews/*')
  [ "$PRE" = "$POST" ] || { echo "reviewed diff changed; inspect before keeping this rewrite"; exit 1; }
  git log main..HEAD --format='%s' | grep -v '^chore:'
  ```

  The last line prints the six code subjects for the imperative-form check. Two measurements taken at
  disposition time, both of which move with every appended commit and neither of which should be
  hardcoded into a later check: `git rev-list --count 25be2c2..HEAD` is **13**, not the `8` the
  paragraph above records, and the filtered reviewed diff is **8 files, 227 insertions, 8 deletions**,
  not the `211` insertions recorded above — findings 1 and 3 landed 16 further insertions after this
  finding was written. This is why the script compares `PRE` to `POST` rather than to a constant.

  **Two siblings carry the same policy defect and this remedy does not address them.** `956cc6c`
  (`chore: Correct the stamp comment naming deleteNote (Finding 3)`) touches `src/domain/notesService.ts`
  and `5314138` (`chore: Assert deleteNote leaves another note's stamp alone (Finding 1)`) touches
  `test/notesService.test.mjs`, both under a `chore:` prefix that
  `.claude/context/conventions.md` (`## Commit-message policy`) reserves for artifact-only commits. They
  are not drafted here because each mixes artifact and code files in one commit, so the correct
  treatment is a split rather than a reword and that is a decision for the operator, not a paste.
