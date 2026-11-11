### Task 14 — Rename the anchor and QA keys in the plugin's shell library and QA helpers

**Goal:** `hc_main_root` reads the anchor from `DEVSCENE_MAIN_REPO`. `reserve-qa-user.sh` finds its slots from `DEVSCENE_QA_<n>_EMAIL=` lines in the adopter's credentials file.

**Depends on:** Task 2, which set `MAIN_REPO_ANCHOR_VARIABLE = 'DEVSCENE_MAIN_REPO'`, and Task 3, whose watcher exports `DEVSCENE_MAIN_REPO` to every session. Also Task 6, whose `cli/templates/claude/qa-accounts.env.example` now writes `DEVSCENE_QA_1_EMAIL=` and its siblings: this helper's parse must match those keys exactly.

**Guard cost.** `.claude/context/plugin.md` → *Guards, the shared library …* asks that a change to the library be re-measured in `docs/guard-verification.md`. This change touches only `hc_main_root`'s variable read and comments. `docs/watcher.md` → *The main-checkout anchor* records that no guard calls that function, so no guard decision and no per-call cost changes, and there is nothing to re-measure. The one mention of the name in `docs/guard-verification.md` is Task 20's. The suites `qa-user-locks.test.mjs` and `main-root-fallback.test.mjs` read these files and are Task 18's.

### Targets

- `plugin/hooks/lib/harness-config-lib.sh`
- `plugin/scripts/reserve-qa-user.sh`
- `plugin/scripts/release-qa-user.sh`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `harness-config-lib.sh`: `HARNESS_MAIN_REPO` (3) becomes `DEVSCENE_MAIN_REPO`: the `REPRO` line, the `1. THE ANCHOR.` comment and `anchor="${HARNESS_MAIN_REPO-}"`. Leave the shell options alone; the library sets none.
- [ ] `reserve-qa-user.sh`: `HARNESS_QA_` becomes `DEVSCENE_QA_` in the header, the `REPRO` block and the slot parse (`'^DEVSCENE_QA_[0-9]+_EMAIL=.+'` and `'s/^DEVSCENE_QA_([0-9]+)_EMAIL=.*/\1/'`). `HARNESS_MAIN_REPO` becomes `DEVSCENE_MAIN_REPO` in the comments and `REPRO`.
- [ ] `release-qa-user.sh`: `HARNESS_MAIN_REPO` becomes `DEVSCENE_MAIN_REPO` in the comment and `REPRO`.

**Verification:**

- `git grep -nE 'HARNESS_(MAIN_REPO|QA_)' -- plugin/hooks plugin/scripts` prints nothing.
- `bash -n` on each of the three files exits zero.
- Following `reserve-qa-user.sh`'s own `REPRO` block against a throwaway `git init` fixture whose credentials file holds `DEVSCENE_QA_1_EMAIL=` and `DEVSCENE_QA_2_EMAIL=` reserves slot 1 (`.claude/context/plugin.md` → *Verifying a change in this layer*).
