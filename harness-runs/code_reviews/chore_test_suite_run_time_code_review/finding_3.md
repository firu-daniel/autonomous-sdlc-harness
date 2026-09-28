### 3. `measure-suite.sh`'s contract says the container runs "the timed loop of 3", but the container runs `--runs <k>`, default 1

**File:** `scripts/measure-suite.sh`, header `THE CONTRACT.` item 6: "The timed loop of 3". Line hint: 22.

**Problem.** Item 6 of the header contract says that inside the container "The timed loop of 3 follows". The code does not do that. The launcher passes `--runs "$runs"` into the container (`bash /in-script/measure-suite.sh --in-container --runs "$runs" --ref "$sha"`). `runs` defaults to `1`, and the container runs the same `while [ "$i" -le "$runs" ]` loops as host mode. The header's own item 3 and its `Usage:` block say `--runs <k>`, default 1, and Task 6's plan specifies exactly that ("the same timed loop Task 5 runs — `npm test` `k` times"). Item 6 is the one place that says otherwise.

It matters for acceptance item 1's follow-up. Someone who reads the header and then runs `bash scripts/measure-suite.sh --cpus 4`, the command `docs/development.md` gate 4 names, expects three container runs and gets one. So they get a single sample where the header promised the three-run evidence the story plan leaves to that follow-up.

**Fix.** In item 6, replace:

```
#      /home/node/work, committed once as a fresh repository, and `npm ci` runs. The timed loop of 3
#      follows, as `node`, with `container` in the <mode> slot and cpus= as the container reports it.
```

with:

```
#      /home/node/work, committed once as a fresh repository, and `npm ci` runs. Item 3's timed loops
#      follow, <k> runs each, as `node`, with `container` in the <mode> slot and cpus= as the
#      container reports it.
```

**Verification:** `grep -n "loop of 3" scripts/measure-suite.sh` prints nothing. `bash scripts/measure-suite.sh --in-container` on the host still exits 2 (a comment-only edit).
