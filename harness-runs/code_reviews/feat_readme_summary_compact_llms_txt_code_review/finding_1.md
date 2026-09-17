### 1. `check-llms-txt.sh` passes a `tree/main` directory link that will be empty on `main`

**File:** `scripts/check-llms-txt.sh`, the `tree` branch of the per-link loop, at "is not a tracked directory"

The script promises to "fail when a link in `llms.txt` would not resolve on `main`". For a `…/tree/main/<path>` link it runs two tests:

1. The `removed_paths` loop fails the link only when `<path>` equals an entry or sits under one.
2. `git ls-files -- ":(literal)$path/"` must list something.

Neither test catches a directory that is tracked on `dev` but whose tracked files all sit under `removed_paths` entries. `publish-main.sh` removes every file in such a directory, so it does not exist on `main`, yet the link passes both tests.

This tree already has one such directory. `git ls-files .github` lists `.github/FUNDING.yml` and `.github/workflows/publish-main.yml`, and `.github/workflows/publish-main.yml` is a `removed_paths` entry. So a link to `https://github.com/firu-daniel/autonomous-sdlc-harness/tree/main/.github/workflows` passes gate 6c but returns a 404 on `main`. No link in `llms.txt` hits this today. The gate is still weaker than its documented contract.

**Fix.** In the `else` arm (the `tree` kind), count the tracked files under `<path>/` that no removed entry covers, and fail when there are none. Replace the current `else` arm:

```bash
    else
      if [ -z "$(git ls-files -- ":(literal)$path/")" ]; then
        finding "$target" "'${path}' is not a tracked directory"
      fi
    fi
```

with:

```bash
    else
      tracked_under="$(git ls-files -- ":(literal)$path/")"
      if [ -z "$tracked_under" ]; then
        finding "$target" "'${path}' is not a tracked directory"
      else
        surviving=0
        while IFS= read -r tracked; do
          kept=1
          for entry in "${removed[@]}"; do
            case "$tracked" in
              "$entry" | "$entry"/*) kept=0; break ;;
            esac
          done
          if [ "$kept" -eq 1 ]; then surviving=1; break; fi
        done <<<"$tracked_under"
        if [ "$surviving" -eq 0 ]; then
          finding "$target" "every tracked file under '${path}' is removed from main by ${publish_script}"
        fi
      fi
    fi
```

A here-string (`<<<`) and `break` inside `case` both work in bash 3.2. The inner loop reads from its own redirect, so it does not consume the outer loop's input from `"$file"`.

Then state the new rule in the two places that document the contract:

- [ ] `scripts/check-llms-txt.sh` header, `THE CONTRACT.` item 5: add a second sentence, "A `tree` <path> must also keep at least one tracked file that no entry removes."
- [ ] `docs/development.md` §5, the paragraph opening "**A third command checks that every link in `llms.txt` resolves on `main`**": after "an entry of `removed_paths` in `scripts/publish-main.sh`", add "; and a `tree` link keeps at least one tracked file beneath it that no entry removes".

**Verification.** Write a probe file at `harness-runs/scratch/llms-probe.txt`, which is untracked, containing:

```
# autonomous-sdlc-harness

> probe

## Probe

- [workflows](https://github.com/firu-daniel/autonomous-sdlc-harness/tree/main/.github/workflows): probe
```

Run `bash scripts/check-llms-txt.sh harness-runs/scratch/llms-probe.txt`. It should exit 1 and print the new "every tracked file under '.github/workflows' is removed from main" line. Delete the probe, then run `bash scripts/check-llms-txt.sh` with no argument and confirm it still exits 0.
