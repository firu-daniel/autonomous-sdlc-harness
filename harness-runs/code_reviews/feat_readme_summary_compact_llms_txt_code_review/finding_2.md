### 2. `llms.txt`'s `## Quick start` section holds a numbered list that has no links, which the llmstxt.org file-list format does not allow

**File:** `llms.txt`, under `## Quick start`, at "1. Install the plugin:"

The task prompt (§3, item 1) asks for the llmstxt.org format: an H1, a blockquote summary, then "H2 sections that list links with a one-line description each". The acceptance criterion (item 3) repeats that `llms.txt` "follows the format". In that format, each H2 section is a *file list*, where every entry has the form `- [name](url): notes`. Free-form Markdown belongs in the details area between the blockquote and the first H2.

`## Quick start` has one conforming entry, `- [README.md](…): the full quick start…`, and then five numbered lines with no link. A tool that parses the file by the spec reads each H2 section as a list of links. It keeps the README link and drops the five steps, which are the only part of the quick start that `llms.txt` states itself.

**Fix.** Move the five numbered steps into the details area and leave `## Quick start` as a link list only.

- [ ] Delete these five lines, and the blank line before them, from under `## Quick start`:

  ```
  1. Install the plugin: `claude plugin marketplace add firu-daniel/autonomous-sdlc-harness`, then `claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness`.
  2. Wire your repository: `npx autonomous-sdlc-harness init`.
  3. Teach it the codebase: type `/harness-analyze` in an interactive Claude Code session opened on the repository, not in the terminal.
  4. Verify: `npx autonomous-sdlc-harness doctor`.
  5. Start the daemon: `npx autonomous-sdlc-harness daemon install`, then `npx autonomous-sdlc-harness daemon start`.
  ```

- [ ] Insert them, byte-identical, between the paragraph opening "This file is for a language model choosing which document of this repository to read." and `## The two halves`. Put a blank line before them, then the lead-in line `The quick start, in five steps:`, then a blank line, then the five steps, then a blank line before `## The two halves`.

`## Quick start` then holds only the `README.md` link entry. The gate's structural rules still hold: line 1 is unchanged, the blockquote still comes before the first `## `, and the moved lines contain no `](`.

**Verification.** `bash scripts/check-llms-txt.sh` exits 0. Every non-blank line under each `## ` heading starts with `- [`.
