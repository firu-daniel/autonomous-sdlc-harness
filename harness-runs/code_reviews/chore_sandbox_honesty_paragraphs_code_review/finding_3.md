### 3. The whiteboard's prompt-data paragraph puts "every command the run executes" inside the sandbox, the four excluded scripts included

**File:** `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` (the paragraph opening **The prompt is data, not instruction.**) — "the OS-level sandbox around every command the run executes"

Task 4 added the sandbox to the list of containment layers in this paragraph as *"the OS-level sandbox around every command the run executes"*. Two things in the record say otherwise. Its scope is Bash commands, not every command. And four scripts the run executes are excluded from it and run with full access: the main checkout's `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` and `launch-sandboxed-gates.sh` (`docs/sandbox-record.md` → `## 2. What runs outside the sandbox, and why`). The same file's `**5. The sandbox**` row, rewritten in the same task, states the exception (*"bar the scripts the profile excludes from it"*). This paragraph drops it.

No reader decision rests on this paragraph alone, because the row above it carries the exception. The sentence is still stronger than the record.

**Fix:** in that paragraph, replace

```
the OS-level sandbox around every command the run executes,
```

with

```
the OS-level sandbox around every Bash command the run executes, bar the four scripts it excludes,
```

Change nothing else in the paragraph. This is a prose-only edit to a `plugin/docs/` file, so it owes no test run.
