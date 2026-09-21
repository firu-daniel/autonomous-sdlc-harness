### Task 4 — Heading chunker and corpus enumeration

**Goal:** Turn the second brain into chunks. The corpus is every Markdown file under `docs.root` plus every conventions document `layers[]` names, and each file is split at its `##` and `###` headings. Every chunk carries its document title and heading path in its text, and stores its path, heading anchor and content hash as metadata.

**Depends on:** Task 1, which exports `retrievalApplies(config: HarnessConfig): boolean` from `cli/src/config/model.ts`. The corpus function reads `config.docs?.root` and `config.layers[].conventions`, and does not re-check the gate itself. Its callers, Tasks 6 and 8, do that.

**Where this task stops.** Pure functions over the filesystem: this task reads Markdown and returns data. It embeds and stores nothing (Task 5). The chunk shape below is the interface Task 5 persists, and Task 7 renders `path` and `anchor` as `path#heading`.

### Targets

- `cli/src/retrieval/chunk.ts` (new).
- `cli/src/retrieval/corpus.ts` (new).

**Work:**

- [ ] `chunk.ts`: export the chunk shape:

  ```ts
  interface DocChunk {
    readonly key: string;        // `${path}#${anchor}`, or `path` alone for the preamble; unique per corpus
    readonly path: string;       // repo-relative, forward slashes
    readonly anchor: string;     // GitHub-style heading slug, '' for the preamble
    readonly heading: string;    // the heading text as written, '' for the preamble
    readonly text: string;       // what is embedded and BM25-indexed
    readonly body: string;       // the section's own lines, for the snippet
    readonly hash: string;       // sha256 hex of `text`
  }
  ```

  Export `chunkMarkdown(path: string, markdown: string): DocChunk[]`. The **title** is the first `# ` line, falling back to the file's basename. A new chunk starts at every `## ` or `### ` line outside a fenced code block (track ```` ``` ```` and `~~~` fences). A `###` section is its own chunk and is not part of its parent `##` chunk. The `text` is `` `${title}\n${headingPath}\n\n${body}` ``, where `headingPath` is `title > ## parent > ### child` in document order. Content before the first `##` is the preamble chunk, emitted only when it is non-blank after removing the title line. A section whose body is blank is still emitted, because its heading is content.
- [ ] `chunk.ts`: the anchor slug follows GitHub's rule. Lower-case the text. Strip every character that is not a letter, a digit, a space, a hyphen or an underscore, and remove backticks. Replace each space with `-`. A repeated slug within one file gets `-1`, `-2`, … in order. Give the function a doc comment, because `path#heading` is the citation an agent then opens.
- [ ] `corpus.ts`: export `corpusFiles(repoRoot: string, config: HarnessConfig): { files: readonly string[]; warnings: readonly string[] }`. It recursively lists `*.md` under `normalizeRepoDir(config.docs?.root)` (`cli/src/core/repoPaths.ts`), skipping symlinked directories. It adds each `layers[].conventions` value that exists and is a file. It de-duplicates, sorts in code-unit order, and returns repo-relative forward-slash paths. An absent `docs.root` directory, or a conventions document that is missing, becomes a warning line, never a throw: the corpus is navigation, and one missing file must not take the tool down. A path resolving outside `repoRoot` is skipped with a warning (`cli/src/core/paths.ts` → `insideRepo`).
- [ ] Both modules open with the required header comment, *"The rule this module exists to enforce"*. For `chunk.ts` the rule is that a chunk's identity is its path and anchor and its change signal is its hash, which is what makes refresh incremental. For `corpus.ts` it is that the corpus is exactly the docs root plus the configured conventions documents.

**Verification:**

- `bash scripts/typecheck.sh` exits zero.
- The behaviour is asserted through the compiled CLI in Task 6's suite, whose fixture document has a preamble, two `##` sections, a `###` under one of them, a fenced block containing a `## ` line, and a duplicated heading. Task 6 asserts the chunk count that shape implies (preamble 1 + `##` 2 + `###` 1 + duplicate 1, with the fenced line not a chunk), so a fenced heading counted as a section fails there.
