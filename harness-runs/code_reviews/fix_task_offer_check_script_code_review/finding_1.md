### 1. The shipped `task-offer-check.sh` header names this project's issue `#219`, which no adopter can resolve

**File:** `cli/templates/scripts/task-offer-check.sh` (the `# THE ACCEPTED STRICTER CASE.` header paragraph): "Until #219 lands, a Linux run copy can carry leftover". The same bytes are in the self-adopted copy, `scripts/task-offer-check.sh`, which must stay byte-identical to the template.

`cli/templates/scripts/` is what a future adopter receives (`.claude/context/cli.md` → `## What this layer owns, and what it is not`). Each outer-loop script is copied verbatim and written `create-if-absent`. `#219` is an issue number in this project's own tracker. In an adopter's repository, `#219` either names nothing or names one of the adopter's own issues, which is unrelated. So a reader of the adopter's copy who follows the reference ends up at the wrong issue. "Until #219 lands" is also a deferral whose end the adopter's copy never sees, because a re-run of `init` keeps an existing script. No other file under `cli/templates/scripts/` cites an issue number: `git grep -n -E '#[0-9]{3}\b' -- cli/templates/scripts` reaches only this line. The library this script sources cites the measurement document instead (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_target_check_var`'s header, "`docs/sandbox-verification.md`, row CL5"). The phrase "the inline one-liner this replaces" has the same audience problem: an adopter who wired after this branch never had a one-liner.

**Fix:** in **both** `cli/templates/scripts/task-offer-check.sh` and `scripts/task-offer-check.sh`, replace the whole `# THE ACCEPTED STRICTER CASE.` paragraph. It runs from that line down to the line ending "than the raw `alternates` prefix.", and the `#` line after it stays. The replacement is:

```sh
# THE ACCEPTED STRICTER CASE. The clone arm goes through
# `hr_clone_target_check_var`, so it also refuses a clone with a planted
# `commondir`, `config.worktree` or `objects/info/http-alternates`, a
# non-directory `objects`, or a `.git/config` key outside the clone allow-list
# (a hand-run `git push -u`'s `branch.<name>.*`), where the inline fence test
# this script replaced offered. On a Linux host a run copy can carry leftover
# `commondir` / `http-alternates` placeholders after a killed session, and a
# `config.worktree` whose cause is not established (`docs/sandbox-verification.md`,
# row AP2), so the fence is silent there, as the wrappers already refuse that
# copy. A candidate whose `.git` is a symbolic link is refused, and the printed
# path is the canonical main checkout rather than the raw `alternates` prefix.
```

The change is to comment lines only, so no behaviour changes. After the edit, `cmp scripts/task-offer-check.sh cli/templates/scripts/task-offer-check.sh` must print nothing and exit 0. Leave `scripts/task-offer-check.sh` at mode `100755`.
