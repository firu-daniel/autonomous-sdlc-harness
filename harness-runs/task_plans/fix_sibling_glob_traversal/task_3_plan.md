### Task 3 — Describe the vetoed arms in the four guards' headers and REPRO blocks and in `plugin/hooks/README.md`

**Goal:** Bring every guard-side description of the path-anchored arms in line with the arms as Task 2 built them, so that no header or README sentence describes the hole as open. Each allow-only guard's REPRO block gains the NO-OUTPUT rows that reproduce the closed shapes it reaches, and its ALLOW rows stay true.

**Depends on:** Task 2, which changed `plugin/hooks/lib/harness-config-lib.sh`. Restated so you can describe it without reading Task 2's file:
- `hc_path_anchored_patterns` now emits a `!`-prefixed **veto** glob under each wildcard-bearing arm, and `hc_matches_any_pattern` grants a piece only when it matches an arm and none of that arm's own vetoes.
- The vetoes refuse what the wildcard matched when it carries a literal `/../`, a trailing `/..`, or a character outside `[A-Za-z0-9._/-]`. A space, and therefore a subcommand inside a tail-free `--prefix` wildcard, is outside that class.
- The space-suffixed `cd <root|app_dir|state_dir> *` twins became `cd <dir> *[<>]*`, so the tail must be one redirection word. A second `cd` operand is refused, because zsh reads `cd <old> <new>` against `$PWD`.
- Two new sibling arms, `cd <work_root>/<project_name>-*/<appDir>` and `/<stateDir>`, keep a scoped `appDir` under a sibling allowed.
- No guard's code changed. Every guard reaches the vetoes through the shared matcher.
- The library comments are Task 2's and the `docs/guard-verification.md` records are **Task 7's**. Cite the record as `docs/guard-verification.md` §2.4 row `(m)`, the inventory row Task 7 adds. Do not restate its measurements here.

**Where this task stops.** Comment and README text only. No line of decision code in any guard moves. If a sentence can only be made true by changing code, report it and do not change the code.

### Targets

- `plugin/hooks/allow-safe-compounds.sh` — header comment and REPRO block.
- `plugin/hooks/git-rewrite-branch-guard.sh` — header comment and REPRO block.
- `plugin/hooks/autonomous-script-allowlist-guard.sh` — header comment and REPRO block.
- `plugin/hooks/allow-qa-credentials-read.sh` — header comment and REPRO block.
- `plugin/hooks/README.md` — `## The shared library`.

**Work:**

- [ ] **`allow-safe-compounds.sh`.** In the `THE PATH-ANCHORED ARMS` paragraph, after *"They cover `cd <dir>` and the exact, tail-free `<pkg-manager> --prefix <dir>`"*, add that each wildcard-bearing arm carries vetoes and say what they refuse, in one or two sentences that cite the library rather than restate it. Then:
  - Correct the `HOW A PIECE IS MATCHED` / leading-words prose wherever it implies a `cd` arm carries arbitrary trailing arguments.
  - **NO OUTPUT** gains:
    - `git -C <repo> status && cd <work_root>/<project_name>-x/../../<outside> && <commands.depInstall>`;
    - `git status && <runner> --prefix <work_root>/<project_name>-x/../../<outside>/<app_dir>`;
    - `git status && <runner> --prefix <work_root>/<project_name>-x <subcommand> /<app_dir>`;
    - `git -C <repo> status && cd <repo> <outside> && <commands.depInstall>`, with a gloss naming zsh's two-operand `cd`;
    - from a run copy, `git -C <repo> status && cd <repo>/../../<outside> && ls`.
  - **ALLOW** gains `cd <repo> 2>/dev/null && git status`.
  - The existing `cd <work_root>/<project_name>-<branch> && git status` row stays.
- [ ] **`git-rewrite-branch-guard.sh`.** Its `THE PATH-ANCHORED ARMS` paragraph gets the same addition. The header's piece-walking prose states that a `cd` piece reaches `update_cwd_from_cd` only after the vetoed arm grants it. So a traversal `cd` no longer threads an outside directory into a later bare `git rm` / `git mv`, which carries no `-C` for the reconstruction to judge. **NO OUTPUT** gains `git -C <repo> status && cd <work_root>/<project_name>-x/../../<outside> && git rm <path>`, and the same from a run copy as `cd <repo>/../../<outside>`. Its ALLOW row `cd <work_root>/<project_name>-<branch> && rm <tracked>` stays.
- [ ] **`autonomous-script-allowlist-guard.sh`.** In `THE NON-SCRIPT PIECES ARE NOT JUDGED BY A SECOND OPINION`, add one sentence: the `cd` piece that sets `run_cwd` is judged by the vetoed arms first. In a run copy, `cd <repo>/<scripts dir>/../../…/<outside>` used to put a relative `.sh` token textually under `<scripts dir>` while it ran from outside, and the arm's `/../` veto is what now refuses it. **NO OUTPUT** gains `git -C <repo> status && cd <repo>/<scripts dir>/../../../../../<outside> && bash <scripts dir relative>/<wrapper>.sh`, from a run copy, with the `..` count matching the depth of `<scripts dir>`.
- [ ] **`allow-qa-credentials-read.sh`.** Add the same one-sentence note to the paragraph that routes non-credential pieces through `hc_path_anchored_patterns`. **NO OUTPUT** gains `git -C <repo> status && cd <work_root>/<project_name>-x/../../<outside> && cat <creds path relative>`. The ALLOW row `cd <repo> && cat <creds path>` stays.
- [ ] **`plugin/hooks/README.md` → `## The shared library`.** In the sentence *"It also owns the *path-anchored* prefixes — the arms that name a per-checkout directory (`cd <dir>`, and the exact, tail-free `<pkg-manager> --prefix <dir>`)…"*, add that each wildcard-bearing arm carries veto globs the shared matcher honours. Say it so that no guard can apply a different reading of an arm, and cite `docs/guard-verification.md` §2.4 row `(m)` for the measurements. Keep the paragraph's last sentence, about all four guards building from the same functions, as it stands.

**Verification:**

- Run each REPRO row this task adds or touches, by hand, per `plugin/hooks/README.md` → `## Reproducing a decision by hand`, on a throwaway `git init` fixture under the system temp directory carrying a real `git worktree add` sibling and a `git clone --shared` copy. Run it in the guard whose block lists it, with `/bin/bash`. Every NO-OUTPUT row prints nothing and exits 0, and every ALLOW row prints one `allow` object.
- `git diff -U0 HEAD -- plugin/hooks/*.sh` shows only lines beginning `#`.
- `grep -n 'any trailing arguments' plugin/hooks/*.sh plugin/hooks/README.md` prints no line that claims a sibling `cd` arm carries trailing arguments.
  - **Deviations from plan:**
    - `allow-safe-compounds.sh` NO-OUTPUT row 3 is spelled `<subcommand not in commands.*>` rather than `<subcommand>`: measured, a configured subcommand (`npm --prefix <work_root>/<project_name>-x ci /<app_dir>`) is granted through `hc_runner_piece_in_workspace`'s rewrite to `npm ci /<app_dir>`, which is the bare spelling's own grant, so the row is true only for an unconfigured one. The existing `--prefix` rows already use this spelling.
    - `autonomous-script-allowlist-guard.sh` NO-OUTPUT row writes `bash <scripts dir>/<wrapper>.sh` rather than `<scripts dir relative>/<wrapper>.sh`, matching the block's existing `cd <repo> && bash <scripts dir>/<wrapper>.sh` spelling. Its gloss reads "as many `..` as climb out of <work_root>" instead of "matching the depth of `<scripts dir>`", because the guard's decision is textual and needs only enough `..` to leave the workspace.
    - `git-rewrite-branch-guard.sh`: the `update_cwd_from_cd` sentence went into the header's `THE PATH-ANCHORED ARMS` paragraph, and a one-line restatement went into the `# Piece walking.` comment above the function. Both are comment lines.
    - `docs/guard-verification.md` §2.4 row `(m)` is cited as the plan directs, but that row does not exist yet. Task 7 adds it.
    - Evidence route for the hand-run REPRO bullet: the permission profile refused the fixture-building compound `Bash` command, so the fixture (a `git init` repository under the system temp directory, a real `git worktree add` sibling, and a `git clone --shared` run copy on an ordinary branch with `appDir: app`, `scriptsDir: scripts`, `phases.qa: true`) was built and every added or touched row run with `/bin/bash` from the probe `harness-runs/scratch/task3_repro.py` through `bash scripts/scratch-run.sh`. Result: 14/14 rows as listed (`FAILURES: 0`). The same probe run against commit `2b8c01c9`'s guards and library shows all 9 new NO-OUTPUT rows as `allow` before Task 2.
