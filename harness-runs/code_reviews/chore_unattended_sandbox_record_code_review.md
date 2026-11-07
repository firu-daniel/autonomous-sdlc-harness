# Code review: chore_unattended_sandbox_record

**Context.** Branch `chore_unattended_sandbox_record`, reviewed 2026-11-07 against `origin/dev`. This checkout has no local `dev` ref, and `origin/dev` is the configured `defaultBranch`'s remote-tracking ref, at merge base `105df64a`. The review covered 16 files: 376 insertions and 157 deletions over Tasks 1–8. 13 run-artifact files excluded from the reviewed diff.

The diff falls into three segments:
- **cli and plugin.** Comment and runtime-string repoints in `cli/templates/scripts/launch-sandboxed-gates.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` (above `hr_remote_status_write`), `cli/test/run-copy-clone-arm.test.mjs` and `plugin/hooks/git-trust-file-guard.sh` (header and `deny` reason). The guard's re-measurement is recorded in `docs/guard-verification.md`.
- **The new document of record.** `docs/sandbox-record.md`, §§1–7.
- **Repoints and registration.** The residual move out of `docs/cli.md` §6. Citation repoints in `docs/watcher.md`, `docs/remote-execution.md`, `docs/sandbox-placeholder-upstream-report.md`, `docs/development.md`, `docs/sandbox-verification.md` and the two Gate 12 graders under `scripts/lib/gate12-sandbox-round/`. Roadmap rows 22–34 in `docs/development.md` → `## 6. The roadmap this tree defers to`. Registration in `README.md` → `## Where to read more` and `llms.txt`.

**Headline conclusions.**
- **The moved residual list.** A `--color-moved` diff of `docs/cli.md` against `docs/sandbox-record.md` shows residuals 1–13 moved verbatim, with two kinds of exception:
  - in-file pointers (*"the measured fetch pins above"*, *"(above)"*, *"(§7)"*) rewritten as `cli.md` §6 / §7 anchors that resolve;
  - appended *Since then* sentences in residual 1 item 3, residuals 2, 9, 11 and 12, residual 12's **Job mode** item 4 and residual 13's **What is owed**.

  The new residuals 14–18 cover each item the prompt adds.
- **Verdicts.** Every verdict the record cites that this review spot-checked matches its row in `docs/sandbox-verification.md`. That is about 120 row verdicts across §§2–5, §8, §9 and §10, including G1/G2, P1/P1a, CS2, CS8, CL5 (Linux), N5 on all three platforms, the §4 per-leg table, and PN1–PN3 / NN1–NN2. No result is stronger than its row.
- **Citation sweeps.** The scope register's derivation commands A and B were re-run, and every remaining hit is one of three things:
  - a `no-change` row (observed quotes in `docs/sandbox-verification.md`, the self-adopted `scripts/` copies that follow at the post-merge re-render, and the `residual 0` criterion counts);
  - a citation naming `docs/sandbox-record.md`;
  - the retained `**Residuals, stated rather than hidden:**` pointer paragraph in `docs/cli.md`.
- **Cited anchors.** Every heading, header block and symbol the record cites resolves. That covers the `THE CHECKS` items (check 4 included), `THE BWRAP VECTOR`, `WHY IT MAY BE EXCLUDED`, `RESIDUALS OF THE DETACHED SHAPE`, the commit wrapper's header paragraphs, `expectedSandbox` / `LOOPBACK_ALLOWED_HOST`, and the `cli.md`, `watcher.md` and `remote-execution.md` bold anchors.
- **Wrapper check order.** The seven-step order in §2 matches the call order in `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`.
- **§7 follow-ups.** Every §7 bullet that carries a roadmap number has its row in `docs/development.md` → `## 6`. No `<pending>` token remains. Each mismatch §7 states about `docs/cli.md` and `commit-on-branch.sh` was confirmed in the current text.
- **Changed literals.** No test asserts on any literal the branch changed. The guard's `deny` reason is quoted only in an observed cell, deliberately left as it was. `G12_FR4_DEPARTURE` is consumed only by `grade-full-run.sh`. The `docs/cli.md §6` literals that `cli/test/watcher-placeholder-host.test.mjs` and `cli/test/sandbox-probe-gates-legs.test.mjs` assert are unchanged by design and named in §7 as roadmap items 32 and 33.
- **Mechanical sweeps.** No line-number anchors were added. No new exported symbol was added under any layer path. Tests: the branch adds no test and changes only one test-file header comment. `phases.parity` is `false`, so no parity review applies.

## Phase 2 Readiness — Ordered Fix List

None: this review files no fixable finding.

## Must Fix

None.

## Should Fix

None.

## Nice to Have

None.

## Intentional divergences to confirm

None: `phases.parity` is `false`.
