### 4. Gate 15 still says `run` takes every leg but `headless-parity` and `refusal`, and names four Linux-only legs; plain `run` now also leaves out the four job-mode-only legs

**File:** `docs/development.md` → **Gate 15 — the unattended sandbox probe (macOS and Linux).**, opening paragraph — "`run` takes every leg but `headless-parity` and `refusal`, in table order, and off Linux it skips the Linux-only legs `glob-deny`, `registry`, `detached` and `loopback`; `run --leg <one>` naming one of those off Linux prints its rows `not run`."

**Problem.** This branch changed both facts the sentence states, and the sentence was left as it was:

- `scripts/sandbox-probe.sh`'s run loop now skips every job-mode-only leg when it runs without `--job` (`elif sp_leg_job_only "$sp_leg"; then continue`). Those legs are `SP_JOB_ONLY_LEGS="job-layout runner-install runner-pid runner-privs"` in `scripts/lib/sandbox-probe/core.sh`. `run --leg job-layout` without `--job` prints `not run` with `job mode only: run it with --job <checkout>`.
- `SP_LINUX_ONLY_LEGS` gained `runner-install runner-pid runner-privs`.

A person who runs `bash scripts/sandbox-probe.sh run` is told every leg but two runs. The four new legs in the table just below the sentence then never appear in the output, and nothing in the paragraph says why. The sentence also lists four Linux-only legs where the code now has seven. The `--help` text was updated (`without --job, every job-mode-only leg is left out`); this sentence was not.

**Fix.** In that paragraph, replace the quoted sentence with:

> `run` takes every leg but `headless-parity`, `refusal` and the job-mode-only legs `job-layout`, `runner-install`, `runner-pid` and `runner-privs`, in table order, and off Linux it skips the Linux-only legs `glob-deny`, `registry`, `detached`, `loopback`, `runner-install`, `runner-pid` and `runner-privs`; `run --leg <one>` naming a Linux-only leg off Linux prints its rows `not run`, and naming a job-mode-only leg without `--job` prints its rows `not run`, *job mode only*.

Change nothing else in the paragraph. `cli/test/sandbox-probe-git-and-legs.test.mjs` compares Gate 15's tables, not this sentence, so no test changes.
