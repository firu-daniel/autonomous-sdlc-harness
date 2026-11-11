### 2. Two workflow-template headers now read "an devscene"

**Files:**
- `cli/templates/github/workflows/harness-control.yml` (the line-1 header comment): "acts on an devscene command comment"
- `cli/templates/github/workflows/harness-trigger.yml` (the line-1 header comment): "starts an devscene task run when an"

Task 4 swapped `autonomous-sdlc-harness` for `devscene` and kept the article "an", which suited only the old vowel-initial name. Both templates are written into every adopter's `.github/workflows/` by `init`, so each adopter gets an ungrammatical opening line. No test pins either line: a grep of `cli/test` and `cli/src` for "command comment" and "task run when" finds only `cli/test/fixtures/harness-control-0.6.1.yml`, which records the 0.6.1 bytes and must stay as it is.

**Fix:** change the article on each line and leave every other byte alone. Do not edit `cli/test/fixtures/harness-control-0.6.1.yml`.

- `cli/templates/github/workflows/harness-control.yml`, line 1, becomes:
  ```
  # harness-control.yml — acts on a devscene command comment
  ```
- `cli/templates/github/workflows/harness-trigger.yml`, line 1: replace `starts an devscene task run` with `starts a devscene task run`. The rest of the line, including its trailing `when an`, stays as it is.

This fix creates or edits no test file, so it runs no test.
