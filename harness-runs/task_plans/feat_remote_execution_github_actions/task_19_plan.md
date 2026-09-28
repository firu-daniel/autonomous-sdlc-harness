### Task 19 — Add `doctor --check-github` and its `remote-github` check

**Goal:** Let an adopter ask GitHub, on demand, whether the remote setup is complete — authenticated, workflow known to GitHub, a credential secret present, the runner variable read back — without making a default `doctor` run reach the network.

**Depends on:** Task 18, which defined `REMOTE_EXECUTION_CHECK` in `cli/src/doctor/checks.ts` itself (no separate module — so the module's private `pass` / `warn` / `fail` / `unevaluated` builders are used in place, with no runtime import cycle and no second copy), registered it after `daemon-path` in `CHECKS`, and extended `cli/test/doctor.test.mjs`. Task 2's `runGh(args, cwd): { status, stdout, stderr } | undefined` (bounded, fixed argv, `undefined` when `gh` does not spawn), `WORKFLOW_RUN_FILE`, `WORKFLOW_RESUME_FILE`, `OAUTH_TOKEN_SECRET`, `API_KEY_SECRET`, `PUSH_URL_SECRET`, `RUNNER_VARIABLE`, `REMOTE_STOP_VARIABLE`. Task 1's `remoteExecutionApplies`.

**The flag and the check, stated once for every consumer** (Task 27 documents them; Task 17's closing report names the flag):

- `doctor --check-github` — an option of the command's own, beside `--check-registry`, off by default, changing no other check. `CheckContext` gains `probeGithub: boolean`, `false` in every default run.
- `remote-github` — *"what GitHub says about the remote setup"*, placed immediately after `remote-execution`:

| State | Grade | Detail |
|---|---|---|
| remote execution off | `pass` | nothing asked |
| on, flag not given | `pass` | "not asked — run `doctor --check-github`" |
| on, `gh` does not spawn, or `gh auth status` exits non-zero | `fail` | the `gh` remedy |
| on, `gh workflow view harness-run.yml` fails | `fail` | GitHub does not know the workflow: push it to the repository's default branch |
| on, `gh secret list` shows neither `CLAUDE_CODE_OAUTH_TOKEN` nor `ANTHROPIC_API_KEY` | `fail` | set one; billing follows the API key when both are set |
| on, both credential secrets present | `pass`, noted | billing follows `ANTHROPIC_API_KEY` |
| on, `HARNESS_PUSH_URL` absent | `warn` | notifications from a remote run reach no one |
| on, `gh workflow view harness-resume.yml` fails | `warn` | usage auto-resume unavailable |
| on, `HARNESS_REMOTE_STOP` set | `warn` | every remote start and continuation is stopped |
| on, otherwise | `pass` | `HARNESS_RUNNER`'s value, read with `gh variable list`, stated as "GitHub-hosted (`ubuntu-latest`)" when unset and "runner label `<value>`" when set |

  A `gh` call that times out or cannot reach GitHub is `warn`, naming the call — "cannot tell" is not "missing". Secret **values** are never read: `gh secret list` returns names only, and the detail prints names only.

### Targets

- `cli/src/doctor/checks.ts` — `REMOTE_GITHUB_CHECK`, defined beside `REMOTE_EXECUTION_CHECK`; `CheckContext.probeGithub`; the `CHECKS` entry.
- `cli/src/commands/doctor.ts` — the `--check-github` flag constant, `OWN_FLAGS`, the usage lines beside `--check-registry`'s, and passing `probeGithub`.
- `cli/test/doctor.test.mjs` — the accompanying cases.

**Work:**

- [ ] Add the flag to `doctor.ts` in the form `CHECK_REGISTRY_FLAG` uses, with a doc comment saying why it is off by default (a default run answers the same in CI, offline and in an `&&` chain), and extend the usage text.
- [ ] Add `probeGithub` to `CheckContext` with a doc comment in the style of `probeRegistry`'s, and set it from the flag.
- [ ] Implement `REMOTE_GITHUB_CHECK` per the table, every `gh` call through `runGh` with a fixed argument vector and JSON output (`--json` where `gh` offers it), and register it.
- [ ] Cases with `HARNESS_GH_CLI` pointed at a stub that answers per subcommand from files the test writes: each row, including a stub that sleeps past the bound (→ `warn`) and the both-secrets note; a default run with the stub recording its invocations records none; `doctor --check-github` on a repository with remote off asks nothing.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0.
- In the default-run case the stub's invocation log is empty — the offline guarantee, asserted.
- `doctor --help` lists `--check-github` with its explanation.
- `git ls-files cli/src/doctor` lists no `remoteExecution.ts`; `grep -n "REMOTE_GITHUB_CHECK" -r cli/src` hits only `cli/src/doctor/checks.ts`.

**Deviations from plan:**

- The timeout case uses a stub that sends itself `SIGTERM` rather than one that sleeps past the bound. `runGh`'s bound is a fixed 30 s (`GH_TIMEOUT_MS`, not overridable), and a child it kills for the bound comes back as exactly what a self-signalled child does: `status: null` with a signal. So the check gets the same input, and the case does not cost 30 s. The bound itself is Task 2's, and this case does not exercise it.
- `--json` is used on `gh secret list` (`name`) and `gh variable list` (`name,value`) only. `gh workflow view` has no `--json` flag, and `gh auth status` offers one only in recent `gh` releases, so both are run with their plain fixed argv and graded on their exit status.
- Not in the table, graded `warn` by the "cannot tell" rule: a `gh secret list` / `gh variable list` that exits non-zero for a reason other than the network (for example a 403 for a non-admin), or that answers JSON this check does not read.
