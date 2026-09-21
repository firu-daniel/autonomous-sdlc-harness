### Task 9 — Shared modules: digest a whole park per block, and the ledger's resume sentence

**Goal:** Make the clarification digest record one block per park — every question of that park and the answer file's ruling verbatim — without disturbing digests already committed, and make the flow-progress ledger's resume sentence say that every answered pair the watcher resumed for is consumed.

**Depends on:** Task 7, restated: `question_<n>.md` is now one file per park, opening with the raising agent/phase and holding one `## Q<k> — <decision needed>` section per question; `answer_<n>.md` answers the whole park, addressing questions by `Q<k>`; `<n>` stays unique across the branch directory and its `answered/` archive and is never reused; on a resume the watcher leaves every consumed pair at the top level until the resumed session exits, then archives exactly that set. Branches that parked before this layout have one-question files, and some have committed digests whose blocks were written one per question (this repository's own `chore_plugin_prefix_command_sweep` digest is one).

**Where this task stops.** The channel itself is Task 7's and is referenced, never restated, here. `### 1.7` of the ledger document gains no watcher detail: the loop guard is the watcher's and is documented by Task 12.

### Targets

- `plugin/instructions/clarification_digest_instructions.md` → `## What is digested`, `## The entry format`.
- `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)`, step 5.

**Work:**

- [ ] `## What is digested`: the source-set sentence becomes "an earlier park's pairs are already archived while the pairs that resumed *this* session are still at the top level"; the rest of the bullet, and the rule that the channel section is the one definition, stay.
- [ ] `## The entry format`: one block per `question_<n>` **file** — one per park. `**asked:**` carries each `Q<k>` of that file in order (its decision and options, enumerated content verbatim as the existing rule requires); `**answered:**` quotes the answer file verbatim, or the existing `no answer file on disk — resolved out of band` arm; `**carries beyond this branch:**` covers the park as a whole. Add to **The heading is the key.** that a block written for a one-question file before this layout is left exactly as written — its key is still the unique index of the file it came from, so append-only and the byte-unchanged re-entry are unaffected.
- [ ] `autonomous_pause_and_ledger.md` `### 1.7` step 5: "a top-level `answer_<n>.md` is consumed as today" becomes "the top-level answered pairs the watcher resumed for are consumed as `Override 2(a)` states", keeping the `Override 2(a)` label exactly as written (it is resolved by that label).

**Verification:**

- `grep -n "the pair that resumed\|consumed as today" plugin/instructions/clarification_digest_instructions.md plugin/instructions/autonomous_pause_and_ledger.md` prints nothing.
- Read the edited entry format against the committed digest `harness-runs/clarification_digests/chore_plugin_prefix_command_sweep.md` in this checkout: its single `## question_1 — …` block is a valid block under the new text with no edit, so re-running the step on that branch would append nothing.
- The fixed subject `chore: Record clarification digest for <branch>` and `## Commit mechanics` are untouched: `git diff plugin/instructions/clarification_digest_instructions.md` shows no change outside the two named sections.
