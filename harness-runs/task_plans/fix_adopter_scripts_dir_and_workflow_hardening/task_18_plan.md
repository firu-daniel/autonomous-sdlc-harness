### Task 18 — Name the change in `README.md`, `llms.txt` and `ROADMAP.md`

**Goal:** An adopter reading the quick start learns three things before running `init`: it writes its scripts into `harness-scripts/`, so a repository's own `scripts/` stays theirs; `--scripts-dir <dir>` picks another directory; and the workflows it writes pass a strict audit apart from the findings `docs/remote-execution.md` §11 lists. `ROADMAP.md` records the change. This repository keeps no CHANGELOG, and its tables carry what is done as well as what is open.

**Depends on:**
- **Task 1** — a fresh `init` writes `"scriptsDir": "harness-scripts"`, and `init --scripts-dir <dir>` writes another value on a generated config.
- **Task 16** — `docs/remote-execution.md` → `## 11. Security` carries the hardening and the residual `zizmor` findings, which this task links to rather than restates.

**Where this task stops.** These three files only. The version bump is `scripts/release.sh` step 1, run by the operator (story index → `Manual setup required:`).

### Targets

- `README.md` — `### Adopting it in your own repository`, step **B**.
- `llms.txt` — the quick start's step 2.
- `ROADMAP.md` — the `## Evidence and adoption` table.

**Work:**

- [ ] **`README.md`, step B** (story index → `## Scope register`, row 37). After the fenced `npx autonomous-sdlc-harness init` block, add one or two sentences: `init` writes its scripts into `harness-scripts/`, leaving a `scripts/` you already have untouched, and a repository adopted by an earlier release keeps its scripts where they are. Then give the alternative as its own fenced block:

  ```bash
  npx autonomous-sdlc-harness init --scripts-dir tools/harness
  ```

  Link [`docs/cli.md`](docs/cli.md) §2 for the flag.
- [ ] **`llms.txt`, step 2** (row 38). Under "Wire your repository", add one sentence after the fenced command: the scripts land in `harness-scripts/`, and `--scripts-dir <dir>` picks another directory. No new fenced command is needed, and no link is added, because gate 6c checks that every link resolves on `main`.
- [ ] **`ROADMAP.md` → `## Evidence and adoption`** (row 51). Add a row with status `Done`, "Adoption beside existing tooling (0.6.6)":
  - new adoptions write `harness-scripts/`, with `--scripts-dir` to choose, and existing adoptions never move;
  - the workflow templates are pinned to commit SHAs, with least-privilege permissions per job;
  - shipped files pass `typos`;
  - the residual `zizmor` findings are documented in `docs/remote-execution.md` §11.

  Do not add it to `## Index`, which lists outstanding work only.

**Verification:**

- **The README's adopter commands.** `grep -n 'scripts-dir\|harness-scripts' README.md llms.txt ROADMAP.md` shows the new sentences, and each command an adopter runs sits alone in its own fenced block.
- **The `llms.txt` links.** `git diff llms.txt` adds no link. The link gate 6c runs at Run gates.
- **What the README claims.** Read the README sentence against Task 1's behaviour: it claims no move for an existing adopter, and that matches the absent-key and kept-config decisions in the story index.
