### Task 5 — Refuse a fresh local launch when bwrap's nested user-namespace check fails, in the run library's mirror

**Goal:** Carry out the user's answer to clarification park 1, Q1 (a): *"add the check to the watcher: before a fresh local launch on Linux, run the same probe doctor runs and refuse the launch on failure with a message pointing to `npx autonomous-sdlc-harness doctor`."* An Ubuntu 26.04 machine then never starts a local session in which every Bash call fails. Like `doctor`, the watcher only reports: it changes nothing on the host.

**Depends on:** Task 2 and Task 4.

- **From Task 2:** `NESTED_USERNS_PROBE` (`bwrap --unshare-user --dev-bind / / -- unshare -U -r true`), `NESTED_USERNS_HELPER` (`unshare`), `BWRAP_USERNS_RESTRICT_PROFILE_PATH` (`/etc/apparmor.d/bwrap-userns-restrict`), and the assessment `assessSandboxHost(facts).nestedUserns`. It is one of `not-applicable`, `not-run`, `passed`, `failed` and `failed-stock-restrict`, and comes from the optional facts `nestedUserns?: { state: 'not-run' } | { state: 'passed' } | { state: 'failed'; detail }` and `stockRestrictProfile?: boolean`.
- **From Task 4:** `probeSandboxHost` runs the check only on a `linux` or `wsl2` host where both `bwrap` and `unshare` resolve. Its doc comment already declares `hr_sandbox_prereq_probe_var` as the mirror of exactly that; this task makes the shell side true.

**What this task does not do.**

- **Not here:** the watcher's call site and its `fail_before_launch` message do not change. They already run only for a fresh local, non-opted-out launch, and the message already ends *"npx autonomous-sdlc-harness doctor reports it under sandbox-prerequisites"*.
- **Not here:** this repository's self-adopted copies `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` are refreshed from these templates by **Task 9**. This task edits only the templates under `cli/templates/scripts/`.
- **Not judged:** a resumed local session, job mode and a remote drop stay unjudged here. This is the answer's scope; Task 8 documents it, and the job is covered by Tasks 3 and 4.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: `hr_sandbox_prereq_judge_var`, `hr_sandbox_prereq_probe_var`, and the header's two `MIRROR OF` blocks for the sandbox.
- `cli/templates/scripts/autonomous-watcher.sh`: the **THE SANDBOX PREFLIGHT** comment block only.
- `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`

**Work:**

- [ ] **The judge.**
  - Extend `hr_sandbox_prereq_judge_var` with two optional trailing arguments: `<nested>`, one of `not-run`, `passed` and `failed`, defaulting to `not-run` so today's four-argument callers answer exactly as now; and `<stock>`, `1` or `0`, defaulting to `0`.
  - Set a new `HR_SANDBOX_NESTED` to the owner's answer vocabulary: `not-applicable` for `macos`, `wsl1` and `unsupported`; `not-run`, `passed` or `failed` from `<nested>`; and `failed-stock-restrict` when `<nested>` is `failed` and `<stock>` is `1`.
  - On either failed answer, return 1 and append one sentence to `HR_SANDBOX_REFUSAL`, joined with `; ` after any missing-piece sentence. The sentence says that `bwrap` cannot create a user namespace inside its sandbox, so every sandboxed command would fail. It names `/etc/apparmor.d/bwrap-userns-restrict` when `<stock>` is `1`. It carries **no** `doctor` pointer of its own: the watcher's unchanged `fail_before_launch` message wraps `HR_SANDBOX_REFUSAL` and already ends *"npx autonomous-sdlc-harness doctor reports it under sandbox-prerequisites"*, so the refusal names `doctor` exactly once, as the user's answer asks.
  - The judge never offers the opt-out, and stays pure and Bash-3.2-safe. Update its comment block to list the new arguments and variable.
- [ ] **The probe.**
  - `hr_sandbox_prereq_probe_var` keeps its `uname` and `command -v` reads.
  - Then, only when the host kind is `linux` or `wsl2` and both `command -v bwrap` and `command -v unshare` resolve, it runs `bwrap --unshare-user --dev-bind / / -- unshare -U -r true >/dev/null 2>&1` and passes `passed` or `failed`. Otherwise it passes `not-run`.
  - It passes `<stock>` as `1` when `[ -e /etc/apparmor.d/bwrap-userns-restrict ]`.
  - Update its comment. Update the library header's `MIRROR OF cli/src/doctor/sandboxPrerequisites.ts` block:
    - Drop *"AppArmor is not mirrored: no shell decision reads it"*.
    - Say that the judge now also mirrors `NestedUsernsAnswer`.
    - Say that `hr_sandbox_prereq_probe_var` mirrors three of the owner's values, each by name: `NESTED_USERNS_PROBE` (the argument vector it runs), `NESTED_USERNS_HELPER` (the `command -v unshare` read that gates the check) and `BWRAP_USERNS_RESTRICT_PROFILE_PATH` (the stock-profile path whose presence words the refusal). Name `cli/test/sandbox-prerequisites-shell-mirror.test.mjs` as the test that holds them equal. This matches the mirror entry Task 2 adds to the owner's header.
  - Update the `MIRROR OF cli/src/doctor/checks.ts → probeSandboxHost` block to name the nested check and the stock-file presence.
- [ ] **`autonomous-watcher.sh`'s THE SANDBOX PREFLIGHT comment.** Replace *"It refuses only on a definite missing piece; an `uncertain` AppArmor answer never refuses, and the library's probe does not read AppArmor at all."* with the new rule:
  - It refuses on a definite missing piece, **and on Linux and WSL2 when bwrap's nested user-namespace check fails**.
  - An `uncertain` AppArmor answer never refuses.
  - The probe reads one AppArmor path, `bwrap-userns-restrict`'s presence, only to word the refusal.

  No code line in this file changes.
- [ ] **`sandbox-prerequisites-shell-mirror.test.mjs`.** Every expected value comes from the owner's exports.
  - Add the two new facts (`nestedUserns: { state: 'not-run' }`, `stockRestrictProfile: false`) to the existing fact literals, so the existing cases state what they assume.
  - Extend the judge matrix over `<nested>` ∈ {`not-run`, `passed`, `failed`} × `<stock>` ∈ {`0`, `1`}:
    - `HR_SANDBOX_NESTED` equals `assessSandboxHost({...facts, nestedUserns, stockRestrictProfile}).nestedUserns`.
    - The status is 1 exactly when the owner's `missing` is non-empty or its answer is a failed one.
    - On a failed answer, the refusal is non-empty, does not itself contain `npx autonomous-sdlc-harness doctor` (the watcher's message supplies it once), and names `BWRAP_USERNS_RESTRICT_PROFILE_PATH` exactly for `failed-stock-restrict`.
    - No refusal offers the opt-out.
  - Extend the probe test's `stubBin` with a helper stub whose file name is read from `NESTED_USERNS_HELPER`, never retyped as `unshare`, and a `bwrap` stub, named from `NESTED_USERNS_PROBE[0]`, that records its arguments to a file and exits 0 or 1 by option. Import `NESTED_USERNS_PROBE`, `NESTED_USERNS_HELPER` and `BWRAP_USERNS_RESTRICT_PROFILE_PATH` from the owner.
    - Assert that on `Linux` with both present, the recorded arguments equal `NESTED_USERNS_PROBE.slice(1)`.
    - Assert that the helper the probe gates on is the owner's: with the `NESTED_USERNS_HELPER` stub present the stub `bwrap` is called, and with it absent the stub `bwrap` is never called and the answer is `not-run`. Also assert that `NESTED_USERNS_PROBE` carries `NESTED_USERNS_HELPER` at the position after `--`, so the vector and the gate cannot drift apart.
    - Assert that the stock-profile path the probe tests is the owner's: the source text of `hr_sandbox_prereq_probe_var`, read from the library, contains `` `[ -e ${BWRAP_USERNS_RESTRICT_PROFILE_PATH} ]` `` built from the import, and no other `/etc/apparmor.d/` path.
    - Assert that `HR_SANDBOX_NESTED` and the status match the owner's assessment, with `stockRestrictProfile` read as `existsSync(BWRAP_USERNS_RESTRICT_PROFILE_PATH)` on this host.
    - Assert that on `Darwin` the stub `bwrap` is never called and the answer is `not-applicable`.
  - Update the header's rule to name the nested answer.

**Verification:**

- `npm test --workspace cli -- test/sandbox-prerequisites-shell-mirror.test.mjs` passes, including the existing opt-out and uname-failure cases unchanged.
- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` and `bash -n cli/templates/scripts/autonomous-watcher.sh` exit 0.
- A grep of the library's two changed functions finds no construct newer than Bash 3.2: no `${var,,}`, no associative array, no `mapfile`.
- The judge called with four arguments, as every existing caller and test override does, returns the same status and `HR_SANDBOX_REFUSAL` as before this change for each row of the existing matrix.
