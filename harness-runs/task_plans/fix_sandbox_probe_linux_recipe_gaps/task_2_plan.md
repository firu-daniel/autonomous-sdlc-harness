### Task 2 — Bring Gate 15's container recipe up to date for PD20, PD21 and PD22's four fixes

**Goal:** Make `docs/development.md` → `## 5. Verifying a change` → Gate 15's *A Linux run, in a local container* do on its own what the first Linux run (2026-10-29) did by hand as departures:
- PD20: read the colima VM's AppArmor sysctl and set it, as a departure the record names.
- PD21: create a placeholder `~/.ssh/config`.
- PD22: copy the evidence out before the container exits, read the exit status through `${PIPESTATUS[0]}`, give `probe` a bash login shell, and cache the git credential before the first probe clone.

Carry each change that applies into the recipes that reuse the container's lines.

**The record this task reads, not writes.** The defects and their fixes are `docs/sandbox-verification.md` §5 rows PD20, PD21 and PD22. The first Linux run's departures are §0 *The probe's first Linux run (2026-10-29)* → *Departures from Gate 15*. Task 3 owns that file. This task does not edit it.

**Bounds.**
- This is a documentation change to `docs/development.md` only.
- No script, profile, generator, wrapper, guard, watcher or `harness-run.yml` changes.
- `allowNestedUserNamespaces` and `enableWeakerNestedSandbox` are not mentioned as something to set. The recipe's existing sentence saying the probe sets neither stays.
- Every command added sits in a fenced block, one command per line, never inline in prose (`harness-runs/lessons.md` → *Adopter-facing documentation*).
- Find every anchor below by its quoted text or bold lead, never by line number.

### Targets

- `docs/development.md`: *A Linux run, in a local container*; *The absent-path check, by hand*; *The refusal subcommand and the hand rows*; **Recording a Linux run.** Scope-register rows 1–5, 7, 9 and 11 are `change`. The others this task's derivation reaches stay as the register states.

**Work:**

- [ ] **PD20, the VM's AppArmor sysctl.**
  - *The opening paragraph of A Linux run, in a local container.* Add the fact as measured, citing `docs/sandbox-verification.md` §5 PD20:
    - On colima's Ubuntu 24.04 VM, `kernel.apparmor_restrict_unprivileged_userns` reads `1`.
    - In that state `bwrap` run as `probe` fails with `setting up uid map: Permission denied`.
    - `--security-opt apparmor=unconfined` does not lift it.
  - *The "On the host:" block.* Between `colima start` and the `docker run …` line, add the read line `colima ssh -- sysctl kernel.apparmor_restrict_unprivileged_userns` and the set line `colima ssh -- sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0`, each on its own line.
  - *Prose with the block* states:
    - The set line is taken only when the read prints `1`.
    - It is a **departure the record names**: the value read, and whether it was set to `0`, go into the run's record (see the fourth bullet).
    - A VM restart undoes it, so after any `colima start` it is read again before the next container.
    - The restricted case belongs to the GitHub-hosted runner, `docs/sandbox-verification.md` §9 IS1–IS4 (#194), and not to the container. That case is a `bwrap` AppArmor profile installed with the sysctl left at `1`.
- [ ] **PD22 item 3, the user's shell.** In the "As root in the container:" block, replace `useradd -m probe` with `useradd -m -s /bin/bash probe`. Add one clause of prose:
  - Debian gives a new user `/bin/sh`.
  - The recipe's exit-status lines read bash's `PIPESTATUS`, which `/bin/sh` does not have (§5 PD22).
- [ ] **PD21's placeholder, and the credential (PD22 item 4).**
  - *The placeholder.* Add a block run as `probe` that creates the placeholder. **Anchor it after the recipe's stop check, never directly after the clone block.** The clone block ends with `node cli/dist/cli.js doctor`. It is followed by the paragraph opening "`git status --porcelain` must print nothing; if it prints a path, `init` changed a tracked file and the run stops there." That paragraph leads into the **What the recipe places in the container, and how it is removed** bullets, which end with "Nothing from the host's `~/.ssh`, `~/.claude` or keychain is mounted." The placeholder block goes after that last bullet and before the paragraph led by **What a Linux run expects, and the macOS result it compares against.** That way the stop check comes before the placeholder, the dry-run push and the `run` line. Give the block a one-sentence lead-in as `probe`, from the checkout, once `git status --porcelain` has printed nothing. Mirror the runner workflow's own step (`scripts/sandbox-probe-runner.yml`, the `ssh-config` step):

    ```
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    printf '%s\n' '# sandbox-probe placeholder: S1 and S2 read this file to tell a refusal from an absence.' > ~/.ssh/config
    chmod 600 ~/.ssh/config
    ```

    State that it holds no key and no host entry, and that S1 and S2 otherwise print `not run` (§5 PD21).
  - *The credential.* The credential is cached by the first line of the run block the next bullet adds: `git push --dry-run origin HEAD:refs/heads/sbx-cred-check`. That is before the first probe clone, because cutting a probe clone pushes its branch, for `run` and for `run --leg headless-parity` alike (§5 PD22). Prose with it states three things:
    - The dry run creates nothing on the remote.
    - The credential is cached for the `credential.helper 'cache --timeout=7200'` window.
    - If more than two hours pass before a later `run --leg headless-parity` or the absent-path check, the line is run again first.
  - *The **What the recipe places in the container, and how it is removed** bullets.*
    - In **The git credential** bullet, the token is given at the prompt that the dry-run push raises, not "at git's first prompt".
    - Add a bullet for the `~/.ssh/config` placeholder: one comment line, no key, no host entry, deleted with the container.
- [ ] **PD22 item 2, the exit status.**
  - *The run block.* Directly after the placeholder block, add a run block as `probe`, from the checkout, one command per line. That puts it, too, after the "`git status --porcelain` must print nothing … the run stops there." paragraph and its **What the recipe places in the container, and how it is removed** bullets (last bullet: "Nothing from the host's `~/.ssh`, `~/.claude` or keychain is mounted."), and before **What a Linux run expects, and the macOS result it compares against.** The block holds:
    - the credential line above;
    - `bash scripts/sandbox-probe.sh run 2>&1 | tee ~/sandbox-probe-run.log`;
    - `echo "exit ${PIPESTATUS[0]}"`.
  - *Prose with it:* once output is piped to a log, `$?` is `tee`'s status, so the recipe reads `${PIPESTATUS[0]}` on the very next line.
  - *The refusal subcommand and the hand rows.* Its "As `probe`, from the checkout:" block becomes `bash scripts/sandbox-probe.sh refusal 2>&1 | tee -a ~/sandbox-probe-refusal.log` followed by `echo "exit ${PIPESTATUS[0]}"`. Its "the same two lines as `probe` again" wording stays true.
  - ***Recording a Linux run.*** Change "the `echo "exit $?"` line after every `run` and `refusal`" to "the `echo "exit ${PIPESTATUS[0]}"` line", and add two things the record carries: the VM's sysctl reading from the first bullet, and whether it was set.
  - *Job mode, on a local fresh clone (CS6).* Leave its `echo "exit $?"` as it is: that block runs on the host and is not piped (scope register row 12).
- [ ] **PD22 item 1, the evidence, and the recipes that reuse the container.**
  - *The copy-out step.* Add a bold-led paragraph immediately before **Recording a Linux run.**, as **Copy the evidence out before leaving the container.** It sits after the hand rows, so the HP1 sessions' logs are included. It says the container is `--rm` with no volume, so leaving it deletes everything. Its fenced block, run from a host terminal while the container still runs, one command per line:

    ```
    probe_home="$(docker exec sbx-probe-linux getent passwd probe | cut -d: -f6)"
    docker cp sbx-probe-linux:/tmp/sandbox-probe-evidence.<suffix> <host dir>
    docker cp "sbx-probe-linux:$probe_home/.claude/projects" <host dir>
    docker cp "sbx-probe-linux:$probe_home/sandbox-probe-run.log" <host dir>
    docker cp "sbx-probe-linux:$probe_home/sandbox-probe-refusal.log" <host dir>
    ```

  - *Prose with the block* states:
    - `<suffix>` is read off the evidence directory the probe prints as its last stderr line, which the run log holds. `TMPDIR` is unset for `probe` in the container, so the directory is under `/tmp`.
    - Copy `~/.claude/projects` only, never the whole `~/.claude`, which holds the OAuth credential.
    - The kept streams and session logs can quote what a session read, so the copies are removed once the rows are recorded. This is the rule **A leg that does not pass leaves its evidence behind.** already gives for the evidence directory.
  - *The absent-path check, by hand.* After its three clone lines (`git clone --branch <branch> …`, `cd autonomous-sdlc-harness`, `git checkout -B dev`), add one sentence. Its `run --leg headless-parity` cuts and pushes a probe clone, so the run block's credential line is run before it, and the recipe's placeholder and `useradd` lines apply unchanged. Its own **Copy both output directories to the host** step stays as it is.
  - *The suite under jq 1.6, by hand* and *The suite on Linux, by hand* are **not** edited. They push nothing, keep no probe evidence and pipe nothing, and they inherit the `useradd` line from the recipe they name (scope register rows 14 and 15).

**Verification:**

- `git grep -n 'useradd -m probe' -- docs/development.md` prints nothing. `git grep -n 'useradd -m -s /bin/bash probe' -- docs/development.md` reaches the root block only.
- `git grep -n 'PIPESTATUS' -- docs/development.md` reaches only the run block, the refusal block and **Recording a Linux run.**. `git grep -n 'echo "exit \$?"' -- docs/development.md` reaches only the CS6 job-mode block.
- `git grep -n 'apparmor_restrict_unprivileged_userns=0' -- docs/development.md` reaches the host block, and the prose beside it names the line a departure and names §9 IS1–IS4 for the restricted case.
- `git grep -n 'sbx-cred-check' -- docs/development.md` reaches the run block's first line, and the absent-path check's added sentence points to it.
- `git grep -n '\.claude/projects' -- docs/development.md` reaches the copy-out block. No `docker cp` line in the file names `$probe_home/.claude` without `/projects`.
- Re-run the story index's scope-register derivation entries 1 and 2 verbatim. Every hit in `docs/development.md` falls inside a site the register names, and every site marked `change` and owned by Task 2 shows a diff. Every site marked `no-change` shows none.
- **Deviations from plan:** `git grep -n 'PIPESTATUS' -- docs/development.md` also reaches two prose lines: the clause under the root block (the PD22 item 3 clause this plan requires, which names bash's `PIPESTATUS`) and the prose following the run block (the `${PIPESTATUS[0]}` explanation this plan requires). Every code-line hit is the run block, the refusal block or **Recording a Linux run.**; implemented as the plan's prose asks rather than paraphrasing the token away. Scope-register row 4 (the clone block) carries no line edit of its own: the placeholder and run blocks it names land after row 5's bullets, as this plan anchors them. Row 11's "the copied-out evidence are recorded" is met by the separate **Copy the evidence out before leaving the container.** step; **Recording a Linux run.** gains only the sysctl reading and whether it was set, as this plan's work list gives.
- Read the edited section once top to bottom, as the person running the gate would. Each added command is in a fenced block on its own line, and no step depends on a later one: the `git status --porcelain` stop check and its **What the recipe places in the container, and how it is removed** bullets come before the placeholder block and the run block, and both blocks come before **What a Linux run expects, and the macOS result it compares against.**; the credential is cached before the first probe clone, the shell is bash before any `PIPESTATUS` read, and the copy-out comes before leaving the container.
