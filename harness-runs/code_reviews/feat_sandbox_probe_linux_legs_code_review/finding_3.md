### 3. The entry point's opening header line still says the probe measures the sandbox "on macOS"

**File:** `scripts/sandbox-probe.sh`, the header's first line, "measure the unattended sandbox on macOS: cut a throwaway probe clone"

**Severity:** Should Fix. **Layer:** general.

This branch makes the probe run on Linux too. Preflight refusal 2 now admits Linux (`scripts/lib/sandbox-probe/preflight.sh` → `sp_preflight`, check 2), and the same header's platform sentence was rewritten to *"macOS, and Linux in a local container (docs/development.md → Gate 15)"*.

The opening line was not changed. It still reads `# sandbox-probe.sh — measure the unattended sandbox on macOS: cut a throwaway probe clone, launch`. So the header contradicts itself: a maintainer who reads only the summary line, which is what an editor's file outline and `head` show, is told the script is macOS-only. Gate 15 in `docs/development.md` is now titled *"(macOS and Linux)"*, and the header should say the same.

**Fix.** In `scripts/sandbox-probe.sh`, replace the header's first line

```
# sandbox-probe.sh — measure the unattended sandbox on macOS: cut a throwaway probe clone, launch
```

with

```
# sandbox-probe.sh — measure the unattended sandbox on macOS and Linux: cut a throwaway probe clone, launch
```

Change nothing else. The next header line continues the sentence unchanged. No suite asserts on this line (`grep -rn 'measure the unattended sandbox' cli/test` finds none), and the fix edits no test file, so it runs no test.
