### Task 15 — Test the probe's git judges and its leg table

**Goal:** Cover the parts of the probe that read neither a stream nor the main checkout: the git judges (`sp_judge_push`, `sp_judge_ref`) against a throwaway fixture repository, and the leg table (`--list`) against the result-line format. No `claude` launched, and no fixture aimed at this repository.

**Depends on:**
- **Task 1** — `--list`, `SP_LEGS` and `sp_result_line <leg> <row> <verdict> <evidence> <departure>`, which prints exactly `leg="<leg>" row="<row>" result="<pass|fail|not run>" evidence="<evidence>" departure="<departure or none>" claude="<SP_VERSION or unknown>"`, the evidence reduced to its first line with each `"` replaced by `'`.
- **Task 3** — `sp_remote_tip <main> <branch>`, `sp_judge_push <main> <branch> <before>` and `sp_judge_ref <repo> <ref> <before> <expect moved|unchanged>`, each setting `SP_VERDICT` and `SP_EVIDENCE`.

This task adds a suite; it changes no probe file. The preflight refusals and the `shasum` guard are **Task 14's** suite, a separate file.

**How the probe is reached.** None of these cases touches checkout state:
- **`--list`** runs the probe at `join(WORKSPACE_ROOT, 'scripts', 'sandbox-probe.sh')` with `runBash`, as Task 13 does for `judge`; it touches nothing.
- **`sp_result_line` and the git judges** run in a `bash -c` that sources `core.sh` and `judge.sh` from `join(WORKSPACE_ROOT, 'scripts', 'lib', 'sandbox-probe')` (the form `cli/test/watcher-run-profile.test.mjs` → `watcherCall` uses). Every repository argument names a throwaway fixture: a `seedRepository` fixture from `./helpers/fixture.mjs` with a bare remote, both under `os.tmpdir()` and torn down in process. Neither file reads `SP_MAIN` or the probe's own checkout, so sourcing them from `WORKSPACE_ROOT` aims nothing at this repository.

### Targets

- `cli/test/sandbox-probe-git-and-legs.test.mjs` (new) — the suite.

**Work:**

- [ ] **Header** stating the rule: the probe's git judges read refs, never exit statuses, and its leg table is the single declaration `--list` prints. Name what is not covered: the sandboxed sessions themselves, which only a hand-run probe reaches, and the preflight refusals and the `shasum` guard, which `cli/test/sandbox-probe-shell.test.mjs` (Task 14) covers.
- [ ] **The git judges.** In the `seedRepository` fixture with its remote, assert `sp_judge_push` reads `pass` when `ls-remote` moves and `fail` when it does not, and `sp_judge_ref` reads `moved`/`unchanged` against `rev-parse` before/after. These run real `git`, no `claude`.
- [ ] **The leg table.** Assert `--list` prints one line per leg in the Task 1 order — `gates`, `mktemp`, `scratch`, `retrieval`, `wrappers`, `wrappers-refresh`, `planted-config`, `planted-files`, `write-protection`, `git`, `network`, `retry`, `repo-settings`, `credentials`, `invalid-profile`, `headless-parity` — each carrying its rows, and that every row id the story index's new-row table lists appears in exactly one leg. CS4 is in `wrappers` only. Assert `sp_result_line` formats its fields in the fixed order with values double-quoted and newlines in evidence collapsed.
- [ ] **The anchor rule.** Any `process.env` spread this suite writes blanks the main-checkout anchor in the same object (`[MAIN_REPO_ANCHOR_VARIABLE]: ''`, imported from `../dist/core/mainRepoAnchor.js`), as `cli/test/main-anchor-isolation.test.mjs` enforces over every `cli/test/*.mjs`. Prefer a helper env (`runBash`'s default `{}`) that needs no spread.

**Verification:**

- The suite's own run: `npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs`, from the repository root, one plain foreground command.
- Every fixture is built under `os.tmpdir()` and removed in process; grep the suite for any path under this checkout used as a fixture and find none.
- Grep the suite for `WORKSPACE_ROOT` and read each hit: it appears only as the location of `scripts/sandbox-probe.sh` for `--list` and of `core.sh`/`judge.sh` for sourcing. Every repository argument a judge receives names a fixture under `os.tmpdir()`.
- No case launches `claude`.
