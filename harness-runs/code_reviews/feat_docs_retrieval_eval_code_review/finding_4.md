### 4. `args.mjs`'s `default:` branch makes the next flag added to `FLAGS` parse as `--transcript`

**Site.** `evals/docs-retrieval/args.mjs` → `parseArgs`, the `switch (flag)` statement's closing arm:

```js
      case '--floor':
        raw.floor = value;
        break;
      default:
        raw.transcript = value;
        break;
```

**The problem.** `FLAGS` is the module's declared surface and `VALUE_FLAGS` is derived from it, so a flag added to `FLAGS` is accepted by the parser the moment it is declared. Every flag has its own `case` except `--transcript`, which is reached through `default:` — so a flag declared in `FLAGS` and not given a `case` is silently parsed as a transcript path. `run.mjs` then loads the arm A scorer and refuses on a file that is not a transcript, or worse scores the run as if a hand run had been supplied, and the message names `--transcript` rather than the flag the operator typed.

The module's own rule is that it is *"the one place a flag is spelled, defaulted and refused"*, and this is the one shape in it where declaring a flag is not enough and the failure is silent rather than loud. Everything else in the file refuses by name. Nothing ships wrong today — the arms are the only declared flags and all have cases — so the cost is entirely on the next edit.

**The fix.** Make `--transcript` explicit and give `default:` the refusal it should have had, which turns the omission into a named error instead of a misparse:

```js
      case '--transcript':
        raw.transcript = value;
        break;
      default:
        refuse(`${flag} is declared in FLAGS with no case in parseArgs, so its value would be misread`);
```

`refuse` throws, so no `break` is needed after it and the switch stays exhaustive by construction.
