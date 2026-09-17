### Task 11 — Plugin flow documents: the park exchange and the loop guard

**Goal:** Make the plugin's two flow documents describe a park as one exchange — one question file, one answer file, a resume once it is answered — and add the watcher's park-loop guard to the ways a run stops.

**Depends on:** Task 2 and Task 7.

- From **Task 7**, restated: `question_<n>.md` is one file per park, holding every question that park raises; `answer_<n>.md` answers the whole park; the watcher resumes once every open question file is answered and archives exactly the pairs that resume consumed; the digest writes one block per park, keyed `question_<n>`.
- From **Task 2**, restated: when a park-resumed session parks again with no new question, or parks again within `PARK_LOOP_WINDOW_SECS`, the watcher counts a no-progress cycle; after `PARK_LOOP_MAX_CYCLES` in a row it records the status `park_loop`, logs the evidence, notifies once, and stops resuming the run until an operator creates `<state_dir>/clarifications/<branch>/PARK_LOOP_CLEAR` in its working copy. That makes the watcher's terminal states five: `completed`, `parked`, `paused`, `failed`, `park_loop`.

**Where this task stops.** The daemon-side description, the thresholds and the knobs are the harness repository's `docs/watcher.md` §4 (Task 12); these documents point there and restate none of it. A path outside `plugin/` is cited repo-relative in prose, never through `${CLAUDE_PLUGIN_ROOT}` (`.claude/context/plugin.md` → `## Citation`).

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md` → `## Answer a clarification (park-and-ask)`, `## Clarification digest`.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The exit.** paragraph, `## The ways a run stops, and which of them come back`, and the **"How do you stop it going off the rails?"** answer.

**Work:**

- [ ] `AUTONOMOUS_FLOW.md` → `## Answer a clarification (park-and-ask)`: the run writes every question of its park into one self-contained `question_<n>.md`; the paired `answer_<n>.md` answers the park; the watcher resumes once every open question file is answered and archives exactly the pairs that resume consumed. Add one sentence: a run whose resumes make no progress is held under `park_loop` until an operator clears it (the harness repository's `docs/watcher.md` §4). `## Clarification digest`: "one block per clarification that branch parked on" becomes one block per park.
- [ ] `AUTONOMOUS_FLOW_WHITEBOARD.md`: **The exit.** says five terminal states; the **Park** row's "Comes back?" cell becomes "yes, when the park's question file is answered"; add a row **Park-loop guard** — who initiates: nobody, the control plane, on a run whose resumes make no progress; comes back: once an operator clears it; mechanism: stops resuming and records `park_loop`. Add the guard to the "off the rails" answer's list of independent limits in one clause.

**Verification:**

- `grep -n "four terminal states\|block per clarification" plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` prints nothing.
- The whiteboard's closing sentence under the table still resolves: every path it names exists, and the new row's mechanism points at `docs/watcher.md` §4 in prose.
- `plugin/docs/README.md`'s `AUTONOMOUS_FLOW` citer sweep finds every cited heading still present, since no heading was renamed.
- `bash scripts/check-command-spelling.sh` exits 0.
