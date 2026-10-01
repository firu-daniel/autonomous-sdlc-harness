### Task 3 — Port the Markdown chunker (`chunk.py`)

**Goal:** Port `cli/src/retrieval/chunk.ts` so the same headings produce the same chunk keys, the same `path#heading` anchors, the same embedded `text` and the same sha256 change-signal hashes. The eval's labels resolve against those keys, so a chunker that splits differently would make every later recall number incomparable.

**Depends on:** Task 2, which provides `jscompat.py`, including `js_trim`. This task imports what it needs from there and adds no string-semantics helper of its own. If you need one, it belongs in `jscompat.py`. Raise a blocker rather than writing it here.

**Ported from:** `cli/src/retrieval/chunk.ts`: `DocChunk`, `ATX_HEADING`, `FENCE_OPEN`, `headingSlug`, `joinBody`, `makeChunk`, `chunkMarkdown`. Read it end to end, including the fold decision comment in the emission loop. Do not change it.

**Where this task stops.** This task delivers the chunker and its unit tests, pinned against expectations read off the TypeScript. The proof against the running TypeScript chunker over both eval corpora is Task 4's. `chunk_markdown` is consumed by Task 4's parity case and by Task 9's `refresh_index`, which call it with exactly the signature below.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/chunk.py` (new)
- `docs-retrieval-service/tests/test_chunk.py` (new)

**Work:**

- [ ] **The record and the entry point.** `@dataclass(frozen=True) class DocChunk(key: str, path: str, anchor: str, heading: str, text: str, body: str, hash: str)` carries the field names of the TypeScript interface, unchanged. `chunk_markdown(path: str, markdown: str) -> list[DocChunk]` returns chunks in document order. The module docstring carries `chunk.ts`'s rule verbatim in substance: *a chunk's identity is its path and heading anchor, and its change signal is the hash of its text*, plus the split and fold rules.
- [ ] **Line and regex semantics, JS's not Python's.** Split with `re.split(r"\r?\n", markdown)`, never `splitlines()`, which also splits on `\r`, `\v`, `\x1c`–`\x1e`, `\x85` and ` `. In the heading regex, JS's `.` excludes `\n \r    `, so spell it `[^\n\r  ]`. JS's unflagged `$` is end of input, so anchor with `\Z` (or `fullmatch`), never Python's `$`, which also matches before a trailing newline. A fence closes when `js_trim(line)` is at least the opening length and consists only of the fence character. A backtick fence whose remainder after the marker contains a backtick is not a fence. Blank-line tests in `joinBody` use `js_trim`.
- [ ] **`heading_slug(text, seen)` ported exactly.** Lower-case with `str.lower()`. Keep a code point when its `unicodedata.category` starts with `L` or `N` (JS `\p{L}` / `\p{N}`) or when it is space, `_` or `-`, and drop every other code point, backticks included. Turn each space into `-`. Repeats take `-1`, `-2`, …, skipping any suffixed form a literal heading already took, with the `seen` bookkeeping identical to `headingSlug`. Every ATX heading outside a fence, at any level, consumes a slug, and only `##` and `###` start a chunk. The title is the first `# ` line outside a fence, falling back to `posixpath.basename(path)`. The preamble chunk is emitted only when something other than the title line is in it. A bodiless `##` immediately followed by a `###` is folded, while an empty `##` or `###` with no child is still emitted. `heading_path` is spelled exactly as `makeChunk`'s callers spell it (`<title> > ## <h2>` and `<title> > ## <h2> > ### <h3>`, or `<title> > ### <h3>` with no parent).
- [ ] **The hash.** `text = f"{title}\n{heading_path}\n\n{body}"` and `hash = sha256(text as UTF-8).hexdigest()`. Node's `Hash.update(string)` encodes a lone surrogate as `U+FFFD`, so replace any lone surrogate with `"�"` before encoding. Python's `errors="replace"` writes `?` instead, which would silently change the hash. If the Unicode version behind `unicodedata` (Python 3.11 is 14.0) disagrees with Node's `\p{L}` / `\p{N}` on a character Task 4's corpora actually contain, Task 4 fails. That is a seam finding for Task 17, not something to paper over here.
- [ ] `test_chunk.py`: opens with the rule it enforces. It builds the same `guide` document `cli/test/docs-retrieval.test.mjs` builds (a fence hiding `## not a heading`, `### Offline` under `## Setup`, a second `## Setup`) and asserts:
  - the key set is `docs/guide.md`, `#setup`, `#offline`, `#usage` and `#setup-1`;
  - the `### Offline` `text` carries `Guide > ## Setup > ### Offline`;
  - a bodiless `##` wrapper over a `###` is folded, and an empty `##` with no child is kept;
  - a document whose only pre-heading line is its title emits no preamble;
  - a document with no `# ` line takes its basename as the title;
  - backticks and punctuation vanish from a slug;
  - the same document in CRLF and in LF yields identical keys and hashes;
  - one `hash` equals `hashlib.sha256` of its `text` computed in the test.

**Verification:**

- `tests/test_chunk.py` passes (subject to the story index's test-run note).
- `grep -n "splitlines\|\.strip()\|re\.\(M\|MULTILINE\)" docs-retrieval-service/src/harness_docs_retrieval/chunk.py` finds nothing. Each would be a Python-semantics substitution for a JS rule.
- Every whitespace rule `chunk.py` uses is imported from `jscompat.py`.
