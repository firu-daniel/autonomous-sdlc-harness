### 3. Two documents still say an unanswered question alone makes a run parked, but the watcher now also parks on an answered pair left at the top level

**Files:**
- `docs/watcher.md` → `## 4. Pausing, parking and the usage gate`, the paragraph that starts **Parking is the same shape, on a different file.**: "the watcher classifies that as `parked` from the unanswered question alone, whatever the exit code"
- `cli/templates/state-dir/clarifications/README.md`, last paragraph: "an unanswered question file is the sole signal that classifies a run as parked"
- `harness-runs/clarifications/README.md`, this repository's byte-identical mirror, with the same sentence

**Problem.** Task 1 changed `classify_run_exit` in `cli/templates/scripts/autonomous-watcher.sh`. After it archives the `resumed_for_index` set, it now marks the run parked on **any** numbered top-level `question_<n>.md`, whether or not that file has its `answer_<n>.md`. The comment there reads "A pair still at the top level after the archival above => parked too: it was written during the session, never read by it, and the next resume must deliver it". The two documents above still state the old rule as the only rule:
- `docs/watcher.md` says "from the unanswered question alone".
- The adopter-facing README says "the sole signal".

Both claims are now false for a pair written during a resumed session. The rest of each paragraph is correct.

**Fix.**

- [ ] In `docs/watcher.md` §4, replace `the watcher classifies that as `parked` from the unanswered question alone, whatever the exit code.` with:

  `the watcher classifies that as `parked` from the question file alone, whatever the exit code — any numbered `question_<n>.md` still at the top level once the pairs a resume consumed are archived, answered or not, because an answered pair still there was written during the session and never read by it.`

- [ ] In `cli/templates/state-dir/clarifications/README.md`, replace `an unanswered question file is the sole signal that classifies a run as parked` with `a question file left at the top level is the sole signal that classifies a run as parked`.
- [ ] Apply the identical replacement to `harness-runs/clarifications/README.md`, and confirm that `cmp harness-runs/clarifications/README.md cli/templates/state-dir/clarifications/README.md` prints nothing.
