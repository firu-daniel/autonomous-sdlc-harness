### Task 13 — Add `docs/retrieval.md`'s end-to-end section on turning the Python backend on

**Goal:** Document, end to end, how an adopter turns the Python backend on: the key, the container, the package and its weights, and the `doctor` output that says it is ready. Record there the two decisions selecting the backend had to settle: how the database is scoped, and what a lost connection costs. They sit beside the commands, where an operator reads them. Write it as a new `## Turning on the Python backend` section, placed immediately after `## When to turn it on`.

**Depends on:**

- Task 12, which rewrites `## How it fits together`, `## What this buys you`, `## What it costs` and `## Where it goes next`, and links to this section by the exact heading `## Turning on the Python backend`.
- Task 4's launcher: it resolves `harness-docs-retrieval` on `PATH` plus `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`, `/usr/sbin`, `/sbin` and `~/.local/bin`. It defaults the URL to `postgresql://harness:harness@127.0.0.1:5432/docs_retrieval` and exits `3` when the backend cannot serve.
- Task 5's checks `retrieval-python-dependencies` (`packages`), `retrieval-python-model-cache` (`weights`) and `retrieval-python-index` (`index`), whose pass lines carry `self-check`'s own detail.
- Task 11's `docs/config.md` row, which owns the connection-string decision. This section cites it.

**Where this task stops.** Only `docs/retrieval.md`. The package's own README is Task 15's. The `docs/cli.md` sections are Task 14's.

### Targets

- `docs/retrieval.md`

**Work:**

- [ ] The steps, each adopter command in its own fenced `bash` block, one command per line, never inline:
  1. Set the key: `npx autonomous-sdlc-harness config set docs.retrievalBackend python`. Retrieval itself must already be on.
  2. Start the database from a clone of this repository, at the tag matching the installed CLI: `docker compose up -d --wait postgres` from `docs-retrieval-service/`, because the `postgres` image builds from that directory.
  3. Install the package with its `models` extra so `harness-docs-retrieval` lands on a directory the launcher searches. Use `uv tool install` from that clone's `docs-retrieval-service/`, which puts it in `~/.local/bin`. **Confirm the exact spelling against `uv tool install --help`** before writing it, and do not run it. State that the package is not published, which the task prompt puts out of scope.
  4. Fetch the weights where an operator is present: `harness-docs-retrieval fetch-models`.
  5. Check readiness: `npx autonomous-sdlc-harness doctor`. Show the three `retrieval-python-*` lines as `PASS`, and the three TypeScript lines as passing not applicable, using each check's id and title from Task 5 without inventing their detail text.
- [ ] **Its database** subsection, stating the decisions:
  - the default URL and the `.mcp.json` `env` override with a password-free URL and `~/.pgpass`, citing `docs/config.md` §5 for the reasons;
  - **one database per repository, shared by its checkouts and worktrees**. A second repository on the same machine creates its own database and names it in its own `.mcp.json`, with `docker compose exec postgres createdb -U harness <name>` in a fenced block.
  - **What sharing costs**, stated as an accepted cost rather than a measured one:
    - each call's refresh reconciles the shared index to the calling checkout's corpus;
    - worktrees on different branches re-embed the chunks that differ;
    - two servers refreshing at once can interleave, so a hit may name a section another branch has;
    - two repositories left on one database delete each other's chunks on every refresh, and `doctor` cannot detect that.
- [ ] **A lost connection** subsection: the server holds one connection and does not reconnect, so after a Postgres restart every `search_docs` call fails until the server restarts. The next agent session restarts it. Cite `docs-retrieval-service/README.md` → `## The seam, as found`, item 8, for the mechanism.
- [ ] **Switching back and what stays**:
  - remove the key, or set `typescript`;
  - `init` kept the TypeScript runtime and models, so nothing is reinstalled;
  - the `docs` verb (`docs index`, `docs search`) always answers from the TypeScript backend;
  - in a remote GitHub Actions job nothing of the Python backend is provisioned, so with it selected the server does not start there (`docs/remote-execution.md` → **Retrieval.**).
- [ ] `## Still open`: add one bullet. The turn-on path above has not been walked end to end on a real machine with real weights. Task 10's container case covers the launcher, the server and the database under the stub only. It is settled by `feat_docs_retrieval_backend_comparison`'s real-model run.

**Verification:**

- Reading the new section line by line, every adopter command (`npx …`, `docker …`, `uv …`, `harness-docs-retrieval …`) sits in a fenced block, one per line, and none appears inline in a prose line.
- Every heading and file it cites resolves: `docs/config.md` §5's `docs.retrievalBackend` row, the service README's `## The seam, as found`, and `docs/remote-execution.md` → **Retrieval.**
- The section quotes no figure and no password beyond the compose file's published throwaway default.
- The forward links written before this heading existed now resolve: `git grep -n "Turning on the Python backend" -- docs/config.md docs/retrieval.md` shows the new `## Turning on the Python backend` heading, spelled exactly, and every citing line in `docs/config.md` §5's `docs.retrievalBackend` row (Task 11) and in `docs/retrieval.md`'s own sections (Task 12) names that same text.

**Deviations from plan:**

- **`uv tool install --help` was not run (evidence downgrade).** Both `uv tool install --help` and `uv --version` were refused by the session's permission layer, so the step-3 spelling `uv tool install ".[models]"` rests on reading, not execution: the package name and `models` extra from `docs-retrieval-service/pyproject.toml` → `[project]` / `[project.optional-dependencies]`, and uv's documented path-with-extras requirement form. The planned confirmation against `--help` is still owed; a supervised step or the comparison branch's real-model walk should run it.
- **Step 2 gained the clone commands.** The plan asks for the database to be started "from a clone of this repository, at the tag matching the installed CLI" but names no command for getting there; the section adds `npx autonomous-sdlc-harness --version`, `git clone --branch autonomous-sdlc-harness--v<version> …` and the `cd` into `docs-retrieval-service/`, each fenced. The tag form is the release tag `docs/remote-execution.md` → **Plugin install, and its pin.** names; that the CLI version and that tag coincide was not checked against `git tag` (also refused).
- **Doctor output shown as a table, not as printed lines.** `doctor` prints `STATUS  id  detail` with ids padded to the widest id across every check (`cli/src/commands/doctor.ts` → `run`), and the Python detail text is `self-check`'s own, so the section tabulates id, title and expected status instead of reproducing lines whose padding and detail it cannot state.
- **`## Still open` names the test file, not "Task 10".** A durable document cannot cite a task number, so the bullet names `docs-retrieval-service/tests/test_launcher_e2e.py`, the file Task 10 added.
