### Task 27 — Document the workflows, `--plugin-root-entries`, the two checks and `--check-github` in `docs/cli.md`

**Goal:** Keep `docs/cli.md` the reference of record for what the CLI does after this branch: a new `init` switch, two new generated files, a new outer-loop script, two new `doctor` checks and a new `doctor` option.

**Depends on:** the CLI tasks whose behaviour this documents, restated here so the writer need not open them:

- **Task 14** — `init --plugin-root-entries`: when this run creates the permission profile, it also writes the `Read` and helper `Bash` entries for every plugin root this machine resolves — the lines `doctor`'s `plugin-permissions` check asks for, built by one shared function; off by default, because on a person's machine a version-carrying root goes stale at the next upgrade; a kept profile gains nothing and a note says so; no resolved root is a warning. Meant for a remote job.
- **Task 17** — when `execution.target` is `github-actions`, `init` writes `.github/workflows/harness-run.yml` (rendered: its only substitution is the CLI's own version, which pins the job's CLI and plugin) and `.github/workflows/harness-resume.yml` (copied), both `create-if-absent`, `--force` after a `.bak`; planned after the scripts and before the permission profile; the closing report lists the GitHub-side steps.
- **Task 5** — `remote-run.sh` joins the outer-loop family: not agent-invocable, withheld by the script-allowlist guard (Task 21), run by the watcher, the remote job and a person.
- **Tasks 18–19** — both checks are defined in `cli/src/doctor/checks.ts`. `remote-execution` (offline: the target, the workflow files, `gh` on `PATH`, the workflow on `origin/<defaultBranch>`; `fail` when on and `harness-run.yml` or `gh` is missing); whether an installed daemon's `PATH` reaches `gh` is reported by the existing `daemon-path` check, whose graded binaries gain `gh` while `execution.target` is `github-actions`; and `remote-github` (asks GitHub only under `--check-github`: `gh auth status`, `gh workflow view`, credential secret names, `HARNESS_PUSH_URL`, `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`; unreachable is `warn`; secret values are never read). `--check-github` is off by default and moves no other check.

### Targets

- `docs/cli.md` — §2 (flag table; `### Generator order, and why it is load-bearing`), §3 (re-run table), §5 (register row 12), §7 (check table; the options paragraph, register row 46) (register row 52).

**Work:**

- [ ] §2: a flag-table row for `--plugin-root-entries` in the form of its neighbours, with the off-by-default reason; one sentence in `### Generator order…` placing the workflow generator after the scripts and before the profile, and why (the workflows run outer-loop scripts).
- [ ] §3: two re-run table rows, `.github/workflows/harness-run.yml` and `harness-resume.yml` (written only when `execution.target` is `github-actions`), policy `create-if-absent`, with the reason (the adopter tunes the cron, the timeouts and the runner).
- [ ] §5: `remote-run.sh` in the member list of **Two families land in `scriptsDir`…**, and the sentence about who starts the non-generated family names the remote job as a third starter beside the watcher and a person.
- [ ] §7: two check-table rows placed after `daemon-path`, as `remote-execution` and `remote-github`, each with its question; the opening's option count becomes three and `--check-github` is described at the section's end beside `--check-registry`, including that a default run reaches no network.

**Verification:**

- Every check id, flag and path named matches the source (`grep -n "id: 'remote-" cli/src/doctor/checks.ts`, `grep -n "check-github\|plugin-root-entries" cli/src/commands`).
- Re-run the story index's derivation entries 2 and 7 and confirm `docs/cli.md`'s hits are the edited sentences.
- Commands an adopter runs sit in fenced blocks, one per line.

**Deviations from plan:**

- §7's opening said both options "neither moves the exit status"; `--check-github` enables `remote-github`, which fails (`cli/src/doctor/checks.ts` → `REMOTE_GITHUB_CHECK`), so the opening now says the first two never move it and `--check-github` can.
- §5's `DENY_SCRIPT_BASENAMES` sentence also names `remote-run.sh` — register row 12 is reached by derivation entry 3 as well as entry 2, and Task 21 added the basename to the guard.
- §7 gained one severity bullet for the two checks, beside the other severity bullets, and a sentence on the `daemon-path` bullet saying it grades `gh` while `execution.target` is `github-actions`. The Depends list names both facts; the Work list did not ask for them.
- `--check-registry`'s "the one of the two `--dry-run` does not suppress" became "`--dry-run` does not suppress it", because `--check-github` is not suppressed either (`cli/src/commands/doctor.ts` header).
- The `--check-github` paragraph names the other two options rather than saying "the two options above", so derivation entry 7 no longer matches it.
- `bash scripts/test.sh` exits 1 on two gates unrelated to this diff: 6a matches the ignored `harness-runs/scratch/t3-test.log` from an earlier task, and 11 needs the retrieval runtime, which is not installed on this machine.
