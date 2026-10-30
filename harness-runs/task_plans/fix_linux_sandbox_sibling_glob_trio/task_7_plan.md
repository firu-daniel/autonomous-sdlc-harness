### Task 7 — Bring `docs/cli.md` §6, `docs/watcher.md` and Gate 15 into line with the re-rooting

**Goal:** Make the three prose owners of the per-run profile and the Linux interim position say what the branch now does and what was measured. Make Gate 15's hand procedure take AP1–AP6, sibling clone included.

**Depends on:**

- **Task 2**, the behaviour. On a bubblewrap host the per-run copy takes out of `sandbox.filesystem.denyWrite` exactly the base's sibling-glob entries for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` (`autonomous-watcher.sh` → `run_profile_glob_drops`). It adds an exact entry for each of those paths in every **other** existing sibling directory whose `.git` is a real directory and in which the path's parent exists (`run_profile_entries`). The run copy is excluded by identity, and every `Edit` rule stays.
  - `run_profile_check` accepts exactly that drop, and only when it is given a run copy, so the job-mode check is unchanged.
  - The manifest lists every absent exact `denyWrite` entry, every absent path each remaining glob yields at launch (`lib/harness-run-lib.sh` → `hr_profile_deny_paths`), and each `--add-dir` root's `.mcp.json`, in both modes.
- **Task 5**, the procedure. `scripts/sandbox-absent-path-check.sh` reads a sibling clone at `SIB`, default `<main>-sbx_sibling`, which the maintainer makes before `sandbox-probe.sh run --leg headless-parity` starts.
- **Task 6**, the rows cited: `docs/sandbox-verification.md` §5 AP1–AP6, owed again, and §6's glob point, now measured in part.

**Measured facts this task may state, with their stamps:**

- AP2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0: a `denyWrite` glob is expanded against the directories that exist at sandbox start, and a placeholder is mounted at each absent path it yields.
- GW1, 2026-10-29, Claude Code 2.1.312: a new file under an existing directory it matched was written.

The re-rooting's effect is **predicted**. The exposure of sibling copies through the base's `Edit(/<worktree_glob>/**)` allow is **derived**.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` binds the measured / derived / owed labelling. The lessons ledger binds the Gate 15 commands: every command sits in a fenced block, one per line.

### Targets

- `docs/cli.md` → §6:
  - the paragraph **"Three wrappers run outside the sandbox, each in one spelling."**, its sentence *"…the only spelling the base profile has for every sibling copy is the sibling glob, and how the Linux sandbox treats a `denyWrite` entry containing `*` is unverified."*;
  - *"Each run adds its own copy's paths by exact path, in a per-run profile."* and its bullet list;
  - residual 2;
  - residual 12's lead paragraph, **What a run cannot rely on** and **Job mode**.
- `docs/watcher.md` → `### The per-run profile`: **What it adds**, **The launch check**'s third bullet, and **On a bubblewrap host (Linux, WSL2)**'s manifest sentence.
- `docs/development.md` → Gate 15, **The absent-path check, by hand.**

**Work:**

- [ ] **`docs/cli.md` §6, the per-run paragraph and the Three wrappers paragraph.**
  - Per-run paragraph: replace *"and the Linux sandbox may skip them (residual 2)"* with the measured statement: on Linux a glob is expanded at sandbox start, absent paths included (residual 2). Add a bullet: on a bubblewrap host, the base's three sibling-glob trio entries are taken out of `denyWrite` and re-rooted at every other sibling clone by exact path (residual 12). Amend *"and nothing else changed"* so it names that one removal.
  - **"Three wrappers run outside the sandbox, each in one spelling."**: replace *"and how the Linux sandbox treats a \`denyWrite\` entry containing \`*\` is unverified"* with the measured statement: on Linux such an entry is expanded against the directories that exist when the sandbox starts (AP2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0), and a new file under an existing matched directory was written, not refused (GW1, 2026-10-29, Claude Code 2.1.312). Keep the paragraph's conclusion: a run copy's wrapper is sandbox-writable, so only the main checkout's copy is excluded. Leave the rest of the paragraph unchanged.
- [ ] **`docs/cli.md` §6, residual 2.**
  - Replace its first sentence (*"…is unverified — it may skip one, or expand it…"*) with AP2's and GW1's facts and their stamps. Keep the conclusion that the globbed entries are relied on against sandboxed commands on macOS only.
  - In the sentence about the per-run copy, add that on a bubblewrap host the base's own glob entries for the trio are also left out and re-rooted, so no `denyWrite` entry names the session's own trio.
  - Replace *"So on Linux what is left is another run copy's paths"* with: another run copy's paths that a glob covers, apart from the trio, which is exact.
- [ ] **`docs/cli.md` §6, residual 12.**
  - Lead paragraph: AP1–AP6 are owed again on this branch's head.
  - **What a run cannot rely on:** add each derived residual of the re-rooting. A sibling created after the spawn is uncovered until the next spawn. A sibling with no `.git` directory, or no `.git/objects/info`, gets no entry for that path. A sibling path carrying a quote, a `*`, a tab or a newline is skipped. A sibling's absent trio paths still carry placeholders during each call. Also add why the trio is re-rooted rather than dropped: the base's `Edit(/<worktree_glob>/**)` allow reaches sibling copies (derived). The launch check covers only a run's own clone at its launch.
  - **Job mode:** the manifest now also records each glob's absent expansions (derived). The job's checkout is a main checkout the sibling glob does not match, so its profile carries no drop.
- [ ] **`docs/watcher.md` → `### The per-run profile`.**
  - **What it adds**: in the first bullet, replace *"because the Linux sandbox may skip a \`denyWrite\` entry containing \`*\`"* with the measured fact citing `docs/cli.md` §6 residual 2. Add a bullet for the sibling trio entries, and a sentence before the list that on a bubblewrap host the base's three trio glob entries are removed first.
  - **The launch check**, third bullet: *"removing exactly the entries appended … gives back the base"*, except that on a bubblewrap host, with a run copy, the base is compared without its three trio glob entries.
  - **On a bubblewrap host**: the manifest sentence lists each remaining glob's absent expansions too.
- [ ] **`docs/development.md` → Gate 15, *The absent-path check, by hand.***
  - It fills AP1–AP6.
  - Before starting `sandbox-probe.sh run --leg headless-parity`, as `probe`, from the checkout, make the sibling with `git clone --shared . ../autonomous-sdlc-harness-sbx_sibling`, in its own fenced block. Say that the container is discarded with it, and that `SIB=` names another.
  - Add that `sweep` also deletes manifest-recorded leftovers in the sibling.
  - Keep the existing fenced blocks unchanged.

**Verification:**

- `git grep -nE 'may skip (one|them|a .denyWrite.)|is unverified — it may skip|containing .\*. is unverified' -- docs/cli.md docs/watcher.md` prints nothing.
- `grep -n 'sbx_sibling' docs/development.md` finds the fenced `git clone --shared` line, alone on its line inside a fenced block.
- Each new Linux sentence in the three files carries one of the labels *measured* (with the AP2 or GW1 stamp), *derived* or *owed*. Read the diff of each file and find none without one.

**Deviations from plan:**

- Beyond the listed targets, `docs/cli.md` §6's per-run paragraph also carries two sentences the targets did not name, and both now contradict Task 2. I amended both, with the same wording as the `docs/watcher.md` edits: the manifest sentence now lists each path a remaining glob yields (`hr_profile_deny_paths`), and the launch check's *"gives back the base"* clause now names the trio-less base on a bubblewrap host with a run copy. Residual 12's **Job mode** item 2 (the `$RUNNER_TEMP` manifest) also names the glob expansions, labelled derived.
- Residual 2: I did not add the *"unmeasured"* sentence on read-only existing files and mid-session siblings that `docs/sandbox-verification.md` §6 carries. The plan did not ask for it, and the measured / derived / owed label set has no slot for it.
- Verification, all three bullets: both greps were run. The first printed nothing (exit 1). The second found `git clone --shared . ../autonomous-sdlc-harness-sbx_sibling` alone on its line inside a fenced block. For the label bullet, I read the diff of each file.
