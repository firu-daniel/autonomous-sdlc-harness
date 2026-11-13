# Lessons ledger

**What this is.** One-line rules distilled from defects that got past every automated gate on a branch and were caught only by a human's hands-on review of the finished work. An agent that plans work or grades it reads this file **before it starts** — before a plan is drafted, before a review is graded — and an entry here carries the same force as a rule in one of the project's own conventions documents, so a plan that re-plans a lesson fails its review and the agent writing it checks its own draft against the ledger before handing it over. The other end of the loop is the fix step: the agent that turns a hands-on review into a fix plan is the ledger's only writer, and it appends there once per review round. The file lives in the run-artifact tree rather than beside the agent configuration so that an unattended headless run can append to it, and it is resolved against the checkout the run is executing in — never against a fixed path, or a run in a second working copy appends its lesson to the wrong branch.

**This ledger is appended to and never rewritten.** A new lesson is added as one line under the section it belongs to; a rule taught again by a second branch gains that branch in its attribution instead of being duplicated, so grep before adding; and a rule later codified into a conventions document keeps its line here with a pointer to that document appended. Nothing is edited away, reordered or truncated: the file accumulates over the whole life of the project, it is the only copy of that history, and an overwrite destroys it.

**Entry shape.** One line per lesson — the rule in the imperative, then the branches that taught it:

```markdown
- **[the rule, in one line]** _(taught by: [branch], [branch])_ — codified in [conventions document] §[section]
```

---

## Layer ownership

_The entry below is a worked example, not a lesson from this project — delete it, or replace it with the project's own first lesson._

- **A unit in the outermost layer never reaches the innermost one directly: it calls through the layer between, so the logic has one place to live and one place to be tested.** _(taught by: feat/recent_searches_panel, feat/search_result_pagination)_ — codified in the layering conventions document §Call flow

_[Add headings of your own as themes emerge — one per recurring theme — and file each new lesson under the heading it belongs to.]_

_Written by `autonomous-sdlc-harness init`, and yours from there on: a re-run never touches a ledger that already exists._
