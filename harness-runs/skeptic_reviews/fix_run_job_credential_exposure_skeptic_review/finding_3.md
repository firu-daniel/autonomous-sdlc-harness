### 3. The whiteboard's new citation of the job's credential design names `docs/remote-execution.md` with no anchor, though the section it means has one

**Site:** `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The prompt is data, not instruction.**, the substring "the job's credential design is its `docs/remote-execution.md`".

**Problem.** This branch rewrote the paragraph (Task 7) and added that citation. `.claude/context/plugin.md` → `## Citation` says: "Anything outside the plugin is cited by its repo-relative path plus, where one exists, a symbol anchor". An anchor exists here. The design the sentence means is the bold-led block **The job's credential design.** under `docs/remote-execution.md` → `## 11. Security`. That block calls itself the one place "where it is decided and argued; every other document, and every other section of this one, cites it". Every other citer in `docs/` names it as `§11, **The job's credential design.**`.

`docs/remote-execution.md` is a document of more than 1,000 lines. A reader following the bare path has to search the whole file for the design. A citation without its anchor also does not fail loudly if the block is renamed or moved.

The paragraph's other two new citations already carry anchors: `docs/watcher.md` → `### The session's environment` and `docs/sandbox-record.md` → `## 5. The Linux runner's PID namespace and no-new-privileges`. Both resolve.

**Fix.** In `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The prompt is data, not instruction.**, replace

```
the job's credential design is its `docs/remote-execution.md`)
```

with

```
the job's credential design is its `docs/remote-execution.md` → `## 11. Security`, **The job's credential design.**)
```

Change nothing else in the paragraph. Use no `${CLAUDE_PLUGIN_ROOT}` path, because the file is outside the plugin, and add no line number.

No test changes. This is a documentation edit only, so the fix runs no test.
