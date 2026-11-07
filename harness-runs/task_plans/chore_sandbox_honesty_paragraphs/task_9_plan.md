### Task 9 — Add the paragraph on what the sandbox changes after `docs/outer-loop-verification.md` §3's measurement

**Goal:** `docs/outer-loop-verification.md` → `## 3. The allow/deny surface` keeps its 2026-09-03 measurement exactly as recorded — a probe's `git branch -D` ran where the same words as a command were refused — and gains one following paragraph that says what the unattended sandbox, which landed after that drive, changes about it and what it does not, with no claim stronger than `docs/sandbox-record.md`.

**This is a catch-all task** (`path` `"."`): its implementer reads every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured, the command and the exact message; a later version that behaves differently is detectable rather than merely surprising, which is why the existing measurement is not edited.

**What the record says, and what is only derived** (`docs/sandbox-record.md`):

- §1: every Bash command and every process it starts is inside the sandbox, so a probe run through `scratch-run.sh` in an unattended run is too.
- §4 `scratch` leg: SR1 and SR2 **pass** on macOS and in the Linux container — the runner ran the probe, and a write outside the sandbox's roots from inside it was refused.
- §2: CS2 **pass** — the main checkout's whole `.git` refused to a sandboxed command; CL4 **pass** — a sandboxed git works in a clone, its own refs included.
- Not driven: §3's legs under the sandbox. So a probe's deletion of a branch in the **run copy** is, by CL4, not something the sandbox stops, and one aimed at the **main** checkout's refs is, by CS2, refused — both **derived**, neither re-driven. The `pre-push` hook's ranking is unchanged.

### Targets

- `docs/outer-loop-verification.md` → `## 3. The allow/deny surface`, immediately after the paragraph **The consequence, stated as the measurement.**

**Work:**

- [ ] Leave **The consequence, stated as the measurement.** and every table and paragraph before it byte-identical.
- [ ] Insert one paragraph after it, led by a bold sentence such as **What the sandbox changes, stated against the measurement rather than over it.** It says: the drive above predates the unattended profile's sandbox and ran no sandbox; under that profile a probe is a Bash process inside it (record §1), held to its write roots and network allowlist (SR2, **pass**); the deny floor still binds only command strings, so inside the write roots the probe still reaches what the floor withholds — a `git branch -D` against the run copy's own refs is not stopped by the sandbox (derived from CL4, not re-driven), while a write into the main checkout's `.git` is refused (derived from CS2, not re-driven); with `sandbox.optOut` taken the measurement above stands as it is; the `pre-push` hook still ranks as the plugin's whiteboard ranks it; and what the sandbox contains and every residual are [`sandbox-record.md`](sandbox-record.md) §1 and §6.

**Verification:**

- `git diff -- docs/outer-loop-verification.md` shows added lines only, all inside §3, after **The consequence, stated as the measurement.**
- Every *derived* in the new paragraph is labelled as such, and every *measured* claim names its row (SR2, CS2, CL4) as `docs/sandbox-record.md` grades it.
- `git grep -n -F "sandbox-record.md" -- docs/outer-loop-verification.md` finds the new pointer.
