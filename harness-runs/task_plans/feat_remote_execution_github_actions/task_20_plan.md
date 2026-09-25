### Task 20 — Name remote execution and `remote-run.sh` in `cli/README.md`

**Goal:** Keep the package README true after this branch: it enumerates the outer-loop script family and what `init` writes, and both gained a member.

**Depends on:** Task 5 (`remote-run.sh` is a new outer-loop script: it sends a remote run's dispatch, pause, warm-up and stop to GitHub, and syncs its state back on demand), Task 14 (`init --plugin-root-entries`), Task 17 (`init` writes `.github/workflows/harness-run.yml` and `harness-resume.yml` when `execution.target` is `github-actions`), and Task 19 (`doctor --check-github`).

### Targets

- `cli/README.md`.

**Work:**

- [ ] In the templates paragraph (the one naming the two families that live under `templates/`), add `remote-run.sh` to the outer-loop member list (register row 8), and name the new `github/` template directory: the two workflows `init` writes only when remote execution is on.
- [ ] In **What the five subcommands do**, extend `init`'s and `doctor`'s sentences by one clause each: `init` writes the two workflows when `execution.target` is `github-actions`; `doctor` reports the remote setup offline and asks GitHub under `--check-github`. Name `docs/remote-execution.md` as the place the design lives. Do not add a sixth subcommand anywhere — none was added.

**Verification:**

- The README names `remote-run.sh`, both workflow files and `--check-github`, and no sentence in it still describes the outer-loop family or `init`'s output as complete without them.
- Re-run the story index's derivation entry 2 command and confirm `cli/README.md`'s hit is the edited paragraph.
