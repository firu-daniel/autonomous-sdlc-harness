### 3. The watcher header points at "JOB MODE above", but that section is below

**File:** `cli/templates/scripts/autonomous-watcher.sh`, header section `# THE WATCHER'S GIT IN A RUN'S COPY.`, the last bullet: "IN JOB MODE, the watchdog's job-surfaces check runs `npx` outside the" / "checkout (JOB MODE above)."

**The problem.** The header section `# JOB MODE.` comes after `# THE WATCHER'S GIT IN A RUN'S COPY.` in the file. The bullet still sends the reader upward to find it. No other cross-reference in this header to that section carries a direction word: the others read "see JOB MODE", "(JOB MODE)" or a bare "JOB MODE)".

**Fix.** Replace `checkout (JOB MODE above).` with `checkout (see JOB MODE).`. Do the same for the identical `(JOB MODE above)` in this bullet if any copy of it appears elsewhere in the header. A `grep -n "JOB MODE above"` over the file finds every one.

`cli/test/outer-loop-scripts.test.mjs` compares the written script with the template byte for byte, so it needs no change: the template is the copy that changes.
