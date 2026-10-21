### 1. TD1's verdict says "TD2 confirms it", but TD2 has not been run

**File:** `docs/sandbox-verification.md` (`## 5. Failures and their follow-ups` → `**The temporary directory.**` → row TD1, Verdict cell) — "so the same three calls fail sandboxed as F2 did; TD2 confirms it."

TD1 is an **unsandboxed** measurement. Its Verdict cell goes past what it measured. It says the bare `mktemp`, the bare `mktemp -d` and `mktemp -t` "fail sandboxed as F2 did", and that "TD2 confirms it". But TD2, two rows down, is **not run — owed**, and F2 measured only the `-t` call (`log="$(mktemp -t harness-gates)"`). Nobody has run the bare and `-d` forms sandboxed. So the cell states an inference as a measured, confirmed result.

`.claude/context/conventions.md` → `## Documents of record` requires a measured fact to state what was measured, the command and the exact message. The story plan names this exact failure as its third top risk: "a record that claims a sandboxed or Linux result nobody took". The cost is concrete. A maintainer reading "TD2 confirms it" can treat TD2 as settled and skip the owed manual run. TD2 is the only row that would show whether the bare forms really fail sandboxed.

**Fix:** in TD1's Verdict cell, replace this sentence:

```
The sandbox limits where a write may land, not which directory `mktemp` picks, so the same three calls fail sandboxed as F2 did; TD2 confirms it.
```

with:

```
The sandbox limits where a write may land, not which directory `mktemp` picks, so the bare and `-d` calls are expected to fail sandboxed as the `-t` call did in F2. That is an inference from this row and F2, not a measurement: TD2, owed, is the row that measures it.
```

Leave the rest of the row as it is. No test file covers this document, so the fix runs no test.
