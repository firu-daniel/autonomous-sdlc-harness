### Task 8 — Add an online zizmor mode, `--zizmor-online`, to `scripts/check-rendered-workflows.mjs`

**Goal:** Give the nightly one command that runs zizmor 1.30.1 **online**, with a GitHub token, over two directories. The first is the four rendered adopter workflows, graded against the **same** `RESIDUAL` set 14d uses offline. The second is this repository's own `.github`, graded against an empty residual. `impostor-commit`, `ref-confusion`, `known-vulnerable-actions` and `stale-action-refs` run only online, and today that audit is a hand-run step (`docs/development.md` gate 14: "The online audit, which needs a GitHub token, is hand-run and never this leg").

**Depends on:** Task 5, the previous editor of this file (`parseError` now calls `yaml.load`). Also Task 7, which leaves this repository's own `.github` with no unsuppressed finding, so this mode's second pass can come back clean.

**The interface the nightly calls**, which **Task 10** restates:

```
node scripts/check-rendered-workflows.mjs --zizmor-online
```

- **Token:** taken from `GH_TOKEN` when set and non-empty. Otherwise it is taken from `gh auth token`, spawned with a fixed argument vector, so a local run is a literal command. If neither yields one, print the reason and exit `4`. The token reaches zizmor **only** through the child's `GH_TOKEN` environment variable, never through `--gh-token` on its argv, where a process listing would show it.
- **zizmor:** resolved exactly as `--zizmor` resolves it (`resolveZizmor`: `PATH` at 1.30.1, else `uvx zizmor@1.30.1`), and `4` when neither resolves.
- **Pass 1:** render as `withRendered` does, then run `zizmor --no-config --format=json <render>/.github` with no `--offline`, and grade it with the same `RESIDUAL` and the same two finding kinds as `zizmorFindings`: a finding outside `RESIDUAL`, and a `RESIDUAL` entry that no longer fires.
- **Pass 2:** run `zizmor --no-config --format=json <repoRoot>/.github` online, where every finding is a finding. The only allowance there is an inline `# zizmor: ignore[<audit>]` comment in the workflow itself, which zizmor already drops from JSON output. Findings are reported with the repository-relative path, for example `.github/workflows/<file>`.
- **Exit:** `0` when both passes are clean, `1` with every finding on stderr in the existing `check-rendered-workflows: <file> — <reason>` shape, `2` on bad usage, `4` when zizmor or a token is unavailable.

**Where this task stops.** `scripts/run-gates.sh` is **not** edited. 14d stays offline, and this mode is never a gate leg, because an API outage or a new advisory must not fail an unrelated change. The `docs/development.md` text about the online audit is **Task 11**'s. The workflow that runs this mode is **Task 10**'s.

### Targets

- `scripts/check-rendered-workflows.mjs` — header, argument parsing, a token resolver, an online run of `zizmorFindings`, and the new mode's dispatch.

**Work:**

- [ ] Generalise `zizmorFindings(tool, githubDir)` so a caller chooses **online or offline**, **which residual set** to grade against, and **how a finding's file is labelled**. `--zizmor` keeps calling it offline with `RESIDUAL` and its current labels, byte-for-byte the same findings text as today.
- [ ] Add `resolveGhToken()`, returning `{ token }` or `{ reason }`. It reads `GH_TOKEN`, then falls back to `execFileSync('gh', ['auth', 'token'], …)` with stdio captured and a non-zero exit treated as "no token". Pass `{ ...process.env, GH_TOKEN: token }` as the zizmor child's env in online mode.
- [ ] Add the `--zizmor-online` mode to the accepted-argument list, the usage line and the dispatch. It runs both passes above; pass 2 runs even when pass 1 found something, so every finding is reported.
- [ ] Rewrite the header's `--zizmor` paragraph ("The online `--gh-token` audit is a hand-run step, never this mode") and add a `--zizmor-online` usage paragraph. The paragraph says what each pass grades against, where the token comes from and that it never sits on argv, that `.github/workflows/supply-chain.yml` runs this mode nightly, and that `run-gates.sh` never does. Extend the `Exit:` block's `4` line to cover a missing token.

**Verification:** run each command from the repository root, without a pipe. `scripts/check-rendered-workflows.mjs` is a gate script (`scripts/run-gates.sh` runs it as gates 14a–14d), so this task **never runs it**, in any mode, including the new one and a bad-usage call (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 4). The new mode is graded by source reads here. Its one real online run is a hand-run step before merge, listed in the story index's `**Manual setup required:**`. Task 13 records it as not run by the flow.

- `node --check scripts/check-rendered-workflows.mjs` exits 0. This parses the file without executing it.
- Read the file and confirm that the usage string and the accepted-argument list both name `--zizmor-online`, and that the dispatch routes `--zizmor-online` to a function that runs pass 1 (rendered set, `RESIDUAL`) and then pass 2 (`<repoRoot>/.github`, empty residual), with pass 2 reached even when pass 1 found something.
- Read the online path's zizmor invocation and confirm that its argument array carries no `--offline`, and that the child's `env` is `{ ...process.env, GH_TOKEN: token }`.
- Grep the file for `--gh-token`: it appears only in prose, never in an argument array.
- Read `resolveGhToken()` and the dispatch, and confirm that exit `4` is returned on each unavailable dependency: no `GH_TOKEN` and `gh auth token` failing or empty, and `resolveZizmor` resolving neither `PATH` zizmor 1.30.1 nor `uvx`. Each case prints a reason naming which one is missing.
- Read the `--zizmor` path and confirm it still calls the generalised `zizmorFindings` offline, with `RESIDUAL` and its existing file labels. 14d (`--zizmor`, offline) runs at Phase G and must report exactly what it reported before this task.
