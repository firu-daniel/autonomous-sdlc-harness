### Task 7 — Close roadmap item 20 in `docs/remote-execution.md`, `docs/development.md` and `ROADMAP.md`

**Goal:** The remote-execution design describes the job's install step and the preflight refusal as they now are, including that the step has not yet run on GitHub. Roadmap item 20 is marked shipped where it is defined, and `ROADMAP.md`'s "`doctor` sandbox checks" row says what shipped and what is left.

**Depends on:** Tasks 2, 4 and 5. This task documents them and changes none of them. The facts it states:

- `harness-run.yml`'s `run` job carries `Install the sandbox prerequisites` immediately before `Preflight with doctor` (Task 5). The step installs `bubblewrap` and `socat` when absent, through `apt-get` (or `dnf`), as root or with non-interactive `sudo`. Where `kernel.apparmor_restrict_unprivileged_userns` is `1` and `/etc/apparmor.d/bwrap` grants no `userns`, it writes that profile and reloads AppArmor. It never fails on its own.
- `Preflight with doctor` refuses the job through `sandbox-prerequisites`, which fails under `--remote-job` on a definite missing piece unless `sandbox.optOut` is taken (Task 2).
- The watcher refuses a fresh local launch on such a host (Task 4).
- The step exists only in a workflow a CLI carrying this branch rendered. It needs a release and `init --upgrade-workflows` (§7 → `### Upgrading`). It has not yet run on GitHub, and its first real run is roadmap item 21's full-run leg.

### Targets

- `docs/remote-execution.md`: §1 step 4 "**The job's setup**", §4 → the paragraph "**The permission profile.**", and §8 → "**GitHub-hosted runners that work:**".
- `docs/development.md`: §6 → the `| 20 |` row and the "**Items 3, 4, 13 and 14 have shipped**" paragraph.
- `ROADMAP.md`: the "`doctor` sandbox checks" row in the security-and-containment table.

**Work:**

- [ ] **`docs/remote-execution.md`.**
  - In §1 step 4, insert *install the sandbox's prerequisites where they are absent* between generating the job's permission profile and the `doctor --remote-job` preflight. Add *a host that cannot start the sandbox* to what that preflight stops the job on (§8).
  - In §4 → "**The permission profile.**", in the sentence *"`doctor --remote-job` then runs as a preflight, so any check it fails stops the job before launch rather than mid-run; under that option `profile-paths`, `plugin-permissions` and `profile-tracked` fail where a plain `doctor` only warns."*, add that the preflight also stops the job on a host that cannot start the sandbox: under `--remote-job`, `sandbox-prerequisites` fails on a definite missing piece unless `sandbox.optOut` is taken, where a plain `doctor` only warns. Point at §8 for the install step that runs before it.
  - In §8's runner paragraph, replace *"The workflows do not install them yet (roadmap item 20)"* and the sentence after it. Describe the install step, the preflight refusal, and where the step comes from: a workflow rendered by a release carrying it, re-rendered through `### Upgrading`.
  - State plainly that the step **has not yet run on GitHub**, and that its first run is the full-run leg of roadmap item 21 (`docs/development.md` §6). Keep the self-hosted-runner advice: install the two packages there, or let the step install them when the runner allows non-interactive `sudo`. The opt-out comes last, never as the first fix.
  - Put any command an adopter runs in a fenced block of its own, one command per line.
- [ ] **`docs/development.md` §6.** Prefix row 20's text with `**Shipped.**`, the form rows 5–12, 15, 16 and 19 use. Say in the row what it delivered: `doctor`'s `sandbox-prerequisites`, the watcher's launch refusal, and the job's install step, which has not yet run on GitHub. Add `20` to the paragraph's list *"as have items 5, 6, 7, 8, 9, 10, 11, 12, 15, 16 and 19, whose rows say so in their own text"*.
- [ ] **`ROADMAP.md`.** In the "`doctor` sandbox checks" row, set the status to `In progress`, a status the file's legend defines. Rewrite its description to say what shipped: the prerequisite check, the launch refusal, the job's install step, and the domain allowlist that `sandbox.allowedDomains` carries. Name what remains, the tools known to break under the sandbox, as roadmap item 21's measurement. Leave the index row `| 38 |` as it is.

**Verification:**

- `git grep -n -i "roadmap item 20" -- docs ROADMAP.md README.md` prints nothing outside `docs/development.md`'s row and paragraph.
- Re-run the story index's `## Scope register` entries C1, C2 and C3. Every hit in these three files appears in the register as a row, and every `change` row owned by Task 7 is edited.
- `docs/remote-execution.md` §8 states in its own words that the install step has not yet run on GitHub. No sentence in it claims a measured GitHub result for the step.
