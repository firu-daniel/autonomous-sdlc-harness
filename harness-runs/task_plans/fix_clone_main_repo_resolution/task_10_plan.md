### Task 10 — Record the library change in `docs/guard-verification.md` and add the owed rows AN5–AN6 to `docs/sandbox-verification.md`

**Goal:** Update the two documents of record for this branch.

- **The guard record.** `plugin/hooks/lib/harness-config-lib.sh` changed, and a change to the library re-measures itself in `docs/guard-verification.md` (`.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`). Record that the change is confined to a function no guard calls.
- **The sandbox record.** Nothing records the fallback from a clone with `HARNESS_MAIN_REPO` unset. Add rows for it beside AN1–AN4, marked *not yet measured*, because a run cannot open an interactive Claude Code session in another checkout. Also record the platform posture of the clone arm's trust in `objects/info/alternates`.

**Depends on:**

- **Task 3**, which adds the clone arm and `hc_main_root_var` to `hc_main_root` in that library and changes nothing else there.
- **Task 4**, which points every plugin reader's fallback at `plugin/instructions/main_repo_resolution.md` → `## The fallback`. In a run clone, that rule:
  - reads the one-line `.git/objects/info/alternates`;
  - requires the named candidate to be a main checkout whose run registry records the clone's branch as `copy_kind` `clone` at the clone's path, with the clone at `<parent of candidate>/<projectName>-<branch>`;
  - otherwise stops with one sentence beginning `cannot resolve the main checkout — `.

### Targets

- `docs/guard-verification.md` — one new dated entry beside **2026-10-20: `hc_main_root` changed, and no guard calls it.**, which stays as written.
- `docs/sandbox-verification.md` — `### The main-checkout anchor (2026-10-20)`: rows AN5 and AN6 appended to its table, and one dated paragraph after the table. AN1–AN4 and the section's existing paragraphs stay as written.

**Work:**

- [ ] **`docs/guard-verification.md`.** Add a dated entry, in the shape of the 2026-10-20 one, saying that `fix_clone_main_repo_resolution` changed `hc_main_root` and added `hc_main_root_var`, and changed nothing else in the library. Run `grep -n 'hc_main_root' plugin/hooks/*.sh` against this branch's tip and record the commit, the command and its exact result: no output, exit status 1. State that the per-Bash-call path the §1.2 composite measures is therefore unchanged, and that no latency row is re-taken. Never record a figure you did not measure.
- [ ] **Row AN5 — registered clone, interactive, variable unset.**
  - **Setup.** An interactive session started by hand, without `HARNESS_MAIN_REPO`, with its cwd in a run clone the main checkout's registry records as `copy_kind` `clone`.
  - **Check.** `/autonomous-sdlc-harness:branch-status <that branch>`.
  - **Expected.** The command reads `<main>/<stateDir>/autonomous_logs/registry.json` and reports the run, and no read touches `<clone>/<stateDir>/autonomous_logs/`.
  - **Observed:** *not yet measured*. **Verdict:** *owed*.
- [ ] **Row AN6 — unregistered clone, same setup.** A `git clone --shared` of the main checkout at the derived sibling path with no registry record.
  - **Expected.** The command stops with one sentence beginning `cannot resolve the main checkout — `, naming the registry. It reports neither a run nor "no run of that name".
  - **Observed:** *not yet measured*. **Verdict:** *owed*.
  - **After the table**, name the follow-up: a maintainer takes both rows by hand after this branch merges, as the branch's story index lists under `Manual setup required`.
  - **Why no roadmap item number is cited.** `.claude/context/conventions.md` → `## Documents of record` says *"A deferral cites a numbered roadmap item, and the number owes a row"*. AN5–AN6 are not a deferral of content under that rule: the behaviour ships in this branch (Tasks 2–4), and what is owed is a hand measurement of it, written into the row that records it. `docs/sandbox-verification.md` already records such rows this way with no roadmap number — *"G4–G7 are owed measurements, not results"*, and the CS12–CS15 and W6–W8 paragraphs — and the paragraph after the table says so in one sentence citing that precedent. `docs/development.md` → `## 6. The roadmap this tree defers to` item 21 (measuring what the unattended sandbox breaks) is not cited either: AN5–AN6 measure an interactive session with no run profile, which is outside that item.
- [ ] **One dated paragraph after the table: the platform posture.**
  - The clone arm reads `objects/info/alternates`. CL5 shows the sandbox refuses to open that file on macOS, and the Linux CL5 row is `blocked: F9`, so it is unmeasured there.
  - So the rule never trusts that file alone. The candidate must carry a registry recording the clone at its path, and the main checkout's own registry is write-protected. The candidate must also sit at the work root, so neither the copy nor a directory inside it can pass.
  - The residual, on a platform where the file is writable, is a directory at the work root shaped as a main checkout, carrying its own registry that names the copy.

**Verification:**

- `grep -n 'AN5\|AN6' docs/sandbox-verification.md` finds both rows inside `### The main-checkout anchor (2026-10-20)`, each marked *not yet measured*.
- `git diff docs/sandbox-verification.md docs/guard-verification.md` adds lines and changes no existing row or dated entry. Read it to confirm.
- The guard-verification entry quotes a command and a result you ran, with the commit it ran against.
- The text after the AN table names AN5–AN6 as owed measurements, cites the G4–G7 precedent in the same file, and contains no `item <N>` citation (`grep -n -E 'items? [0-9]+'` over the added lines finds nothing).

**Deviations from plan:**

- The plan says CL5 shows the sandbox "refuses to open" `objects/info/alternates`; CL5's probe was a zero-byte `dd … conv=notrunc`, a write-open. The paragraph says the sandbox refuses a sandboxed command's write-open of that file, which is what CL5 measured.
- The registry's write protection is cited to RG1–RG3 (§4), the rows that measured it; the plan stated it without a row.
- The dated paragraph sits after the section's existing `**Clean-up.**` paragraph, which belongs to AN1–AN4 and stays adjacent to them.
