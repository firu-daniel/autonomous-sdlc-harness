### 5. The module's platform posture says CL5 shows the alternates file "refused", but CL5 measures a sandboxed write-open, not a read

**File:** `plugin/instructions/main_repo_resolution.md` → `## What this repeats of the outer loop's clone check, and what it drops` → **Platform posture.** — "row CL5 shows the alternates file refused on macOS"

`docs/sandbox-verification.md` row CL5 is a write probe. Its targets are "Every write inert…", and its result is **Refused** for "opening `objects/info/alternates`" as a write target. The module's paraphrase drops the word *write*. An agent applying `## The fallback` reads this section too. It can take the sentence to mean that F2's own `Read` of that file is refused on macOS, which contradicts F2, which reads the file. The point of the sentence is that the file is write-protected there and unmeasured on Linux. `docs/sandbox-verification.md`'s own dated note on this branch says it correctly: "CL5 shows the sandbox refuses a sandboxed command's write-open of that file on macOS".

**Fix:** in that **Platform posture.** bullet, replace `` `docs/sandbox-verification.md` row CL5 shows the alternates file refused on macOS; `` with:

```markdown
`docs/sandbox-verification.md` row CL5 shows a sandboxed command's write-open of the alternates file refused on macOS;
```

Leave the rest of the bullet unchanged.
