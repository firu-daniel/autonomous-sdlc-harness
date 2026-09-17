### 1. `check-llms-txt.sh` passes a non-normalized link path (`..`, `.` or an empty segment) into a path `publish-main.sh` removes

**File:** `scripts/check-llms-txt.sh`, the per-link loop, between the `"names no path"` check and the `for entry in "${removed[@]}"` loop.

**The problem.** The script says it fails "when a link in `llms.txt` would not resolve on `main`". Its two legs do not compare the same string:

- The `removed_paths` leg compares the **raw** `<path>` text from the URL: `case "$path" in "$entry" | "$entry"/*)`.
- The tracked leg hands the same text to `git ls-files -- ":(literal)$path"`, and git **normalizes** a pathspec before matching. It resolves `.` and `..` segments.

So a path that reaches a removed entry through a `..` or a leading `./` misses the first leg. The second leg then finds it tracked, and the link passes. Measured on this tree:

```
$ git ls-files --error-unmatch -- ':(literal)docs/../scripts/run-gates.sh' ':(literal)./scripts/run-gates.sh' ':(literal)cli/../harness.config.json'
harness.config.json
scripts/run-gates.sh
```

Neither `docs/../scripts/run-gates.sh` nor `./scripts/run-gates.sh` equals `scripts` or starts with `scripts/`. `cli/../harness.config.json` does not equal `harness.config.json`. So all three links would pass gate 6c:

- `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/../scripts/run-gates.sh`
- `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/./scripts/run-gates.sh`
- `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/cli/../harness.config.json`

**Runtime symptom.** A client resolves the dot-segments before it sends the request (RFC 3986 §5.2.4). The request is then `…/blob/main/scripts/run-gates.sh` or `…/blob/main/harness.config.json`. Both paths are in `removed_paths`, so both return a 404 on `main`, and gate 6c still reports `ok`. No link in `llms.txt` does this today. But the gate exists to catch exactly this kind of link, and contract item 4 says "no target has any other form".

This is not code-review Finding 1. That finding covered a normalized `tree` path whose files are all removed. This one covers a path the removed-paths comparison never recognizes.

**Fix.**

- [ ] In `scripts/check-llms-txt.sh`, directly after this block:

```bash
    if [ -z "$path" ]; then
      finding "$target" "names no path"
      continue
    fi
```

insert:

```bash
    case "/$path/" in
      *"//"* | *"/./"* | *"/../"*)
        finding "$target" "'${path}' is not a normalized path (an empty, '.' or '..' segment)"
        continue
        ;;
    esac
```

Wrapping the path in `/…/` makes a leading, trailing or inner empty segment show up as `//`, and a `.` or `..` segment show up as `/./` or `/../`, wherever it sits. The two `tree` links in `llms.txt` today, `plugin` and `cli`, have no trailing slash, so they still pass.

- [ ] In the same file's header, `THE CONTRACT.` item 4, change `No target carries `#` or `?`, and no target has any other form.` to `No target carries `#` or `?`, no <path> has an empty, `.` or `..` segment, and no target has any other form.`
- [ ] In `docs/development.md` §5, in the paragraph that opens "**A third command checks that every link in `llms.txt` resolves on `main`**", change "no target carries `#` or `?` or has any other form" to "no target carries `#` or `?` or has any other form, and no `<path>` has an empty, `.` or `..` segment".

**Verification.** Write a probe file at `harness-runs/scratch/llms-probe.txt`. That path is untracked. Give it this content:

```
# autonomous-sdlc-harness

> probe

## Probe

- [a](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/../scripts/run-gates.sh): probe
- [b](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/./scripts/run-gates.sh): probe
- [c](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/cli/../harness.config.json): probe
```

Run `bash scripts/check-llms-txt.sh harness-runs/scratch/llms-probe.txt`. It must exit 1 and print three "is not a normalized path" lines. Before the fix it exits 0. Delete the probe. Then run `bash scripts/check-llms-txt.sh` with no argument and confirm it still exits 0.
