### Task 2 — Add a standing check over the eval's committed query sets and transcripts, as gate 6e

**Goal:** Before any real-catalog material is committed, extend the tree's self-containment gate so it covers what this branch adds — a query set over a private catalog and ten agent transcripts — with a check that prints nothing on a clean tree and names every hit otherwise, and record in `docs/development.md` how the cleared material stands against both halves of gate 6.

**Why this task exists and ships early.** The task prompt's `## Publication clearance` requires that *"the existing path/identifier checks cover what this branch added, committed transcripts included"* and that they be **extended rather than worked around**. The existing mechanical half, gate `6a no machine paths`, is `grep -rn "$HOME"` — it catches only the home path of whoever runs it, so a transcript ref under `/tmp`, `/private/var` or another user's home, a `..`-climbing path, or a credential passes it; and `6a` is already red in this checkout by design, so a new hit there is invisible to a *"no new failure"* reading. The adversarial half — roadmap item 11's identifier sweep — ran once and does not recur (`docs/development.md` §6 row 11). Shipping the new check first means every later commit of a query set (Tasks 12–15) and a transcript (Task 17) lands under it.

### Targets

- `scripts/check-eval-artifacts.sh` (new) — the check.
- `scripts/run-gates.sh` — gate `6e`, graded by empty output.
- `docs/development.md` → `## 5. Verifying a change`, gate 6's paragraphs.

**Work:**

- [ ] `check-eval-artifacts.sh`: `#!/usr/bin/env bash`, a `# check-eval-artifacts.sh — …` header stating what it scans, what it refuses and why `6a` does not already cover it, and `set -u`. It scans the eval's **data** artifacts only — **`evals/docs-retrieval/queries/`**, **`evals/docs-retrieval/transcripts/`** (absent until Task 17 — a missing directory is skipped silently, never an error line) and **`evals/docs-retrieval/arm-a/sample-transcript.json`** — and never the scripts or prose beside them (`run-arm-a.sh` and `docs/retrieval-eval.md` legitimately document an illustrative `/tmp/…` output path, which `6a` already judges), resolved from the script's own `${BASH_SOURCE[0]}` repository root, with `grep -rnE` over these shapes: an absolute POSIX path under `/Users/`, `/home/`, `/private/`, `/tmp/`, `/var/`, `/Volumes/` or `/opt/`; a Windows drive path; a path segment beginning `../`; the literal `HARNESS_EVAL_CORPUS_ROOT=` (an assignment carries the value); credential shapes `sk-ant-`, `ghp_`, `github_pat_`, `xox[bp]-`, `AKIA[0-9A-Z]{16}`; the keys `session_id`, `"cwd"`, `api_key`; and an e-mail address. It prints each hit as `path:line:match` and nothing else, and exits 0 either way — the gate grades output, not status. No pipe, no `$(…)` in any command it documents.
- [ ] `run-gates.sh`: add `gate_silent "6e no machine-local or credential material in eval artifacts" bash scripts/check-eval-artifacts.sh` after `6d`, with a comment saying why `6a` does not cover it (the two sentences above).
- [ ] `docs/development.md` §5, gate 6: add `6e` beside `6a`–`6d` with what it scans and why; and in the paragraph that names the adversarial half (roadmap item 11), add that the **real-catalog query set and its transcripts carry Expause product names and Vite documentation references deliberately**, under the operator's publication clearance recorded in this branch's task prompt, so they are not item-11 findings; what item 11 swept for — a location, a credential, an account identifier — is what `6a` and `6e` hold the tree to.

**Verification:**

- `bash scripts/check-eval-artifacts.sh` prints nothing on the tree as it stands (the committed `fixture-catalog.jsonl`, `self-docs.jsonl` and `arm-a/sample-transcript.json` are clean).
- Plant a scratch copy of `arm-a/sample-transcript.json` with one ref rewritten to an absolute `/tmp/` path and one `usage` key renamed `session_id`, point the scan at it by copying it under `evals/docs-retrieval/queries/` **temporarily**, confirm both hits are printed with their line numbers, then delete the planted file and confirm the script is silent again. The planted file is never committed.
- `bash scripts/run-gates.sh`, run without a pipe, prints `ok` for `6e` and no failure that was not already failing before this task.
