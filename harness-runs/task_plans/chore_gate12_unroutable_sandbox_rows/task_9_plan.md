### Task 9 — Rewrite Gate 12's round steps 7 and 8 and the owed checks in `docs/development.md`, and re-derive the restated table from `--list`

**Goal:** The gate's prose about the five clauses says what this branch decided. The hand-step paragraph lists only what stays by hand. The restated row table matches `bash scripts/gate12-sandbox-round.sh --list` row for row.

**Depends on:**

- **Task 3:**
  - The `source` route.
  - SB2 `plant` with arms `clarifications,pause-note`. The `pause-note` arm commits `gate12-sb2-pause-token.txt` at the root and asks the session to link `<stateDir>/PAUSE_PROGRESS.md` to it through `scratch-run.sh`.
  - SB3 and JS3N on `source`, and RJ2's new note.
- **Tasks 4 and 5:** what `grade` prints. RJ2 is `pass` on its refusal, plus a `source` line. SB2 can `pass`, plus a `source` line for the variant. SB3 and JS3N print `source`.
- **Task 1:** `hr_remote_status_write` removes a link at its target before the rename.

This is a catch-all task: read every configured layer's conventions document (`.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`). `docs/sandbox-verification.md`, `docs/cli.md` and `docs/remote-execution.md` are **Task 8's**. The docs-restatement test is **Task 10's**: the table this task writes must satisfy *each Taken by is the route mapped*, with the route `source` restated as `source`.

### Targets

- `docs/development.md` → Gate 12 → **The sandbox series round (#170 step 4) — not yet run.**: step 7, step 8, **The rows the driver takes, and how.** and **The owed checks.**

**Work:**

- [ ] **Step 7**, *"The arms it plants:"*: add a `SB2 \`pause-note\`` bullet. It names the root token file, and the scratch file and `scratch-run.sh` call by which the session makes the `PAUSE_PROGRESS.md` link during its own run, never by a committed link, which the watcher moves aside. Rewrite *"SB2's planted job parks on its task prompt's question"* so it is the `clarifications` arm's job that parks; the `pause-note` job runs to its end.
- [ ] **Step 7, the hand-steps block.**
  - **The block:** keep its heading. It now lists SB4's optional half only, beside the existing note that SB4's bundle half has no plant.
  - **A new short paragraph** after it, **The clauses closed upstream, read from the source.** It covers SB2's `remote_status.json` variant (`hr_remote_status_write` removes a link at the path before each rename, with the residual stated) and SB3 (the three reasons, by symbol).
  - **The SB2 `PAUSE_PROGRESS.md` bullet** moves into the arms list above. State plainly that the session *can* make a link under the state directory through a `scratch-run.sh` Node file, which corrects the bullet's *"The session cannot make the link either"*.
  - **The sentence** *"These, with JS3N under step 8 and RJ2's launch-check clause below, are the subject of …"*: replace it with one sentence saying `chore_gate12_unroutable_sandbox_rows` decided all five, citing its task prompt path.
- [ ] **RJ2 and JS3N.**
  - **RJ2:** rewrite **RJ2 is refused before its launch check, settled from the source.** to say that `grade` prints the refusal as RJ2's `pass`, a branch passing the step as `fail`, and one `source` line for the launch-check clause.
  - **JS3N:** retitle step 8's **JS3N is a hand step.** as JS3N read from the source, keeping its reasons and adding the checkout's whole `.git`. `grade` prints it `source`.
- [ ] **The rows the driver takes, and how.** Re-derive the table from `bash scripts/gate12-sandbox-round.sh --list`, run from this checkout's root. Keep every row in `--list` order. *Taken by* is the route mapped as the docs test maps it, with `source` → `source`. A `hand` or `source` row's note carries `--list`'s note verbatim. Rows whose `--list` fields did not change stay byte for byte.
- [ ] **The owed checks.** Append the closure to four bullets:
  - the `sandbox1c` §3 bullet: JS3N's clause is read from the source;
  - the `sandbox1c2` §2 bullet: the `PAUSE_PROGRESS.md` link is session-made, and the variant is read from `hr_remote_status_write`;
  - the `sandbox1c2` §3 bullet: SB3 is read from the source;
  - the `sandbox1e4` §10 item 2 bullet: the branch is refused before the launch check, and the clause is read from the source.

  Keep each bullet's private-source expectation as written. Add the closure after it, so the bullet still records what was owed.

**Verification:**

- The restated table's rows equal `--list`'s row IDs and steps, in order. Every `source` and `hand` row's note contains `--list`'s note verbatim.
- Re-run the story index's register entries A and B. Every `docs/development.md` hit is a register row, and each `change` row owned by Task 9 has been edited.
- Each command the round names stays inside a fenced block (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*).
