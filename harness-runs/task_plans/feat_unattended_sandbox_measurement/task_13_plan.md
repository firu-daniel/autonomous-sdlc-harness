### Task 13 — Test the probe's judge against recorded stream fixtures

**Goal:** Drive the probe's parsing and its verdicts against recorded stream-json fixtures, with no `claude` launched. This covers the `judge` subcommand end to end: the exact-match rule, the five refusal layers, the git-free call/tool/mcp judges, and — the story index's first top risk — N5's three arms.

**Depends on:** Task 3, which defines `sp_judge_cli`, the `judge call | tool | mcp | allowed-domains` subcommands, the layer table, and `sp_judge_allowed_domains` — the single home of N5's three arms, which Task 11's leg calls. This task adds the suite that drives them; it changes no probe file.

**How the probe is reached.** `scripts/sandbox-probe.sh` lives at the repository root, found through `WORKSPACE_ROOT` from `./helpers/fixture.mjs`, and driven through `runBash(WORKSPACE_ROOT, [join(WORKSPACE_ROOT, 'scripts', 'sandbox-probe.sh'), 'judge', …])`, the form `cli/test/run-analytics.test.mjs` uses for a root-level script. No test launches `claude`: the subcommand reads a fixture file and prints a result line.

### Targets

- `cli/test/fixtures/sandbox-probe/` (new) — the recorded stream-json fixtures, one `.jsonl` per case.
- `cli/test/sandbox-probe-judge.test.mjs` (new) — the suite.

**Work:**

- [ ] **The fixtures**, in the event shape of `cli/test/fixtures/run-analytics-two-sessions.jsonl`, each a hand-written JSONL recording of a session. Cover at least:
  - a `dd … Operation not permitted` refusal (sandbox);
  - a `Permission to use Bash … has been denied` refusal, and a `result` event whose `permission_denials[].tool_input.command` names the call (permission);
  - a `File is in a directory that is denied by your permission settings.` refusal, on an `Edit` and on a `Write` (file-tool);
  - a `<sandbox_violations> … host is not on the allow list` refusal and a `CONNECT tunnel failed` one (network);
  - a successful call (`ran`), including an N5 host-answered body and an N5 call carrying `allowed_domains` that was refused;
  - a call carrying `allowed_domains` absent (for the `not run` arm);
  - a `search_docs` `tool_result` with and without `is_error: true`;
  - a session with the same command issued twice.

  Use `@FIXTURE_ROOT@` for any path, as the run-analytics fixture does, so gate 6a stays clean.
- [ ] **The suite header** states the rule it enforces: the judge's verdict and quoted evidence are fixed by the stream's four refusal shapes and the exact-match rule, and no case launches `claude`. It names what is deliberately not covered: whether a real session produces these shapes, which only a hand-run probe shows.
- [ ] **The cases**, each asserting on the `result="…"`, `evidence="…"` and (for the layer) the printed line, with `node:assert/strict`:
  - exact match vs a command with `; echo $?` appended (→ `not run`);
  - each layer maps to its expected verdict, in the table's precedence (a permission refusal that also contains `Operation not permitted` grades `permission`);
  - `judge tool` on `Edit`/`Write`/`Read` by `file_path`;
  - `judge mcp` → `pass`/`fail`/`not run`;
  - **N5's three arms, through `judge allowed-domains <stream> <command>`:** a call carrying `allowed_domains` that was refused → `pass`; one carrying it whose host answered → `fail`, and the evidence carries Task 3's sentence `finding: allowed_domains widened a sandboxed call; this needs its own follow-up task prompt, not a doc edit`; a call with `allowed_domains` absent → `not run`, evidence `the call carried no allowed_domains parameter`;
  - the twice-issued command → judged once, evidence carries `(issued 2 times)`.
- [ ] A missing or unreadable stream path makes `judge` exit 1; assert on that and on the empty tree (no fixture written outside `cli/test/fixtures/`).

- [ ] **The anchor rule.** Any `process.env` spread this suite writes blanks the main-checkout anchor in the same object (`[MAIN_REPO_ANCHOR_VARIABLE]: ''`, imported from `../dist/core/mainRepoAnchor.js`), as `cli/test/main-anchor-isolation.test.mjs` enforces over every `cli/test/*.mjs`. Prefer a helper env (`runBash`'s default `{}`) that needs no spread.

**Verification:**

- The suite's own run, as its unit verification: `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`, from the repository root, one plain foreground command.
- Every assertion reads the probe's printed line verbatim, not a reconstruction of it.
- No case launches `claude`, loads a model or reaches the network.
