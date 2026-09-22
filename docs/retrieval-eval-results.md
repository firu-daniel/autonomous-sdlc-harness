# Docs-retrieval eval results

**Who reads this, and what it owns.** A maintainer deciding whether the docs-retrieval tool earns its
place against the index-first navigation agents use today, and the regression gate that grades a later
run against these numbers. This file is the **record of what was measured** — recall, MRR, latency and
cost per arm, over each committed corpus, with the corpus stamp, the models and the abstention
threshold each figure was taken under. It does not explain how to run the eval or what the metrics
mean: `docs/retrieval-eval.md` owns that, and `docs/retrieval.md` owns how the tool itself works.

> **The region between the two markers below is generated.** `evals/docs-retrieval/run.mjs` rewrites
> it on every run given `--out`, and it is the **only** writer of those bytes. A hand edit inside the
> region is destroyed by the next run; everything outside it, including every section below the end
> marker, is left byte for byte.

<!-- eval:generated:start -->

<!-- eval:corpus:fixture-catalog:start -->
### Corpus `fixture-catalog`

| Arm | Mode | recall@1 | recall@3 | recall@5 | MRR | strict recall@5 | strict MRR | p50 ms | p95 ms | cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | — | — | — | — | — | — | — | — | — | awaiting hand run |
| B | `lexical` | 0.444 | 0.889 | 1.000 | 0.657 | 1.000 | 0.606 | 0.6 | 4.2 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.778 | 1.000 | 1.000 | 0.889 | 1.000 | 0.806 | 5.8 | 6.5 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| D | `fused` | 0.556 | 1.000 | 1.000 | 0.759 | 1.000 | 0.685 | 5.9 | 7.7 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.444 | 0.667 | 0.667 | 0.556 | 0.667 | 0.556 | 652.4 | 799.4 | local — no billed tokens (12 embed calls, 12 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its row is
filled by re-running the eval with `--transcript` against a hand-run transcript, per the procedure in
`docs/retrieval-eval.md` → `## Running arm A by hand`.

The `cost` column is not a score, and **the arms’ scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

**Provenance.**

- Corpus `fixture-catalog` — snapshot `{ files: 9, chunks: 41 }`,
  as the index build of this run reported it. A figure over `fixture-catalog` is read with this stamp beside it;
  two figures carrying different stamps are not a before/after pair.
- `docs.root`: `docs`, as the runner set it (the eval owns the retrieval gate and
  `docs.root` alone).
- The corpus is *every* `*.md` under that `docs.root`, with no file filtered out, so a document added
  under it joins the corpus that measures it — and where that root is this checkout’s own `docs/`, this
  file, `docs/retrieval-eval-results.md`, is one of its members and is counted in the stamp above. A stamp
  taken before such a document existed is therefore a different corpus.
- `layers[]`: none — this corpus is read as a repository of its own and carries no conventions documents.
- Query set: `evals/docs-retrieval/queries/fixture-catalog.jsonl` — 9 positive, 3 negative.
- `k`: 5; repetitions per query: 1.
- Embedder: `Xenova/bge-small-en-v1.5:q8:cls:384:v1`. Reranker: `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1` — loaded and run outside the stub.
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset for this run, which the index build refuses to proceed without.
- Abstention threshold in force: `0.32`, read off the `search.js` this run loaded.
- The figures above are the **post-calibration** ones for the one arm that threshold applies to. The
  pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold
  calibration` below, taken at the earlier snapshot that section records by corpus name and chunk count —
  so both variables that moved between the two readings, the threshold and the corpus, are named.
- Host `darwin 24.6.0`, Node `v20.19.5`, 2026-09-21T18:59:36.311Z.

```json
{
  "corpus": "fixture-catalog",
  "snapshot": {
    "files": 9,
    "chunks": 41
  },
  "abstainScoreThreshold": 0.32,
  "embedder": "Xenova/bge-small-en-v1.5:q8:cls:384:v1",
  "reranker": "Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1",
  "k": 5,
  "repeat": 1,
  "queries": {
    "path": "evals/docs-retrieval/queries/fixture-catalog.jsonl",
    "positives": 9,
    "negatives": 3
  },
  "generatedAt": "2026-09-21T18:59:36.311Z",
  "host": "darwin 24.6.0",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "mode": null,
      "ran": false
    },
    {
      "arm": "B",
      "mode": "lexical",
      "ran": true,
      "embedCalls": 0,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.4444444444444444,
          "3": 0.8888888888888888,
          "5": 1
        },
        "mrr": 0.6574074074074074,
        "strict": {
          "recall": {
            "1": 0.4444444444444444,
            "3": 0.7777777777777778,
            "5": 1
          },
          "mrr": 0.6055555555555556
        },
        "latency": {
          "p50": 0.6111659999996846,
          "p95": 4.170292000000245
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.015625
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.170292000000245
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 5
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.2911659999999756
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.015625
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6478750000001128
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015625
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6638750000001892
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.015625
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6084999999998217
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 3
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.572624999999789
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 4
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/tracking.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015625
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6077499999996689
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#exception-codes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6143749999996544
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6111659999996846
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.6481250000001637
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "hits": [],
            "durationMs": [
              0.23050000000012005
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/tracking.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.5816250000002583
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "C",
      "mode": "vector",
      "ran": true,
      "embedCalls": 12,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.7777777777777778,
          "3": 1,
          "5": 1
        },
        "mrr": 0.8888888888888888,
        "strict": {
          "recall": {
            "1": 0.6666666666666666,
            "3": 0.8888888888888888,
            "5": 1
          },
          "mrr": 0.8055555555555556
        },
        "latency": {
          "p50": 5.762374999999793,
          "p95": 6.468499999999949
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.236041000000114
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015625
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.090416000000005
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.015625
              },
              {
                "ref": "docs/tracking.md#status-codes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.823041999999987
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/labels.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#exception-codes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.762374999999793
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.468499999999949
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/rates.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.015625
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.545375000000149
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015625
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.308958000000075
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.015625
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.218708000000333
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015625
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.016415999999936
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.015625
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.5448749999995925
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#bay-numbering",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.361292000000049
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/tracking.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.015625
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.386332999999922
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "D",
      "mode": "fused",
      "ran": true,
      "embedCalls": 12,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.5555555555555556,
          "3": 1,
          "5": 1
        },
        "mrr": 0.7592592592592592,
        "strict": {
          "recall": {
            "1": 0.4444444444444444,
            "3": 1,
            "5": 1
          },
          "mrr": 0.6851851851851851
        },
        "latency": {
          "p50": 5.865124999999807,
          "p95": 7.719375000000127
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.03125
              },
              {
                "ref": "docs/labels.md",
                "score": 0.02976190476190476
              }
            ],
            "durationMs": [
              5.9692919999997684
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.02976190476190476
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.029083245521601686
              }
            ],
            "durationMs": [
              6.116167000000132
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.03125
              },
              {
                "ref": "docs/labels.md",
                "score": 0.030536130536130537
              }
            ],
            "durationMs": [
              5.574083000000428
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.030621785881252923
              }
            ],
            "durationMs": [
              5.865124999999807
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.030536130536130537
              }
            ],
            "durationMs": [
              7.719375000000127
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/rates.md#remote-area-surcharge",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/rates.md",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/rates.md#fuel-surcharge",
                "score": 0.03125
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.031024531024531024
              },
              {
                "ref": "docs/rates.md#volumetric-weight",
                "score": 0.030536130536130537
              }
            ],
            "durationMs": [
              5.504707999999937
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.03036576949620428
              },
              {
                "ref": "docs/webhooks.md#subscribing-to-events",
                "score": 0.029857397504456328
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.029850746268656716
              }
            ],
            "durationMs": [
              7.628374999999778
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/tracking.md#event-ordering-and-duplicates",
                "score": 0.02967032967032967
              }
            ],
            "durationMs": [
              6.04024999999956
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.030798389007344232
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.029857397504456328
              }
            ],
            "durationMs": [
              5.955583999999817
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.03076923076923077
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.029437229437229435
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.029411764705882353
              },
              {
                "ref": "docs/tracking.md#estimated-delivery-window",
                "score": 0.029211087420042643
              },
              {
                "ref": "docs/exceptions.md#claims-for-a-lost-parcel",
                "score": 0.029138513513513514
              }
            ],
            "durationMs": [
              5.528875000000426
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03076923076923077
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/depot-operations.md#bay-numbering",
                "score": 0.015625
              },
              {
                "ref": "docs/rates.md#rate-cards",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.708000000000084
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/tracking.md",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/api-auth.md#scopes",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/exceptions.md#returns-to-sender",
                "score": 0.029211087420042643
              }
            ],
            "durationMs": [
              5.266958000000159
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.032266458495966696
          }
        ]
      }
    },
    {
      "arm": "E",
      "mode": "fused-rerank",
      "ran": true,
      "embedCalls": 12,
      "rerankCalls": 12,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 9,
        "negatives": 3,
        "recall": {
          "1": 0.4444444444444444,
          "3": 0.6666666666666666,
          "5": 0.6666666666666666
        },
        "mrr": 0.5555555555555556,
        "strict": {
          "recall": {
            "1": 0.4444444444444444,
            "3": 0.6666666666666666,
            "5": 0.6666666666666666
          },
          "mrr": 0.5555555555555556
        },
        "latency": {
          "p50": 652.4469169999998,
          "p95": 799.3642080000009
        },
        "samples": 12,
        "abstainedOnNegative": 3,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md",
                "score": 0.9988245368003845
              },
              {
                "ref": "docs/routing.md#how-a-route-is-chosen",
                "score": 0.997146487236023
              },
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.967546820640564
              },
              {
                "ref": "docs/depot-operations.md",
                "score": 0.9095854163169861
              },
              {
                "ref": "docs/routing.md#zone-graph",
                "score": 0.788049042224884
              }
            ],
            "durationMs": [
              517.770583
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9988245368003845,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-late-handin",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/routing.md#cut-off-times",
                "score": 0.9811885952949524
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.7106814980506897
              },
              {
                "ref": "docs/depot-operations.md#handover-to-a-courier",
                "score": 0.3005616068840027
              },
              {
                "ref": "docs/depot-operations.md#sort-plans",
                "score": 0.109153151512146
              },
              {
                "ref": "docs/exceptions.md#returns-to-sender",
                "score": 0.05581606552004814
              }
            ],
            "durationMs": [
              545.5106249999999
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9811885952949524,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-barcode-contents",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.941379964351654
              },
              {
                "ref": "docs/labels.md#label-anatomy",
                "score": 0.9142329692840576
              },
              {
                "ref": "docs/labels.md#printing-and-label-stock",
                "score": 0.7656862139701843
              },
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.5925036668777466
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.02494685910642147
              }
            ],
            "durationMs": [
              652.4469169999998
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.941379964351654,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-unreadable-label",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/labels.md#when-a-label-is-rejected",
                "score": 0.9988497495651245
              },
              {
                "ref": "docs/depot-operations.md#inbound-scanning",
                "score": 0.995164155960083
              },
              {
                "ref": "docs/labels.md",
                "score": 0.9884990453720093
              },
              {
                "ref": "docs/labels.md#the-routing-barcode",
                "score": 0.9212325215339661
              },
              {
                "ref": "docs/INDEX.md",
                "score": 0.8922458291053772
              }
            ],
            "durationMs": [
              607.866
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9988497495651245,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-billable-weight",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              629.0243339999997
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-fc-surcharge-compounding",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              678.095875
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-fc-webhook-retry",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.5472269654273987
              },
              {
                "ref": "docs/webhooks.md#delivery-and-retries",
                "score": 0.017705265432596207
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.0010588211007416248
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.0004331582458689809
              },
              {
                "ref": "docs/exceptions.md#redelivery-attempts",
                "score": 0.0001967466960195452
              }
            ],
            "durationMs": [
              703.5496669999993
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.5472269654273987,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-fc-verify-callback",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              754.9446669999998
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-fc-token-lifetime",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/api-auth.md#token-exchange",
                "score": 0.983818769454956
              },
              {
                "ref": "docs/api-auth.md#rotating-a-key",
                "score": 0.4273105263710022
              },
              {
                "ref": "docs/webhooks.md#replaying-missed-events",
                "score": 0.0005338062765076756
              },
              {
                "ref": "docs/api-auth.md#api-keys",
                "score": 0.00026457515195943415
              },
              {
                "ref": "docs/webhooks.md#signature-verification",
                "score": 0.00011346016981406137
              }
            ],
            "durationMs": [
              782.9009169999999
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.983818769454956,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-fc-negative-recruitment",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              776.3848749999997
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              799.3642080000009
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              331.1431670000002
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          }
        ]
      }
    }
  ]
}
```
<!-- eval:corpus:fixture-catalog:end -->

<!-- eval:corpus:self-docs:start -->
### Corpus `self-docs`

| Arm | Mode | recall@1 | recall@3 | recall@5 | MRR | strict recall@5 | strict MRR | p50 ms | p95 ms | cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | — | — | — | — | — | — | — | — | — | awaiting hand run |
| B | `lexical` | 0.333 | 0.667 | 0.933 | 0.534 | 0.733 | 0.344 | 2.6 | 6.8 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.533 | 0.533 | 0.600 | 0.547 | 0.333 | 0.247 | 7.8 | 9.1 | local — no billed tokens (20 embed calls, 0 rerank calls) |
| D | `fused` | 0.533 | 0.800 | 0.867 | 0.650 | 0.667 | 0.352 | 9.8 | 12.2 | local — no billed tokens (20 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.400 | 0.600 | 0.600 | 0.500 | 0.533 | 0.383 | 1145.3 | 1263.5 | local — no billed tokens (20 embed calls, 20 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its row is
filled by re-running the eval with `--transcript` against a hand-run transcript, per the procedure in
`docs/retrieval-eval.md` → `## Running arm A by hand`.

The `cost` column is not a score, and **the arms’ scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

**Provenance.**

- Corpus `self-docs` — snapshot `{ files: 13, chunks: 177 }`,
  as the index build of this run reported it. A figure over `self-docs` is read with this stamp beside it;
  two figures carrying different stamps are not a before/after pair.
- `docs.root`: `docs`, as the runner set it (the eval owns the retrieval gate and
  `docs.root` alone).
- The corpus is *every* `*.md` under that `docs.root`, with no file filtered out, so a document added
  under it joins the corpus that measures it — and where that root is this checkout’s own `docs/`, this
  file, `docs/retrieval-eval-results.md`, is one of its members and is counted in the stamp above. A stamp
  taken before such a document existed is therefore a different corpus.
- `layers[]`, read out of the resolved checkout’s `harness.config.json` and never composed here:
  - `cli` (path `cli`) → `.claude/context/cli.md`
  - `plugin` (path `plugin`) → `.claude/context/plugin.md`
  - `general` (path `.`) → `.claude/context/conventions.md`
- Query set: `evals/docs-retrieval/queries/self-docs.jsonl` — 15 positive, 5 negative.
- `k`: 5; repetitions per query: 1.
- Embedder: `Xenova/bge-small-en-v1.5:q8:cls:384:v1`. Reranker: `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1` — loaded and run outside the stub.
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset for this run, which the index build refuses to proceed without.
- Abstention threshold in force: `0.32`, read off the `search.js` this run loaded.
- The figures above are the **post-calibration** ones for the one arm that threshold applies to. The
  pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold
  calibration` below, taken at the earlier snapshot that section records by corpus name and chunk count —
  so both variables that moved between the two readings, the threshold and the corpus, are named.
- Host `darwin 24.6.0`, Node `v20.19.5`, 2026-09-21T19:00:20.828Z.

```json
{
  "corpus": "self-docs",
  "snapshot": {
    "files": 13,
    "chunks": 177
  },
  "abstainScoreThreshold": 0.32,
  "embedder": "Xenova/bge-small-en-v1.5:q8:cls:384:v1",
  "reranker": "Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1",
  "k": 5,
  "repeat": 1,
  "queries": {
    "path": "evals/docs-retrieval/queries/self-docs.jsonl",
    "positives": 15,
    "negatives": 5
  },
  "generatedAt": "2026-09-21T19:00:20.828Z",
  "host": "darwin 24.6.0",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "mode": null,
      "ran": false
    },
    {
      "arm": "B",
      "mode": "lexical",
      "ran": true,
      "embedCalls": 0,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.3333333333333333,
          "3": 0.6666666666666666,
          "5": 0.9333333333333333
        },
        "mrr": 0.5344444444444444,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.4,
            "5": 0.7333333333333333
          },
          "mrr": 0.34444444444444444
        },
        "latency": {
          "p50": 2.611417000000074,
          "p95": 6.793041000000812
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#3-can-another-family-reach-this-state",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015625
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              23.993499999996857
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#2-the-scripts",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#output-logging-and-errors",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#3-the-allowdeny-surface",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.453291999998328
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/cli.md#one-example--the-shape-a-rule-takes-here",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.3491659999999683
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/typecheck-key-decision.md#6-option-c--a-composer-family-fallback",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/conventions.md#the-testing-bar",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.6489159999982803
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#7-doctor",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.5946660000008706
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#31-narrowed--allow--silent",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#where-a-new-responsibility-goes",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              5.3527920000015
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/plugin.md#registries--a-name-routed-to-an-implementation",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.819374999999127
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/plugin.md#wires-dispatch-in-return-out",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.345208000002458
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/outer-loop-verification.md#17-the-generated-wrappers-arguments-anchor-detached-start",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#5-the-wrapper-script-contract",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.8783330000005662
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.015625
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.2408749999995052
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.9358749999992142
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 5
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.5866669999995793
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#the-testing-bar",
                "score": 0.015625
              },
              {
                "ref": "docs/analyze.md#1-the-target-vocabulary",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.6708749999997963
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.702750000000378
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 5
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#6-option-c--a-composer-family-fallback",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#7-doctor",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#5-the-wrapper-script-contract",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.793041000000812
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#2-standing-decision-matrices",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-pre-calibration-distributions-quoted",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.679833999998664
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-pre-calibration-distributions-quoted",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.422167000000627
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-pre-calibration-distributions-quoted",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.278999999998632
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.611417000000074
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#3-decision-changes-across-the-port",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.004417000000103
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "C",
      "mode": "vector",
      "ran": true,
      "embedCalls": 20,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.5333333333333333,
          "3": 0.5333333333333333,
          "5": 0.6
        },
        "mrr": 0.5466666666666666,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.26666666666666666,
            "5": 0.3333333333333333
          },
          "mrr": 0.24666666666666667
        },
        "latency": {
          "p50": 7.78887499999837,
          "p95": 9.077084000000468
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#8-config",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.942042000002402
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#33-widened--silent--allow",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#21-helper-call-order-composition",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#22-expansion-bypass-rows",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#35-jurisdiction-and-defaults",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.663791999999376
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#1-global-flags-and-exit-codes",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#registries-and-dispatch-tables",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/cli.md#what-this-layer-owns-and-what-it-is-not",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/cli.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.604792000001908
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/typecheck-key-decision.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/typecheck-key-decision.md#4-option-a--make-the-key-optional",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/plugin.md#verifying-a-change-in-this-layer",
                "score": 0.015625
              },
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              14.628708000000188
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/watcher.md#the-path",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.655665999998746
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#what-a-later-change-owes-this-section-2",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.492207999999664
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/guard-verification.md#12-per-guard-and-composite-latency-ms-per-call",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#0-method",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.089417000002868
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#verifying-a-change-in-this-layer",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.505250000001979
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#21-exit-classification",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md#26-the-stall-watchdog",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.416000000001077
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/watcher.md#the-policy-a-coordinating-record-and-an-opt-in-lock",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md#21-exit-classification",
                "score": 0.015625
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.055374999999913
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.524416999996902
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--awaiting-a-hand-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.710792000001675
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/analyze.md#8-how-this-is-verified",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/analyze.md#2-mode-greenfield-or-existing",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/analyze.md#12-the-corpus-passs-own-decisions",
                "score": 0.015625
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.396457999999257
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015625
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.79541700000118
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.015625
              },
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.077084000000468
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/config.md#4-token--class--home",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/config.md",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.78887499999837
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#threshold-calibration",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#what-the-move-cost",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-two-bounds-that-fixed-the-choice",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.404709000002185
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/development.md#1-source-types-and-the-plugin-root",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.414582999997947
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--awaiting-a-hand-run",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-fixture-catalog",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.38866699999926
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#the-order-files-are-created-so-a-half-built-feature-is-still-coherent",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#docs-fetch-models",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.121250000000146
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          }
        ]
      }
    },
    {
      "arm": "D",
      "mode": "fused",
      "ran": true,
      "embedCalls": 20,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.5333333333333333,
          "3": 0.8,
          "5": 0.8666666666666667
        },
        "mrr": 0.65,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.5333333333333333,
            "5": 0.6666666666666666
          },
          "mrr": 0.3522222222222222
        },
        "latency": {
          "p50": 9.7534169999999,
          "p95": 12.222083000000566
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.030886196246139225
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.030330882352941176
              },
              {
                "ref": "docs/typecheck-key-decision.md#3-can-another-family-reach-this-state",
                "score": 0.03028233151183971
              },
              {
                "ref": "docs/cli.md#8-config",
                "score": 0.0288981288981289
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.028205128205128206
              }
            ],
            "durationMs": [
              8.021457999999257
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.030886196246139225,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/guard-verification.md#35-jurisdiction-and-defaults",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/guard-verification.md#25-directory-de-quoting-the-widening-and-its-paired-refusal",
                "score": 0.030303030303030304
              },
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.028991596638655463
              }
            ],
            "durationMs": [
              7.51850000000195
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.031544957774465976
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/cli.md#1-global-flags-and-exit-codes",
                "score": 0.03021353930031804
              },
              {
                "ref": ".claude/context/conventions.md#registries-and-dispatch-tables",
                "score": 0.02976190476190476
              },
              {
                "ref": ".claude/context/cli.md#what-this-layer-owns-and-what-it-is-not",
                "score": 0.028958333333333336
              }
            ],
            "durationMs": [
              10.601458000001003
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031544957774465976,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/typecheck-key-decision.md#4-option-a--make-the-key-optional",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.030117753623188408
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.02919863597612958
              }
            ],
            "durationMs": [
              13.034167000001617
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03177805800756621,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.030776515151515152
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.029116045245077504
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.02792120864410021
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.02788769549651404
              }
            ],
            "durationMs": [
              10.122458000001643
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031099324975891997,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.03278688524590164
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.03021353930031804
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.02964426877470356
              },
              {
                "ref": "docs/guard-verification.md#21-helper-call-order-composition",
                "score": 0.026547116736990152
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.025893752088205813
              }
            ],
            "durationMs": [
              10.672667000002548
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.0315136476426799
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.03125763125763126
              },
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.029551337359792925
              },
              {
                "ref": "docs/guard-verification.md",
                "score": 0.028298204527712725
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.02736726874657909
              }
            ],
            "durationMs": [
              9.7534169999999
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.0315136476426799,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.032018442622950824
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.03200204813108039
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.02976190476190476
              },
              {
                "ref": "docs/development.md",
                "score": 0.02967032967032967
              }
            ],
            "durationMs": [
              10.579459000000497
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/outer-loop-verification.md#15-restart-watchersh",
                "score": 0.03007688828584351
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.02928692699490662
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.02750455373406193
              }
            ],
            "durationMs": [
              9.592832999998791
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03149801587301587,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.031746031746031744
              },
              {
                "ref": "docs/watcher.md#the-policy-a-coordinating-record-and-an-opt-in-lock",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.03076923076923077
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.028484848484848488
              }
            ],
            "durationMs": [
              9.652207999999519
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.030330882352941176
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.03028233151183971
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.029083245521601686
              }
            ],
            "durationMs": [
              9.791625000001659
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 3,
            "strictRank": 5
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--awaiting-a-hand-run",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.03021353930031804
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.030117753623188408
              }
            ],
            "durationMs": [
              9.410665999999765
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03128054740957967,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/analyze.md",
                "score": 0.029857397504456328
              },
              {
                "ref": "docs/analyze.md#1-the-target-vocabulary",
                "score": 0.02946912242686891
              },
              {
                "ref": "docs/analyze.md#10-what-the-skeletons-say-now-the-offer-exists",
                "score": 0.02919863597612958
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.02871794871794872
              }
            ],
            "durationMs": [
              8.695290999999997
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.027820121951219513
              },
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.027051561365286855
              },
              {
                "ref": "docs/watcher.md#2-the-scripts",
                "score": 0.026742734890354787
              }
            ],
            "durationMs": [
              12.222083000000566
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.029726775956284153
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.02886002886002886
              },
              {
                "ref": "docs/cli.md#the-interaction-rule",
                "score": 0.028790389395194696
              }
            ],
            "durationMs": [
              11.26995800000077
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03225806451612903,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.027425373134328357
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.027346637102734665
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.02699859747545582
              },
              {
                "ref": "docs/config.md",
                "score": 0.02637768817204301
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.025567754549556326
              }
            ],
            "durationMs": [
              11.269167000002199
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.027425373134328357
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-pre-calibration-distributions-quoted",
                "score": 0.031099324975891997
              },
              {
                "ref": ".claude/context/plugin.md#sample-fixtures",
                "score": 0.028381642512077296
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.026988636363636364
              },
              {
                "ref": ".claude/context/cli.md#dependencies-and-which-way-they-point",
                "score": 0.02690501986276634
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.0265113137453563
              }
            ],
            "durationMs": [
              9.615166999999929
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.031099324975891997
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.030776515151515152
              },
              {
                "ref": "docs/development.md#1-source-types-and-the-plugin-root",
                "score": 0.03021353930031804
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.03009207275993712
              },
              {
                "ref": "docs/retrieval-eval-results.md#what-the-move-cost",
                "score": 0.02712049508554787
              },
              {
                "ref": ".claude/context/conventions.md#documents-of-record",
                "score": 0.025362318840579712
              }
            ],
            "durationMs": [
              10.42779199999859
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.030776515151515152
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.030798389007344232
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.030621785881252923
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.02946912242686891
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.02889344262295082
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.028850145288501453
              }
            ],
            "durationMs": [
              9.416125000003376
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.030798389007344232
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.032266458495966696
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.029116045245077504
              },
              {
                "ref": "docs/outer-loop-verification.md#26-the-stall-watchdog",
                "score": 0.027692895339954164
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.02749719416386083
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.02619736419157827
              }
            ],
            "durationMs": [
              9.268792000002577
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.032266458495966696
          }
        ]
      }
    },
    {
      "arm": "E",
      "mode": "fused-rerank",
      "ran": true,
      "embedCalls": 20,
      "rerankCalls": 20,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 15,
        "negatives": 5,
        "recall": {
          "1": 0.4,
          "3": 0.6,
          "5": 0.6
        },
        "mrr": 0.5,
        "strict": {
          "recall": {
            "1": 0.26666666666666666,
            "3": 0.4666666666666667,
            "5": 0.5333333333333333
          },
          "mrr": 0.38333333333333336
        },
        "latency": {
          "p50": 1145.3307920000007,
          "p95": 1263.4789999999994
        },
        "samples": 20,
        "abstainedOnNegative": 5,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1263.4789999999994
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#3-the-allowdeny-surface",
                "score": 0.8066375851631165
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.7561017274856567
              },
              {
                "ref": "docs/guard-verification.md#32-tightened--silent--deny",
                "score": 0.5888859033584595
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.5314047336578369
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.3608555197715759
              }
            ],
            "durationMs": [
              1287.192541999997
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8066375851631165,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.9983236789703369
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.94883793592453
              },
              {
                "ref": ".claude/context/cli.md#not-determined",
                "score": 0.8381896018981934
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.7049463391304016
              },
              {
                "ref": ".claude/context/plugin.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.6496245265007019
              }
            ],
            "durationMs": [
              1063.0152499999967
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9983236789703369,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1195.0398330000025
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.9118165969848633
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.8761773109436035
              },
              {
                "ref": ".claude/context/plugin.md#the-placeholder-vocabulary",
                "score": 0.5041606426239014
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.43399330973625183
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.29934847354888916
              }
            ],
            "durationMs": [
              1120.5922500000015
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9118165969848633,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.7265825271606445
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.0030089227948337793
              },
              {
                "ref": "docs/outer-loop-verification.md#11-commit-on-branchsh--refuses-loudly",
                "score": 0.000867422902956605
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.0003935615241061896
              },
              {
                "ref": "docs/guard-verification.md#35-jurisdiction-and-defaults",
                "score": 0.0000389436972909607
              }
            ],
            "durationMs": [
              1188.293583000006
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7265825271606445,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.9808194041252136
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.9797009825706482
              },
              {
                "ref": "docs/guard-verification.md",
                "score": 0.6645653247833252
              },
              {
                "ref": "docs/guard-verification.md#3-decision-changes-across-the-port",
                "score": 0.038353826850652695
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.011228492483496666
              }
            ],
            "durationMs": [
              1141.0581660000025
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9808194041252136,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#plugin-asset-authoring",
                "score": 0.9992165565490723
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.9961328506469727
              },
              {
                "ref": "docs/development.md",
                "score": 0.9920783042907715
              },
              {
                "ref": ".claude/context/plugin.md#citation",
                "score": 0.9666450023651123
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.7336789965629578
              }
            ],
            "durationMs": [
              1072.408292
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9992165565490723,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-sd-daemon-lifecycle",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#1-the-loop-in-one-page",
                "score": 0.9050639271736145
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.4667190611362457
              },
              {
                "ref": "docs/outer-loop-verification.md#15-restart-watchersh",
                "score": 0.03868675231933594
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.025482188910245895
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.018250873312354088
              }
            ],
            "durationMs": [
              1205.3202910000036
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9050639271736145,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.9856442213058472
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--awaiting-a-hand-run",
                "score": 0.13560578227043152
              },
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.1288224160671234
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.032486531883478165
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.02734939381480217
              }
            ],
            "durationMs": [
              1249.4705420000028
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9856442213058472,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.5406689643859863
              },
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.44475895166397095
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--awaiting-a-hand-run",
                "score": 0.11128897219896317
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.09484846144914627
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.05775439366698265
              }
            ],
            "durationMs": [
              1145.3307920000007
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.5406689643859863,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.6837828159332275
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.3671532869338989
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--awaiting-a-hand-run",
                "score": 0.3388470709323883
              },
              {
                "ref": "docs/retrieval-eval-results.md",
                "score": 0.270835816860199
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.26530829071998596
              }
            ],
            "durationMs": [
              1152.1687079999974
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.6837828159332275,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.33899036049842834
              },
              {
                "ref": "docs/analyze.md",
                "score": 0.2882399559020996
              },
              {
                "ref": "docs/analyze.md#9-how-the-offer-reaches-the-command-and-the-naming-hazard",
                "score": 0.24035446345806122
              },
              {
                "ref": "docs/cli.md#1-global-flags-and-exit-codes",
                "score": 0.10705219954252243
              },
              {
                "ref": "docs/analyze.md#10-what-the-skeletons-say-now-the-offer-exists",
                "score": 0.046089813113212585
              }
            ],
            "durationMs": [
              1089.5891669999983
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.33899036049842834,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.9918370842933655
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.9581737518310547
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.9212865829467773
              },
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.8447800278663635
              },
              {
                "ref": "docs/cli.md",
                "score": 0.8256142735481262
              }
            ],
            "durationMs": [
              1138.463416000006
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9918370842933655,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-sd-second-init",
            "negative": false,
            "abstained": false,
            "hits": [
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.9619483947753906
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.9537369608879089
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.45984140038490295
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.06278954446315765
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.050347305834293365
              }
            ],
            "durationMs": [
              1166.8789580000011
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9619483947753906,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1137.974666999995
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1144.7912499999948
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1125.1992500000051
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1199.1624579999989
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": true,
            "hits": [],
            "durationMs": [
              1218.469041999997
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          }
        ]
      }
    }
  ]
}
```
<!-- eval:corpus:self-docs:end -->

<!-- eval:generated:end -->

## Threshold calibration

**This section is the record of the calibration** — the one place the value, the evidence it was
chosen from, what it costs and the limit on it are written down. The constant's own doc comment in
`cli/src/retrieval/search.ts`, `docs/retrieval.md` and `docs/cli.md` §11 cite this section rather than
restating its figures: a number that belongs to the calibration is added here and nowhere else.

**The value.** `ABSTAIN_SCORE_THRESHOLD = 0.32` in `cli/src/retrieval/search.ts`, applied as
`best < ABSTAIN_SCORE_THRESHOLD` to the top reranker score of the `fused-rerank` mode alone.

**What it was calibrated on.** Arm E of the eval, run on 2026-09-21 (`2026-09-21T16:46:12.749Z` for
`fixture-catalog`, `2026-09-21T16:46:35.978Z` for `self-docs`) on host `darwin 24.6.0`
under Node `v20.19.5`, with embedder `Xenova/bge-small-en-v1.5:q8:cls:384:v1` and reranker
`Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1` loaded outside the stub, over the two committed corpora
at the snapshots that run reported: `fixture-catalog` at 9 files / 41 chunks (9 positive and 3
negative queries) and `self-docs` at 13 files / 173 chunks (15 positive and 5 negative queries).

### The two bounds that fixed the choice

They come from different places and are not interchangeable.

- **The measured distribution bounds the value from inside**, and is the evidence quoted below. The
  run was taken with the threshold at `0.3`, and `bestScore` is the top **returned** hit's score, so
  an abstaining query carries `null`: **no negative score is observable at all**, only that each is
  strictly below `0.30`. The interval the evidence therefore asserts, pooled over both corpora, is
  `[0.30, 0.33899036049842834]` — `0.30` the censoring bound on every negative, `0.33899036049842834`
  (`q-sd-analyze-writes`, `self-docs`) the lowest observed positive. Its midpoint `0.3195`, rounded to
  two decimals, is `0.32`. Per corpus: the lowest observed positive is `0.5472269654273987`
  (`q-fc-webhook-retry`) on `fixture-catalog` and `0.33899036049842834` on `self-docs`, and on both
  every negative is censored at `< 0.30`.
- **The stub-fixture bound bounds it from outside**, and is a property of the code rather than of any
  corpus: the abstention cases of `cli/test/docs-retrieval.test.mjs` run under the `stub-overlap`
  reranker, which scores a matching query's best hit `1.000` and the no-match query `0.000`, so any
  value strictly inside `(0.000, 1.000)` keeps them passing and a value at or outside either end
  flips one. The constant's doc comment restates this bound, because that is where it binds.

### The pre-calibration distributions, quoted

These are the per-query best scores of the run above, copied out of this file's generated region as it
stood at the calibration. They are **quoted here rather than cited** because Task 9 regenerates that
region under the calibrated threshold, and a regenerated fence cannot carry a `bestScoreOnPositive`
for the queries the new threshold abstains on — which are exactly the queries the choice was made
from. `null` means the query abstained at `0.3`, so its score is censored: known only to be `< 0.30`,
never observed.

| Corpus | Query | Kind | `bestScoreOnPositive` / `bestScoreOnNegative` |
| --- | --- | --- | --- |
| `fixture-catalog` | `q-fc-route-choice` | positive | `0.9988245368003845` |
| `fixture-catalog` | `q-fc-late-handin` | positive | `0.9811885952949524` |
| `fixture-catalog` | `q-fc-barcode-contents` | positive | `0.941379964351654` |
| `fixture-catalog` | `q-fc-unreadable-label` | positive | `0.9988497495651245` |
| `fixture-catalog` | `q-fc-billable-weight` | positive | `null` — censored, `< 0.30` |
| `fixture-catalog` | `q-fc-surcharge-compounding` | positive | `null` — censored, `< 0.30` |
| `fixture-catalog` | `q-fc-webhook-retry` | positive | `0.5472269654273987` |
| `fixture-catalog` | `q-fc-verify-callback` | positive | `null` — censored, `< 0.30` |
| `fixture-catalog` | `q-fc-token-lifetime` | positive | `0.983818769454956` |
| `fixture-catalog` | `q-fc-negative-recruitment` | negative | `null` — censored, `< 0.30` |
| `fixture-catalog` | `q-fc-negative-lattice` | negative | `null` — censored, `< 0.30` |
| `fixture-catalog` | `q-fc-negative-datastore` | negative | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-new-config-key` | positive | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-deny-guard` | positive | `0.8066375851631165` |
| `self-docs` | `q-sd-new-subcommand` | positive | `0.9983236789703369` |
| `self-docs` | `q-sd-run-gates` | positive | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-state-dir` | positive | `0.9128396511077881` |
| `self-docs` | `q-sd-commit-prefix` | positive | `0.7014356851577759` |
| `self-docs` | `q-sd-guard-shell-options` | positive | `0.9804458022117615` |
| `self-docs` | `q-sd-cross-asset-reference` | positive | `0.9992165565490723` |
| `self-docs` | `q-sd-daemon-lifecycle` | positive | `0.9118318557739258` |
| `self-docs` | `q-sd-usage-limit` | positive | `0.9862282872200012` |
| `self-docs` | `q-sd-search-abstains` | positive | `0.5403093695640564` |
| `self-docs` | `q-sd-retrieval-network` | positive | `0.6682106852531433` |
| `self-docs` | `q-sd-analyze-writes` | positive | `0.33899036049842834` |
| `self-docs` | `q-sd-stack-detection` | positive | `0.9918370842933655` |
| `self-docs` | `q-sd-second-init` | positive | `0.9619483947753906` |
| `self-docs` | `q-sd-negative-ingress` | negative | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-negative-tungsten` | negative | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-negative-blog` | negative | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-negative-grpc` | negative | `null` — censored, `< 0.30` |
| `self-docs` | `q-sd-negative-migration` | negative | `null` — censored, `< 0.30` |

### What the move cost

Arm E was run on both corpora twice in one pass over one tree — once with the constant at `0.3` and
once at `0.32`, with a rebuild between the two runs and no other edit — through
`bash scripts/scratch-run.sh` over a launcher that calls `runEval` without `--out`, so it printed the
table and each corpus's `snapshot` stamp and wrote nothing. Both readings of each corpus reported the
**same** stamp, which is the only reason the pair below is a before/after rather than two unrelated
figures.

| Corpus | `snapshot` (both readings) | arm E recall@5 at `0.3` | arm E recall@5 at `0.32` |
| --- | --- | --- | --- |
| `fixture-catalog` | `{ files: 9, chunks: 41 }` | `0.667` (0.6666666666666666) | `0.667` (0.6666666666666666) |
| `self-docs` | `{ files: 13, chunks: 173 }` | `0.600` (0.6) | `0.600` (0.6) |

**The move costs no positive.** recall@5, recall@3, recall@1 and MRR are unchanged on both corpora,
and the same 5 positives abstain at both values — `q-fc-billable-weight`,
`q-fc-surcharge-compounding`, `q-fc-verify-callback` on `fixture-catalog`, `q-sd-new-config-key` and
`q-sd-run-gates` on `self-docs`, the 5 already censored at `0.3`.

**And the move buys no measured negative either.** The arm abstains on every negative query — 3 of 3
on `fixture-catalog`, 5 of 5 on `self-docs` — and it did so at `0.3` as well, since every negative is
`null` in the distributions quoted above, which is what abstaining at `0.3` renders as. So on these
two corpora the move changes no measured outcome at all. What it buys is margin this run could not
observe: a negative scoring in `[0.30, 0.32)` abstains under the new value, and every negative here
is censored below `0.30` rather than measured, so none of them is such a query. The case for `0.32`
over `0.3` is the interval midpoint above and nothing in this subsection.

The figures above are not re-checkable in the generated region as it stands, which is the pre-move
run; they become re-checkable when Task 9 regenerates that region post-move, whose provenance states
its own, later snapshot and the threshold in force.

### The limit on this calibration

Both corpora are far below the roughly 1,500 chunks of a mature docs catalog — 41 and 173 — so this
is a calibration on two small committed corpora rather than on a real catalog, and its standing
reproduction is gate 11 of `scripts/run-gates.sh`, which re-runs the eval against the recorded floor,
rather than a remembered run.

**Its confirmation has now been taken, and it held at both ends.** On 2026-09-22, `docs/development.md`
§5 → gate 10 leg (iv) searched a private real documentation catalog held outside this checkout — commit
`010c50e`, 156 files / 1,960 chunks, the same corpus `## Cold build and index size` →
`### The real-catalog build — 1,960 chunks, 2026-09-22` stamps — in the default `fused-rerank` mode, so
the reranker ran and the threshold applied. The positive query *"How do I configure a proxy for the Vite
dev server?"* returned the known section **first and exactly**,
`docs/vite/config/server-options.md#serverproxy` at score **1.000**; the negative query *"What is the
recommended marinade time for lamb souvlaki?"* returned **`no confident match`** — it abstained. That is
one confirming run at each end, **not a re-calibration**: `ABSTAIN_SCORE_THRESHOLD` stays at `0.32` and
`evals/docs-retrieval/floor.json` is untouched, and two queries are a confirmation rather than an
observed negative distribution.

What would move the value is still a further run: a real-catalog arm E whose
negative queries return scores at or above `0.32`, or whose positives fall below it, reopens the
choice — and because every negative here is censored rather than measured, a run that observes the
negative distribution instead of bounding it is enough on its own to re-derive the number.

## The shipped default against fusion alone

**What this section records.** On both committed corpora the shipped default mode — arm E,
`fused-rerank` — scores **below** arm D, `fused`, on every relevance column, at two orders of
magnitude more latency. E is the default of `docs search` (`cli/src/commands/docs.ts` →
`DEFAULT_MODE`) and the only mode the MCP server can ask for (`cli/src/retrieval/server.ts`), so D is
reachable only by a hand-passed `--mode fused`. This is a **measurement**, not a recommendation:
whether either of those two defaults should change, and whether the abstention policy should extend to
`fused`, are decisions this section does not take and no figure here settles.

The figures are read off this file's generated region above — the per-arm tables and the per-query
records in the same fences — and none is retyped from elsewhere. The `snapshot` stamp belongs to each
row pair, because the two corpora are two different measurements and not a series.

| Corpus | `snapshot` | Arm | recall@1 | recall@3 | recall@5 | MRR | p50 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fixture-catalog` | `{ files: 9, chunks: 41 }` | D `fused` | 0.556 | 1.000 | 1.000 | 0.759 | 5.9 |
| `fixture-catalog` | `{ files: 9, chunks: 41 }` | E `fused-rerank` | 0.444 | 0.667 | 0.667 | 0.556 | 652.4 |
| `self-docs` | `{ files: 13, chunks: 177 }` | D `fused` | 0.533 | 0.800 | 0.867 | 0.650 | 9.8 |
| `self-docs` | `{ files: 13, chunks: 177 }` | E `fused-rerank` | 0.400 | 0.600 | 0.600 | 0.500 | 1145.3 |

**What the deficit is made of — and the two corpora answer differently.** A positive query E misses is
either an **abstention**, where the top reranker score fell below `ABSTAIN_SCORE_THRESHOLD` and the
mode returned nothing at all (`hits: []`), or a **non-abstaining miss**, where it returned five hits
and no relevant one among them.

- On `fixture-catalog`, **all three** of E's missed positives are abstentions —
  `q-fc-billable-weight`, `q-fc-surcharge-compounding`, `q-fc-verify-callback`. D ranks a relevant hit
  for every one of the nine positives. So on this corpus the entire gap is the abstention policy and
  none of it is the ranking.
- On `self-docs`, E misses six positives: **two** abstentions (`q-sd-new-config-key`,
  `q-sd-run-gates`) and **four** non-abstaining misses (`q-sd-deny-guard`, `q-sd-usage-limit`,
  `q-sd-retrieval-network`, `q-sd-analyze-writes`). D misses only two, `q-sd-deny-guard` and
  `q-sd-retrieval-network`, which E misses as well — so of the four, two are shared with fusion and
  **two are demotions the cross-encoder caused**: `q-sd-usage-limit` (rank 4 under D) and
  `q-sd-analyze-writes` (rank 1 under D) were inside the top five that fusion alone produced and were
  pushed out of it by the rerank.

**The one column E wins.** E abstains on **every** negative query — 3 of 3 on `fixture-catalog` and 5
of 5 on `self-docs` — where B, C and D abstain on none of either, each answering confidently on a
query the corpus has no answer for. That is bar 3, **Failure**, of
`docs/retrieval-eval.md` → `## The decision rule`, and it is the only one of that rule's three bars on
which E beats D.

**So the comparison is a trade, and on these two corpora it runs this way:** E buys a clean refusal on
every negative query at the price of relevance on positives and of a p50 in the hundreds of
milliseconds — and on `fixture-catalog` it pays that price *only* in abstentions, which is a
threshold, while on `self-docs` it also pays it in two demotions, which is the reranker.

**What this does not settle.** The same limit `## The limit on this calibration` above states, in the
same terms: two fixture-sized corpora at 41 and 177 chunks, both far below the roughly 1,500 chunks of
a mature docs catalog; one host and one Node version; one repetition per query, so no figure here
carries a spread — with the same standing rule in force that a figure measured on a fixture-sized
corpus never justifies a design decision on its own. The hand run of `docs/development.md` §5 → gate 10
against a private real catalog **has since been taken**, on 2026-09-22; its figures are in
`## Cold build and index size` → `### The real-catalog build — 1,960 chunks, 2026-09-22` and its search
leg in `### The limit on this calibration` above, and neither is a fusion-versus-default comparison. So
the limit on **this** table is unchanged: what would confirm or overturn it is the same comparison run
on a real catalog, which no run has taken.

## Cold build and index size

**The rule this section used to state, and why it is struck.** This section carried a standing rule that a
cold build costing more than **60 seconds** moves out of the agent's path and into
`scripts/setup-worktree.sh`, on the premise that the agent runner's MCP tool-call timeout defaults to 60 s
and that an adopter may set their Bash timeouts lower. **That premise is false**, and **no replacement
constant is stated in its place** — not a larger timeout, not `${MCP_TOOL_TIMEOUT}`, not a fresh crossover
chunk count — because wall time causes no failure on any path the harness uses. The facts below were read
out of the installed binary with `strings -a` at `~/.local/share/claude/versions/2.1.278` — Claude Code
**2.1.278**, macOS arm64, 2026-09-22 — which is bundled JS, so they are source rather than inference from a
variable's name:

- `MCP_TOOL_TIMEOUT` governs MCP tool-call **execution** and defaults to `1e8` ms, about **27.8 hours**,
  with a floor of 1,000 ms. A per-server `timeout` in `.mcp.json` overrides it, and values under the floor
  are ignored.
- `MCP_TIMEOUT`'s 30,000 ms is a **different setting** — MCP server **startup** — and conflating the two is
  the likeliest origin of the struck rule.
- What can end a long MCP call is **silence, not duration**. `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT` is
  1,800,000 ms for **stdio** servers, which the `harness-docs` server is, and trips only when the tool sends
  neither a response nor a progress notification. `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` (120,000 ms) moves a
  long call to a background task, which does not fail it. Measured: a stdio MCP tool sleeping 75 s returned
  `DONE after 75.0s` under `claude -p`.
- The Bash path does not fail either: `BASH_DEFAULT_TIMEOUT_MS` is 120,000 ms and `BASH_MAX_TIMEOUT_MS`
  600,000 ms, and a 25 s command given a 5 s timeout was *"moved to the background"* and completed normally.
  So this section's own *"an adopter may set their Bash timeouts lower"* was true and harmless: the
  consequence is backgrounding, not failure.
- The only `60000` anywhere near MCP in that binary is `var pr=60000` in the HTTP transport, used as
  `Math.max(n,pr)` — a request **floor**, which means the opposite of the ceiling the rule claimed.

These are host-side settings in the Claude Code runner. They do not change with the model the harness runs.

**What replaces the constant.** A property of the build rather than a number: **the build must not go silent
for longer than the idle timeout** — a build that reports progress cannot trip anything above. Where the
build belongs is then a **cost** question, what warming is worth to the worktree that pays it, and not a
timeout question. `docs/retrieval.md` carries that decision; this section carries the figures it is taken
on, for two corpora, each with its own host and corpus stamp.

### The 177-chunk build — this repository's own `docs/`, 2026-09-21

**What was measured, and in which sense it was cold.** Three cold builds of the `self-docs` corpus into a
persisted index, each in its own process, at corpus snapshot `{ files: 13, chunks: 177 }` taken off each
run's own `RefreshResult` — all three agreed on it. The **index** was cold: the directory was removed in
process before each build, the removal asserted (`dataDir` must not exist when the store opens) and
`RefreshResult.embedded` asserted equal to its `chunks`, which is what distinguishes a cold build from an
incremental refresh over a surviving index. The **model cache was warm** — the weights are installed once
per machine and nothing on this branch downloads anything, so no figure here includes a model download.
That leg is gate 10's leg (i) and is out of scope. `modelFilesPresent(retrievalModelCacheDir()).present`
and `retrievalRuntimeState().installed` were both true before the first run.

**The three runs, kept rather than collapsed.** The phases are timed separately because they scale
differently: the model load is per process, the store open is per index directory, and only the refresh
is per chunk.

| Run | Model load ms | Store open ms | Refresh ms | Total ms |
| --- | --- | --- | --- | --- |
| 1 | 373.0 | 1054.6 | 11064.0 | 12491.5 |
| 2 | 191.8 | 853.4 | 11166.3 | 12211.4 |
| 3 | 192.5 | 875.8 | 11029.6 | 12097.9 |
| **median** | **192.5** | **875.8** | **11064.0** | **12211.4** |

| Phase | Median ms | ms per chunk (177) | Spread across the three runs |
| --- | --- | --- | --- |
| Model load (`resolveModels`) | 192.5 | 1.09 | 181.2 ms, 94% of the median |
| Store open (`openPgliteStore`) | 875.8 | 4.95 | 201.2 ms, 23% of the median |
| Refresh (`refreshIndex`, every chunk embedded) | 11064.0 | 62.51 | 136.6 ms, 1.2% of the median |
| Total | 12211.4 | 68.99 | 393.6 ms, 3.2% of the median |

The total row is the **median of the three totals**, not the sum of the three phase medians (12132.3 ms),
which no single run produced. No run's refresh differs from the refresh median by more than **0.9%**, so
the check that a run deviating by more than half is investigated rather than averaged away did not fire.
The two short phases carry the whole of the visible spread — run 1 is the outlier in both, and it was the
first process of the session to read the weight files and to create the index directory. They contribute
about 1.1 s of the 12.2 s total and about 1 s of the 94.8 s total the extrapolation below predicted at
~1,500 chunks; only the refresh figure was extrapolated.

**The index on disk.** Sizes are walked in process over the index directory after the store is closed,
`size` summed for the apparent figure and `blocks * 512` for the allocated one. All three runs produced a
byte-identical directory.

| Figure | Total | Per chunk (177) | At ~1,500 chunks, linear |
| --- | --- | --- | --- |
| Apparent size (sum of `size`) | 43,163,949 B (43.2 MB) | 244 kB | ~366 MB |
| Allocated size (sum of `blocks * 512`) | 44,433,408 B (44.4 MB) | 251 kB | ~377 MB |
| Files | 985 | — | — |

The last column is the linear projection this pass published, kept as the record of what was predicted.
It is **not a current figure**: the real-catalog build below measures the index at a second chunk count
and replaces that projection with a two-anchor fit.

**Where the index was built, and why that is the same figure an adopter gets.** Into
`harness-runs/scratch/docs_index/`, which `.gitignore` excludes by its contents. This repository has no
ignore rule for `harness-runs/docs_index/` — `init` writes one only for an adopter who turns retrieval on,
which this repository has not — so building at the configured location would have risked committing a
derived cache. It is the same store, opened the same way by the same `openPgliteStore` call, so the sizes
above are the sizes `<stateDir>/docs_index/` would hold for this corpus.

**What these figures do not settle.** One host (`darwin 24.6.0`), one macOS, one Node
(`v20.19.5`), one corpus of 177 chunks, on 2026-09-21. The 1,500-chunk extrapolations are **linear in the
chunk count**, which the per-chunk embedding cost supports — every chunk is embedded once, in batches —
and which the rest may not: the store's own index-build cost need not be linear, and the size figure is
the worse of the two extrapolations, because 985 files of an embedded Postgres data directory carry a
fixed overhead that a per-chunk division charges to the chunks. Read the size row as an upper bound.
Separating the fixed term from the per-chunk one needed a second measurement at a different chunk count:
that measurement is the real-catalog build recorded below, and the two-anchor fit it produced is stated
there. A fixture-sized figure does not justify a decision on its own, which is why the extrapolations and
their limits were stated in the same breath as the figures they were taken from.

**How to reproduce it.** The measurement is `measureColdBuild` in `evals/docs-retrieval/cold-build.mjs`,
committed so it is re-runnable, driven once per process by a launcher under the run's scratch directory
that calls it for this corpus and that index directory. The launcher's body is
`docs/retrieval-eval.md` → `### The cold-build and query-log launchers`, which also states why three
runs means three invocations of this command:

```
bash scripts/scratch-run.sh harness-runs/scratch/cold-build.mjs
```

The removal and the size walk are both in process, deliberately: a shelled-out recursive removal is a
`deny` floor entry in `.claude/settings.autonomous.json` and `du` has no entry at all, so either would
have stalled an unattended run. No entry was added to that profile for this pass. Filling this section
grows the corpus it measures, so a later run over `self-docs` carries a different snapshot stamp and is
not a before/after pair with the figures above.

### The real-catalog build — 1,960 chunks, 2026-09-22

**The two builds in this section are not a before/after pair.** They are two measurements with different
stamps: different host (Node `v22.23.2` here against `v20.19.5` above), different corpus (1,960 chunks
against 177, an 11× difference), different date. Nothing below records the 177-chunk figure as having
moved. This is `docs/development.md` §5 → gate 10, run by hand in full; legs (i), (ii), (v) and (vi) are
out of this section's scope, which is leg (iii)'s wall times and the index on disk, plus acceptance 2a's
eval-route cross-check.

**Host stamp.** MacBook Air, Apple M4, 10 cores (4 performance + 6 efficiency), 16 GB, macOS 15.7.4
(24G517), `uname -sr` → `Darwin 24.6.0`, arm64, Node `v22.23.2`, npm 10.9.8, Claude Code 2.1.278, the
package `autonomous-sdlc-harness@0.2.0` installed from the registry, load average `1.92 1.76 1.76`, nothing
else of consequence running. The Node version differs from the 177-chunk figures' `v20.19.5`: **recorded,
not reconciled.**

**Corpus stamp.** A private real documentation catalog held outside this checkout, at commit `010c50e`,
**156 files, 1,960 chunks** — identified by its commit, its size and its character, never by a filesystem
path. All four runs printed the same summary line, `docs index: 156 files, 1960 chunks; embedded 1960,
unchanged 0, deleted 0`, so the four are four builds of one snapshot. The corpus clears the roughly
1,500-chunk floor of a mature docs catalog by 31%.

**In which sense this build was cold.** Each of the four CLI runs went into a **fresh** index directory. The
eval-route run of the cross-check below had its `dataDir` removed immediately before the call, with the
module asserting the directory absent when the store opened and `embedded === chunks` on the result, so an
incremental refresh cannot masquerade as a cold one. The **model cache was warm** on both routes: the
download is gate 10's leg (i), and it is out of this section's scope.

**The four runs, kept rather than averaged.** CLI route, `docs index` into a fresh index directory each
time. CPU sat at 452–459% throughout all four, and `du -sh sdlc-harness/docs_index` returned **72M** after
every one of them.

| Run | Context | Wall time | Seconds |
| --- | --- | --- | --- |
| 1 | machine rested | `1:51.25` | 111.25 |
| 2 | immediately after run 1 | `1:59.30` | 119.30 |
| 3 | immediately after run 2 | `2:07.58` | 127.58 |
| 4 | after ~10 min of light load | `1:54.47` | 114.47 |

**The spread, and its cause.** Across runs 1–3 the spread is **16.33 s, 13.7% of the median (119.30 s)** —
and the cause is legible in the order rather than in the number. Runs 1–3 rise **monotonically** back to
back, and run 4, taken after a pause, **returns to baseline**: that is thermal behaviour of a fanless M4
Air under 8+ minutes of sustained ~4.5-core load, not variance in the software. So the honest figure is
**~111–114 s cold on a rested machine, degrading to ~128 s when builds run back to back**, and the four are
not collapsed into one average. The 177-chunk section's sub-1% refresh spread is **not comparable**: that
corpus is 11× smaller and its runs are far too short to heat the machine, so the two spreads are not a
series.

**What this did to the extrapolation, in both directions.**

- **Time held.** The cold build measured **60.87 ms per chunk of total wall time** (min 56.76, max 65.09)
  against the **62.51 ms** of per-chunk *refresh* the extrapolation used — within **2.6%** of the median. The
  two are not the same phase: the CLI route reports one wall time, and the like-for-like refresh figure is the
  eval route's **55.1 ms**, which runs **11.9%** under the extrapolated one. Both readings are recorded because
  the prediction was a refresh figure and the shipped route cannot isolate one. Read that as
  **linear-and-lucky rather than linear-and-right**: the thermal spread above straddles the predicted value, so
  the prediction lands inside the noise band of the host it was tested on.
- **Size missed, by 5.6×.** The index is **37.6 kB per chunk** at 1,960 chunks against the **244 kB** the
  extrapolation used, and the **~366 MB** it projected at ~1,500 chunks overshoots by **5.6×** — the fit
  gives ~65 MB there. The two-point fit, over its two anchors **43.2 MB @ 177 chunks** and **72 MB @ 1,960
  chunks**, is **~40.3 MB fixed overhead plus ~16.5 kB per chunk**: the index is fixed-cost dominated, and
  the original number was a fixed cost divided by a small chunk count — the same error shape as the struck
  60-second rule and as the six-minute download prediction leg (i) replaced. **No projection beyond those
  two anchors is published here**: one further data point buys a fit, not a third extrapolation.

**Acceptance 2a — the eval-route cross-check, both routes labelled.** The same corpus snapshot (156 files,
1,960 chunks) was built again through `measureColdBuild` with `cold: { index: true, modelCache: false }`,
which separates the phases the CLI route reports as one wall time.

| Figure | CLI route | Eval route (`measureColdBuild`) |
| --- | --- | --- |
| Total | 111.25 s rested (run 1), 114.47 s (run 4) | 109.26 s (`totalMs` 109,260.07) |
| Total per chunk | 60.87 ms median (min 56.76, max 65.09) | 55.7 ms (`totalMs` ÷ 1,960) |
| Refresh per chunk | — (the CLI route reports one wall time) | 55.1 ms (`refreshMs` ÷ 1,960) |
| Index size | `du -sh` **72M** | `allocatedBytes` 75,808,768 = **72.3 MiB**; `apparentBytes` 74,195,245 |
| Files | — | 986 |

**There is no disagreement to investigate, and neither route is chosen over the other.** The totals are
1.8% apart, which is inside the thermal band the four CLI runs established, and `du -sh`'s figure is the
allocated one rounded to the megabyte. The per-chunk rows are the same comparison in per-chunk units — the
CLI route's figure is its total divided by the chunk count, because that route reports one wall time and no
phases, so the only like-for-like pair is the two totals. The shipped CLI path and the library the eval drives
are measuring the same thing; both are recorded, labelled by route.

**The three things only the phase-separating route could show.**

- **The store-open phase is still per-index-directory, not per-chunk**: 875.8 ms at 177 chunks against
  941.5 ms at 1,960 — an 11× corpus for a 7.5% rise. The assumption held at the first size that could have
  broken it, so the 177-chunk arithmetic above stands.
- **The model load is flat, and it is not the cost**: 192.5 ms at 177 chunks against 334.4 ms here, falling
  from ~1.6% of the total to **0.31%** of it.
- **Refresh is 107,984 ms of a 109,260 ms total, 98.8% of it** — the measured confirmation that the cost of
  warming is the refresh.

**How the cross-check was driven, since it is not a shipped route.** `evals/docs-retrieval/cold-build.mjs`
exports `measureColdBuild` but has **no CLI entry** — no `--cold` flag on `run.mjs` and no npm script — so a
throwaway module imported it directly, with `repoRoot` and `docsRoot` pointed at the corpus and
`conventions: ['.claude/context/conventions.md']`.

**The state left behind on the machine.** The machine-wide model cache was moved aside and restored **in the
same command** during leg (ii), and verified back at 57M; the teardown copies and the extra index
directories were deleted; `_cacache` was cleaned and has repopulated normally. **Nothing in this branch's
work touches that cache**, because no task here runs an index build.

## The query-log pass

**What this pass measures, and why it is not a by-product of the arm runs.** `logQuery` is called
from `cli/src/retrieval/server.ts` alone, so arms B-E — which drive `searchDocs` directly — write no
record at all; and the server hardcodes `mode: 'fused-rerank'`, so every record it can write is an
arm E record. This pass therefore drives the shipped stdio MCP server over the larger corpus and
reports its latency separately from library-level arm E, because it is the only figure that includes
the per-call incremental refresh and the MCP round trip — what an agent actually waits for.

**The fixture repository, and its configuration.** `docs serve` refuses unless `phases.docs` and
`docs.retrieval` are both true, and this repository's `harness.config.json` satisfies neither and is
deliberately left alone — so **these numbers are not this repository's own configuration**. The pass
mirrors the resolved `self-docs` corpus into a git-initialized repository under the system temp
directory, one commit, removed at the end: 13 files copied at their own repo-relative paths, which
is exactly what `corpusConfig({ corpus: 'self-docs' })` resolves — the pass asserts the two counts
are equal, so a layer added to this checkout's configuration grows the fixture or fails the pass.
Its configuration is this checkout's own with the corpus's keys layered over it: `docs.root` `docs`,
`docs.retrieval` and `phases.docs` true, `stateDir` `harness-runs`, and the rules documents of the
checkout's own layer entries, mapped one for one onto their copied paths:

- `cli` → `.claude/context/cli.md`
- `plugin` → `.claude/context/plugin.md`
- `general` → `.claude/context/conventions.md`

**The two legs.** Each is one `docs serve` child over that fixture, with all 20 queries of
`self-docs` called once through the MCP SDK's own stdio client at the server's default `k` of 5,
every round trip timed from the client side.

| Leg | What it asserted |
| --- | --- |
| `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` set | The log holds exactly one JSON line per call, in call order, each line's `query` byte-identical to the query as sent; every line carries every key `cli/src/retrieval/queryLog.ts` declares — `outcome`, `timestamp`, `query`, `k`, `hits`, `bestScore`, `abstained`, `refresh`, `durationMs` — with none absent and `outcome` one of `answered`, `refresh-failed`, `search-failed`. |
| `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` unset | The same query set again with the key deleted from the child's environment: the fixture's file listing is byte-for-byte the same set of paths before and after, and the log the other leg wrote is neither re-opened nor extended — the same 20 lines, unchanged. |

**The latencies.** Server-side is each record's own `durationMs`, read back out of the JSONL rather
than out of the client; client-side is the round trip the caller waits for. Library-level arm E is
read out of this file's generated region for the same corpus.

| Figure | p50 ms | p95 ms |
| --- | --- | --- |
| Server-side `durationMs`, from the log | 819.0 | 956.0 |
| Client-side MCP round trip | 822.3 | 959.2 |
| Library-level arm E (`fused-rerank`), `docs/retrieval-eval-results.md` generated region | 1145.3 | 1263.5 |
| Library-level arm E as the region stood when this pass ran, since regenerated | 600.7 | 748.2 |
| Client-side round trip of the `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` unset leg, for comparison | 873.2 | 908.8 |

**What the server answered, read back out of the JSONL.** 13 of the 20 records carry `abstained: false`
with `hits` in {5} and a `bestScore` no lower than `0.33899036049842834`; the other 7 carry
`abstained: true` with `hits: 0` and `bestScore: null`, which is the shape an abstention takes in
this log.

**The gap, and its two causes.** Server-side against library-level arm E, the gap is -326.3 ms at
p50 and -307.5 ms at p95, so the server-side figure sits below the published library-level arm rather
than above it, and the two things only this pass's calls carry — the per-call incremental refresh,
which re-reads and re-hashes the whole corpus before every search, and the MCP round trip, 3.3 ms of
it at p50 — are smaller than the run-to-run variation of one reranker-bound call, which is what the
difference between the two rows is made of. See the repeatability note below. That 3.3 ms is the
client-side figure above minus the server-side one. Neither is the dominant term at this corpus
size: both rows are reranker-bound, and each query was called once.

**What the refresh costs after the first call.** The first call of a server is also its cold build:
`{ embedded: 177, unchanged: 0, deleted: 0 }`. Every later call reports `{ embedded: 0, unchanged: 177, deleted: 0 }`
on 19 of them — nothing re-embedded, so what the per-call refresh costs from the second call on is
the corpus walk and the hash comparison alone.

**Provenance.** 7 of the 20 calls abstained. Both legs ran with
`AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` deleted from the child's environment, so the child loaded
the real embedder `Xenova/bge-small-en-v1.5` and the real reranker `Xenova/ms-marco-MiniLM-L-6-v2`;
the abstention threshold in force is the one this checkout's `search.js` carries. This pass ran at
its own corpus snapshot `{ files: 13, chunks: 177 }`, off the cold build's own counts, while
library-level arm E above was taken at `{ files: 13, chunks: 177 }` under threshold `0.32`
(2026-09-21T19:00:20.828Z) — the same stamp as this pass, but a separate run of a reranker-bound
call, so the two latency rows are read as server-side against library-level and never as a
before/after pair. Host `darwin 24.6.0`, Node
`v20.19.5`, 2026-09-21T18:18:03.552Z. The pass is `runQueryLogPass` in
`evals/docs-retrieval/query-log-pass.mjs`, driven through a launcher under the run's scratch
directory that calls it with the eval's own parsed arguments for this corpus, whose body is
`docs/retrieval-eval.md` → `### The cold-build and query-log launchers`:

```
bash scripts/scratch-run.sh harness-runs/scratch/query-log-pass.mjs
```

**Repeatability, and why the gap above is a ceiling rather than a measurement.** The pass ran five
times on this tree while it was being built, back to back on the same host, with the same models and
the same 20 queries. Server-side p50 came out `575`, `637`, `649`, `702` and `819` ms and p95 `816`,
`819`, `842`, `917` and `956` ms, in run order — the p50 rising about 42% across the five and the p95
about 17%, on a laptop whose load rose with each run. The table above publishes the last of the
five, so its gap against library-level arm E is the narrowest of the five rather than the
representative one: every one of the five server-side p50s sat **below** that arm. What the series
does establish is that the per-call refresh and the MCP round trip are small against a
reranker-bound call — the round trip is 1.8-3.3 ms of client-side overhead in every one of the five,
and the refresh re-embeds nothing after the first call. What it does not establish is a stable figure for
the gap; that needs repetitions on an idle host, and no run recorded in this file has taken them. The
real-catalog hand run recorded in `## Cold build and index size` is not that run either: it timed cold
builds and put two queries through the search path, not a repeated latency series.

## Arm A — awaiting a hand run

**What arm A measures.** Index-first navigation by an agent: the alternative the docs-retrieval tool
has to beat. An agent is started in a documentation catalog with a read-only tool set, told to read
that catalog's `INDEX.md` first and to answer with nothing but the `path#heading` references of the
sections it would use — the same `ref` spelling the query sets label and the other arms return — so
recall, MRR and latency are computed over its answer by the same code that scores arms B–E. Its cost
column is the one that is not `local`: an arm A run bills agent tokens, and the transcript carries
each invocation's usage block.

**No arm A number is recorded on this branch, and the run that built its harness made no `claude -p`
call at all.** Arm A needs a nested agent subprocess, and the unattended permission profile carries
no grant for the agent binary; per that profile's own `_README` a tool call matching neither `allow`
nor `deny` stalls in print mode rather than prompting, so an unattended attempt would hang the run
instead of reporting a refusal. The scratch-runner route to the same subprocess was technically open
and was declined on purpose: it would have put an unsupervised nested agent session, with its own
auth and no token cap, inside an unattended run in order to take a measurement. The arm's row above
therefore reads *awaiting hand run* rather than carrying a zero.

**What is committed, and what fills the row.** The harness is built and exercised:

- `evals/docs-retrieval/arm-a/agent-task.md` — the task text the agent is given, with one
  substitution token for the query.
- `evals/docs-retrieval/arm-a/run-arm-a.sh` — the invocation an operator runs by hand, one agent call
  per query, appending one transcript record each.
- `evals/docs-retrieval/arm-a/score-transcript.mjs` — transcript to arm A records, which the eval
  runner scores through the same `scoreArm` call every other arm goes through.
- `evals/docs-retrieval/arm-a/sample-transcript.json` — a hand-written three-record transcript, with
  invented usage figures, that the scorer is exercised against without an agent. Nothing in this file
  is taken from it.

The row is filled by re-running the eval with `--out` and `--transcript` against a real transcript,
which regenerates the table from the same rendering path as every other row. It is never hand-edited:
the generated region has one writer, and the next `--out` run destroys anything typed into it.

**One corpus, and one reason for it.** Arm A is defined over `fixture-catalog` alone: it navigates
from an `INDEX.md`, that corpus carries its own, and this repository's `docs/` has none. The
`self-docs` table renders an arm A row because the table walks the declared arms for every corpus;
that row stays empty after a hand run too, and awaits a catalog with an index rather than a run.

**The procedure is its companion document's.** `docs/retrieval-eval.md` → `## Running arm A by hand`
owns how to produce that transcript: the preconditions, the commands and what to do with the output.
It is not restated here.
