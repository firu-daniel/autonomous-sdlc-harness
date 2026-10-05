### Task 8 — `docs/development.md`: gate 14, the (xiv) by-name check, and the Gate 12 round 7 record

**Goal:** Make `docs/development.md` describe the tree this branch leaves behind, and record Gate 12 round 7.
- **`## 5.`** gains gate 14, the gate Task 7 wired into `scripts/run-gates.sh`.
- **Gate 12 → (xiv)'s setup** checks that GitHub lists all four workflows by name, which would have caught finding 1 before leg (a).
- **Leg (f)'s `status` pass condition** admits the new round-started reply.
- **The Round 7 paragraph** is recorded verbatim.
- **Only round 7's "What still owes a first recording" sentence stands.**

**Depends on:**
- **Task 7**, which adds gate 14. It has three legs:
  - **14a:** `node scripts/check-rendered-workflows.mjs` — renders the workflows through `init` in a throwaway repository outside the checkout and parses each with `js-yaml`;
  - **14b:** `node scripts/check-rendered-workflows.mjs --negatives` — must refuse `cli/test/fixtures/harness-control-0.6.1.yml`;
  - **14c:** `node scripts/check-rendered-workflows.mjs --actionlint` — `actionlint -shellcheck= -pyflakes=` over the rendered files and the negative fixture. It exits 4, and `run-gates.sh` prints `SKIPPED`, where `actionlint` is not on `PATH`.

  Gate 14 depends on gate 2a's build. `js-yaml` is a root `devDependencies` entry, already in the lockfile through `ajv-cli`.
- **Task 4**, whose `doctor --check-github` fails, naming the file, on any harness workflow GitHub lists with `name` equal to its `path`.
- **Task 6**, whose `status` reply, when the ledger reads fully ticked and the branch tip carries a newer `chore: add user review for <branch>` commit, is byte for byte:

  > ``A user-review round has started on `<branch>`, and its flow-progress ledger is not written yet.``

This file restates what it documents, so the implementer needs none of those files.

**The judgements this task carries, from the story index.**
- **The Round 7 paragraph goes in verbatim, with no wording adjusted.** It records 0.6.1 as observed, and its sentence *"All three are carried to `fix_forge_run_control_gate12_round7_findings`."* stays true. This branch's fixes therefore make no sentence of it untrue.
- **Two sentences are removed, not one.** Round 5's *"What still owes a first recording"* sentence and round 6's both stand today. The acceptance criterion says that only round 7's stands, so both are removed.

### Targets

- `docs/development.md`, in these places:
  - `## 5. Verifying a change`: its opening sentence, "Thirteen gates. Run each **without a pipe** …"; the paragraph that begins "**Seven of the thirteen run unattended**"; and a new **Gate 14** paragraph after Gate 13's last paragraph, before `## 6.`;
  - Gate 12 → (xiv)'s setup;
  - Gate 12 → (xiv) leg (f)'s `status` pass condition;
  - Gate 12 → the round 5 and round 6 closing sentences;
  - Gate 12 → a new Round 7 paragraph.

**Work:**

- [ ] **`## 5.` opening sentence and paragraph.**
  - The section's first sentence, "Thirteen gates.", becomes "Fourteen gates."; the rest of that sentence is unchanged.
  - "**Seven of the thirteen run unattended**" becomes "**Eight of the fourteen run unattended**".
  - The gate list becomes "gates 1, 2, 3, 4, 6, 11, 13 and 14".
  - "**Two members of that seven are conditional.**" becomes "three members of that eight", and a sentence on gate 14 joins it: 14c is `SKIPPED` where `actionlint` is not on `PATH`, printed with the gates the script cannot run and counted among neither the passes nor the failures, as 13d is.
  - The six hand-run gates are unchanged.
- [ ] **New `**Gate 14 — the rendered workflows parse.**` paragraph.** Say:
  - why it exists: Gate 12 round 7's finding 1 — 0.6.1's `harness-control.yml` was not valid YAML, and no suite parsed the files `init` renders;
  - what 14a, 14b and 14c each do, as listed above;
  - that it renders into a throwaway repository outside this checkout and removes it on every exit path;
  - that it depends on gate 2a's build;
  - that `js-yaml` is a dev-only root dependency, already in the lockfile through `ajv-cli`, and not a dependency of the published package.

  Give each of the three commands its own fenced block, one command per line, run from the repository root. The lessons ledger → `## Adopter-facing documentation` requires it: *"Every command an adopter is meant to run sits in a fenced block, one command per line."*

  Then state how 14c is installed where wanted, and that its absence is a `SKIPPED`, not a pass.
- [ ] **Gate 12 → (xiv)'s setup.** After the push and `gh label create sdlc-harness` blocks, add a check that GitHub lists all four workflows by name. Run each command in its own block:

  ```
  gh workflow list --all
  ```

  It passes when `harness-run`, `harness-resume`, `harness-trigger` and `harness-control` are each listed by that name, which is the templates' own `name:` value, and none by its `.github/workflows/<file>` path. GitHub lists a file it cannot parse by its path, as round 7 recorded for `harness-control.yml`. Also say that (xiv)'s own `doctor --check-github` run now fails on such a file.
- [ ] **Gate 12 → (xiv) leg (f)'s `status` pass condition.** The sentence that reads "Passes when each reply names the run's state, the next ledger entry (`Next in the flow-progress ledger:`, or that every entry is ticked) …" gains a third alternative inside the parenthesis: "or, early in a user-review round, that the round has started and its flow-progress ledger is not written yet". Change nothing else in that sentence.
- [ ] **The round record.**
  1. Insert the **Round 7 paragraph** from the task prompt (`harness-runs/task_prompts/fix_forge_run_control_gate12_round7_findings_task_prompt.md` → `### Item 4 — Record Gate 12 round 7` → **Round 7 paragraph (verbatim, for `docs/development.md`)**). Insert it **byte for byte**, without its `> ` blockquote markers: every paragraph, the numbered findings list, the "All three are carried …" sentence, and its closing "What still owes a first recording: …" sentence.
  2. Place it after round 6's closing paragraph, the one that begins "What still owes a first recording: (v)'s enable … (xiv)'s re-run of leg (d) without a workaround …", and before **Setup.**
  3. Then delete that round 6 sentence, and the round 5 sentence that begins "What still owes a first recording: (v)'s enable … (xi)'s convergence …", together with the blank line each leaves.
  4. Find every anchor by its quoted text, never by line number.

**Verification:**

- Run `git grep -n "What still owes a first recording" -- docs`. Every hit lies inside the Round 7 block just inserted.
- Run `git grep -niE "thirteen|seven of the" -- docs/development.md` (case-insensitive, so "Thirteen gates." is reached). No hit refers to §5's gate count; a hit elsewhere, such as the "thirteen definitions today" count of agent definitions in a pass-criteria paragraph, is not a gate count.
- Diff the inserted Round 7 text against the prompt's blockquote with the `> ` markers stripped. It is identical: every check-mark, backtick and figure carries over unchanged.
- Read the (xiv) setup addition and the gate 14 paragraph. Every command sits alone in its own fenced block.
- Each of the four round 7 legs' anchors that `docs/github-run-control.md` → `## 8.` cites (Round 7, leg (h)) exists in the inserted text. Task 9's rows cite it.
