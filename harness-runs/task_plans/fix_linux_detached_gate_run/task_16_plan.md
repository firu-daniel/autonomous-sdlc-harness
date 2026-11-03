### Task 16 — State the launcher and its sandbox in `docs/cli.md` §5 and §6, with a new residual

**Goal:** `docs/cli.md` states three things where each belongs:

- in §5, the list of outer-loop scripts;
- in §6, the profile's account of what runs outside the sandbox and what protects it;
- in §6, a new residual that states rather than hides what the launcher's sandbox does not hold.

Every sentence added is either cited to a row, or marked *derived from the code*. None states a Linux result as measured.

**Depends on:**

- **Task 2: the launcher**, `launch-sandboxed-gates.sh <target> <label>`.
  - **Its checks:** `hr_wrapper_main_of`, `hr_git_env_drop`, `hr_wrapper_target_check_var`, `hr_wrapper_branch_var`. No git command runs in the target.
  - **Its answers:** `in-session` (exit 4) off a bubblewrap host or under the opt-out; `pending` (exit 3); or a refusal (exit 2) naming its cause, among them `bwrap` not on `PATH` and `bwrap` unable to start a sandbox, which quotes `bwrap` and names `kernel.apparmor_restrict_unprivileged_userns`.
  - **What it starts.** A supervisor (`setsid` when present, `nohup`, `disown`) runs `bwrap --new-session --unshare-all --die-with-parent --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind <target> <target>`, then:
    1. `--ro-bind` over each exact `denyWrite` entry of the session's profile under the target that exists. That is the per-run copy for a run copy, and the base for the main checkout, which is job mode.
    2. A `--ro-bind /dev/null` placeholder at each such entry that is absent, refused when its parent is absent, and swept by the supervisor through `hr_placeholder_sweep_paths_var` once `bwrap` exits.
    3. The base profile's credential files masked, and its token variables unset.
    4. `-- bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>`.
  - `bwrap` and `setsid` are found with `command -v` on the inherited `PATH`.
- **Task 3:** the row, `runsUnsandboxed: true`, `agentInvocable: true`. The base therefore excludes `bash <repoRoot>/<scriptsDir>/launch-sandboxed-gates.sh:*`, allows its two forms, and write-protects the main checkout's copy. Each per-run copy appends its run-copy twin, as it does for every wrapper.
  - **Task 3 also rewords `cli/src/doctor/checks.ts` → `SANDBOXED_WRAPPER_CONSEQUENCE`**, the sentence `doctor`'s `profile-sandbox` appends to every missing or stale excluded entry. Its new value is exactly: *"that script runs sandboxed: a git wrapper there cannot move the main checkout's branch from a clone, because the profile write-denies the main checkout's whole `.git`, and a linked worktree's git record and an SSH remote are both out of reach on macOS; the gate launcher there cannot start its own `bwrap` sandbox on a bubblewrap host, so Run gates refuse and an unattended run parks"*.
- **Tasks 5–6:** Phase G's `<gate_launcher>`. The autonomous forks spell the main checkout's launcher literally, and the semi-autonomous ones bind `none`. A launcher refusal is `<escalate>`, which parks an unattended run.
- **The record:** `docs/sandbox-verification.md` §5 F10 (BG9, LB5, T3), and the owed GS1–GS4 rows in §8 and §9 (Task 15).

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document.

### Targets

`docs/cli.md`, these sites only: the story index's `## Scope register` rows 15, 32, 34, 35, 75 and 76, plus residual 5 and a new residual 13.

- §5 *"Two families land in `scriptsDir`"*;
- §6 *"Three wrappers run outside the sandbox, each in one spelling."*;
- §6 *"The excluded rule's `:*` accepts any argument, so all three wrappers check their target before any git call"*: its bold lead and its `hr_git_env_drop` sentence only;
- §6 *"Everything that runs outside the sandbox is write-protected on both sides"*;
- §6 *"Credentials are denied on both sides."*: its *"excluded wrappers keep the environment"* sentence only;
- §7 *"`profile-sandbox` is a warning without `--remote-job`"*: the clause quoting the consequence sentence only;
- residual 5 (*"The environment reaching an excluded wrapper is trusted as it arrives"*);
- a new residual 13 at the end of *"Residuals, stated rather than hidden"*.

**Work:**

- [ ] **§5.** In *"Two families land in `scriptsDir`"*, name the gate launcher `launch-sandboxed-gates.sh` beside the test-suite runner in the outer-loop list.
- [ ] **§6, the excluded set.**
  - Retitle *"Three wrappers run outside the sandbox, each in one spelling."* to *"Four scripts run outside the sandbox, each in one spelling."* Search the document for every citation of that bold lead and repoint it in the same edit (`git grep -n -F 'Three wrappers run outside the sandbox' -- docs plugin cli README.md ARCHITECTURE.md`).
  - Append one passage after the paragraph's account of the git wrappers. It says three things:
    - On a bubblewrap host the gate launcher is the fourth, because a process a sandboxed call detaches did not outlive the call there (F10).
    - It runs nothing of the run copy outside a sandbox: it starts the gate worker under its own `bwrap` sandbox, as above, and answers `in-session` off a bubblewrap host.
    - Its `:*` accepts any argument, so it checks its target exactly as the wrappers do (the next paragraph), and Phase G issues it literally.
  - In the *"Everything that runs outside the sandbox …"* paragraph, change *"the three excluded wrappers"* to *"the four excluded scripts"*. The set itself is derived from the row, so nothing else changes there.
  - **The next paragraph, *"The excluded rule's `:*` accepts any argument …"*** (register row 75). Its bold lead becomes *"The excluded rule's `:*` accepts any argument, so all four excluded scripts check their target first: the three git wrappers before any git call, the gate launcher before it starts anything"*. Re-run `git grep -n -F 'all three wrappers check their target' -- docs plugin cli README.md ARCHITECTURE.md` and repoint any citation of the old lead in the same edit. In the sentence ending *"which all three wrappers call"*, add that the gate launcher calls `hr_git_env_drop` too. Every other sentence of that paragraph describes git calls the launcher does not make, and stays byte-identical.
- [ ] **§6 credentials and §7 `profile-sandbox`, the two statements derived from elsewhere.**
  - **§6 *"Credentials are denied on both sides."*** (register row 76). After *"which is also why the excluded wrappers keep the environment an HTTPS push needs"*, add: the gate launcher, also excluded, keeps it too, and for the gate worker it starts it unsets every `envVars` name and masks every `files` path again inside its own `bwrap` sandbox (residual 13). This mirrors the sentence Task 3 adds to the profile template's `CREDENTIALS ARE DENIED ON BOTH SIDES` string.
  - **§7 *"`profile-sandbox` is a warning without `--remote-job`"*** (register row 35). The bullet quotes the old `SANDBOXED_WRAPPER_CONSEQUENCE` word for word: *"a missing one is named with what its absence costs on every count, that wrapper running sandboxed where a clone cannot move the main checkout's branch because the profile write-denies the main checkout's whole `.git`, and a linked worktree's git record and an SSH remote are both out of reach on macOS"*. Restate that clause so it matches Task 3's new value (**Depends on:** above), in the bullet's participial form: *"… on every count, that script running sandboxed: a git wrapper there cannot move the main checkout's branch from a clone, because the profile write-denies the main checkout's whole `.git`, and a linked worktree's git record and an SSH remote are both out of reach on macOS; the gate launcher there cannot start its own `bwrap` sandbox on a bubblewrap host, so Run gates refuse and an unattended run parks"*. Change no other clause of the bullet: the stale-spelling clause still says *"leaves that wrapper running sandboxed"*, which stays true of the wrappers it was written for.
- [ ] **Residual 5.** Add that the launcher's `bwrap` and `setsid` are chosen by `PATH` the same way, so a `bwrap` earlier on `PATH` than the system's is the sandbox the gates run in.
- [ ] **New residual 13: *"On a bubblewrap host the gate run is sandboxed by the launcher, not by Claude Code."*** It states five things:
  - **The fact and the route.** F10 with BG9, LB5 and T3, the cause not measured. The user's ruling, which rejected excluding the run copy's own `run-test-suite.sh` and took re-sandboxing the worker.
  - **What the sandbox holds** (derived from the code, `launch-sandboxed-gates.sh`):
    - no network;
    - writes to the target alone;
    - the session profile's exact protected paths read-only;
    - credentials masked and token variables unset;
    - `--die-with-parent` to its supervisor.
  - **What it does not hold**, each named:
    - a glob `denyWrite` entry is not applied, because only exact paths are;
    - an absent protected path is held by a placeholder that `bwrap` creates on disk, which the supervisor sweeps through `hr_placeholder_sweep_paths_var`, residual 12's class of leftover if the supervisor is killed first;
    - the `Edit` rules do not apply, because no file tool runs inside it;
    - its own loopback is private, which is stricter than F8.
  - **What happens where it cannot run.** `bwrap` missing or user namespaces refused is a refusal, and Phase G parks an unattended run with that reason. Run gates never run unsandboxed there, and never report a pass.
  - **What is owed.** GS1–GS4, WF5 and T3 at the next Gate 15 container run, and their runner rows. If GS1 shows the supervisor does not outlive the call, the follow-up proposed is that the launcher refuse on every bubblewrap host.

**Verification:**

- `git diff -U0 -- docs/cli.md` shows hunks only at the sites named under `### Targets`.
- Re-run register entries E2 and E3 from the story index. Invariant: every `docs/cli.md` hit they return is a register row, and only the rows marked `change` for Task 16 differ from `HEAD`. The §7 hunk falls inside the `profile-sandbox` bullet (row 35), and touches only the consequence clause.
- `git grep -n -F -e 'Three wrappers run outside the sandbox' -e 'all three wrappers check their target' -- docs plugin cli README.md ARCHITECTURE.md` has no hit.
- `git grep -n -F 'a clone cannot move the main checkout' -- docs/cli.md` has no hit: §7 no longer quotes the old consequence.
- No sentence added here states a Linux result as measured. Each one is cited to a §5, §8 or §9 row, or marked *derived from the code*.
