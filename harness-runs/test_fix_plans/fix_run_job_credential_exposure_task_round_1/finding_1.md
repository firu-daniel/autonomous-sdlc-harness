### 1. Shipped watcher comment trips the typos gate on the `PN1–PN3` row ids

**Site:** `cli/templates/scripts/autonomous-watcher.sh` — the env-scrub header comment, the bullet beginning `#   * IT IS HYGIENE THAT BLOCKS CASUAL READS`; the offending text is the quoted substring `` no-new-privileges`, PN1–PN3, NN1–NN2), and unverified on other images and `` (around line 455, navigation hint only).

**Failing test:** none — gate 6f shipped files pass typos (`scripts/check-typos.sh`, run by `scripts/run-gates.sh`)

**Failure, quoted from the log:**

```
  FAIL  6f shipped files pass typos (exit 1, 0 s)
        check-typos: cli/templates/scripts/autonomous-watcher.sh — PN
        check-typos: cli/templates/scripts/autonomous-watcher.sh — PN
run-gates: 1 failed, 24 passed
  - 6f shipped files pass typos
```

**Class:** new this round (round 1; no earlier log).

**Diagnosis.** `scripts/check-typos.sh` runs `typos 1.51.1` with its default dictionary over `cli/templates`, `plugin`, `schemas` and `cli/src`, and fails on any hit outside its keyed deliberate set (file + word). Task 4's commit (`48986b2a fix: Task 4 — Scrub session env in spawn_engine, act on push refusal`) added a comment to the shipped watcher template that cites the sandbox-record rows `PN1–PN3`. typos splits `PN1` and `PN3` into the token `PN` and flags it as a misspelling — once per id, which is why the log prints the same hit twice. `NN1–NN2` is not flagged. A grep of the shipped trees (`cli/templates`, `plugin`, `schemas`, `cli/src`) shows this comment line is the only occurrence of `PN1`/`PN3` there; the other occurrences live in `docs/sandbox-record.md` and `cli/test/`, which the gate does not scan. No test pins the comment's wording.

**Fix.** Reword the comment so it no longer spells the `PN` row ids, keeping its meaning and its pointer into the sandbox record. Name the legs rather than the rows, which `docs/sandbox-record.md` → `## 5.` already uses (`The runner-pid leg takes PN1–PN3 and the runner-privs leg takes NN1–NN2`). For example, replace

```
#     (docs/sandbox-record.md → `## 5. The Linux runner's PID namespace and
#     no-new-privileges`, PN1–PN3, NN1–NN2), and unverified on other images and
```

with

```
#     (docs/sandbox-record.md → `## 5. The Linux runner's PID namespace and
#     no-new-privileges`, its `runner-pid` and `runner-privs` legs), and
#     unverified on other images and
```

re-wrapping the following line(s) of that bullet as needed so the comment block's existing width is kept. Change nothing outside the comment.

Do **not** instead add `cli/templates/scripts/autonomous-watcher.sh|PN` to the deliberate set in `scripts/check-typos.sh`: that set is reserved for words a shipped file cannot avoid (exported identifiers, regex text, tool flags), and this one is avoidable prose.

- [ ] Reword the comment as above.
- [ ] Confirm with a grep that no `PN1`, `PN2` or `PN3` remains under `cli/templates`, `plugin`, `schemas` or `cli/src`.
