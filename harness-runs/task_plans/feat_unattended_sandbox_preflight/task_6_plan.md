### Task 6 — Describe the check, the refusal and the opt-out's exemption in `docs/cli.md`, `docs/config.md` and `docs/watcher.md`

**Goal:** The CLI and watcher documents describe what now exists: `doctor`'s `sandbox-prerequisites` check and its grades, the watcher's refusal of a fresh local launch, the job's install step, and the exemption a taken opt-out gives. Every pointer to roadmap item 20 in them is closed.

**Depends on:** Tasks 1–5. This task documents what they built and changes none of it. The facts it states, each owned by the task named:

- **The table** (Task 1, `cli/src/doctor/sandboxPrerequisites.ts`):
  - macOS (Seatbelt) needs nothing;
  - Linux and WSL2 need `bwrap` (package `bubblewrap`) and `socat` (package `socat`) on `PATH`;
  - WSL1, detected from the kernel release, is unsupported ("Sandboxing requires WSL2");
  - any platform other than macOS or Linux is unsupported;
  - on Ubuntu 24.04 and later, `kernel.apparmor_restrict_unprivileged_userns` = `1` needs a profile at `/etc/apparmor.d/bwrap` granting `userns` to `/usr/bin/bwrap`, then `sudo systemctl reload apparmor`. Without that profile the answer is **uncertain**, because a profile under another name may already grant it. Uncertain is reported, never refuses and never passes.
- **The check** (Task 2): `sandbox-prerequisites`, listed after `profile-write-protection`.
  - A definite missing piece is a warning, and a failure under `--remote-job`. `--remote-job` therefore now moves **six** checks.
  - An uncertain AppArmor answer is a warning in both modes.
  - A taken `sandbox.optOut` passes it as not required.
  - It reads this process's `PATH`, spawns nothing and reaches no network.
- **The refusal** (Task 4): the watcher judges a fresh local inbox drop after the branch-owning-record rejections and before the machine lane. A definite missing piece archives the drop as `failed_<ts>_<name>`, sets the record to `failed` and sends one `failed` notification naming the piece and its install command. It never defers. A remote drop, a resume and job mode are not judged here. A taken opt-out exempts the drop.
- **The install step** (Task 5): `harness-run.yml` → `Install the sandbox prerequisites`, before `Preflight with doctor`.

### Targets

- `docs/cli.md`: §6 → "**What a host needs.**", and §7's opening paragraph, check table, `profile-sandbox` bullet, a new `sandbox-prerequisites` bullet and the `--remote-job` paragraph.
- `docs/config.md`: §5 → the `sandbox.optOut` row.
- `docs/watcher.md`: §1 → step 3 "**The guards, in one order.**"

**Work:**

- [ ] **`docs/cli.md` §6 → "What a host needs."** Rewrite it from the table above.
  - Put every command an adopter runs in its own fenced block, one command per line (the lessons ledger, *"Every command an adopter is meant to run sits in a fenced block"*): `sudo apt-get install bubblewrap socat`, `sudo dnf install bubblewrap socat` and `sudo systemctl reload apparmor`.
  - Give the profile text itself in a fenced block of its own, as the file's content, with the path it goes to.
  - State that `doctor` reports all of it under `sandbox-prerequisites`, that the watcher refuses a fresh local launch on a definite missing piece, and that the remote job installs the packages first (`remote-execution.md` §8).
  - Keep the WSL1 opt-out sentence, after the fix rather than as the first one.
  - Delete *"…are roadmap item 20"*.
- [ ] **`docs/cli.md` §7 table and bullets.**
  - Insert `| sandbox-prerequisites | this host can start the sandbox an unattended run needs |` directly after the `profile-write-protection` row.
  - Add a grading bullet, **`sandbox-prerequisites` is a warning without `--remote-job` and a failure under it**, after the `profile-write-protection` bullet. It covers the uncertain-AppArmor and opt-out grades and the facts it reads.
  - In the `profile-sandbox` bullet, replace *"refusing to launch an unsandboxed run is roadmap item 20"* with a pointer to the shipped refusal (`sandbox-prerequisites` and the watcher's launch refusal, §6).
- [ ] **`docs/cli.md` §7 `--remote-job` counts.** In the opening paragraph ("turns five checks' warnings into failures") and in the **`--remote-job`** paragraph ("`profile-paths`, … fail where they would otherwise warn"), make it six checks. Add `sandbox-prerequisites`, and say that a taken opt-out passes it. Keep "It reaches no network" true: say that the new check reads local files and `PATH`.
- [ ] **`docs/config.md` §5 → `sandbox.optOut`.** Add one sentence: a taken opt-out also exempts the host from the watcher's launch refusal and from `sandbox-prerequisites`, which passes as not required. A blank or non-string `reason` is not a taken opt-out, so the refusal stands.
- [ ] **`docs/watcher.md` §1 → step 3.** Add the host check to the guard order, after the branch-owning record and before the lane. Add it to the **archived** group with its reason: a host does not install its own packages, so waiting would not change the answer. State that a remote drop skips it, and that it is read from the main checkout's configuration.

**Verification:**

- `git grep -n "roadmap item 20" -- docs/cli.md docs/config.md docs/watcher.md` prints nothing.
- Re-run the story index's `## Scope register` entries C1, C3, C4 and C5. Every hit in these three files appears in the register as a row, and every `change` row owned by Task 6 is edited.
- Every command this task adds is in a fenced block of its own, one command per line. The opt-out never appears as the first fix.
