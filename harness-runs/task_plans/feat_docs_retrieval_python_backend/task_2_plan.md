### Task 2 — Add the JS-semantics helper module and port corpus enumeration (`corpus.py`)

**Goal:** Give the package one module that reproduces the JavaScript string and number semantics the TypeScript retrieval code relies on, so that no later module re-derives a rule. Then port `cli/src/retrieval/corpus.ts` on top of it, so both backends enumerate exactly the same file set.

**Depends on:** Task 1, which creates the package, `errors.py` and the test layout under `docs-retrieval-service/tests/`.

**Ported from:** `cli/src/retrieval/corpus.ts` (`corpusFiles`, `markdownUnder`, `toRepoRelative`), `cli/src/core/repoPaths.ts` (`normalizeRepoDir`) and `cli/src/core/paths.ts` (`insideRepo`). Read them; do not change them.

**Where this task stops.** Chunking is Task 3's. The comparison against the live TypeScript `corpusFiles` over the eval's two corpora is Task 4's. This task's tests pin the behaviour against hand-written expectations taken from reading the TypeScript, and Task 4 then proves it against the running code. The helpers below are consumed by Task 3 (`chunk.py`), Task 8 (`search.py`'s snippet and score rendering) and Task 10 (`service.py`'s argument refusals). Those tasks import them and never write a second copy.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/jscompat.py` (new)
- `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` (new)
- `docs-retrieval-service/tests/test_jscompat.py` (new)
- `docs-retrieval-service/tests/test_corpus.py` (new)

**Work:**

- [ ] `jscompat.py`. Its header's rule: *a JavaScript string or number operation the TypeScript backend performs is reproduced here exactly, or a byte difference appears that has nothing to do with retrieval.* Exported functions:
  - `JS_WHITESPACE: str`: exactly ECMAScript's WhiteSpace plus LineTerminator set, which is `\t \n \v \f \r`, space, `     `–`          　 ﻿`. Python's `\s` differs: it adds `\x1c`–`\x1f` and `\x85`, and lacks `﻿`.
  - `js_whitespace_runs(s: str, repl: str) -> str`: `s.replace(/\s+/g, repl)`.
  - `js_trim(s: str) -> str` and `js_trim_end(s: str) -> str`.
  - `utf16_len(s: str) -> int` and `utf16_slice(s: str, start: int, end: int) -> str`: JS `.length` and `.slice` in UTF-16 code units. A cut inside a surrogate pair yields the same lone surrogate JS yields; Python `str` can hold one, so round-trip through `surrogatepass`.
  - `utf16_sort_key(s: str) -> bytes`: `s.encode("utf-16-be", "surrogatepass")`, which is JS's `<` code-unit order.
  - `js_to_fixed(x: float, digits: int) -> str`: `Number.prototype.toFixed`. It rounds the **exact** binary value half-up, away from zero, through `decimal.Decimal(x).quantize(…, ROUND_HALF_UP)`. Python's `f"{x:.3f}"` is round-half-even and turns `0.0625` into `0.062` where JS gives `0.063`. `-0.0` renders without a sign, and `NaN` / `Infinity` render as JS renders them.
  - `json_stringify_str(s: str) -> str`: `JSON.stringify` of a string. Non-ASCII is left raw, control characters take the short or `\u00xx` (lowercase) escapes, and a lone surrogate is escaped as `\udxxx`.
  - `js_object_keys(keys: Sequence[str]) -> list[str]`: `Object.keys` order. Canonical array-index strings (`"0"` … `"4294967294"`) come first, ascending numerically, then every other key in insertion order.
- [ ] `test_jscompat.py`: opens with the rule above. It pins each helper against JS-computed literals: `js_to_fixed(0.0625, 3) == "0.063"`, `js_to_fixed(0.1875, 3) == "0.188"`, `js_to_fixed(1/3, 3) == "0.333"`, `js_to_fixed(-0.0, 3) == "0.000"`; `js_trim("﻿ a  ") == "a"` and `js_trim("\x1ca") == "\x1ca"`; `utf16_len("😀") == 2`; `utf16_slice("a😀b", 0, 2)` ends in the lone high surrogate; `utf16_sort_key` orders `"😀"` before `"￿"`; `json_stringify_str('a"\n') == '"a\\"\\n"'`; `js_object_keys(["b", "1", "a", "0"]) == ["0", "1", "b", "a"]`. Take each literal from what Node prints for the same expression. The header says so, so a reviewer can re-derive it.
- [ ] `corpus.py`. Exported functions:
  - `normalize_repo_dir(value: str) -> str`, ported byte for byte.
  - `inside_repo(repo_root: str, candidate: str) -> bool`. Use `os.path.abspath`, never `Path.resolve`: JS `path.resolve` does not follow symlinks, and `Path.resolve` does.
  - `@dataclass(frozen=True) class CorpusFiles(files: tuple[str, ...], warnings: tuple[str, ...])`.
  - `corpus_files(repo_root: str, config: Mapping[str, Any]) -> CorpusFiles`. `config` carries the **same keys `harness.config.json` carries**: `docs.root` and `layers[]` with `name` and `conventions`. There is no mapping layer and no renamed key. Its rule, quoted from `corpus.ts`'s header: the corpus is exactly every Markdown file under `docs.root` plus every conventions document `layers[]` names, and nothing here throws on a missing path. It applies no gate.
  - The recursion mirrors `markdownUnder`. It descends `entry.is_dir(follow_symlinks=False)` only, so a symlinked directory is not descended. It takes a `*.md` that is `entry.is_file(follow_symlinks=False)`, or a symlink whose target `os.path.isfile`.
  - Results are made repo-relative with forward slashes, de-duplicated, and sorted by `utf16_sort_key`.
  - The four warning strings are copied **verbatim** from `corpus.ts`, `docs.root is not set, so no documentation directory is indexed` and its three siblings, with the same interpolations.
  - `read_corpus_file(repo_root: str, path: str) -> str` is the one reader of a corpus file, mirroring `readFileSync(join(repoRoot, path), 'utf8')`: `open(…, encoding="utf-8", errors="replace", newline="")`. That gives no newline translation and no BOM stripping. Task 4's parity case and Task 9's refresh both read through it.
- [ ] `test_corpus.py`: builds throwaway repositories under `tmp_path`, never inside this checkout. It asserts:
  - an unset `docs.root` yields its warning plus the conventions documents;
  - a `docs.root` of `../outside` and a non-directory each yield their warning;
  - a missing conventions document and one resolving outside the repository each yield theirs;
  - a conventions document that is also under `docs.root` appears once;
  - a symlinked directory is not descended, and a symlinked `.md` file is included;
  - a `layers[]` entry with an empty or non-string `conventions` is skipped silently;
  - the order is code-unit order;
  - `read_corpus_file` returns a file written with `\r\n` line endings and a leading BOM unchanged.

**Verification:**

- `tests/test_jscompat.py` and `tests/test_corpus.py` pass (subject to the story index's test-run note).
- Every warning string in `corpus.py` is found verbatim by a grep of `cli/src/retrieval/corpus.ts`, with its `${…}` interpolations read as the Python f-string holes.
- `grep -n "Path(.*).resolve\|\.resolve()" docs-retrieval-service/src/harness_docs_retrieval/corpus.py` finds nothing. Symlink semantics stay JS's.
