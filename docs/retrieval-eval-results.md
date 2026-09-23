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
| B | `lexical` | 0.444 | 0.889 | 1.000 | 0.657 | 1.000 | 0.606 | 0.5 | 4.1 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.778 | 1.000 | 1.000 | 0.889 | 1.000 | 0.806 | 5.4 | 6.3 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| D | `fused` | 0.556 | 1.000 | 1.000 | 0.759 | 1.000 | 0.685 | 5.7 | 6.7 | local — no billed tokens (12 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.444 | 0.667 | 0.667 | 0.556 | 0.667 | 0.556 | 561.7 | 636.3 | local — no billed tokens (12 embed calls, 12 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its rows are
filled by re-running the eval with one `--transcript` per variant against a hand-run transcript, per the
procedure in `docs/retrieval-eval.md` → `## Running arm A by hand`. The arm A rows, when present, are each
scored from the **first repetition's** transcript of that variant; the spread across repetitions is
hand-written below the end marker.

The `cost` column is not a score, and **the arms' scores are not comparable across rows**: the non-reranking
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
  under it joins the corpus that measures it — and where that root is this checkout's own `docs/`, this
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
- Host `darwin 24.6.0`, Node `v20.19.5`, 2026-09-23T19:26:59.227Z.

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
  "generatedAt": "2026-09-23T19:26:59.227Z",
  "host": "darwin 24.6.0",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "variant": null,
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
          "p50": 0.547874999999749,
          "p95": 4.059624999999869
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
              4.059624999999869
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
            "bestRerankScore": null,
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
              0.816124999999829
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
            "bestRerankScore": null,
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
              0.5768339999999625
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
            "bestRerankScore": null,
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
              0.6013749999997344
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
            "bestRerankScore": null,
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
              0.5461669999999685
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
            "bestRerankScore": null,
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
              0.5002500000000509
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
            "bestRerankScore": null,
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
              0.547874999999749
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
            "bestRerankScore": null,
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
              0.5315000000000509
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
            "bestRerankScore": null,
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
              0.5357500000000073
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
            "bestRerankScore": null,
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
              0.5872089999998025
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              0.2072920000000522
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
              0.5613329999996495
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
          "p50": 5.411375000000135,
          "p95": 6.339042000000063
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
              5.081625000000258
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
            "bestRerankScore": null,
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
              6.033166000000165
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
            "bestRerankScore": null,
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
              4.906500000000051
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
            "bestRerankScore": null,
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
              5.683708000000024
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
            "bestRerankScore": null,
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
              5.78933300000017
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
            "bestRerankScore": null,
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
              5.411375000000135
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
            "bestRerankScore": null,
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
              6.339042000000063
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
            "bestRerankScore": null,
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
              5.949249999999665
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
            "bestRerankScore": null,
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
              5.928000000000338
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
            "bestRerankScore": null,
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
              4.454833000000235
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
              5.226709000000028
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
              5.3737500000002
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
          "p50": 5.734709000000294,
          "p95": 6.682625000000371
        },
        "samples": 12,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
              6.267917000000125
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
            "bestRerankScore": null,
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
              6.682625000000371
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
            "bestRerankScore": null,
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
              5.530875000000378
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
            "bestRerankScore": null,
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
              5.734709000000294
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
            "bestRerankScore": null,
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
              5.924207999999908
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
            "bestRerankScore": null,
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
              5.483750000000327
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
            "bestRerankScore": null,
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
              5.881582999999864
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
            "bestRerankScore": null,
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
              5.91537500000004
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
            "bestRerankScore": null,
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
              5.749459000000115
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
            "bestRerankScore": null,
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
              5.361541000000216
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03076923076923077
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
              5.161833000000115
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
              5.322624999999789
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
          "p50": 561.7407920000005,
          "p95": 636.2764169999991
        },
        "samples": 12,
        "abstainedOnNegative": 3,
        "perQuery": [
          {
            "id": "q-fc-route-choice",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9988245368003845,
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
              516.178375
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
            "bestRerankScore": 0.9811885952949524,
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
              483.60612500000025
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
            "bestRerankScore": 0.941379964351654,
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
              583.0760419999997
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
            "bestRerankScore": 0.9988497495651245,
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
              525.4331669999992
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
            "bestRerankScore": 0.00004109544534003362,
            "hits": [],
            "durationMs": [
              561.7407920000005
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
            "bestRerankScore": 0.0007010828121565282,
            "hits": [],
            "durationMs": [
              533.0116669999998
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
            "bestRerankScore": 0.5472269654273987,
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
              606.0804579999995
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
            "bestRerankScore": 0.07702871412038803,
            "hits": [],
            "durationMs": [
              612.6759579999998
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
            "bestRerankScore": 0.983818769454956,
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
              636.2764169999991
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
            "bestRerankScore": 0.00018444025772623718,
            "hits": [],
            "durationMs": [
              626.1063330000006
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-lattice",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00001332825831923401,
            "hits": [],
            "durationMs": [
              625.3889170000002
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-fc-negative-datastore",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.1376960277557373,
            "hits": [],
            "durationMs": [
              240.04858400000012
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
| B | `lexical` | 0.333 | 0.600 | 0.867 | 0.501 | 0.600 | 0.301 | 2.1 | 5.2 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.533 | 0.600 | 0.667 | 0.569 | 0.333 | 0.247 | 7.4 | 8.7 | local — no billed tokens (20 embed calls, 0 rerank calls) |
| D | `fused` | 0.533 | 0.733 | 0.800 | 0.639 | 0.667 | 0.363 | 7.9 | 10.6 | local — no billed tokens (20 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.467 | 0.600 | 0.600 | 0.533 | 0.533 | 0.383 | 1005.1 | 1225.7 | local — no billed tokens (20 embed calls, 20 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its rows are
filled by re-running the eval with one `--transcript` per variant against a hand-run transcript, per the
procedure in `docs/retrieval-eval.md` → `## Running arm A by hand`. The arm A rows, when present, are each
scored from the **first repetition's** transcript of that variant; the spread across repetitions is
hand-written below the end marker.

The `cost` column is not a score, and **the arms' scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

**Provenance.**

- Corpus `self-docs` — snapshot `{ files: 14, chunks: 213 }`,
  as the index build of this run reported it. A figure over `self-docs` is read with this stamp beside it;
  two figures carrying different stamps are not a before/after pair.
- `docs.root`: `docs`, as the runner set it (the eval owns the retrieval gate and
  `docs.root` alone).
- The corpus is *every* `*.md` under that `docs.root`, with no file filtered out, so a document added
  under it joins the corpus that measures it — and where that root is this checkout's own `docs/`, this
  file, `docs/retrieval-eval-results.md`, is one of its members and is counted in the stamp above. A stamp
  taken before such a document existed is therefore a different corpus.
- `layers[]`, read out of the resolved checkout's `harness.config.json` and never composed here:
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
- Host `darwin 24.6.0`, Node `v20.19.5`, 2026-09-23T19:27:46.757Z.

```json
{
  "corpus": "self-docs",
  "snapshot": {
    "files": 14,
    "chunks": 213
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
  "generatedAt": "2026-09-23T19:27:46.757Z",
  "host": "darwin 24.6.0",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "variant": null,
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
          "3": 0.6,
          "5": 0.8666666666666667
        },
        "mrr": 0.5011111111111111,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.3333333333333333,
            "5": 0.6
          },
          "mrr": 0.30111111111111116
        },
        "latency": {
          "p50": 2.0999159999992116,
          "p95": 5.244708999998693
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#4-stack-detection",
                "score": 0.015625
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.977875000000495
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/watcher.md#2-the-scripts",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#output-logging-and-errors",
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
              2.179374999999709
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
                "ref": ".claude/context/cli.md#one-example--the-shape-a-rule-takes-here",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/cli.md#not-determined",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.2333749999997963
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
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
              2.0999159999992116
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
            "bestRerankScore": null,
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
              2.799250000000029
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
            "bestRerankScore": null,
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
                "ref": "docs/retrieval-eval-results.md#the-real-catalog-query-set",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              4.224792000000889
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
            "bestRerankScore": null,
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
                "ref": ".claude/context/plugin.md#registries--a-name-routed-to-an-implementation",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/conventions.md#output-logging-and-errors",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.0766660000008414
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
            "bestRerankScore": null,
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
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.1824169999999867
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
            "bestRerankScore": null,
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
                "ref": "docs/cli.md#9-daemon",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.463958000000275
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-shipped-default-against-fusion-alone",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval.md#running-arm-a-by-hand",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.015625
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.8849999999983993
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--the-real-catalog-hand-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-limits-stated-with-the-verdict",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval.md#what-to-do-with-the-result",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.608250000001135
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval.md#the-tool-set-and-the-network",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/cli.md#10-how-this-is-tested",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.2160829999993439
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
              2.062292000002344
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
            "bestRerankScore": null,
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
              3.5649579999990237
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
            "bestRerankScore": null,
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
              5.244708999998693
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/guard-verification.md#2-standing-decision-matrices",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.1165000000000873
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-pre-calibration-distributions-quoted",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.015625
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7653750000026776
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md#what-it-costs",
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
              2.361457999999402
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.015625
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.85241600000154
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/analyze.md#6-what-it-could-not-determine",
                "score": 0.015625
              },
              {
                "ref": "docs/guard-verification.md#3-decision-changes-across-the-port",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.1239580000001297
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
          "3": 0.6,
          "5": 0.6666666666666666
        },
        "mrr": 0.5688888888888889,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.26666666666666666,
            "5": 0.3333333333333333
          },
          "mrr": 0.24666666666666667
        },
        "latency": {
          "p50": 7.354125000001659,
          "p95": 8.662374999999884
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
              7.7019579999978305
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
            "bestRerankScore": null,
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
              7.840250000001106
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
            "bestRerankScore": null,
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
              7.037124999998923
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
            "bestRerankScore": null,
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
                "ref": "docs/typecheck-key-decision.md#2-what-depends-on-the-key-existing",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.858125000002474
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval.md#how-to-run-it",
                "score": 0.016129032258064516
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/watcher.md#the-path",
                "score": 0.015625
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.772709000000759
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
            "bestRerankScore": null,
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
              6.919666999998299
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
            "bestRerankScore": null,
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
              7.0552500000012515
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
            "bestRerankScore": null,
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
              7.268374999999651
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
            "bestRerankScore": null,
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
              6.8723749999990105
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
            "bestRerankScore": null,
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
              7.354125000001659
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-verdict",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval.md#still-open",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-limits-stated-with-the-verdict",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#findings-about-the-rule-recorded-and-not-acted-on",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.7665000000015425
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval.md#the-tool-set-and-the-network",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-limits-stated-with-the-verdict",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--the-real-catalog-hand-run",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.269792000002781
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
            "bestRerankScore": null,
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
              7.307084000000032
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
            "bestRerankScore": null,
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
              8.006291999998211
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
            "bestRerankScore": null,
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
              8.662374999999884
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
            "bestRerankScore": null,
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
                "ref": "docs/config.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/config.md#4-token--class--home",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#4-userconfig-reserved",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.807791999999608
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
                "ref": "docs/retrieval-eval-results.md#the-177-chunk-build--this-repositorys-own-docs-2026-09-21",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-two-bounds-that-fixed-the-choice",
                "score": 0.015625
              },
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.344375000000582
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/development.md",
                "score": 0.01639344262295082
              },
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/development.md#1-source-types-and-the-plugin-root",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval.md#the-cold-build-and-query-log-launchers",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.84270800000013
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#how-arm-a-navigated-a-156-file-catalog",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/retrieval-eval.md#the-command",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/retrieval-eval-results.md#cost",
                "score": 0.015625
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--the-real-catalog-hand-run",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.216334000000643
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
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
              8.381083000000217
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
          "3": 0.7333333333333333,
          "5": 0.8
        },
        "mrr": 0.6388888888888888,
        "strict": {
          "recall": {
            "1": 0.2,
            "3": 0.5333333333333333,
            "5": 0.6666666666666666
          },
          "mrr": 0.36333333333333334
        },
        "latency": {
          "p50": 7.948208000001614,
          "p95": 10.603707999998733
        },
        "samples": 20,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.030776515151515152
              },
              {
                "ref": "docs/typecheck-key-decision.md#3-can-another-family-reach-this-state",
                "score": 0.03009207275993712
              },
              {
                "ref": "docs/cli.md#8-config",
                "score": 0.0288981288981289
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.027745885954841176
              }
            ],
            "durationMs": [
              8.711875000000873
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03177805800756621,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-deny-guard",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.03278688524590164
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
                "score": 0.028790389395194696
              }
            ],
            "durationMs": [
              7.598375000001397
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.031544957774465976
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.030330882352941176
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
              8.897874999998749
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/typecheck-key-decision.md#1-the-bind",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/typecheck-key-decision.md#4-option-a--make-the-key-optional",
                "score": 0.03036576949620428
              },
              {
                "ref": "docs/typecheck-key-decision.md#5-option-b--an-explicit-none-sentinel",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.029411764705882353
              }
            ],
            "durationMs": [
              10.995542000000569
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03128054740957967,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-sd-state-dir",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/watcher.md#for-a-consumer-written-in-typescript",
                "score": 0.030536130536130537
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.028693528693528692
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.02681010928961749
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.026625704045058884
              }
            ],
            "durationMs": [
              7.936750000000757
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.03278688524590164
              },
              {
                "ref": ".claude/context/plugin.md#what-this-layer-is",
                "score": 0.02904040404040404
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.028949545078577336
              },
              {
                "ref": "docs/retrieval-eval-results.md#cold-build-and-index-size",
                "score": 0.028006267136701922
              },
              {
                "ref": "docs/typecheck-key-decision.md#7-recommendation",
                "score": 0.02637768817204301
              }
            ],
            "durationMs": [
              8.12445800000205
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/development.md#3-manifest-facts-a-contributor-must-not-rediscover",
                "score": 0.0315136476426799
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.030158730158730156
              },
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.029551337359792925
              },
              {
                "ref": "docs/guard-verification.md",
                "score": 0.02815814850530376
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.027119252873563218
              }
            ],
            "durationMs": [
              7.994749999998021
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
            "bestRerankScore": null,
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
                "score": 0.029571646010002173
              },
              {
                "ref": "docs/development.md",
                "score": 0.029437229437229435
              }
            ],
            "durationMs": [
              7.393457999998645
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#23-the-recorded-pid-and-what-signalling-it-actually-does",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.030117753623188408
              },
              {
                "ref": "docs/outer-loop-verification.md#15-restart-watchersh",
                "score": 0.02964426877470356
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.02928692699490662
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.027263007840342125
              }
            ],
            "durationMs": [
              7.521958000001177
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03125763125763126,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/outer-loop-verification.md#25-the-usage-gate",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/watcher.md#the-policy-a-coordinating-record-and-an-opt-in-lock",
                "score": 0.03021353930031804
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.027972027972027972
              }
            ],
            "durationMs": [
              7.948208000001614
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-limits-stated-with-the-verdict",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--the-real-catalog-hand-run",
                "score": 0.029726775956284153
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-decision-applied-to-the-real-catalog",
                "score": 0.029437229437229435
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-verdict",
                "score": 0.02724014336917563
              }
            ],
            "durationMs": [
              7.387541000000056
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031754032258064516,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval.md#the-tool-set-and-the-network",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/retrieval-eval.md#running-arm-a-by-hand",
                "score": 0.02877846790890269
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.027364110201042444
              },
              {
                "ref": "docs/retrieval-eval.md#the-decision-rule",
                "score": 0.027346637102734665
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.027252906976744186
              }
            ],
            "durationMs": [
              7.801290999999765
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/analyze.md#4-re-run-and-what-an-interrupted-run-leaves-behind",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/analyze.md",
                "score": 0.02964426877470356
              },
              {
                "ref": "docs/analyze.md#1-the-target-vocabulary",
                "score": 0.02946912242686891
              },
              {
                "ref": "docs/analyze.md#10-what-the-skeletons-say-now-the-offer-exists",
                "score": 0.028991596638655463
              },
              {
                "ref": "docs/analyze.md#3-what-it-may-write",
                "score": 0.028577260665441927
              }
            ],
            "durationMs": [
              7.458000000002357
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 5
          },
          {
            "id": "q-sd-stack-detection",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
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
                "score": 0.02797067901234568
              },
              {
                "ref": ".claude/context/cli.md#how-a-module-in-this-layer-is-written",
                "score": 0.027205882352941177
              },
              {
                "ref": "docs/watcher.md#2-the-scripts",
                "score": 0.026742734890354787
              }
            ],
            "durationMs": [
              10.603707999998733
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.030776515151515152
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.029906956136464335
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.029030910609857977
              },
              {
                "ref": "docs/cli.md#the-interaction-rule",
                "score": 0.02803921568627451
              }
            ],
            "durationMs": [
              9.00787499999933
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
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.02719970792259949
              },
              {
                "ref": "docs/guard-verification.md#14-two-preconditions-the-whole-set-inherits-from-the-configuration-load",
                "score": 0.02712049508554787
              },
              {
                "ref": "docs/config.md#2-where-configuration-lives",
                "score": 0.026767330130404943
              },
              {
                "ref": "docs/config.md",
                "score": 0.026182294223531334
              },
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.024696835255841466
              }
            ],
            "durationMs": [
              8.388874999996915
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.02719970792259949
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#the-pre-calibration-distributions-quoted",
                "score": 0.03021353930031804
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-re-calibration-method-fixed-before-the-real-catalog-run",
                "score": 0.029551337359792925
              },
              {
                "ref": ".claude/context/plugin.md#sample-fixtures",
                "score": 0.027417840375586856
              },
              {
                "ref": ".claude/context/cli.md#dependencies-and-which-way-they-point",
                "score": 0.02574682290807064
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.025679012345679014
              }
            ],
            "durationMs": [
              7.059708000000683
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03021353930031804
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/development.md#6-the-roadmap-this-tree-defers-to",
                "score": 0.029910714285714284
              },
              {
                "ref": "docs/development.md#1-source-types-and-the-plugin-root",
                "score": 0.029030910609857977
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.028629032258064516
              },
              {
                "ref": "docs/retrieval.md#how-it-fits-together",
                "score": 0.02546333601933924
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.024449182658137884
              }
            ],
            "durationMs": [
              8.20350000000326
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.029910714285714284
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--the-real-catalog-hand-run",
                "score": 0.02967032967032967
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-query-log-pass",
                "score": 0.02964254577157803
              },
              {
                "ref": "docs/retrieval-eval-results.md#corpus-self-docs",
                "score": 0.02886002886002886
              },
              {
                "ref": "docs/retrieval-eval.md#the-command",
                "score": 0.027637721755368813
              },
              {
                "ref": "docs/retrieval-eval.md#the-decision-rule",
                "score": 0.02715098147128967
              }
            ],
            "durationMs": [
              7.76129199999923
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.02967032967032967
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.03200204813108039
              },
              {
                "ref": ".claude/context/conventions.md#the-stack-in-the-words-the-rules-below-use",
                "score": 0.02886002886002886
              },
              {
                "ref": "docs/outer-loop-verification.md#26-the-stall-watchdog",
                "score": 0.027346637102734665
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.027271052146674038
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.02574441687344913
              }
            ],
            "durationMs": [
              8.214374999999563
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03200204813108039
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
          "1": 0.4666666666666667,
          "3": 0.6,
          "5": 0.6
        },
        "mrr": 0.5333333333333333,
        "strict": {
          "recall": {
            "1": 0.26666666666666666,
            "3": 0.4666666666666667,
            "5": 0.5333333333333333
          },
          "mrr": 0.38333333333333336
        },
        "latency": {
          "p50": 1005.1416669999999,
          "p95": 1225.719041999997
        },
        "samples": 20,
        "abstainedOnNegative": 5,
        "perQuery": [
          {
            "id": "q-sd-new-config-key",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.24328240752220154,
            "hits": [],
            "durationMs": [
              1373.8354580000014
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
            "bestRerankScore": 0.8057302832603455,
            "hits": [
              {
                "ref": "docs/outer-loop-verification.md#3-the-allowdeny-surface",
                "score": 0.8057302832603455
              },
              {
                "ref": "docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls",
                "score": 0.7180002927780151
              },
              {
                "ref": "docs/guard-verification.md#32-tightened--silent--deny",
                "score": 0.6071503162384033
              },
              {
                "ref": "docs/guard-verification.md#37-the-sweep-behind-the-verdict",
                "score": 0.518258273601532
              },
              {
                "ref": "docs/guard-verification.md#24-disclosed-residuals-re-confirmed",
                "score": 0.3597424030303955
              }
            ],
            "durationMs": [
              1225.719041999997
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8057302832603455,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-new-subcommand",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9983586072921753,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.9983586072921753
              },
              {
                "ref": ".claude/context/cli.md#naming-and-file-layout",
                "score": 0.9492279291152954
              },
              {
                "ref": ".claude/context/cli.md#not-determined",
                "score": 0.8436465263366699
              },
              {
                "ref": ".claude/context/cli.md#what-done-means-here",
                "score": 0.6837409138679504
              },
              {
                "ref": ".claude/context/plugin.md#what-accompanies-a-new-unit-of-each-kind",
                "score": 0.6426020860671997
              }
            ],
            "durationMs": [
              936.8634580000034
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9983586072921753,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-run-gates",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.15524116158485413,
            "hits": [],
            "durationMs": [
              1042.9682090000024
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
            "bestRerankScore": 0.9111862778663635,
            "hits": [
              {
                "ref": "docs/config.md#3-statedir",
                "score": 0.9111862778663635
              },
              {
                "ref": ".claude/context/plugin.md#a-worked-example",
                "score": 0.8781256675720215
              },
              {
                "ref": "docs/retrieval-eval.md#how-to-run-it",
                "score": 0.5213450193405151
              },
              {
                "ref": "docs/config.md#1-the-three-resolution-classes",
                "score": 0.4460771083831787
              },
              {
                "ref": "docs/development.md#2-the-one-authoring-rule-that-follows",
                "score": 0.30296963453292847
              }
            ],
            "durationMs": [
              930.338291
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9111862778663635,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-commit-prefix",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7109293937683105,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#commit-message-policy",
                "score": 0.7109293937683105
              },
              {
                "ref": ".claude/context/plugin.md#the-commit-message-policy",
                "score": 0.0029896805062890053
              },
              {
                "ref": "docs/outer-loop-verification.md#11-commit-on-branchsh--refuses-loudly",
                "score": 0.000785926531534642
              },
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.00040577547042630613
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-real-catalog-query-set",
                "score": 0.00024948405916802585
              }
            ],
            "durationMs": [
              1000.4068340000013
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7109293937683105,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-guard-shell-options",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9819909930229187,
            "hits": [
              {
                "ref": ".claude/context/conventions.md#shell-assets",
                "score": 0.9819909930229187
              },
              {
                "ref": ".claude/context/plugin.md#guards-the-shared-library-and-the-helper-scripts",
                "score": 0.9790743589401245
              },
              {
                "ref": "docs/guard-verification.md",
                "score": 0.6797285079956055
              },
              {
                "ref": "docs/guard-verification.md#3-decision-changes-across-the-port",
                "score": 0.037053581327199936
              },
              {
                "ref": "docs/outer-loop-verification.md",
                "score": 0.012145236134529114
              }
            ],
            "durationMs": [
              989.5380409999998
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9819909930229187,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-sd-cross-asset-reference",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9992165565490723,
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
              911.4661669999987
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
            "bestRerankScore": 0.9138407707214355,
            "hits": [
              {
                "ref": "docs/watcher.md#1-the-loop-in-one-page",
                "score": 0.9138407707214355
              },
              {
                "ref": "docs/cli.md#9-daemon",
                "score": 0.4520930349826813
              },
              {
                "ref": "docs/outer-loop-verification.md#15-restart-watchersh",
                "score": 0.04150214418768883
              },
              {
                "ref": "docs/watcher.md#4-pausing-parking-and-the-usage-gate",
                "score": 0.026958728209137917
              },
              {
                "ref": "docs/outer-loop-verification.md#24-resume-guards-and-the-machine-lane",
                "score": 0.01880623959004879
              }
            ],
            "durationMs": [
              1005.1416669999999
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9138407707214355,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-usage-limit",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9861159920692444,
            "hits": [
              {
                "ref": "docs/watcher.md#5-machine-level-usage-lane",
                "score": 0.9861159920692444
              },
              {
                "ref": "docs/retrieval-eval.md#running-arm-a-by-hand",
                "score": 0.2905900180339813
              },
              {
                "ref": "docs/retrieval-eval-results.md#arm-a--the-real-catalog-hand-run",
                "score": 0.054613836109638214
              },
              {
                "ref": "docs/cli.md#offline-by-construction",
                "score": 0.03134392574429512
              },
              {
                "ref": "docs/development.md#5-verifying-a-change",
                "score": 0.02898281067609787
              }
            ],
            "durationMs": [
              1043.0520830000023
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9861159920692444,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-search-abstains",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7631139755249023,
            "hits": [
              {
                "ref": "docs/cli.md#docs-search",
                "score": 0.7631139755249023
              },
              {
                "ref": "docs/cli.md#docs-serve",
                "score": 0.526432991027832
              },
              {
                "ref": "docs/retrieval-eval-results.md#the-decision-applied-to-the-real-catalog",
                "score": 0.09138792008161545
              },
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.07652298361063004
              },
              {
                "ref": "docs/retrieval-eval.md#the-regression-floor",
                "score": 0.0535120852291584
              }
            ],
            "durationMs": [
              964.9970829999984
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7631139755249023,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-sd-retrieval-network",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7951579093933105,
            "hits": [
              {
                "ref": "docs/cli.md#11-docs",
                "score": 0.7951579093933105
              },
              {
                "ref": "docs/retrieval-eval.md#the-tool-set-and-the-network",
                "score": 0.6725423336029053
              },
              {
                "ref": "docs/retrieval-eval.md#the-decision-rule",
                "score": 0.4319179356098175
              },
              {
                "ref": "docs/cli.md#docs-index",
                "score": 0.37600526213645935
              },
              {
                "ref": "docs/retrieval.md#what-this-buys-you",
                "score": 0.2824769616127014
              }
            ],
            "durationMs": [
              1018.970916000002
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7951579093933105,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-sd-analyze-writes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.33899036049842834,
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
              1024.2666669999999
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
            "bestRerankScore": 0.9918370842933655,
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
              1040.5277080000014
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
            "bestRerankScore": 0.9616067409515381,
            "hits": [
              {
                "ref": "docs/cli.md#generator-order-and-why-it-is-load-bearing",
                "score": 0.9616067409515381
              },
              {
                "ref": "docs/cli.md#3-the-re-run-contract",
                "score": 0.9535205364227295
              },
              {
                "ref": "docs/cli.md#2-init",
                "score": 0.45493796467781067
              },
              {
                "ref": "docs/outer-loop-verification.md#0-method-and-fixtures",
                "score": 0.06281641870737076
              },
              {
                "ref": "docs/config.md#5-key-reference",
                "score": 0.05283895507454872
              }
            ],
            "durationMs": [
              1003.6414169999989
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9616067409515381,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-sd-negative-ingress",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00044672354124486446,
            "hits": [],
            "durationMs": [
              1070.6860410000008
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-tungsten",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.000015803376300027594,
            "hits": [],
            "durationMs": [
              998.2851659999942
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-blog",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00018704720423556864,
            "hits": [],
            "durationMs": [
              971.2930830000041
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-grpc",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.28913185000419617,
            "hits": [],
            "durationMs": [
              1010.2905420000025
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-sd-negative-migration",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00026293908013030887,
            "hits": [],
            "durationMs": [
              1073.9271249999947
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

<!-- eval:corpus:gate10-catalog:start -->
### Corpus `gate10-catalog`

| Arm | Mode | recall@1 | recall@3 | recall@5 | MRR | strict recall@5 | strict MRR | p50 ms | p95 ms | cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-index | — | 0.386 | 0.432 | 0.432 | 0.409 | 0.432 | 0.343 | 9000.0 | 15000.0 | agent hand run over 69 queries — cache_creation_input_tokens 3198348, cache_read_input_tokens 9171364, input_tokens 520, output_tokens 35867 |
| A-search | — | 0.773 | 0.886 | 0.909 | 0.835 | 0.909 | 0.756 | 11000.0 | 18000.0 | agent hand run over 69 queries — cache_creation_input_tokens 1703099, cache_read_input_tokens 8062476, input_tokens 570, output_tokens 42755 |
| B | `lexical` | 0.636 | 0.864 | 0.909 | 0.753 | 0.705 | 0.588 | 1.7 | 3.6 | local — no billed tokens (0 embed calls, 0 rerank calls) |
| C | `vector` | 0.432 | 0.682 | 0.841 | 0.579 | 0.659 | 0.424 | 9.7 | 14.2 | local — no billed tokens (69 embed calls, 0 rerank calls) |
| D | `fused` | 0.659 | 0.818 | 0.841 | 0.732 | 0.659 | 0.522 | 10.8 | 16.4 | local — no billed tokens (69 embed calls, 0 rerank calls) |
| E | `fused-rerank` | 0.591 | 0.750 | 0.795 | 0.677 | 0.682 | 0.494 | 1099.7 | 1269.3 | local — no billed tokens (69 embed calls, 69 rerank calls) |

Arm A is index-first navigation by an agent. It is built and deliberately not run by this eval; its rows are
filled by re-running the eval with one `--transcript` per variant against a hand-run transcript, per the
procedure in `docs/retrieval-eval.md` → `## Running arm A by hand`. The arm A rows, when present, are each
scored from the **first repetition's** transcript of that variant; the spread across repetitions is
hand-written below the end marker.

The `cost` column is not a score, and **the arms' scores are not comparable across rows**: the non-reranking
modes report rank-derived reciprocal-rank-fusion values in the `0.004`–`0.033` range, while the reranking mode
reports calibrated `[0, 1]` cross-encoder scores. Compare recall, MRR and latency across rows; compare scores only
within a row.

**Provenance.**

- Corpus `gate10-catalog` — snapshot `{ files: 156, chunks: 1960 }`,
  as the index build of this run reported it. A figure over `gate10-catalog` is read with this stamp beside it;
  two figures carrying different stamps are not a before/after pair.
- `docs.root`: `docs`, as the runner set it (the eval owns the retrieval gate and
  `docs.root` alone).
- The corpus is *every* `*.md` under that `docs.root`, with no file filtered out, so a document added
  under it joins the corpus that measures it — and where that root is this checkout's own `docs/`, this
  file, `docs/retrieval-eval-results.md`, is one of its members and is counted in the stamp above. A stamp
  taken before such a document existed is therefore a different corpus.
- `layers[]`, read out of the resolved checkout's `harness.config.json` and never composed here:
  - `ad-hoc-1` (path `.`) → `.claude/context/conventions.md`
- Query set: `evals/docs-retrieval/queries/gate10-catalog.jsonl` — 44 positive, 25 negative.
- `k`: 5; repetitions per query: 1.
- Embedder: `Xenova/bge-small-en-v1.5:q8:cls:384:v1`. Reranker: `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1` — loaded and run outside the stub.
- `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset for this run, which the index build refuses to proceed without.
- Abstention threshold in force: `0.32`, read off the `search.js` this run loaded.
- The figures above are the **post-calibration** ones for the one arm that threshold applies to. The
  pre-calibration per-query distributions the value was chosen from are quoted in `## Threshold
  calibration` below, taken at the earlier snapshot that section records by corpus name and chunk count —
  so both variables that moved between the two readings, the threshold and the corpus, are named.
- Host `darwin 24.6.0`, Node `v20.19.5`, 2026-09-23T18:49:10.704Z.

```json
{
  "corpus": "gate10-catalog",
  "snapshot": {
    "files": 156,
    "chunks": 1960
  },
  "abstainScoreThreshold": 0.32,
  "embedder": "Xenova/bge-small-en-v1.5:q8:cls:384:v1",
  "reranker": "Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1",
  "k": 5,
  "repeat": 1,
  "queries": {
    "path": "evals/docs-retrieval/queries/gate10-catalog.jsonl",
    "positives": 44,
    "negatives": 25
  },
  "generatedAt": "2026-09-23T18:49:10.704Z",
  "host": "darwin 24.6.0",
  "node": "v20.19.5",
  "arms": [
    {
      "arm": "A",
      "variant": "index",
      "mode": null,
      "ran": true,
      "embedCalls": 0,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 44,
        "negatives": 25,
        "recall": {
          "1": 0.38636363636363635,
          "3": 0.4318181818181818,
          "5": 0.4318181818181818
        },
        "mrr": 0.4090909090909091,
        "strict": {
          "recall": {
            "1": 0.2727272727272727,
            "3": 0.4090909090909091,
            "5": 0.4318181818181818
          },
          "mrr": 0.34280303030303033
        },
        "latency": {
          "p50": 9000,
          "p95": 15000
        },
        "samples": 69,
        "abstainedOnNegative": 25,
        "perQuery": [
          {
            "id": "q-g10-ew-gift-community-post",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              18000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-sendgift-chat-side-effects",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/gifting.md#business-behaviour",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/gifting.md#data",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/gifting.md#domain",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-blocked-suggested-creators",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/latest-users.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/block-user.md#domain",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/latest-users.md#domain",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/block-user.md#flutter-parity-source-of-truth",
                "score": 0.25
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-new-notification-tap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#presentation",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#flutter-parity-source-of-truth",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/inbox.md",
                "score": 0.25
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-mark-notification-read",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#data",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/inbox.md#data",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#local-state--sync-direction-optimistic-y--for-the-read-flip-only",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#data",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.2
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-reaction-dislike",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#local-state--sync-direction-optimistic-yn",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#presentation",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#domain",
                "score": 0.25
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-watch-later-feed-signal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/feed-discovery.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#cloud-functions",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#domain",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#cloud-functions",
                "score": 0.2
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-deleted-account-subcollection",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#data",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#cloud-functions",
                "score": 0.5
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-recent-signin-withdraw",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#domain",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#flutter-parity-source-of-truth",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#presentation",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#local-state--sync-direction-optimistic-n",
                "score": 0.2
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-second-browser-login",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#how-it-works",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/login-session.md#invoked-from",
                "score": 0.2
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-video-call-ended-summary",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/video-call.md#presentation",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/video-call.md#domain",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.25
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-firestore-to-typed",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#data",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#how-it-works",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#domain",
                "score": 0.2
              }
            ],
            "durationMs": [
              17000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-tojson-optional-keys",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#tojsondto-jsonobject--the-parity-bound-write-direction",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#flutter-parity",
                "score": 0.25
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-withdraw-confirm-modal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#flutter-parity-source-of-truth",
                "score": 0.5
              }
            ],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdrawal-labels-romanian",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#how-it-works",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#what-it-is--why",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#gotchas--constraints",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#flutter-parity",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-hardcoded-padding-colour",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#responsive",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#theme",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#where-its-used",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-new-page-back-title",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#anatomy--one-box-a-backdrop-three-cells",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#props-expauseappbarprops",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#where-its-used",
                "score": 0.2
              }
            ],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-console-error-catch",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#log-call--level-routing-the-key-behaviour",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#source-prefix-convention",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-new-callable-unwrap",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-callable-exists-check",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callable-name-registry--names-must-match-an-export",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#web-unreachable-callables-deployed--flutter-callable-but-no-web-caller--20",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#anchor-files",
                "score": 0.25
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-unlock-payload",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#cloud-functions",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#data",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#domain",
                "score": 0.25
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-photo-comment-reply",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#cloud-functions",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#business-behaviour",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#data",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-group-room-agora-token",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-staging-build",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-dev-api-forward",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-github-pages-subpath",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-wsl-file-save",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-stale-chunk-deploy",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-linked-ui-package",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-admin-html-entry",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-plugin-package-name",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-virtual-routes",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-src-alias",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/clean-architecture.md#gotchas--constraints",
                "score": 1
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-robots-favicon",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-build-only-plugin",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-scoped-card-styles",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              18000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-client-env-undefined",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-config-reads-env",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-health-middleware",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-build-sha-meta",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-mock-updated-event",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-rails-manifest-tags",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-login-sms-2fa",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-typing-indicator",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-voice-message",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-edit-message",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-group-chat",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-playback-speed",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-profile-qr-code",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-coin-promo-code",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-expiring-stories",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-pin-comment",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-storybook-stories",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-callable-app-check",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-precompress",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-obfuscate",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-server-mock",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-vite-sitemap",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-image-webp",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-terraform-state-lock",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-postgres-autovacuum",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-android-keystore",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-kafka-rebalance",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-k8s-ingress-tls",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-pytest-conftest",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-go-private-modules",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-rust-clippy",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-django-squash",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-celery-retry",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          }
        ]
      }
    },
    {
      "arm": "A",
      "variant": "search",
      "mode": null,
      "ran": true,
      "embedCalls": 0,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 44,
        "negatives": 25,
        "recall": {
          "1": 0.7727272727272727,
          "3": 0.8863636363636364,
          "5": 0.9090909090909091
        },
        "mrr": 0.8352272727272727,
        "strict": {
          "recall": {
            "1": 0.6363636363636364,
            "3": 0.8863636363636364,
            "5": 0.9090909090909091
          },
          "mrr": 0.7556818181818182
        },
        "latency": {
          "p50": 11000,
          "p95": 18000
        },
        "samples": 69,
        "abstainedOnNegative": 25,
        "perQuery": [
          {
            "id": "q-g10-ew-gift-community-post",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#invoked-from",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/gifting.md#technical-implementation",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/gifting.md#business-behaviour",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-sendgift-chat-side-effects",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/gifting.md#data",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/gifting.md#business-behaviour",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#payload-parity",
                "score": 0.2
              }
            ],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-blocked-suggested-creators",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/latest-users.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/block-user.md#business-behaviour",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/block-user.md#domain",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/latest-users.md#domain",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-new-notification-tap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#presentation",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#business-behaviour",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#anchor-files",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-mark-notification-read",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#data",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/inbox.md#data",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#local-state--sync-direction-optimistic-y--for-the-read-flip-only",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/inbox.md#local-state--sync-direction-optimistic-partly--success-gated-no-revert-path",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.2
              }
            ],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-reaction-dislike",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#local-state--sync-direction-optimistic-yn",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#pattern-a--optimistic-write-then-revert",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/roadmap-item-like.md#business-behaviour",
                "score": 0.25
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-watch-later-feed-signal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/feed-discovery.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#cloud-functions",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#domain",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#business-behaviour",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#presentation",
                "score": 0.2
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-deleted-account-subcollection",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#data",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#cloud-functions",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/gifting.md#data",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              18000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-recent-signin-withdraw",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#domain",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#local-state--sync-direction-optimistic-n",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#flutter-parity-source-of-truth",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-second-browser-login",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#how-it-works",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.25
              }
            ],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-video-call-ended-summary",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/video-call.md#presentation",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/video-call.md#domain",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.25
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-firestore-to-typed",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#how-it-works",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#domain",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#where-its-used",
                "score": 0.2
              }
            ],
            "durationMs": [
              17000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-tojson-optional-keys",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#tojsondto-jsonobject--the-parity-bound-write-direction",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/submit-feedback.md",
                "score": 0.25
              }
            ],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-withdraw-confirm-modal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#flutter-parity-source-of-truth",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#c-concretely",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#presentation",
                "score": 0.25
              }
            ],
            "durationMs": [
              29000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdrawal-labels-romanian",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#how-it-works",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#anchor-files",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#gotchas--constraints",
                "score": 0.2
              }
            ],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-hardcoded-padding-colour",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#responsive",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#theme",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              16000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-new-page-back-title",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#what-it-is--why",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#anatomy--one-box-a-backdrop-three-cells",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#props-expauseappbarprops",
                "score": 0.25
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#back-affordance--navigatorgobackorfallback",
                "score": 0.2
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-console-error-catch",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#where-its-used",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/analytics-system.md",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-new-callable-unwrap",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-callable-exists-check",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callable-name-registry--names-must-match-an-export",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#flutter-parity",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              18000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-unlock-payload",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#cloud-functions",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#data",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#domain",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#business-behaviour",
                "score": 0.25
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-photo-comment-reply",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#cloud-functions",
                "score": 1
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#data",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#business-behaviour",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-group-room-agora-token",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#what-it-is--why",
                "score": 1
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#2-token-provisioning--the-generatelivestreamtoken-cloud-function",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#where-its-used",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-staging-build",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#modes",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#node_env-and-modes",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-dev-api-forward",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverproxy",
                "score": 1
              },
              {
                "ref": "docs/vite/config/server-options.md#servercors",
                "score": 0.5
              },
              {
                "ref": "docs/vite/config/preview-options.md#previewproxy",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-github-pages-subpath",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#public-base-path",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#github-pages",
                "score": 0.5
              },
              {
                "ref": "docs/vite/config/shared-options.md#base",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/vite/guide/build.md#relative-base",
                "score": 0.25
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-wsl-file-save",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverwatch",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#vite-does-not-detect-a-file-change",
                "score": 0.5
              },
              {
                "ref": "docs/vite/config/build-options.md#buildwatch",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-stale-chunk-deploy",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#version-skew",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#failed-to-fetch-dynamically-imported-module-error",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-linked-ui-package",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#outdated-pre-bundled-deps-when-linking-to-a-local-package",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#monorepos-and-linked-dependencies",
                "score": 0.5
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolve-dedupe",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-admin-html-entry",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 1
              },
              {
                "ref": "docs/vite/config/shared-options.md#input-noninheritbadge",
                "score": 0.5
              },
              {
                "ref": "docs/vite/config/build-options.md#buildrolldownoptions",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              16000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-plugin-package-name",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#conventions",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#authoring-a-plugin",
                "score": 0.5
              }
            ],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-virtual-routes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#importing-a-virtual-file",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#conventions",
                "score": 0.5
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-src-alias",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/clean-architecture.md#gotchas--constraints",
                "score": 1
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#-import-guidelines",
                "score": 0.5
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#clean-imports-with-barrel-exports",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolvealias",
                "score": 0.25
              }
            ],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-g10-vite-robots-favicon",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#the-public-directory",
                "score": 1
              },
              {
                "ref": "docs/vite/config/shared-options.md#publicdir",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-only-plugin",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/using-plugins.md#conditional-application",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/using-plugins.md#enforcing-plugin-ordering",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#conditional-application",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#plugin-ordering",
                "score": 0.25
              }
            ],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-scoped-card-styles",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/features.md#css-modules",
                "score": 1
              },
              {
                "ref": "docs/vite/config/shared-options.md#cssmodules",
                "score": 0.5
              }
            ],
            "durationMs": [
              18000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-client-env-undefined",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-variables",
                "score": 1
              },
              {
                "ref": "docs/vite/config/shared-options.md#envprefix",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-config-reads-env",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/index.md#using-environment-variables-in-config",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#loadenv",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.3333333333333333
              }
            ],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-health-middleware",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#configureserver",
                "score": 1
              }
            ],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-sha-meta",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#transformindexhtml",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.5
              }
            ],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-mock-updated-event",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#server-to-client",
                "score": 1
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#client-server-communication",
                "score": 0.5
              },
              {
                "ref": "docs/vite/guide/api-hmr.md#hotonevent-cb",
                "score": 0.3333333333333333
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#application-plugin-communication",
                "score": 0.25
              }
            ],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-rails-manifest-tags",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/backend-integration.md",
                "score": 1
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.5
              }
            ],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnPositive": 1,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-neg-login-sms-2fa",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              14000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-typing-indicator",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-voice-message",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-edit-message",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-group-chat",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-playback-speed",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-profile-qr-code",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              13000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-coin-promo-code",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-expiring-stories",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              12000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-pin-comment",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-storybook-stories",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-callable-app-check",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-precompress",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-obfuscate",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-server-mock",
            "negative": false,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              15000
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-vite-sitemap",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              10000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-image-webp",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              11000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-terraform-state-lock",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-postgres-autovacuum",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-android-keystore",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-kafka-rebalance",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-k8s-ingress-tls",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-pytest-conftest",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              7000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-go-private-modules",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              8000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-rust-clippy",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              4000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-django-squash",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              9000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-celery-retry",
            "negative": true,
            "abstained": true,
            "bestRerankScore": null,
            "hits": [],
            "durationMs": [
              6000
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          }
        ]
      }
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
        "positives": 44,
        "negatives": 25,
        "recall": {
          "1": 0.6363636363636364,
          "3": 0.8636363636363636,
          "5": 0.9090909090909091
        },
        "mrr": 0.7526515151515152,
        "strict": {
          "recall": {
            "1": 0.5227272727272727,
            "3": 0.6363636363636364,
            "5": 0.7045454545454546
          },
          "mrr": 0.5878787878787879
        },
        "latency": {
          "p50": 1.7179590000014286,
          "p95": 3.578957999998238
        },
        "samples": 69,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-g10-ew-gift-community-post",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#anchor-files",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/INDEX.md#communication",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/gifting.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/gifting.md#data",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/gifting.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              12.91462500000489
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-sendgift-chat-side-effects",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/community-live-streaming.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#cloud-functions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.003667000011774
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-blocked-suggested-creators",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/block-user.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/block-user.md#local-state--sync-direction-optimistic-yn",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/content-management.md#local-state--sync-direction-optimistic-n",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/settings.md#invoked-from",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/block-user.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.277999999991152
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-new-notification-tap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#presentation",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#invoked-from",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.578957999998238
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-mark-notification-read",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/push-notifications.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/inbox.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/inbox.md#local-state--sync-direction-optimistic-partly--success-gated-no-revert-path",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#data",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.113707999989856
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-g10-ew-reaction-dislike",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/roadmap-item-like.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/roadmap-item-like.md#local-state--sync-direction-optimistic-yn",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#local-state--sync-direction-optimistic-yn",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/roadmap-comments.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.235207999998238
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-watch-later-feed-signal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/INDEX.md#content",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#related",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/saved-content.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#invoked-from",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.0292500000214204
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-deleted-account-subcollection",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/saved-users.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/settings.md#data",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#data",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#data",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.1160839999793097
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-recent-signin-withdraw",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#anchor-files",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#flutter-parity-source-of-truth",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#presentation",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#lifecycle-init--hydrate--clear",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.4424160000053234
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-second-browser-login",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/login-session.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/login-session.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.311874999984866
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-video-call-ended-summary",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#where-its-used",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/realtime-firestore-listeners.md#where-its-used",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/video-call.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.192917000007583
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-firestore-to-typed",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/clean-architecture.md#flutter-parity",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/realtime-firestore-listeners.md#what-it-is--why",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#firestoreservice-readswrites",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#what-it-is--why",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.03391699999338
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-tojson-optional-keys",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#domain",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/community-wall.md#domain",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#flutter-parity",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.1271249999990687
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-withdraw-confirm-modal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/redux-state-slices.md#where-its-used",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#c-concretely",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#money-out--revolut-payment",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/legal-documents.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7179590000014286
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdrawal-labels-romanian",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#what-it-is--why",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#gotchas--constraints",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#flutter-parity",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.6974159999808762
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-hardcoded-padding-colour",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#theme",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#what-it-is--why",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#responsive",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/localization-l10n.md#what-it-is--why",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.4688330000208225
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-new-page-back-title",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#complete-api-mapping",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#props-expauseappbarprops",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/support-catalog.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#complete-event-flow",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#documented-exceptions--do-not-force-the-bar-on-these",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.6205830000108108
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-console-error-catch",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#log-call--level-routing-the-key-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/CDN_CORS_SETUP.md#verification",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/server-options.md#serverforwardconsole",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/product-decision-free-window.md#36-enforcement-prerequisite-named-and-costed--corrects-cheap-and-verified",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.6494170000078157
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-new-callable-unwrap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#response-envelopes-are-not-uniform--read-the-cf",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#cloudfunctionsservice-callables",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/roadmap.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callfunction-helper-the-oncall-path",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.3917500000097789
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-callable-exists-check",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callable-name-registry--names-must-match-an-export",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#web-unreachable-callables-deployed--flutter-callable-but-no-web-caller--20",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-workers",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/static-deploy.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/VIDEO_ENCRYPTION_IMPLEMENTATION.md#decryption-errors",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.3908749999827705
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-unlock-payload",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#where-its-used",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#circulation--coin-spends-payment--adjacent",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#invoked-from",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7427090000128374
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-photo-comment-reply",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#local-state--sync-direction-optimistic-yn",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#data",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#local-state--sync-direction-optimistic-yn",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#presentation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.022291999979643
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-group-room-agora-token",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#anchor-files",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#where-its-used",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/video-call.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#what-it-is--why",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7558330000028946
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-staging-build",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#modes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#node_env-and-modes",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/ssr.md#building-for-production",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.913750000006985
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-dev-api-forward",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md#testing-the-app-locally",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/server-options.md#serverproxy",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/CDN_CORS_SETUP.md#option-2-cdn-policy-response-headers-alternative-1",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#fix",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#fix-1",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.830582999973558
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-github-pages-subpath",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md#github-pages",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#azure-static-web-apps",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-pages",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.9244160000234842
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-wsl-file-save",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverwatch",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/build-options.md#buildwatch",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#handlehotupdate",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#vite-does-not-detect-a-file-change",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#the-hotupdate-hook",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7999579999886919
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-stale-chunk-deploy",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#failed-to-fetch-dynamically-imported-module-error",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/features.md#glob-import",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#browser-extensions",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/features.md#dynamic-import",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.318582999985665
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-linked-ui-package",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#monorepos-and-linked-dependencies",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/blog/announcing-vite5-1.md#support-ssrexternal-true-to-externalize-all-ssr-packages",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/ssr.md#ssr-externals",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#outdated-pre-bundled-deps-when-linking-to-a-local-package",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#browser-cache",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.7843330000177957
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-admin-html-entry",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/ssr.md#building-for-production",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/shared-options.md#input-noninheritbadge-",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/features.md#import-with-query-suffixes",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-script-as-a-worker",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              3.2336249999934807
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-plugin-package-name",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#conventions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/blog/announcing-vite8-beta.md#migrating-to-vite-8-beta",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/features.md#client-types",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/migration.md#gradual-migration",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.9882919999945443
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-virtual-routes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#importing-a-virtual-file",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-environment-frameworks.md#raw-devenvironment",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#rolldown-hooks",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-environment-instances.md#devenvironment-class",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7384999999776483
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-src-alias",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/shared-options.md#resolvetsconfigpaths",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/shared-options.md#object-format-recordstring-string",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/features.md#glob-import-caveats",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/shared-options.md#csspreprocessoroptionsextensionadditionaldata",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/config/shared-options.md#tsconfig",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.318083000020124
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-robots-favicon",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#the-public-directory",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#in-javascript",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/product-decision-naming.md#36-firu-lineage-audit--promoted-to-the-presstrust-posture-out-of-the-naming-playbook",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#firestore-schema",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/product-decision-naming.md#31-screen-expause-formally-now",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.260041999979876
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-only-plugin",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/using-plugins.md#enforcing-plugin-ordering",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/submit-feedback.md#flutter-parity-source-of-truth",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/blog/announcing-vite8.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#shared-plugins-during-build",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-workers",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.0622909999801777
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-scoped-card-styles",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/features.md#css-modules",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#-file-naming-conventions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#remappers-data-transformation-layer",
                "score": 0.015873015873015872
              },
              {
                "ref": ".claude/context/conventions.md",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-environment-instances.md#devenvironment-class",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.2470830000238493
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-client-env-undefined",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-variables",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#intellisense-for-typescript",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/shared-options.md#envprefix",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.5325000000011642
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-config-reads-env",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/index.md#using-environment-variables-in-config",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#loadenv",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#createserver",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.2570419999829028
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-health-middleware",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#configureserver",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configurepreviewserver",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/ssr.md#vite-cli",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/server-options.md#serverproxy",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#closeserver",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.7302920000220183
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-sha-meta",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#transformindexhtml",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/ssr.md#setting-up-the-dev-server",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#rolldown-hooks",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/blog/announcing-vite5.md#main-changes",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.5051249999960419
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-mock-updated-event",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#server-to-client",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#client-to-server",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/changes/hotupdate-hook.md#motivation",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#managing-the-application-instances",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-environment.md#closing-the-gap-between-build-and-dev",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.885375000012573
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-rails-manifest-tags",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/backend-integration.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/cli.md#vite-build",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/build.md#css-support",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/ssr.md#building-for-production",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.5378339999879245
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-neg-login-sms-2fa",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#presentation",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/login-session.md#domain",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#lifecycle-init--hydrate--clear",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/login-session.md#flutter-parity-source-of-truth",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.079834000003757
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-chat-typing-indicator",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/share.md#flutter-parity-source-of-truth",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/share.md#domain",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/chat.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/share.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.4055420000222512
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-chat-voice-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/chat.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/video-call.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/share.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/chat.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.3770409999997355
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-chat-edit-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/push-notifications.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-hmr.md#hotacceptcb",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#presentation",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/share.md#data",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.1841249999997672
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-group-chat",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#what-it-is--why",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox.md#cloud-functions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/INDEX.md#communication",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/video-encryption.md#three-parallel-pipelines-one-crypto-core",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#data",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9626659999776166
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-playback-speed",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/VIDEO_ENCRYPTION_IMPLEMENTATION.md#3-presentation-layer-srcpresentation",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#presentation-layer",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#whats-next",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/blog/announcing-vite4-3.md#performance-improvements",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#1-video-playback-control",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9808749999792781
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-profile-qr-code",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/share.md#invoked-from",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#22-anglo-skill-surfaces-self-linked-only--the-sourcing-rule",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/user-subscriptions.md#invoked-from",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#performance-bottlenecks",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/user-profile.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9628340000053868
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-coin-promo-code",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/product-decision-rate-card.md#34-accompanying-mechanics-relabeled-honestly",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/product/launch-todo.md#deliberately-deferred-post-validation-queue--listed-so-nothing-is-silently-dropped",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#21-stripe-on-the-web-plan-c--growth-first-build-when-traffic-warrants",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#22-remaining-deferred-builds-parked-listed-so-nothing-drops-silently",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.8120829999970738
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-neg-expiring-stories",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/launch-todo.md#phase-5--day-90-read--decisions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#7-open-questions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/product-definition.md#for-creators--the-two-platform-tax",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#money-in--the-iap-callables-purchases",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/product-definition.md#6-competitive-positioning",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9168749999953434
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-pin-comment",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/virtual-list.md#reversed--chat-mode--usereversedanchorts",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/gifting.md#anchor-files",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/INDEX.md#content",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/content-management.md#related",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/search-users-sheet.md#invoked-from",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.8228339999914169
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-storybook-stories",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/blog/announcing-vite8.md#thank-you-to-the-community",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/live.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#what-it-is--why",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/product/product-decision-rate-card.md#4-confidence-medium",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/blog/announcing-vite4.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.8053749999962747
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-callable-app-check",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#what-it-is--why",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/video-transcoding-cdn.md#gotchas--constraints",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#response-envelopes-are-not-uniform--read-the-cf",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/VIDEO_SECURITY_CONSIDERATIONS.md#3-xss-attack-surface",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.0629590000025928
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-precompress",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/build-options.md#buildemitassets",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/build-options.md#buildssremitassets",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#in-css-or-html",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.8367919999873266
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-obfuscate",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/blog/announcing-vite8.md#looking-ahead",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/blog/announcing-vite8-beta.md#looking-ahead",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/product-recommendations.md#23-make-the-pause-the-only-ask--hide-the-persistent-unlock-button-p1",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/why.md#where-vite-is-heading",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/why.md#the-origins",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.8056670000078157
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-server-mock",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#what-it-is--why",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/ssr.md#building-for-production",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-workers",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.7947500000009313
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-vite-sitemap",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/features.md#preload-directives-generation",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/blog/announcing-vite3.md#built-asset-paths-fine-grained-control-experimental",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/features.md#license",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/why.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              0.9886249999981374
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-image-webp",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#new-urlurl-importmetaurl",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/image-caching-storage.md#3-download-to-a-blobfile--downloadimageusecase",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/CDN_CORS_SETUP.md#current-cdn-setup-dont-break-this",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#the-why",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7084580000082497
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-terraform-state-lock",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/architecture/STATE_MANAGEMENT.md#-comparison-table",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/product/product-decision-free-window.md#33-feed",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/route-caching.md#gotchas--constraints",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/product/product-recommendations.md#22-feed-mix--dont-let-the-feed-become-a-wall-of-locks-p1",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/remote-config.md#presentation-wiring",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              2.6968749999941792
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-postgres-autovacuum",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/product-definition.md#6-competitive-positioning",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#the-store--datastoragelocalsecurestoragewebcryptots",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/VIDEO_MANAGEMENT.md#table-of-contents",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-hmr.md#hotsendevent-data",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/architecture/STATE_MANAGEMENT.md#-comparison-table",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.7665409999899566
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-android-keystore",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/analytics-system.md#device-detection",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/video-transcoding-cdn.md#flutter-parity",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#consequence-if-this-is-skipped",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/releases.md#release-cycle",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/releases.md#pre-releases",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.8499580000061542
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-kafka-rebalance",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/VIRTUAL_LIST.md#-what-was-built",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/VIRTUAL_LIST.md#problem-1-virtuoso-scroll-lag",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/user-feedback.md#domain",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/VIRTUAL_LIST_SCROLL_CONTROL.md#when-to-optimize",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#responsive",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.3934170000138693
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-k8s-ingress-tls",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#network-requests-stop-loading",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/preview-options.md#previewhttps",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#rules-for-each-layer",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#2-token-provisioning--the-generatelivestreamtoken-cloud-function",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/config/server-options.md#serverhttps",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.6587090000102762
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-pytest-conftest",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#19-un-authenticated-access--share-landings",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/login-session.md#anchor-files",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/remote-config.md#flutter-parity",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/changes/shared-plugins-during-build.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/login-session.md#presentation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.9238749999785796
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-go-private-modules",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/CDN_CORS_SETUP.md#option-1-cors-policy-recommended---dedicated-setting",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-pages",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#vercel-with-git",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/blog/announcing-vite4.md#vite-ecosystem-ci-improvements",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.5812910000095144
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-rust-clippy",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/server-options.md#serverfsdeny",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/changes/per-environment-apis.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/blog/announcing-vite4.md#vite-ecosystem-ci-improvements",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/changes/ssr-using-modulerunner.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.4703750000044238
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-django-squash",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/migration.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/releases.md#deprecations",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/releases.md#supported-versions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/migration.md#default-browser-target-change-badge-textnrv-typewarning-migration-from-v7",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/blog/announcing-vite8.md#the-journey-to-stable",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.395541999983834
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-celery-retry",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/react-query-caching.md#one-global-client-configured-for-fresh-on-forward-cached-on-back",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/campaigns.md#cloud-functions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#flutter-parity-source-of-truth",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/launch-todo.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              1.6515000000072177
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
      "embedCalls": 69,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 44,
        "negatives": 25,
        "recall": {
          "1": 0.4318181818181818,
          "3": 0.6818181818181818,
          "5": 0.8409090909090909
        },
        "mrr": 0.5791666666666667,
        "strict": {
          "recall": {
            "1": 0.29545454545454547,
            "3": 0.5,
            "5": 0.6590909090909091
          },
          "mrr": 0.42386363636363633
        },
        "latency": {
          "p50": 9.66745800001081,
          "p95": 14.179000000003725
        },
        "samples": 69,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-g10-ew-gift-community-post",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#related",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/gifting.md#invoked-from",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#related",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/gifting.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              12.533583999989787
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-sendgift-chat-side-effects",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#circulation--coin-spends-payment--adjacent",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/gifting.md#domain",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/gifting.md#data",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.195458000001963
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-blocked-suggested-creators",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/block-user.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/block-user.md#related",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/block-user.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/block-user.md#flutter-parity-source-of-truth",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/block-user.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.044790999992983
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-new-notification-tap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#domain",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#invoked-from",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#presentation",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.691791999997804
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-mark-notification-read",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#data",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#local-state--sync-direction-optimistic-y-for-read-only",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#data",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#local-state--sync-direction-optimistic-y--for-the-read-flip-only",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.724709000001894
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-reaction-dislike",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#cloud-functions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#flutter-parity-source-of-truth",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#flutter-parity",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#local-state--sync-direction-optimistic-yn",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.46937499998603
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 5
          },
          {
            "id": "q-g10-ew-watch-later-feed-signal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/feed-discovery.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/INDEX.md#content",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#presentation",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#domain",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.22295799999847
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-deleted-account-subcollection",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#invoked-from",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#cloud-functions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.022042000025976
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-recent-signin-withdraw",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#domain",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/login-session.md#invoked-from",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.353499999997439
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-second-browser-login",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/login-session.md#flutter-parity-source-of-truth",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.385500000003958
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-video-call-ended-summary",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/video-call.md#invoked-from",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/video-call.md#related",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/video-call.md#flutter-parity-source-of-truth",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.992499999993015
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-firestore-to-typed",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#firestoreservice-readswrites",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#what-it-is--why",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#where-its-used",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.053791000013007
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-tojson-optional-keys",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/settings.md#data",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/remote-config.md#versiondefaultsettings--the-settings-rewrite",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/analytics-system.md#firestore-schema",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#data",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/saved-users.md#cloud-functions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.673833000008017
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdraw-confirm-modal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#flutter",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#qa-note",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#cloud-functions-the-bulk",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#the-options",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#7-open-questions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.169374999997672
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdrawal-labels-romanian",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/product-decision-naming.md#31-screen-expause-formally-now",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#flutter",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#why-c-is-the-right-shape",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/redux-state-slices.md#where-its-used",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#the-three-load-bearing-assumptions-all-unverified",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              6.976458999997703
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-hardcoded-padding-colour",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#qa-note",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/roadmap/stripe-web-payments.md#what-the-commented-stripets-stub-actually-covers-and-doesnt",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#3-why-this-is-not-a-thin-port",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#why-c-is-the-right-shape",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#cloud-functions-the-bulk",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.7109159999818075
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-new-page-back-title",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#the-title-cell-has-three-shapes-and-the-nesting-order-is-load-bearing",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#props-expauseappbarprops",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#what-it-is--why",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/user-search.md#presentation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.6918339999974705
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-console-error-catch",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#where-its-used",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#log-call--level-routing-the-key-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#global-uncaught-error-capture",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/analytics-system.md#general-application-logging",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              7.458249999996042
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-new-callable-unwrap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#response-envelopes-are-not-uniform--read-the-cf",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/support-catalog.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/contact-support.md#cloud-functions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.561709000001429
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-callable-exists-check",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-fetch-path-the-one-onrequest-function",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/user-feedback.md#domain",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/support-catalog.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#on-the-method-list",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/user-feedback.md#cloud-functions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.66745800001081
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-unlock-payload",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#business-behaviour",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#invoked-from",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#domain",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.568415999994613
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-photo-comment-reply",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/comment-video-reply.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#related",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#domain",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#flutter-parity-source-of-truth",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              14.179000000003725
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-group-room-agora-token",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#domain",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/video-call.md#anchor-files",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/video-call.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/video-call.md#presentation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.273291999998037
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-staging-build",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#modes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlicense",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.76395799999591
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-dev-api-forward",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#servercors",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/server-options.md#serverforwardconsole",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#verify",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#issue",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#fix",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.58445799999754
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-github-pages-subpath",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md#github-pages",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-pages",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#render",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#netlify-with-git",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.737499999988358
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-wsl-file-save",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverwatch",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#closepreviewserver",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#built-file-does-not-work-because-of-cors-error",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/shared-options.md#devtools",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#vite-does-not-detect-a-file-change",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.559042000008048
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-stale-chunk-deploy",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#failed-to-fetch-dynamically-imported-module-error",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#browser-extensions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/migration.md#module-type-support-and-auto-detection",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#clean-imports-with-barrel-exports",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.173459000012372
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-linked-ui-package",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#monorepos-and-linked-dependencies",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#error-cannot-find-module-cfoobarbazvitebinvitejs",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/acknowledgements.md#bundled-dependency-authors",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#built-file-does-not-work-because-of-cors-error",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.876709000003757
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-admin-html-entry",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/ssr.md#source-structure",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#1-model-separation",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/build-options.md#buildoutdir",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/index.md#indexhtml-and-project-root",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.113833000010345
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-plugin-package-name",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#conventions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#hook-filters",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#chunk-import-map-information",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#searchforworkspaceroot",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#transformindexhtml",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              12.713707999995677
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-virtual-routes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#importing-a-virtual-file",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/migration.md#require-calls-for-externalized-modules",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmodulepreload",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/changes/shared-plugins-during-build.md#migration-guide",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/build.md#library-mode",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.723291000002064
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-src-alias",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/features.md#import-inlining-and-rebasing",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolvealias",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/build.md#relative-base",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/migration.md#importmetaurl-in-umd--iife",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/features.md#glob-import-caveats",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.86295800001244
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-robots-favicon",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#the-public-directory",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#-file-naming-conventions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/content-tags.md#local-state--sync-direction-optimistic-n",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/legal-documents.md#data",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callable-name-registry--names-must-match-an-export",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.703125
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-only-plugin",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#rebuild-on-files-changes",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-plugin.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/using-plugins.md#enforcing-plugin-ordering",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.345499999995809
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-g10-vite-scoped-card-styles",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/shared-options.md#cssmodules",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/features.md#css-modules",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#-file-naming-conventions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/shared-options.md#csspreprocessoroptionsextensionadditionaldata",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.088874999986729
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-client-env-undefined",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-javascript.md#loadenv",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/migration.md#importmetaurl-in-umd--iife",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#built-in-constants",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/migration.md#build-throws-bundleerror",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-variables",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.29662500001723
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-g10-vite-config-reads-env",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/index.md#using-environment-variables-in-config",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#loadenv",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#loadconfigfromfile",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configresolved",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#intellisense-for-typescript",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              12.044083000015235
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-health-middleware",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#configureserver",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configurepreviewserver",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#closeserver",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/server-options.md#servermiddlewaremode",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#closepreviewserver",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.82379199998104
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-sha-meta",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#in-css-or-html",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#in-javascript",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#transformindexhtml",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#chunk-import-map-information",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.022417000000132
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-g10-vite-mock-updated-event",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#client-to-server",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#server-to-client",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configurepreviewserver",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#example-usage",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#presentation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.485207999998238
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-rails-manifest-tags",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#css-support",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/build-options.md#buildssrmanifest",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/index.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.691874999989523
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-login-sms-2fa",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#what-it-is--why",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#key-provisioning--where-the-keys-are-minted-and-stored-authservicets",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.785499999998137
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-chat-typing-indicator",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/chat.md#invoked-from",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/inbox.md#flutter-parity-source-of-truth",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/INDEX.md#communication-1",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/chat.md#presentation",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.23283399999491
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-chat-voice-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/video-call.md#invoked-from",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/chat.md#cloud-functions",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/chat.md#data",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.180166999984067
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-chat-edit-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#data",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/chat.md#data",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#business-behaviour",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#presentation",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#flutter-parity-source-of-truth",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.37995800000499
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-group-chat",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox.md#data",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/chat.md#data",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/inbox.md#related",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/block-user.md#invoked-from",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#domain",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.439916999981506
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-playback-speed",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/VIDEO_MANAGEMENT.md#component-responsibilities",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#performance",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/VIDEO_MANAGEMENT.md#playpause-flow",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/video-playback.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#1-video-playback-control",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              13.130499999999302
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-profile-qr-code",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#22-anglo-skill-surfaces-self-linked-only--the-sourcing-rule",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#5-verification-gaps-to-close-manually-1-founder-hour-before-wave-1",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#4-tracking-sheet--tripwire-dashboard",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#template-b--music-producer-en-email--beatstars-linked-social",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.025374999997439
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-coin-promo-code",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#21-stripe-on-the-web-plan-c--growth-first-build-when-traffic-warrants",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#the-dormant-stripe-stub",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#related",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#anchor-files",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              17.7515419999836
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 4,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-expiring-stories",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/user-profile.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/user-profile.md#local-state--sync-direction-optimistic-n",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/go-to-market.md#6-campaign-1--under-the-ratified-badge-prize-constraints",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#1-the-funnel-model-and-weekly-operating-rhythm",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#16-video-series",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              16.66699999998673
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-pin-comment",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-comments.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/content-comments.md",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#flutter-parity-source-of-truth",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#flutter-parity-source-of-truth",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#business-behaviour",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.62066699998104
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-storybook-stories",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/publish-content.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/community-live-streaming.md#presentation",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/community-live-streaming.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#3-outreach-sequences-offer-shaped-120-words-23-follow-ups",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#3-real-time-subscriptions",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              12.145000000018626
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-callable-app-check",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#where-its-used",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#how-it-works",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#domain",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#flutter-parity",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              13.405333000002429
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-precompress",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/features.md#preload-directives-generation",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              14.460167000012007
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-obfuscate",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/build-options.md#buildwrite",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/build-options.md#buildchunksizewarninglimit",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/build-options.md#buildsourcemap",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#build",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/migration.md#build-throws-bundleerror",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.535000000003492
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-server-mock",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#servercors",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/server-options.md#serverforwardconsole",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/server-options.md#serverhmr",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/support-catalog.md#cloud-functions",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#createserver",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.507167000003392
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-vite-sitemap",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/build.md#relative-base",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/static-deploy.md",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/build.md#public-base-path",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.511874999996508
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-vite-image-webp",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#remappers-data-transformation-layer",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/build-options.md#buildcsstarget",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#clean-imports-with-barrel-exports",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/assets.md#explicit-inline-handling",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.998041999991983
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-terraform-state-lock",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/remote-config.md#real-time-push--three-effect-classes",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#the-store--datastoragelocalsecurestoragewebcryptots",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/sync-on-login.md#anchor-files",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/features/settings.md#local-state--sync-direction-optimistic-yn",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/redux-state-slices.md#two-families-of-slice",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.015125000005355
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-postgres-autovacuum",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/grid-column-count.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/campaigns.md#cloud-functions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/grid-column-count.md#gotchas--constraints",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/grid-column-count.md#where-its-used",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/analytics-system.md#memory",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              8.937707999983104
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-android-keystore",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/submit-feedback.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#local-state--sync-direction-optimistic-n",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#lifecycle-init--hydrate--clear",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#security-notes",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#related",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.538167000020621
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-kafka-rebalance",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/campaigns.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/product/marketing-viability.md#11-what-would-change-these-verdicts",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/campaigns.md#local-state--sync-direction-optimistic-yn",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/product/product-decision-free-window.md#33-feed",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/analytics-system.md#batching",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              10.208999999973457
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-k8s-ingress-tls",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#key-features",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#data-layer",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/video-encryption.md#client-key-decryption-srcdomainservicesvideo",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/analytics-system.md#encryptedhlsloader",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/CDN_CORS_SETUP.md#current-cookie-configuration",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.652125000022352
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-pytest-conftest",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/latest-users.md#local-state--sync-direction-optimistic-yn",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/share.md#data",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolvemainfields-noninheritbadge-",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/INDEX.md#concepts-1",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/features/share.md#flutter-parity-source-of-truth",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              11.88758300000336
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-go-private-modules",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#server-side-cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#private-key-delivery--local-hydration-on-login",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#key-provisioning--where-the-keys-are-minted-and-stored-authservicets",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#testing--documentation",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#gotchas--constraints",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.275875000021188
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-rust-clippy",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverfsdeny",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/config/shared-options.md#envprefix",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/config/dep-optimization-options.md#optimizedepsexclude-noninheritbadge-",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#module-externalized-for-browser-compatibility",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/features.md#typescript-compiler-options",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.4213339999842
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-django-squash",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/migration.md#removed-buildrollupoptionswatchchokidar-option",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/vite/guide/migration.md#removed-object-form-buildrollupoptionsoutputmanualchunks-and-deprecate-function-form-one",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/migration.md#other-related-deprecations",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/vite/guide/migration.md#removed-deprecated-features-badge-textnrv-typewarning-migration-from-v7",
                "score": 0.015625
              },
              {
                "ref": "docs/vite/guide/migration.md#build-throws-bundleerror",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.234958000015467
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-celery-retry",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/support-catalog.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/contact-support.md#cloud-functions",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/contact-support.md#data",
                "score": 0.015873015873015872
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.015625
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#3-outreach-sequences-offer-shaped-120-words-23-follow-ups",
                "score": 0.015384615384615385
              }
            ],
            "durationMs": [
              9.248665999999503
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
      "embedCalls": 69,
      "rerankCalls": 0,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 44,
        "negatives": 25,
        "recall": {
          "1": 0.6590909090909091,
          "3": 0.8181818181818182,
          "5": 0.8409090909090909
        },
        "mrr": 0.7318181818181819,
        "strict": {
          "recall": {
            "1": 0.4318181818181818,
            "3": 0.6136363636363636,
            "5": 0.6590909090909091
          },
          "mrr": 0.5215909090909091
        },
        "latency": {
          "p50": 10.847500000003492,
          "p95": 16.386166999989655
        },
        "samples": 69,
        "abstainedOnNegative": 0,
        "perQuery": [
          {
            "id": "q-g10-ew-gift-community-post",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#anchor-files",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/expause-web/features/gifting.md#related",
                "score": 0.031544957774465976
              },
              {
                "ref": "docs/expause-web/features/gifting.md",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#related",
                "score": 0.02928692699490662
              },
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.028577260665441927
              }
            ],
            "durationMs": [
              10.579208999988623
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03177805800756621,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-sendgift-chat-side-effects",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#circulation--coin-spends-payment--adjacent",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/expause-web/features/gifting.md#domain",
                "score": 0.029709507042253523
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#cloud-functions",
                "score": 0.02967032967032967
              }
            ],
            "durationMs": [
              14.47712500000489
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-blocked-suggested-creators",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/block-user.md",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/expause-web/features/block-user.md#anchor-files",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/expause-web/features/block-user.md#local-state--sync-direction-optimistic-yn",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/expause-web/features/block-user.md#business-behaviour",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/expause-web/features/settings.md#invoked-from",
                "score": 0.028782894736842105
              }
            ],
            "durationMs": [
              11.559207999991486
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 3,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-new-notification-tap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#invoked-from",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#presentation",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md",
                "score": 0.03076923076923077
              },
              {
                "ref": "docs/expause-web/features/inbox.md#business-behaviour",
                "score": 0.02964254577157803
              }
            ],
            "durationMs": [
              10.847500000003492
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-mark-notification-read",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/push-notifications.md#business-behaviour",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#data",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#local-state--sync-direction-optimistic-y-for-read-only",
                "score": 0.0304147465437788
              },
              {
                "ref": "docs/expause-web/features/inbox.md#cloud-functions",
                "score": 0.03007688828584351
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.02919863597612958
              }
            ],
            "durationMs": [
              10.901958999980707
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-reaction-dislike",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/expause-web/features/roadmap-item-like.md#business-behaviour",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#local-state--sync-direction-optimistic-yn",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#pattern-a--optimistic-write-then-revert",
                "score": 0.028790389395194696
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#business-behaviour",
                "score": 0.026875901875901876
              }
            ],
            "durationMs": [
              11.601708000001963
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-watch-later-feed-signal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/INDEX.md#content",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#business-behaviour",
                "score": 0.029906956136464335
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#related",
                "score": 0.029827662395050816
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#anchor-files",
                "score": 0.029211087420042643
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md",
                "score": 0.029030910609857977
              }
            ],
            "durationMs": [
              10.906041999987792
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-deleted-account-subcollection",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#cloud-functions",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#data",
                "score": 0.030776515151515152
              },
              {
                "ref": "docs/expause-web/features/saved-users.md#cloud-functions",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#invoked-from",
                "score": 0.03036576949620428
              }
            ],
            "durationMs": [
              12.550999999977648
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03128054740957967,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-recent-signin-withdraw",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#domain",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#presentation",
                "score": 0.029910714285714284
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.029857397504456328
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.02976190476190476
              }
            ],
            "durationMs": [
              10.781665999995312
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-second-browser-login",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/expause-web/features/login-session.md",
                "score": 0.030621785881252923
              },
              {
                "ref": "docs/expause-web/features/login-session.md#flutter-parity-source-of-truth",
                "score": 0.030158730158730156
              },
              {
                "ref": "docs/expause-web/features/login-session.md#anchor-files",
                "score": 0.02946912242686891
              }
            ],
            "durationMs": [
              10.344666999997571
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-video-call-ended-summary",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/features/video-call.md#business-behaviour",
                "score": 0.031544957774465976
              },
              {
                "ref": "docs/expause-web/features/video-call.md#invoked-from",
                "score": 0.030834914611005692
              },
              {
                "ref": "docs/expause-web/features/video-call.md#domain",
                "score": 0.029437229437229435
              },
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.029273504273504274
              }
            ],
            "durationMs": [
              11.269417000003159
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-firestore-to-typed",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#firestoreservice-readswrites",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#what-it-is--why",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.031024531024531024
              },
              {
                "ref": "docs/expause-web/concepts/realtime-firestore-listeners.md#how-it-works",
                "score": 0.028381642512077296
              }
            ],
            "durationMs": [
              11.043834000010975
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-tojson-optional-keys",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-comments.md#data",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/expause-web/features/settings.md#data",
                "score": 0.02938045560996381
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.02928692699490662
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#firestoreservice-readswrites",
                "score": 0.028577260665441927
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.02548701298701299
              }
            ],
            "durationMs": [
              10.523958999983734
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.029513888888888888,
            "rank": 3,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdraw-confirm-modal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#c-concretely",
                "score": 0.030834914611005692
              },
              {
                "ref": "docs/expause-web/concepts/redux-state-slices.md#where-its-used",
                "score": 0.029551337359792925
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.029206349206349208
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#0-decision-2026-07-27",
                "score": 0.026838432635534086
              },
              {
                "ref": "docs/expause-web/roadmap/stripe-web-payments.md#0-decision-update-2026-07-14",
                "score": 0.0266900790166813
              }
            ],
            "durationMs": [
              10.258874999999534
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.030834914611005692,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdrawal-labels-romanian",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#the-three-load-bearing-assumptions-all-unverified",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/expause-web/product/product-recommendations.md#44-creator-side-friction-to-remove-at-cold-start-p1",
                "score": 0.028991596638655463
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#web",
                "score": 0.027071520029266508
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#3-why-this-is-not-a-thin-port",
                "score": 0.023138297872340424
              },
              {
                "ref": "docs/expause-web/product/funding-grants-research.md#9-open-source-fit-romanian-schemes",
                "score": 0.023000660938532716
              }
            ],
            "durationMs": [
              12.170458000007784
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.030309988518943745,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-hardcoded-padding-colour",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#qa-note",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#theme",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/roadmap/stripe-web-payments.md#what-the-commented-stripets-stub-actually-covers-and-doesnt",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#what-it-is--why",
                "score": 0.015873015873015872
              }
            ],
            "durationMs": [
              10.260375000012573
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.01639344262295082,
            "rank": 3,
            "strictRank": 5
          },
          {
            "id": "q-g10-ew-new-page-back-title",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#props-expauseappbarprops",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#anchor-files",
                "score": 0.030798389007344232
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#documented-exceptions--do-not-force-the-bar-on-these",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#what-it-is--why",
                "score": 0.028958333333333336
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#the-title-cell-has-three-shapes-and-the-nesting-order-is-load-bearing",
                "score": 0.028021349599695006
              }
            ],
            "durationMs": [
              12.042833999992581
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03225806451612903,
            "rank": 1,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-console-error-catch",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#log-call--level-routing-the-key-behaviour",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#where-its-used",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/expause-web/analytics-system.md#general-application-logging",
                "score": 0.02528560548362529
              },
              {
                "ref": "docs/expause-web/analytics-system.md#expected-log-flow-success",
                "score": 0.020753512132822477
              }
            ],
            "durationMs": [
              10.0815419999999
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03225806451612903,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-new-callable-unwrap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#response-envelopes-are-not-uniform--read-the-cf",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#cloud-functions",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.02886002886002886
              },
              {
                "ref": "docs/expause-web/features/support-catalog.md#cloud-functions",
                "score": 0.028283227848101264
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#flutter-parity",
                "score": 0.027583600982429624
              }
            ],
            "durationMs": [
              10.220333000004757
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-callable-exists-check",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#flutter-parity",
                "score": 0.028985507246376812
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.026262626262626265
              },
              {
                "ref": "docs/expause-web/features/user-feedback.md#cloud-functions",
                "score": 0.025188536953242836
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#anchor-files",
                "score": 0.023856578204404292
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#what-it-is--why",
                "score": 0.02333469000135667
              }
            ],
            "durationMs": [
              12.152499999996508
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.028985507246376812,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-unlock-payload",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#business-behaviour",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#invoked-from",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.03036576949620428
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#where-its-used",
                "score": 0.03028233151183971
              }
            ],
            "durationMs": [
              9.990292000002228
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-photo-comment-reply",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#anchor-files",
                "score": 0.031024531024531024
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#local-state--sync-direction-optimistic-yn",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md",
                "score": 0.03009207275993712
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#cloud-functions",
                "score": 0.029236022193768675
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#data",
                "score": 0.029116045245077504
              }
            ],
            "durationMs": [
              10.66920899998513
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031024531024531024,
            "rank": 5,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-group-room-agora-token",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#cloud-functions",
                "score": 0.03125
              },
              {
                "ref": "docs/expause-web/features/video-call.md#domain",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/expause-web/features/video-call.md#anchor-files",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#where-its-used",
                "score": 0.03036576949620428
              },
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.03036576949620428
              }
            ],
            "durationMs": [
              12.118333999998868
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03125,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-staging-build",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#modes",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#loadenv",
                "score": 0.028594771241830064
              },
              {
                "ref": "docs/vite/guide/ssr.md#building-for-production",
                "score": 0.02797067901234568
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.026625704045058884
              }
            ],
            "durationMs": [
              10.148875000013504
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-dev-api-forward",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#servercors",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#fix",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/vite/config/server-options.md#serverforwardconsole",
                "score": 0.0304147465437788
              },
              {
                "ref": "docs/vite/config/server-options.md#serverorigin",
                "score": 0.030303030303030304
              },
              {
                "ref": "docs/expause-web/STORAGE_BUCKET_CORS_SETUP.md#verify-1",
                "score": 0.029631255487269532
              }
            ],
            "durationMs": [
              10.610665999993216
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.031099324975891997,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-github-pages-subpath",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md#github-pages",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-pages",
                "score": 0.0315136476426799
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#netlify-with-git",
                "score": 0.030536130536130537
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#azure-static-web-apps",
                "score": 0.03021353930031804
              }
            ],
            "durationMs": [
              13.181959000008646
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-wsl-file-save",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverwatch",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#vite-does-not-detect-a-file-change",
                "score": 0.031009615384615385
              },
              {
                "ref": "docs/vite/config/build-options.md#buildwatch",
                "score": 0.0304147465437788
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#the-hotupdate-hook",
                "score": 0.029083245521601686
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#requests-are-stalled-forever",
                "score": 0.028381642512077296
              }
            ],
            "durationMs": [
              11.218708000000333
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-stale-chunk-deploy",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#failed-to-fetch-dynamically-imported-module-error",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#browser-extensions",
                "score": 0.031754032258064516
              },
              {
                "ref": "docs/vite/guide/api-environment-instances.md#fetchresult",
                "score": 0.028169014084507043
              },
              {
                "ref": "docs/vite/changes/ssr-using-modulerunner.md#motivation",
                "score": 0.026973565905412694
              }
            ],
            "durationMs": [
              10.549333000002662
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-linked-ui-package",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#monorepos-and-linked-dependencies",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#error-cannot-find-module-cfoobarbazvitebinvitejs",
                "score": 0.028629032258064516
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolvededupe",
                "score": 0.02749719416386083
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#outdated-pre-bundled-deps-when-linking-to-a-local-package",
                "score": 0.026988636363636364
              }
            ],
            "durationMs": [
              12.011375000001863
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-admin-html-entry",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/vite/guide/index.md#indexhtml-and-project-root",
                "score": 0.030536130536130537
              },
              {
                "ref": "docs/vite/guide/ssr.md#source-structure",
                "score": 0.02921395544346364
              },
              {
                "ref": "docs/vite/config/shared-options.md#input-noninheritbadge-",
                "score": 0.02886002886002886
              },
              {
                "ref": "docs/vite/guide/features.md#import-with-query-suffixes",
                "score": 0.026860955056179775
              }
            ],
            "durationMs": [
              10.8314160000009
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03225806451612903,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-plugin-package-name",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#conventions",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.030309988518943745
              },
              {
                "ref": "docs/vite/acknowledgements.md#bundled-dependency-authors",
                "score": 0.028258706467661692
              },
              {
                "ref": "docs/vite/guide/build.md#css-support",
                "score": 0.024185517143263623
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolvealias",
                "score": 0.023333333333333334
              }
            ],
            "durationMs": [
              10.50137499999255
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-virtual-routes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#importing-a-virtual-file",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/build.md#library-mode",
                "score": 0.030090497737556562
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#rolldown-hooks",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/vite/guide/migration.md#require-calls-for-externalized-modules",
                "score": 0.02749266862170088
              },
              {
                "ref": "docs/vite/guide/api-environment-frameworks.md#raw-devenvironment",
                "score": 0.02736498731424429
              }
            ],
            "durationMs": [
              11.072625000000698
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-src-alias",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/shared-options.md#resolvealias",
                "score": 0.03128054740957967
              },
              {
                "ref": "docs/vite/guide/features.md#glob-import-caveats",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/vite/config/shared-options.md#object-format-recordstring-string",
                "score": 0.03021353930031804
              },
              {
                "ref": "docs/vite/config/shared-options.md#array-format-array-find-string--regexp-replacement-string-",
                "score": 0.02821939586645469
              },
              {
                "ref": "docs/vite/config/shared-options.md#csspreprocessoroptionsextensionadditionaldata",
                "score": 0.027673192771084338
              }
            ],
            "durationMs": [
              11.27424999998766
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03128054740957967,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-robots-favicon",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#the-public-directory",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#in-javascript",
                "score": 0.030017921146953404
              },
              {
                "ref": "docs/vite/guide/assets.md#new-urlurl-importmetaurl",
                "score": 0.028577260665441927
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.02786377708978328
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.027583600982429624
              }
            ],
            "durationMs": [
              10.63262499999837
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-only-plugin",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/using-plugins.md#enforcing-plugin-ordering",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/vite/guide/api-plugin.md",
                "score": 0.029386529386529386
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.02938045560996381
              },
              {
                "ref": "docs/vite/changes/shared-plugins-during-build.md",
                "score": 0.028985507246376812
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#shared-plugins-during-build",
                "score": 0.027820121951219513
              }
            ],
            "durationMs": [
              10.241749999986496
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-scoped-card-styles",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/features.md#css-modules",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#-file-naming-conventions",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/vite/config/shared-options.md#cssmodules",
                "score": 0.030679156908665108
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.028371628371628373
              },
              {
                "ref": "docs/vite/config/shared-options.md#csspreprocessoroptionsextensionadditionaldata",
                "score": 0.027673192771084338
              }
            ],
            "durationMs": [
              10.819333999999799
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-client-env-undefined",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-variables",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#intellisense-for-typescript",
                "score": 0.03057889822595705
              },
              {
                "ref": "docs/vite/config/shared-options.md#envprefix",
                "score": 0.030117753623188408
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md",
                "score": 0.029083245521601686
              }
            ],
            "durationMs": [
              10.741959000006318
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03177805800756621,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-config-reads-env",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/index.md#using-environment-variables-in-config",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#loadenv",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#config",
                "score": 0.029418126757516764
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configresolved",
                "score": 0.02844551282051282
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.027884615384615386
              }
            ],
            "durationMs": [
              17.149333999986993
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-health-middleware",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#configureserver",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configurepreviewserver",
                "score": 0.03225806451612903
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#closeserver",
                "score": 0.03125763125763126
              },
              {
                "ref": "docs/vite/config/server-options.md#servermiddlewaremode",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/vite/guide/ssr.md#setting-up-the-dev-server",
                "score": 0.029418126757516764
              }
            ],
            "durationMs": [
              12.263124999997672
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03278688524590164,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-sha-meta",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#transformindexhtml",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.029857397504456328
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.02886002886002886
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#in-css-or-html",
                "score": 0.028021349599695006
              },
              {
                "ref": "docs/vite/changes/shared-plugins-during-build.md#motivation",
                "score": 0.027650648360030512
              }
            ],
            "durationMs": [
              15.225749999983236
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-mock-updated-event",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#server-to-client",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#client-to-server",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#the-hotupdate-hook",
                "score": 0.0264808362369338
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#managing-the-application-instances",
                "score": 0.026263297872340427
              },
              {
                "ref": "docs/vite/changes/hotupdate-hook.md#migration-guide",
                "score": 0.026200135226504394
              }
            ],
            "durationMs": [
              13.902124999993248
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03252247488101534,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-rails-manifest-tags",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#css-support",
                "score": 0.032018442622950824
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.03021353930031804
              },
              {
                "ref": "docs/vite/config/build-options.md#buildssrmanifest",
                "score": 0.029571646010002173
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.029116045245077504
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.026860955056179775
              }
            ],
            "durationMs": [
              12.622374999977183
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032018442622950824,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-login-sms-2fa",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/login-session.md#flutter-parity-source-of-truth",
                "score": 0.030536130536130537
              },
              {
                "ref": "docs/expause-web/features/login-session.md#domain",
                "score": 0.030158730158730156
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.02928692699490662
              },
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.028474711270410194
              },
              {
                "ref": "docs/expause-web/features/login-session.md",
                "score": 0.028438886647841874
              }
            ],
            "durationMs": [
              14.795791999989888
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.030536130536130537
          },
          {
            "id": "q-g10-neg-chat-typing-indicator",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/chat.md#invoked-from",
                "score": 0.031544957774465976
              },
              {
                "ref": "docs/expause-web/features/inbox.md#business-behaviour",
                "score": 0.030017921146953404
              },
              {
                "ref": "docs/expause-web/features/chat.md#business-behaviour",
                "score": 0.029910714285714284
              },
              {
                "ref": "docs/expause-web/INDEX.md#communication-1",
                "score": 0.029030910609857977
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#where-its-used",
                "score": 0.02900988017658188
              }
            ],
            "durationMs": [
              12.241749999986496
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.031544957774465976
          },
          {
            "id": "q-g10-neg-chat-voice-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.03278688524590164
              },
              {
                "ref": "docs/expause-web/features/chat.md#data",
                "score": 0.03055037313432836
              },
              {
                "ref": "docs/expause-web/features/chat.md#business-behaviour",
                "score": 0.030017921146953404
              },
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.02854251012145749
              },
              {
                "ref": "docs/expause-web/INDEX.md#communication",
                "score": 0.027972027972027972
              }
            ],
            "durationMs": [
              14.513334000017494
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03278688524590164
          },
          {
            "id": "q-g10-neg-chat-edit-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#presentation",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#business-behaviour",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#data",
                "score": 0.03028233151183971
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#cloud-functions",
                "score": 0.029051670471052088
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#local-state--sync-direction-optimistic-y-for-send--n-for-receive",
                "score": 0.027692895339954164
              }
            ],
            "durationMs": [
              11.225542000000132
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03149801587301587
          },
          {
            "id": "q-g10-neg-group-chat",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/INDEX.md#communication",
                "score": 0.030798389007344232
              },
              {
                "ref": "docs/expause-web/features/inbox.md#data",
                "score": 0.03028233151183971
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#data",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/expause-web/features/inbox.md#related",
                "score": 0.029571646010002173
              },
              {
                "ref": "docs/expause-web/features/inbox.md#business-behaviour",
                "score": 0.02900988017658188
              }
            ],
            "durationMs": [
              10.12345899999491
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.030798389007344232
          },
          {
            "id": "q-g10-neg-playback-speed",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/VIDEO_MANAGEMENT.md#component-responsibilities",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#1-video-playback-control",
                "score": 0.03076923076923077
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#whats-next",
                "score": 0.02976190476190476
              },
              {
                "ref": "docs/expause-web/features/video-playback.md",
                "score": 0.029211087420042643
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#presentation-layer",
                "score": 0.028949545078577336
              }
            ],
            "durationMs": [
              16.574583000008715
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.031099324975891997
          },
          {
            "id": "q-g10-neg-profile-qr-code",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#22-anglo-skill-surfaces-self-linked-only--the-sourcing-rule",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/expause-web/features/user-profile.md#invoked-from",
                "score": 0.029211087420042643
              },
              {
                "ref": "docs/expause-web/features/user-profile.md#flutter-parity-source-of-truth",
                "score": 0.027972027972027972
              },
              {
                "ref": "docs/expause-web/features/user-profile.md#presentation",
                "score": 0.024891774891774892
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#6-money-in-and-money-out-on-web-are-two-surfaces-not-one-profile",
                "score": 0.02480203197370387
              }
            ],
            "durationMs": [
              20.859291000000667
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03252247488101534
          },
          {
            "id": "q-g10-neg-coin-promo-code",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#21-stripe-on-the-web-plan-c--growth-first-build-when-traffic-warrants",
                "score": 0.032266458495966696
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.03125
              },
              {
                "ref": "docs/expause-web/product/launch-todo.md#deliberately-deferred-post-validation-queue--listed-so-nothing-is-silently-dropped",
                "score": 0.02946236559139785
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#anchor-files",
                "score": 0.028371628371628373
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#where-its-used",
                "score": 0.02821939586645469
              }
            ],
            "durationMs": [
              13.827667000005022
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.032266458495966696,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-expiring-stories",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/product/go-to-market.md#6-campaign-1--under-the-ratified-badge-prize-constraints",
                "score": 0.03036576949620428
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#1-the-funnel-model-and-weekly-operating-rhythm",
                "score": 0.028958333333333336
              },
              {
                "ref": "docs/expause-web/features/user-subscriptions.md#business-behaviour",
                "score": 0.027799227799227798
              },
              {
                "ref": "docs/expause-web/product/gtm-recruitment-playbook.md#template-a--fitness-coach-en-email",
                "score": 0.027479766610201392
              },
              {
                "ref": "docs/expause-web/product/launch-todo.md#phase-5--day-90-read--decisions",
                "score": 0.02738245361196181
              }
            ],
            "durationMs": [
              16.386166999989655
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03036576949620428
          },
          {
            "id": "q-g10-neg-pin-comment",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-comments.md#business-behaviour",
                "score": 0.029877369007803793
              },
              {
                "ref": "docs/expause-web/features/content-management.md#related",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#related",
                "score": 0.02938045560996381
              },
              {
                "ref": "docs/expause-web/features/content-comments.md",
                "score": 0.02878726010616578
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#invoked-from",
                "score": 0.026132699813337858
              }
            ],
            "durationMs": [
              10.46249999999418
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.029877369007803793
          },
          {
            "id": "q-g10-neg-storybook-stories",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/features/community-live-streaming.md#presentation",
                "score": 0.029827662395050816
              },
              {
                "ref": "docs/expause-web/features/community-wall.md#presentation",
                "score": 0.029437229437229435
              },
              {
                "ref": "docs/expause-web/features/community-live-streaming.md#flutter-parity-source-of-truth",
                "score": 0.028594771241830064
              },
              {
                "ref": "docs/expause-web/features/publish-content.md#related",
                "score": 0.027629397679130595
              },
              {
                "ref": "docs/expause-web/features/share.md#presentation",
                "score": 0.024184149184149184
              }
            ],
            "durationMs": [
              10.889750000002095
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.029827662395050816
          },
          {
            "id": "q-g10-neg-callable-app-check",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.030621785881252923
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#flutter-parity",
                "score": 0.02625418060200669
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#how-it-works",
                "score": 0.025488400488400488
              },
              {
                "ref": "docs/expause-web/concepts/remote-config.md#web-only-teardown-guard",
                "score": 0.024925373134328358
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#cloud-functions",
                "score": 0.024451318309029312
              }
            ],
            "durationMs": [
              10.659374999988358
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.030621785881252923
          },
          {
            "id": "q-g10-neg-vite-precompress",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.03177805800756621
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.029910714285714284
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.02964254577157803
              },
              {
                "ref": "docs/vite/blog/announcing-vite5-1.md#buildassetsinlinelimit-now-supports-a-callback",
                "score": 0.028309409888357256
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.027252906976744186
              }
            ],
            "durationMs": [
              10.499333000014303
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03177805800756621
          },
          {
            "id": "q-g10-neg-vite-obfuscate",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/blog/announcing-vite8.md#looking-ahead",
                "score": 0.031544957774465976
              },
              {
                "ref": "docs/vite/blog/announcing-vite8-beta.md#a-new-bundler-for-the-web",
                "score": 0.027799227799227798
              },
              {
                "ref": "docs/vite/config/build-options.md#buildsourcemap",
                "score": 0.027777777777777776
              },
              {
                "ref": "docs/vite/guide/build.md#library-mode",
                "score": 0.026838432635534086
              },
              {
                "ref": "docs/vite/guide/build.md#browser-compatibility",
                "score": 0.025657894736842105
              }
            ],
            "durationMs": [
              9.615874999988591
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.031544957774465976
          },
          {
            "id": "q-g10-neg-vite-server-mock",
            "negative": false,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#servercors",
                "score": 0.03009207275993712
              },
              {
                "ref": "docs/vite/config/server-options.md#servermiddlewaremode",
                "score": 0.026190476190476188
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#dev-containers--vs-code-port-forwarding",
                "score": 0.024527186761229315
              },
              {
                "ref": "docs/vite/config/server-options.md#serversourcemapignorelist",
                "score": 0.024224945926459983
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#testing-the-app-locally",
                "score": 0.022380595148787197
              }
            ],
            "durationMs": [
              9.08437500000582
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.03009207275993712,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-vite-sitemap",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.031099324975891997
              },
              {
                "ref": "docs/vite/guide/features.md#preload-directives-generation",
                "score": 0.031054405392392875
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.03009207275993712
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.029513888888888888
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlicense",
                "score": 0.028814262023217248
              }
            ],
            "durationMs": [
              9.261457999993581
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.031099324975891997
          },
          {
            "id": "q-g10-neg-vite-image-webp",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.03200204813108039
              },
              {
                "ref": "docs/vite/guide/assets.md#new-urlurl-importmetaurl",
                "score": 0.03131881575727918
              },
              {
                "ref": "docs/vite/guide/features.md#manual-initialization",
                "score": 0.02690100430416069
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmodulepreload",
                "score": 0.025904203323558164
              },
              {
                "ref": "docs/vite/config/build-options.md#buildchunkimportmap",
                "score": 0.025516795865633074
              }
            ],
            "durationMs": [
              9.798083999980008
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03200204813108039
          },
          {
            "id": "q-g10-neg-terraform-state-lock",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/remote-config.md#anchor-files",
                "score": 0.02719970792259949
              },
              {
                "ref": "docs/expause-web/concepts/sync-on-login.md#related",
                "score": 0.026631393298059962
              },
              {
                "ref": "docs/expause-web/features/settings.md#local-state--sync-direction-optimistic-yn",
                "score": 0.02582908163265306
              },
              {
                "ref": "docs/expause-web/concepts/remote-config.md#related",
                "score": 0.02501906941266209
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#local-state--sync-direction-optimistic-y--for-the-read-flip-only",
                "score": 0.024184149184149184
              }
            ],
            "durationMs": [
              10.270833999995375
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.02719970792259949
          },
          {
            "id": "q-g10-neg-postgres-autovacuum",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/virtual-list.md#initialindex-deep-link-scroll",
                "score": 0.021749408983451537
              },
              {
                "ref": "docs/expause-web/product/product-definition.md#6-competitive-positioning",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/grid-column-count.md#related",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#the-store--datastoragelocalsecurestoragewebcryptots",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/campaigns.md#cloud-functions",
                "score": 0.016129032258064516
              }
            ],
            "durationMs": [
              8.98641700000735
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.021749408983451537
          },
          {
            "id": "q-g10-neg-android-keystore",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/video-transcoding-cdn.md#flutter-parity",
                "score": 0.02803379416282642
              },
              {
                "ref": "docs/expause-web/features/submit-feedback.md#cloud-functions",
                "score": 0.02548435171385991
              },
              {
                "ref": "docs/expause-web/features/publish-content.md",
                "score": 0.024016563146997932
              },
              {
                "ref": "docs/expause-web/concepts/video-transcoding-cdn.md#three-storage-buckets",
                "score": 0.020604395604395608
              },
              {
                "ref": "docs/expause-web/analytics-system.md#device-detection",
                "score": 0.01639344262295082
              }
            ],
            "durationMs": [
              11.18954200000735
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.02803379416282642
          },
          {
            "id": "q-g10-neg-kafka-rebalance",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/VIRTUAL_LIST.md#-what-was-built",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/features/campaigns.md#cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/VIRTUAL_LIST.md#problem-1-virtuoso-scroll-lag",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/product/marketing-viability.md#11-what-would-change-these-verdicts",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/expause-web/features/user-feedback.md#domain",
                "score": 0.015873015873015872
              }
            ],
            "durationMs": [
              9.5977080000157
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.01639344262295082
          },
          {
            "id": "q-g10-neg-k8s-ingress-tls",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/VIDEO_ENCRYPTION_IMPLEMENTATION.md#1-data-layer-srcdata",
                "score": 0.02900988017658188
              },
              {
                "ref": "docs/vite/config/server-options.md#serverhttps",
                "score": 0.02871794871794872
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#network-requests-stop-loading",
                "score": 0.02815814850530376
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#architecture-overview",
                "score": 0.024877149877149878
              },
              {
                "ref": "docs/expause-web/VIDEO_ENCRYPTION_IMPLEMENTATION.md#server-side-cloud-functions",
                "score": 0.023215244229736982
              }
            ],
            "durationMs": [
              9.999834000016563
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.02900988017658188
          },
          {
            "id": "q-g10-neg-pytest-conftest",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/remote-config.md#flutter-parity",
                "score": 0.028373015873015873
              },
              {
                "ref": "docs/expause-web/features/login-session.md#presentation",
                "score": 0.026373626373626377
              },
              {
                "ref": "docs/expause-web/INDEX.md#platform-infra",
                "score": 0.024624624624624628
              },
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.02371967654986523
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#related",
                "score": 0.022380595148787197
              }
            ],
            "durationMs": [
              11.117792000004556
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.028373015873015873
          },
          {
            "id": "q-g10-neg-go-private-modules",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#private-key-delivery--local-hydration-on-login",
                "score": 0.02803379416282642
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/QUICK_SETUP_VIDEO.md#server-side-cloud-functions",
                "score": 0.01639344262295082
              },
              {
                "ref": "docs/expause-web/CDN_CORS_SETUP.md#option-1-cors-policy-recommended---dedicated-setting",
                "score": 0.016129032258064516
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-pages",
                "score": 0.015873015873015872
              }
            ],
            "durationMs": [
              8.855249999993248
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.02803379416282642
          },
          {
            "id": "q-g10-neg-rust-clippy",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverfsdeny",
                "score": 0.03252247488101534
              },
              {
                "ref": "docs/vite/changes/ssr-using-modulerunner.md",
                "score": 0.028371628371628373
              },
              {
                "ref": "docs/vite/guide/features.md#typescript-compiler-options",
                "score": 0.026373626373626377
              },
              {
                "ref": "docs/vite/config/build-options.md#buildchunksizewarninglimit",
                "score": 0.025252525252525256
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#transformwithoxc",
                "score": 0.023518469306404464
              }
            ],
            "durationMs": [
              9.675792000023648
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03252247488101534
          },
          {
            "id": "q-g10-neg-django-squash",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/vite/blog/announcing-vite8.md#the-journey-to-stable",
                "score": 0.029273504273504274
              },
              {
                "ref": "docs/vite/blog/announcing-vite8-beta.md#migrating-to-vite-8-beta",
                "score": 0.02821939586645469
              },
              {
                "ref": "docs/vite/guide/migration.md#removed-buildrollupoptionswatchchokidar-option",
                "score": 0.02788769549651404
              },
              {
                "ref": "docs/vite/blog/announcing-vite8-beta.md#how-vite-migrated-to-rolldown",
                "score": 0.027583600982429624
              },
              {
                "ref": "docs/vite/guide/migration.md#removed-deprecated-features-badge-textnrv-typewarning-migration-from-v7",
                "score": 0.026736111111111113
              }
            ],
            "durationMs": [
              12.022041999996873
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.029273504273504274
          },
          {
            "id": "q-g10-neg-celery-retry",
            "negative": true,
            "abstained": false,
            "bestRerankScore": null,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#gotchas--constraints",
                "score": 0.03149801587301587
              },
              {
                "ref": "docs/expause-web/INDEX.md#web-parity-gaps",
                "score": 0.028006267136701922
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#cloud-functions-the-bulk",
                "score": 0.024868705591597158
              },
              {
                "ref": "docs/expause-web/concepts/text-e2ee.md#wire-format--flutter-byte-compatibility",
                "score": 0.024444444444444446
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#wired-but-caller-pending-callables-a-third-state--neither--nor-plainly-",
                "score": 0.02439384979302188
              }
            ],
            "durationMs": [
              10.258207999984734
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.03149801587301587
          }
        ]
      }
    },
    {
      "arm": "E",
      "mode": "fused-rerank",
      "ran": true,
      "embedCalls": 69,
      "rerankCalls": 69,
      "metrics": {
        "kValues": [
          1,
          3,
          5
        ],
        "positives": 44,
        "negatives": 25,
        "recall": {
          "1": 0.5909090909090909,
          "3": 0.75,
          "5": 0.7954545454545454
        },
        "mrr": 0.6768939393939394,
        "strict": {
          "recall": {
            "1": 0.38636363636363635,
            "3": 0.5681818181818182,
            "5": 0.6818181818181818
          },
          "mrr": 0.49356060606060603
        },
        "latency": {
          "p50": 1099.6625000000058,
          "p95": 1269.2810840000166
        },
        "samples": 69,
        "abstainedOnNegative": 19,
        "perQuery": [
          {
            "id": "q-g10-ew-gift-community-post",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.6507344841957092,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#business-behaviour",
                "score": 0.6507344841957092
              },
              {
                "ref": "docs/expause-web/features/gifting.md#flutter-parity-source-of-truth",
                "score": 0.42348551750183105
              },
              {
                "ref": "docs/expause-web/features/gifting.md",
                "score": 0.24056728184223175
              },
              {
                "ref": "docs/expause-web/features/gifting.md#domain",
                "score": 0.1473969668149948
              },
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.06830006837844849
              }
            ],
            "durationMs": [
              1272.6357499999867
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.6507344841957092,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-sendgift-chat-side-effects",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9923399090766907,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#cloud-functions",
                "score": 0.9923399090766907
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#cloud-functions",
                "score": 0.979432225227356
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#circulation--coin-spends-payment--adjacent",
                "score": 0.9792184233665466
              },
              {
                "ref": "docs/expause-web/features/gifting.md#invoked-from",
                "score": 0.9534200429916382
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#cloud-functions",
                "score": 0.9532334208488464
              }
            ],
            "durationMs": [
              1286.9566669999913
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9923399090766907,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-blocked-suggested-creators",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9631325602531433,
            "hits": [
              {
                "ref": "docs/expause-web/features/block-user.md",
                "score": 0.9631325602531433
              },
              {
                "ref": "docs/expause-web/features/block-user.md#local-state--sync-direction-optimistic-yn",
                "score": 0.6568984985351562
              },
              {
                "ref": "docs/expause-web/features/block-user.md#business-behaviour",
                "score": 0.6399816870689392
              },
              {
                "ref": "docs/expause-web/features/latest-users.md#business-behaviour",
                "score": 0.284921795129776
              },
              {
                "ref": "docs/expause-web/features/settings.md#invoked-from",
                "score": 0.28250840306282043
              }
            ],
            "durationMs": [
              1138.950582999998
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9631325602531433,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-new-notification-tap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9683910012245178,
            "hits": [
              {
                "ref": "docs/expause-web/features/gifting.md#invoked-from",
                "score": 0.9683910012245178
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#business-behaviour",
                "score": 0.9664376378059387
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#invoked-from",
                "score": 0.9275822043418884
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#anchor-files",
                "score": 0.926903486251831
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#presentation",
                "score": 0.9220355749130249
              }
            ],
            "durationMs": [
              1176.2891250000102
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9683910012245178,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-mark-notification-read",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9836937785148621,
            "hits": [
              {
                "ref": "docs/expause-web/features/inbox.md#cloud-functions",
                "score": 0.9836937785148621
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#data",
                "score": 0.9830402135848999
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#business-behaviour",
                "score": 0.969790518283844
              },
              {
                "ref": "docs/expause-web/features/push-notifications.md#invoked-from",
                "score": 0.9692970514297485
              },
              {
                "ref": "docs/expause-web/features/inbox.md#local-state--sync-direction-optimistic-partly--success-gated-no-revert-path",
                "score": 0.9313130378723145
              }
            ],
            "durationMs": [
              1094.3566670000146
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9836937785148621,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-reaction-dislike",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9922598600387573,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-reactions.md#business-behaviour",
                "score": 0.9922598600387573
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#pattern-a--optimistic-write-then-revert",
                "score": 0.7970853447914124
              },
              {
                "ref": "docs/expause-web/features/roadmap-item-like.md#business-behaviour",
                "score": 0.6072527170181274
              },
              {
                "ref": "docs/expause-web/features/roadmap-comments.md#business-behaviour",
                "score": 0.4249015748500824
              },
              {
                "ref": "docs/expause-web/features/content-reactions.md#local-state--sync-direction-optimistic-yn",
                "score": 0.32467541098594666
              }
            ],
            "durationMs": [
              1156.4515419999952
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9922598600387573,
            "rank": 1,
            "strictRank": 5
          },
          {
            "id": "q-g10-ew-watch-later-feed-signal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.8381525874137878,
            "hits": [
              {
                "ref": "docs/expause-web/features/saved-content.md#business-behaviour",
                "score": 0.8381525874137878
              },
              {
                "ref": "docs/expause-web/INDEX.md#content",
                "score": 0.7418469190597534
              },
              {
                "ref": "docs/expause-web/features/saved-content.md#invoked-from",
                "score": 0.14452330768108368
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#business-behaviour",
                "score": 0.03490264341235161
              },
              {
                "ref": "docs/expause-web/features/feed-discovery.md#domain",
                "score": 0.03094986267387867
              }
            ],
            "durationMs": [
              1123.8828749999811
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8381525874137878,
            "rank": 4,
            "strictRank": 4
          },
          {
            "id": "q-g10-ew-deleted-account-subcollection",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.05649895593523979,
            "hits": [],
            "durationMs": [
              1123.8772499999905
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-recent-signin-withdraw",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9454734325408936,
            "hits": [
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.9454734325408936
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#domain",
                "score": 0.544981837272644
              },
              {
                "ref": "docs/expause-web/features/login-session.md#invoked-from",
                "score": 0.1179763451218605
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#invoked-from",
                "score": 0.04702246934175491
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#local-state--sync-direction-optimistic-n",
                "score": 0.011096208356320858
              }
            ],
            "durationMs": [
              1091.7896670000046
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9454734325408936,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-second-browser-login",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9773733019828796,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.9773733019828796
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.2040785849094391
              },
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.08508507162332535
              },
              {
                "ref": "docs/expause-web/features/account-deletion.md#business-behaviour",
                "score": 0.05864226818084717
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.03325442969799042
              }
            ],
            "durationMs": [
              1105.757083000004
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9773733019828796,
            "rank": 1,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-video-call-ended-summary",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.8328534960746765,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.8328534960746765
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#where-its-used",
                "score": 0.4995627701282501
              },
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.13280783593654633
              },
              {
                "ref": "docs/expause-web/features/video-call.md#presentation",
                "score": 0.07375437766313553
              },
              {
                "ref": "docs/expause-web/features/video-call.md#business-behaviour",
                "score": 0.05323898047208786
              }
            ],
            "durationMs": [
              1079.6836250000051
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8328534960746765,
            "rank": 1,
            "strictRank": 5
          },
          {
            "id": "q-g10-ew-firestore-to-typed",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.5939167141914368,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/realtime-firestore-listeners.md#how-it-works",
                "score": 0.5939167141914368
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.40751489996910095
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#what-it-is--why",
                "score": 0.37802770733833313
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#data",
                "score": 0.3111794590950012
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.28935158252716064
              }
            ],
            "durationMs": [
              1114.6797919999808
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.5939167141914368,
            "rank": 2,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-tojson-optional-keys",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9826259016990662,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-comments.md#data",
                "score": 0.9826259016990662
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#remappers",
                "score": 0.8411824107170105
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#firestoreservice-readswrites",
                "score": 0.6134729981422424
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#gotchas--constraints",
                "score": 0.5171820521354675
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#log-call--level-routing-the-key-behaviour",
                "score": 0.35185694694519043
              }
            ],
            "durationMs": [
              1090.9269579999964
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9826259016990662,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-withdraw-confirm-modal",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7907041907310486,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/redux-state-slices.md#where-its-used",
                "score": 0.7907041907310486
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#c-concretely",
                "score": 0.5584657788276672
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#flutter",
                "score": 0.23248714208602905
              },
              {
                "ref": "docs/expause-web/roadmap/payouts-payout-links.md#the-options",
                "score": 0.11453504115343094
              },
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#17-stage-2-payout-program-kyc-ledger-weekly-runner-refunds",
                "score": 0.10703442990779877
              }
            ],
            "durationMs": [
              1080.8539579999924
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7907041907310486,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-withdrawal-labels-romanian",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.17887213826179504,
            "hits": [],
            "durationMs": [
              1099.6625000000058
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-hardcoded-padding-colour",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.0028849972877651453,
            "hits": [],
            "durationMs": [
              1073.2125840000226
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-new-page-back-title",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.3677458167076111,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md",
                "score": 0.3677458167076111
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#what-it-is--why",
                "score": 0.28139498829841614
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#documented-exceptions--do-not-force-the-bar-on-these",
                "score": 0.27437278628349304
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#anchor-files",
                "score": 0.23095820844173431
              },
              {
                "ref": "docs/expause-web/concepts/page-app-bar.md#gotchas--constraints",
                "score": 0.19681362807750702
              }
            ],
            "durationMs": [
              1089.2257499999832
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.3677458167076111,
            "rank": 2,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-console-error-catch",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7905184626579285,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#where-its-used",
                "score": 0.7905184626579285
              },
              {
                "ref": "docs/expause-web/architecture/NAVIGATION_LIFECYCLE.md#1-video-playback-control",
                "score": 0.5585330128669739
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#gotchas--constraints",
                "score": 0.31261634826660156
              },
              {
                "ref": "docs/expause-web/concepts/analytics-logging.md#log-call--level-routing-the-key-behaviour",
                "score": 0.256475031375885
              },
              {
                "ref": "docs/vite/config/server-options.md#serverforwardconsole",
                "score": 0.12588396668434143
              }
            ],
            "durationMs": [
              1069.9740830000082
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7905184626579285,
            "rank": 1,
            "strictRank": 3
          },
          {
            "id": "q-g10-ew-new-callable-unwrap",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9806894063949585,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#response-envelopes-are-not-uniform--read-the-cf",
                "score": 0.9806894063949585
              },
              {
                "ref": "docs/expause-web/features/inbox-notification-tap.md#cloud-functions",
                "score": 0.7805227637290955
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#anchor-files",
                "score": 0.556029736995697
              },
              {
                "ref": "docs/expause-web/concepts/data-layer-dto-remapper.md#cloudfunctionsservice-callables",
                "score": 0.5528743863105774
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#flutter-parity",
                "score": 0.4782731235027313
              }
            ],
            "durationMs": [
              1164.9422499999928
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9806894063949585,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-ew-callable-exists-check",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9702494740486145,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#web-unreachable-callables-deployed--flutter-callable-but-no-web-caller--20",
                "score": 0.9702494740486145
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callable-name-registry--names-must-match-an-export",
                "score": 0.7206255793571472
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-fetch-path-the-one-onrequest-function",
                "score": 0.1232781931757927
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#anchor-files",
                "score": 0.10192763805389404
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#flutter-parity",
                "score": 0.07314404845237732
              }
            ],
            "durationMs": [
              1193.082792000001
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9702494740486145,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-ew-unlock-payload",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9834010004997253,
            "hits": [
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md",
                "score": 0.9834010004997253
              },
              {
                "ref": "docs/expause-web/concepts/payments-and-purchases.md#circulation--coin-spends-payment--adjacent",
                "score": 0.9797785878181458
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#business-behaviour",
                "score": 0.9599328637123108
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#invoked-from",
                "score": 0.9152294397354126
              },
              {
                "ref": "docs/expause-web/features/unlock-premium-content.md#data",
                "score": 0.741050660610199
              }
            ],
            "durationMs": [
              1222.393041000003
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9834010004997253,
            "rank": 5,
            "strictRank": 5
          },
          {
            "id": "q-g10-ew-photo-comment-reply",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.8553592562675476,
            "hits": [
              {
                "ref": "docs/expause-web/features/content-comments.md#business-behaviour",
                "score": 0.8553592562675476
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#cloud-functions",
                "score": 0.7351483702659607
              },
              {
                "ref": "docs/expause-web/features/content-comments.md#local-state--sync-direction-optimistic-yn",
                "score": 0.5738564729690552
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md",
                "score": 0.5605549216270447
              },
              {
                "ref": "docs/expause-web/features/comment-video-reply.md#domain",
                "score": 0.5495814085006714
              }
            ],
            "durationMs": [
              1119.3710830000055
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8553592562675476,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-ew-group-room-agora-token",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9825863242149353,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#what-it-is--why",
                "score": 0.9825863242149353
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md",
                "score": 0.965114176273346
              },
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.9338632822036743
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#where-its-used",
                "score": 0.9166362881660461
              },
              {
                "ref": "docs/expause-web/concepts/agora-rtc.md#anchor-files",
                "score": 0.8250126838684082
              }
            ],
            "durationMs": [
              1124.2476660000102
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9825863242149353,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-staging-build",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9914337992668152,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#modes",
                "score": 0.9914337992668152
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.9438169598579407
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.9247733950614929
              },
              {
                "ref": "docs/vite/guide/ssr.md#building-for-production",
                "score": 0.84883052110672
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.8363175392150879
              }
            ],
            "durationMs": [
              1075.425332999992
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9914337992668152,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-dev-api-forward",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.11869131028652191,
            "hits": [],
            "durationMs": [
              1121.6839170000167
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-github-pages-subpath",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.8052747845649719,
            "hits": [
              {
                "ref": "docs/vite/guide/static-deploy.md#github-pages",
                "score": 0.8052747845649719
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#cloudflare-pages",
                "score": 0.4655163586139679
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#render",
                "score": 0.43777385354042053
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#gitlab-pages-and-gitlab-ci",
                "score": 0.3004828095436096
              },
              {
                "ref": "docs/vite/guide/static-deploy.md#azure-static-web-apps",
                "score": 0.2854037880897522
              }
            ],
            "durationMs": [
              1133.73887500001
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8052747845649719,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-wsl-file-save",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9265260100364685,
            "hits": [
              {
                "ref": "docs/vite/config/server-options.md#serverwatch",
                "score": 0.9265260100364685
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#vite-does-not-detect-a-file-change",
                "score": 0.08465905487537384
              },
              {
                "ref": "docs/expause-web/features/user-profile.md#local-state--sync-direction-optimistic-n",
                "score": 0.06891817599534988
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#the-hotupdate-hook",
                "score": 0.053275320678949356
              },
              {
                "ref": "docs/vite/guide/ssr.md#setting-up-the-dev-server",
                "score": 0.044559285044670105
              }
            ],
            "durationMs": [
              1070.3492499999993
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9265260100364685,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-stale-chunk-deploy",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9973997473716736,
            "hits": [
              {
                "ref": "docs/vite/guide/troubleshooting.md#failed-to-fetch-dynamically-imported-module-error",
                "score": 0.9973997473716736
              },
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.910973072052002
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#browser-extensions",
                "score": 0.9063370227813721
              },
              {
                "ref": "docs/vite/guide/api-environment-instances.md#fetchresult",
                "score": 0.36003175377845764
              },
              {
                "ref": "docs/expause-web/concepts/sync-on-login.md#gotchas--constraints",
                "score": 0.23227137327194214
              }
            ],
            "durationMs": [
              1074.1201670000155
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9973997473716736,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-linked-ui-package",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.49240702390670776,
            "hits": [
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#monorepos-and-linked-dependencies",
                "score": 0.49240702390670776
              },
              {
                "ref": "docs/vite/guide/static-deploy.md",
                "score": 0.262806236743927
              },
              {
                "ref": "docs/vite/guide/dep-pre-bundling.md#browser-cache",
                "score": 0.0865519642829895
              },
              {
                "ref": "docs/vite/guide/index.md#command-line-interface",
                "score": 0.05206746980547905
              },
              {
                "ref": "docs/vite/guide/troubleshooting.md#outdated-pre-bundled-deps-when-linking-to-a-local-package",
                "score": 0.028929976746439934
              }
            ],
            "durationMs": [
              1072.826791999978
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.49240702390670776,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-admin-html-entry",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.260576456785202,
            "hits": [],
            "durationMs": [
              1092.8039590000117
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-vite-plugin-package-name",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9628307819366455,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#conventions",
                "score": 0.9628307819366455
              },
              {
                "ref": "docs/vite/guide/features.md#client-types",
                "score": 0.45963189005851746
              },
              {
                "ref": "docs/vite/blog/announcing-vite8-beta.md#migrating-to-vite-8-beta",
                "score": 0.33741843700408936
              },
              {
                "ref": "docs/vite/guide/build.md#css-support",
                "score": 0.08253433555364609
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.06434805691242218
              }
            ],
            "durationMs": [
              1072.1946250000037
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9628307819366455,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-virtual-routes",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9980148673057556,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#importing-a-virtual-file",
                "score": 0.9980148673057556
              },
              {
                "ref": "docs/vite/guide/api-environment-frameworks.md#raw-devenvironment",
                "score": 0.8450517654418945
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#rolldown-hooks",
                "score": 0.7724257707595825
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.609529972076416
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmodulepreload",
                "score": 0.4637337327003479
              }
            ],
            "durationMs": [
              1094.4685419999878
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9980148673057556,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-src-alias",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.8835850954055786,
            "hits": [
              {
                "ref": "docs/vite/config/shared-options.md#resolvetsconfigpaths",
                "score": 0.8835850954055786
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.5405991077423096
              },
              {
                "ref": "docs/vite/guide/assets.md#new-urlurl-importmetaurl",
                "score": 0.16399569809436798
              },
              {
                "ref": "docs/vite/guide/features.md#import-inlining-and-rebasing",
                "score": 0.061605118215084076
              },
              {
                "ref": "docs/vite/config/shared-options.md#resolvealias",
                "score": 0.049750518053770065
              }
            ],
            "durationMs": [
              1074.91525000002
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.8835850954055786,
            "rank": 1,
            "strictRank": 5
          },
          {
            "id": "q-g10-vite-robots-favicon",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9682046175003052,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#the-public-directory",
                "score": 0.9682046175003052
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.2815793454647064
              },
              {
                "ref": "docs/vite/guide/assets.md#new-urlurl-importmetaurl",
                "score": 0.00807689968496561
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#the-callable-name-registry--names-must-match-an-export",
                "score": 0.005298300180584192
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.0030724401585757732
              }
            ],
            "durationMs": [
              1142.6074999999837
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9682046175003052,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-only-plugin",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9962415099143982,
            "hits": [
              {
                "ref": "docs/vite/guide/using-plugins.md#enforcing-plugin-ordering",
                "score": 0.9962415099143982
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#shared-plugins-during-build",
                "score": 0.9769850969314575
              },
              {
                "ref": "docs/vite/guide/api-plugin.md",
                "score": 0.9686670303344727
              },
              {
                "ref": "docs/vite/guide/api-environment-frameworks.md#the-buildapp-plugin-hook",
                "score": 0.9568374752998352
              },
              {
                "ref": "docs/vite/guide/using-plugins.md#conditional-application",
                "score": 0.9291238188743591
              }
            ],
            "durationMs": [
              1135.4604159999872
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9962415099143982,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-scoped-card-styles",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7495322227478027,
            "hits": [
              {
                "ref": "docs/vite/config/shared-options.md#cssmodules",
                "score": 0.7495322227478027
              },
              {
                "ref": "docs/vite/guide/features.md#css-modules",
                "score": 0.35205399990081787
              },
              {
                "ref": "docs/expause-web/architecture/ARCHITECTURE.md#-file-naming-conventions",
                "score": 0.07190018892288208
              },
              {
                "ref": "docs/vite/config/build-options.md#buildlib",
                "score": 0.016679149121046066
              },
              {
                "ref": "docs/expause-web/concepts/responsive-theme.md#responsive",
                "score": 0.011164499446749687
              }
            ],
            "durationMs": [
              1085.482250000001
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7495322227478027,
            "rank": 1,
            "strictRank": 2
          },
          {
            "id": "q-g10-vite-client-env-undefined",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9657322764396667,
            "hits": [
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-variables",
                "score": 0.9657322764396667
              },
              {
                "ref": "docs/vite/config/shared-options.md#envprefix",
                "score": 0.9111653566360474
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#intellisense-for-typescript",
                "score": 0.8994305729866028
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.8761593699455261
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#built-in-constants",
                "score": 0.7449032664299011
              }
            ],
            "durationMs": [
              1134.38400000002
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9657322764396667,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-config-reads-env",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9873639941215515,
            "hits": [
              {
                "ref": "docs/vite/config/index.md#using-environment-variables-in-config",
                "score": 0.9873639941215515
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#intellisense-for-typescript",
                "score": 0.9735799431800842
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#createserver",
                "score": 0.9698702692985535
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#html-constant-replacement",
                "score": 0.9500632286071777
              },
              {
                "ref": "docs/vite/guide/env-and-mode.md#env-files",
                "score": 0.9194387197494507
              }
            ],
            "durationMs": [
              1164.1300420000043
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9873639941215515,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-health-middleware",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.9949919581413269,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#configureserver",
                "score": 0.9949919581413269
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#configurepreviewserver",
                "score": 0.9854418039321899
              },
              {
                "ref": "docs/vite/guide/ssr.md#vite-cli",
                "score": 0.975874662399292
              },
              {
                "ref": "docs/vite/guide/ssr.md#setting-up-the-dev-server",
                "score": 0.833220899105072
              },
              {
                "ref": "docs/vite/config/server-options.md#serverproxy",
                "score": 0.8194533586502075
              }
            ],
            "durationMs": [
              1080.0972499999916
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.9949919581413269,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-build-sha-meta",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.5703746676445007,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#transformindexhtml",
                "score": 0.5703746676445007
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#rolldown-hooks",
                "score": 0.5352590084075928
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.4290688931941986
              },
              {
                "ref": "docs/vite/guide/api-environment-plugins.md#shared-plugins-during-build",
                "score": 0.35922345519065857
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.11469089984893799
              }
            ],
            "durationMs": [
              1078.4335000000137
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.5703746676445007,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-mock-updated-event",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7016140222549438,
            "hits": [
              {
                "ref": "docs/vite/guide/api-plugin.md#server-to-client",
                "score": 0.7016140222549438
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#client-to-server",
                "score": 0.4335764944553375
              },
              {
                "ref": "docs/vite/changes/hotupdate-hook.md#motivation",
                "score": 0.34102120995521545
              },
              {
                "ref": "docs/vite/guide/api-javascript.md#vitedevserver",
                "score": 0.04888131842017174
              },
              {
                "ref": "docs/vite/guide/api-environment.md#closing-the-gap-between-build-and-dev",
                "score": 0.024179983884096146
              }
            ],
            "durationMs": [
              1108.033832999994
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7016140222549438,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-vite-rails-manifest-tags",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.45608168840408325,
            "hits": [
              {
                "ref": "docs/vite/guide/backend-integration.md",
                "score": 0.45608168840408325
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.4025861322879791
              },
              {
                "ref": "docs/vite/config/build-options.md#buildssrmanifest",
                "score": 0.08439183235168457
              },
              {
                "ref": "docs/vite/guide/build.md#css-support",
                "score": 0.08008135110139847
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmanifest",
                "score": 0.06925444304943085
              }
            ],
            "durationMs": [
              1071.8101669999887
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.45608168840408325,
            "rank": 1,
            "strictRank": 1
          },
          {
            "id": "q-g10-neg-login-sms-2fa",
            "negative": true,
            "abstained": false,
            "bestRerankScore": 0.7175682783126831,
            "hits": [
              {
                "ref": "docs/expause-web/features/login-session.md#flutter-parity-source-of-truth",
                "score": 0.7175682783126831
              },
              {
                "ref": "docs/expause-web/features/login-session.md#presentation",
                "score": 0.2783482074737549
              },
              {
                "ref": "docs/expause-web/concepts/secure-storage-pattern.md#lifecycle-init--hydrate--clear",
                "score": 0.261210560798645
              },
              {
                "ref": "docs/expause-web/INDEX.md#users--social-1",
                "score": 0.13256698846817017
              },
              {
                "ref": "docs/expause-web/features/login-session.md#business-behaviour",
                "score": 0.05479912459850311
              }
            ],
            "durationMs": [
              1103.4006660000014
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.7175682783126831
          },
          {
            "id": "q-g10-neg-chat-typing-indicator",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.1318972110748291,
            "hits": [],
            "durationMs": [
              1123.2334579999733
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-chat-voice-message",
            "negative": true,
            "abstained": false,
            "bestRerankScore": 0.6190884113311768,
            "hits": [
              {
                "ref": "docs/expause-web/features/video-call.md",
                "score": 0.6190884113311768
              },
              {
                "ref": "docs/expause-web/INDEX.md#communication",
                "score": 0.04085336625576019
              },
              {
                "ref": "docs/expause-web/features/chat.md#business-behaviour",
                "score": 0.01061205193400383
              },
              {
                "ref": "docs/expause-web/features/video-call.md#data",
                "score": 0.007518038619309664
              },
              {
                "ref": "docs/expause-web/features/live-streaming-chat.md#business-behaviour",
                "score": 0.007111068814992905
              }
            ],
            "durationMs": [
              1124.397874999995
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.6190884113311768
          },
          {
            "id": "q-g10-neg-chat-edit-message",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.03189298138022423,
            "hits": [],
            "durationMs": [
              1117.3633330000157
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-group-chat",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.03034467250108719,
            "hits": [],
            "durationMs": [
              1076.2620829999796
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-playback-speed",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.009558700025081635,
            "hits": [],
            "durationMs": [
              1090.2685000000056
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-profile-qr-code",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.029336920008063316,
            "hits": [],
            "durationMs": [
              1149.9878749999916
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-coin-promo-code",
            "negative": false,
            "abstained": false,
            "bestRerankScore": 0.7667030096054077,
            "hits": [
              {
                "ref": "docs/expause-web/product/launch-todo.md#deliberately-deferred-post-validation-queue--listed-so-nothing-is-silently-dropped",
                "score": 0.7667030096054077
              },
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#21-stripe-on-the-web-plan-c--growth-first-build-when-traffic-warrants",
                "score": 0.7344700694084167
              },
              {
                "ref": "docs/expause-web/product/product-decision-rate-card.md#34-accompanying-mechanics-relabeled-honestly",
                "score": 0.5185686945915222
              },
              {
                "ref": "docs/expause-web/features/wallet-coins.md#business-behaviour",
                "score": 0.31353020668029785
              },
              {
                "ref": "docs/expause-web/product/technical-roadmap.md#22-remaining-deferred-builds-parked-listed-so-nothing-drops-silently",
                "score": 0.16787664592266083
              }
            ],
            "durationMs": [
              1297.4605000000156
            ],
            "warnings": [],
            "bestScoreOnPositive": 0.7667030096054077,
            "rank": 3,
            "strictRank": 3
          },
          {
            "id": "q-g10-neg-expiring-stories",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.007409744430333376,
            "hits": [],
            "durationMs": [
              1183.5776250000054
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-pin-comment",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.0735495314002037,
            "hits": [],
            "durationMs": [
              1096.3154579999973
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-storybook-stories",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.05188025161623955,
            "hits": [],
            "durationMs": [
              1108.001958000008
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-callable-app-check",
            "negative": true,
            "abstained": false,
            "bestRerankScore": 0.9142862558364868,
            "hits": [
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#gotchas--constraints",
                "score": 0.9142862558364868
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#what-it-is--why",
                "score": 0.4902108609676361
              },
              {
                "ref": "docs/expause-web/concepts/device-takeover.md#what-it-is--why",
                "score": 0.1944779008626938
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md#response-envelopes-are-not-uniform--read-the-cf",
                "score": 0.13145920634269714
              },
              {
                "ref": "docs/expause-web/concepts/cloud-functions-client-surface.md",
                "score": 0.08270184695720673
              }
            ],
            "durationMs": [
              1089.536208000005
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.9142862558364868
          },
          {
            "id": "q-g10-neg-vite-precompress",
            "negative": true,
            "abstained": false,
            "bestRerankScore": 0.36766234040260315,
            "hits": [
              {
                "ref": "docs/vite/guide/build.md#load-error-handling",
                "score": 0.36766234040260315
              },
              {
                "ref": "docs/vite/guide/index.md#overview",
                "score": 0.3533238470554352
              },
              {
                "ref": "docs/vite/guide/api-plugin.md#output-bundle-metadata",
                "score": 0.23989616334438324
              },
              {
                "ref": "docs/vite/guide/backend-integration.md",
                "score": 0.1726824790239334
              },
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.15944267809391022
              }
            ],
            "durationMs": [
              1089.4833750000107
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.36766234040260315
          },
          {
            "id": "q-g10-neg-vite-obfuscate",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.045398589223623276,
            "hits": [],
            "durationMs": [
              1126.6906250000175
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-vite-server-mock",
            "negative": false,
            "abstained": true,
            "bestRerankScore": 0.2878953814506531,
            "hits": [],
            "durationMs": [
              1058.8148339999898
            ],
            "warnings": [],
            "bestScoreOnPositive": null,
            "rank": 0,
            "strictRank": 0
          },
          {
            "id": "q-g10-neg-vite-sitemap",
            "negative": true,
            "abstained": false,
            "bestRerankScore": 0.9861363768577576,
            "hits": [
              {
                "ref": "docs/vite/guide/ssr.md#generating-preload-directives",
                "score": 0.9861363768577576
              },
              {
                "ref": "docs/vite/guide/build.md#multi-page-app",
                "score": 0.9127194285392761
              },
              {
                "ref": "docs/vite/guide/ssr.md#pre-rendering--ssg",
                "score": 0.8956217765808105
              },
              {
                "ref": "docs/vite/guide/features.md#preload-directives-generation",
                "score": 0.8922213315963745
              },
              {
                "ref": "docs/vite/guide/build.md#advanced-base-options",
                "score": 0.8486735820770264
              }
            ],
            "durationMs": [
              1095.3961249999993
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.9861363768577576
          },
          {
            "id": "q-g10-neg-vite-image-webp",
            "negative": true,
            "abstained": false,
            "bestRerankScore": 0.8811254501342773,
            "hits": [
              {
                "ref": "docs/vite/guide/assets.md#new-urlurl-importmetaurl",
                "score": 0.8811254501342773
              },
              {
                "ref": "docs/vite/guide/assets.md#importing-asset-as-url",
                "score": 0.8596318364143372
              },
              {
                "ref": "docs/vite/guide/features.md#static-assets",
                "score": 0.09207592159509659
              },
              {
                "ref": "docs/vite/config/build-options.md#buildmodulepreload",
                "score": 0.03692534193396568
              },
              {
                "ref": "docs/vite/guide/features.md#manual-initialization",
                "score": 0.03585171699523926
              }
            ],
            "durationMs": [
              1093.3775839999726
            ],
            "warnings": [],
            "bestScoreOnNegative": 0.8811254501342773
          },
          {
            "id": "q-g10-neg-terraform-state-lock",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.0006189720588736236,
            "hits": [],
            "durationMs": [
              1147.2990839999984
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-postgres-autovacuum",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00006880000000819564,
            "hits": [],
            "durationMs": [
              1078.6134160000365
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-android-keystore",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.004681364633142948,
            "hits": [],
            "durationMs": [
              1077.207624999981
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-kafka-rebalance",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.000022114867533673532,
            "hits": [],
            "durationMs": [
              1089.9985410000081
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-k8s-ingress-tls",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.02788946032524109,
            "hits": [],
            "durationMs": [
              1269.2810840000166
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-pytest-conftest",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.0047185528092086315,
            "hits": [],
            "durationMs": [
              1110.891166000045
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-go-private-modules",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00045682076597586274,
            "hits": [],
            "durationMs": [
              1098.267125000013
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-rust-clippy",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.00031986282556317747,
            "hits": [],
            "durationMs": [
              1113.1820000000298
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-django-squash",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.001916314009577036,
            "hits": [],
            "durationMs": [
              1076.50900000002
            ],
            "warnings": [],
            "bestScoreOnNegative": null
          },
          {
            "id": "q-g10-neg-celery-retry",
            "negative": true,
            "abstained": true,
            "bestRerankScore": 0.001845852704718709,
            "hits": [],
            "durationMs": [
              1087.1522499999846
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
<!-- eval:corpus:gate10-catalog:end -->

<!-- eval:generated:end -->

## Threshold calibration

**This section is the record of the calibration** — the one place the value, the evidence it was
chosen from, what it costs and the limit on it are written down. The constant's own doc comment in
`cli/src/retrieval/search.ts`, `docs/retrieval.md` and `docs/cli.md` §11 cite this section rather than
restating its figures: a number that belongs to the calibration is added here and nowhere else.

**The value.** `ABSTAIN_SCORE_THRESHOLD = 0.32` in `cli/src/retrieval/search.ts`, applied as
`best < ABSTAIN_SCORE_THRESHOLD` to the top reranker score of the `fused-rerank` mode alone. **It is
unchanged.** The re-calibration method below, run once over the observed distributions, returned
`cannot-separate`, so the constant is left where it was rather than trading recall silently. The
decision of record is also **withdrawn** (`## The decision, applied to the real catalog`), so the
constant goes with the tool under roadmap item 18 in `docs/development.md` →
`## 6. The roadmap this tree defers to`. What follows records the distributions it was re-tested on.

**What it was calibrated on.** The value itself dates from the censored run in
`### The value this replaces`. The re-calibration pooled arm E (`fused-rerank`) of three generated
blocks in this file, each run on 2026-09-23 on host `darwin 24.6.0` under Node `v20.19.5`, with embedder
`Xenova/bge-small-en-v1.5:q8:cls:384:v1` and reranker `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1`
loaded outside the stub and the threshold at `0.32`:

| Corpus | Snapshot | Queries | Generated at |
| --- | --- | --- | --- |
| `gate10-catalog` — the real catalog, corpus commit `57a6c25` (`docs/` identical to gate 10's `010c50e`) | `{ files: 156, chunks: 1960 }` | 44 positive, 25 negative (10 `far`, 15 `near`) | `2026-09-23T18:49:10.704Z` |
| `fixture-catalog` | `{ files: 9, chunks: 41 }` | 9 positive, 3 negative (1 `far`, 2 `near`) | `2026-09-23T19:26:59.227Z` |
| `self-docs` | `{ files: 14, chunks: 213 }` | 15 positive, 5 negative (2 `far`, 3 `near`) | `2026-09-23T19:27:46.757Z` |

Every one of the 101 points is an **observed** `bestRerankScore` — none censored, none `unclassed`, and
none excluded (`excluded` is empty). Every positive carries a grade-3 label. The figures in this
section come from one launcher, run on 2026-09-23 through `bash scripts/scratch-run.sh` over
`harness-runs/scratch/task23_record.mjs`, which calls `readPerQuery(text, id, armForLetter('E').mode)`
for each corpus and `calibrateThreshold` over the three, exactly as the launcher that decided the
constant did.

**The method's case: `cannot-separate`.** The distributions overlap — the highest negative,
`q-g10-neg-vite-sitemap` (`gate10-catalog`, `near`) at `0.9861363768577576`, is above the lowest
positive, `q-fc-billable-weight` (`fixture-catalog`) at `0.00004109544534003362` — so the
**overlapping** branch applies. `L`, the lowest grade-3 positive, is that same query at
`0.00004109544534003362`. `N`, the `near` negatives scoring below `L`, is **empty**: the lowest `near`
negative in the pool, `q-fc-negative-recruitment` at `0.00018444025772623718`, already scores above it.
An empty `N` is the method's `cannot-separate` finding, so no candidate value and no price were computed
(`price` is empty), and the constant is unchanged rather than trading recall silently.

### The observed distributions, quoted

One row per point, in the launcher's order. `q-g10-neg-coin-promo-code` and
`q-g10-neg-vite-server-mock` are positives despite their ids: the operator converted them at approval
(`## The real-catalog query set`).

| Corpus | Query | Kind | Grade 3 | `bestRerankScore` |
| --- | --- | --- | --- | --- |
| `gate10-catalog` | `q-g10-ew-gift-community-post` | positive | yes | `0.6507344841957092` |
| `gate10-catalog` | `q-g10-ew-sendgift-chat-side-effects` | positive | yes | `0.9923399090766907` |
| `gate10-catalog` | `q-g10-ew-blocked-suggested-creators` | positive | yes | `0.9631325602531433` |
| `gate10-catalog` | `q-g10-ew-new-notification-tap` | positive | yes | `0.9683910012245178` |
| `gate10-catalog` | `q-g10-ew-mark-notification-read` | positive | yes | `0.9836937785148621` |
| `gate10-catalog` | `q-g10-ew-reaction-dislike` | positive | yes | `0.9922598600387573` |
| `gate10-catalog` | `q-g10-ew-watch-later-feed-signal` | positive | yes | `0.8381525874137878` |
| `gate10-catalog` | `q-g10-ew-deleted-account-subcollection` | positive | yes | `0.05649895593523979` |
| `gate10-catalog` | `q-g10-ew-recent-signin-withdraw` | positive | yes | `0.9454734325408936` |
| `gate10-catalog` | `q-g10-ew-second-browser-login` | positive | yes | `0.9773733019828796` |
| `gate10-catalog` | `q-g10-ew-video-call-ended-summary` | positive | yes | `0.8328534960746765` |
| `gate10-catalog` | `q-g10-ew-firestore-to-typed` | positive | yes | `0.5939167141914368` |
| `gate10-catalog` | `q-g10-ew-tojson-optional-keys` | positive | yes | `0.9826259016990662` |
| `gate10-catalog` | `q-g10-ew-withdraw-confirm-modal` | positive | yes | `0.7907041907310486` |
| `gate10-catalog` | `q-g10-ew-withdrawal-labels-romanian` | positive | yes | `0.17887213826179504` |
| `gate10-catalog` | `q-g10-ew-hardcoded-padding-colour` | positive | yes | `0.0028849972877651453` |
| `gate10-catalog` | `q-g10-ew-new-page-back-title` | positive | yes | `0.3677458167076111` |
| `gate10-catalog` | `q-g10-ew-console-error-catch` | positive | yes | `0.7905184626579285` |
| `gate10-catalog` | `q-g10-ew-new-callable-unwrap` | positive | yes | `0.9806894063949585` |
| `gate10-catalog` | `q-g10-ew-callable-exists-check` | positive | yes | `0.9702494740486145` |
| `gate10-catalog` | `q-g10-ew-unlock-payload` | positive | yes | `0.9834010004997253` |
| `gate10-catalog` | `q-g10-ew-photo-comment-reply` | positive | yes | `0.8553592562675476` |
| `gate10-catalog` | `q-g10-ew-group-room-agora-token` | positive | yes | `0.9825863242149353` |
| `gate10-catalog` | `q-g10-vite-staging-build` | positive | yes | `0.9914337992668152` |
| `gate10-catalog` | `q-g10-vite-dev-api-forward` | positive | yes | `0.11869131028652191` |
| `gate10-catalog` | `q-g10-vite-github-pages-subpath` | positive | yes | `0.8052747845649719` |
| `gate10-catalog` | `q-g10-vite-wsl-file-save` | positive | yes | `0.9265260100364685` |
| `gate10-catalog` | `q-g10-vite-stale-chunk-deploy` | positive | yes | `0.9973997473716736` |
| `gate10-catalog` | `q-g10-vite-linked-ui-package` | positive | yes | `0.49240702390670776` |
| `gate10-catalog` | `q-g10-vite-admin-html-entry` | positive | yes | `0.260576456785202` |
| `gate10-catalog` | `q-g10-vite-plugin-package-name` | positive | yes | `0.9628307819366455` |
| `gate10-catalog` | `q-g10-vite-virtual-routes` | positive | yes | `0.9980148673057556` |
| `gate10-catalog` | `q-g10-vite-src-alias` | positive | yes | `0.8835850954055786` |
| `gate10-catalog` | `q-g10-vite-robots-favicon` | positive | yes | `0.9682046175003052` |
| `gate10-catalog` | `q-g10-vite-build-only-plugin` | positive | yes | `0.9962415099143982` |
| `gate10-catalog` | `q-g10-vite-scoped-card-styles` | positive | yes | `0.7495322227478027` |
| `gate10-catalog` | `q-g10-vite-client-env-undefined` | positive | yes | `0.9657322764396667` |
| `gate10-catalog` | `q-g10-vite-config-reads-env` | positive | yes | `0.9873639941215515` |
| `gate10-catalog` | `q-g10-vite-health-middleware` | positive | yes | `0.9949919581413269` |
| `gate10-catalog` | `q-g10-vite-build-sha-meta` | positive | yes | `0.5703746676445007` |
| `gate10-catalog` | `q-g10-vite-mock-updated-event` | positive | yes | `0.7016140222549438` |
| `gate10-catalog` | `q-g10-vite-rails-manifest-tags` | positive | yes | `0.45608168840408325` |
| `gate10-catalog` | `q-g10-neg-login-sms-2fa` | near | no | `0.7175682783126831` |
| `gate10-catalog` | `q-g10-neg-chat-typing-indicator` | near | no | `0.1318972110748291` |
| `gate10-catalog` | `q-g10-neg-chat-voice-message` | near | no | `0.6190884113311768` |
| `gate10-catalog` | `q-g10-neg-chat-edit-message` | near | no | `0.03189298138022423` |
| `gate10-catalog` | `q-g10-neg-group-chat` | near | no | `0.03034467250108719` |
| `gate10-catalog` | `q-g10-neg-playback-speed` | near | no | `0.009558700025081635` |
| `gate10-catalog` | `q-g10-neg-profile-qr-code` | near | no | `0.029336920008063316` |
| `gate10-catalog` | `q-g10-neg-coin-promo-code` | positive | yes | `0.7667030096054077` |
| `gate10-catalog` | `q-g10-neg-expiring-stories` | near | no | `0.007409744430333376` |
| `gate10-catalog` | `q-g10-neg-pin-comment` | near | no | `0.0735495314002037` |
| `gate10-catalog` | `q-g10-neg-storybook-stories` | near | no | `0.05188025161623955` |
| `gate10-catalog` | `q-g10-neg-callable-app-check` | near | no | `0.9142862558364868` |
| `gate10-catalog` | `q-g10-neg-vite-precompress` | near | no | `0.36766234040260315` |
| `gate10-catalog` | `q-g10-neg-vite-obfuscate` | near | no | `0.045398589223623276` |
| `gate10-catalog` | `q-g10-neg-vite-server-mock` | positive | yes | `0.2878953814506531` |
| `gate10-catalog` | `q-g10-neg-vite-sitemap` | near | no | `0.9861363768577576` |
| `gate10-catalog` | `q-g10-neg-vite-image-webp` | near | no | `0.8811254501342773` |
| `gate10-catalog` | `q-g10-neg-terraform-state-lock` | far | no | `0.0006189720588736236` |
| `gate10-catalog` | `q-g10-neg-postgres-autovacuum` | far | no | `0.00006880000000819564` |
| `gate10-catalog` | `q-g10-neg-android-keystore` | far | no | `0.004681364633142948` |
| `gate10-catalog` | `q-g10-neg-kafka-rebalance` | far | no | `0.000022114867533673532` |
| `gate10-catalog` | `q-g10-neg-k8s-ingress-tls` | far | no | `0.02788946032524109` |
| `gate10-catalog` | `q-g10-neg-pytest-conftest` | far | no | `0.0047185528092086315` |
| `gate10-catalog` | `q-g10-neg-go-private-modules` | far | no | `0.00045682076597586274` |
| `gate10-catalog` | `q-g10-neg-rust-clippy` | far | no | `0.00031986282556317747` |
| `gate10-catalog` | `q-g10-neg-django-squash` | far | no | `0.001916314009577036` |
| `gate10-catalog` | `q-g10-neg-celery-retry` | far | no | `0.001845852704718709` |
| `fixture-catalog` | `q-fc-route-choice` | positive | yes | `0.9988245368003845` |
| `fixture-catalog` | `q-fc-late-handin` | positive | yes | `0.9811885952949524` |
| `fixture-catalog` | `q-fc-barcode-contents` | positive | yes | `0.941379964351654` |
| `fixture-catalog` | `q-fc-unreadable-label` | positive | yes | `0.9988497495651245` |
| `fixture-catalog` | `q-fc-billable-weight` | positive | yes | `0.00004109544534003362` |
| `fixture-catalog` | `q-fc-surcharge-compounding` | positive | yes | `0.0007010828121565282` |
| `fixture-catalog` | `q-fc-webhook-retry` | positive | yes | `0.5472269654273987` |
| `fixture-catalog` | `q-fc-verify-callback` | positive | yes | `0.07702871412038803` |
| `fixture-catalog` | `q-fc-token-lifetime` | positive | yes | `0.983818769454956` |
| `fixture-catalog` | `q-fc-negative-recruitment` | near | no | `0.00018444025772623718` |
| `fixture-catalog` | `q-fc-negative-lattice` | far | no | `0.00001332825831923401` |
| `fixture-catalog` | `q-fc-negative-datastore` | near | no | `0.1376960277557373` |
| `self-docs` | `q-sd-new-config-key` | positive | yes | `0.24328240752220154` |
| `self-docs` | `q-sd-deny-guard` | positive | yes | `0.8057302832603455` |
| `self-docs` | `q-sd-new-subcommand` | positive | yes | `0.9983586072921753` |
| `self-docs` | `q-sd-run-gates` | positive | yes | `0.15524116158485413` |
| `self-docs` | `q-sd-state-dir` | positive | yes | `0.9111862778663635` |
| `self-docs` | `q-sd-commit-prefix` | positive | yes | `0.7109293937683105` |
| `self-docs` | `q-sd-guard-shell-options` | positive | yes | `0.9819909930229187` |
| `self-docs` | `q-sd-cross-asset-reference` | positive | yes | `0.9992165565490723` |
| `self-docs` | `q-sd-daemon-lifecycle` | positive | yes | `0.9138407707214355` |
| `self-docs` | `q-sd-usage-limit` | positive | yes | `0.9861159920692444` |
| `self-docs` | `q-sd-search-abstains` | positive | yes | `0.7631139755249023` |
| `self-docs` | `q-sd-retrieval-network` | positive | yes | `0.7951579093933105` |
| `self-docs` | `q-sd-analyze-writes` | positive | yes | `0.33899036049842834` |
| `self-docs` | `q-sd-stack-detection` | positive | yes | `0.9918370842933655` |
| `self-docs` | `q-sd-second-init` | positive | yes | `0.9616067409515381` |
| `self-docs` | `q-sd-negative-ingress` | far | no | `0.00044672354124486446` |
| `self-docs` | `q-sd-negative-tungsten` | far | no | `0.000015803376300027594` |
| `self-docs` | `q-sd-negative-blog` | near | no | `0.00018704720423556864` |
| `self-docs` | `q-sd-negative-grpc` | near | no | `0.28913185000419617` |
| `self-docs` | `q-sd-negative-migration` | near | no | `0.00026293908013030887` |

### The value this replaces

`0.32` was chosen on 2026-09-21 from arm E over two committed corpora at earlier snapshots —
`fixture-catalog` at 9 files / 41 chunks and `self-docs` at 13 files / 173 chunks — run with the
threshold at `0.3`. That run recorded only the top **returned** hit's score, `null` on an abstention, so
every negative was censored: known to be below `0.30`, never observed. The interval the evidence
asserted, pooled, was `[0.30, 0.33899036049842834]` — the censoring bound on every negative, and the
lowest observed positive, `q-sd-analyze-writes` — and `0.32` is its midpoint `0.3195` rounded to two
decimals. It could not be re-derived then because no negative score existed to derive it from; the
uncensored `bestRerankScore` above is what that run lacked. The stub-fixture bound still holds for it:
the abstention cases of `cli/test/docs-retrieval.test.mjs` run under the `stub-overlap` reranker, which
scores a match `1.000` and the no-match query `0.000`, so any value strictly inside `(0.000, 1.000)`
keeps them passing.

### What the move cost

**Nothing moved, so nothing changed.** With the value unchanged, no positive newly abstains and no
negative newly abstains on any corpus. What `0.32` does on the observed scores, counted from
`bestRerankScore`, which does not depend on the threshold:

| Corpus | Positives abstaining at `0.32` | Negatives abstaining at `0.32` | Negatives answered at `0.32` |
| --- | --- | --- | --- |
| `gate10-catalog` | 6 of 44 — `q-g10-ew-deleted-account-subcollection`, `q-g10-ew-withdrawal-labels-romanian`, `q-g10-ew-hardcoded-padding-colour`, `q-g10-vite-dev-api-forward`, `q-g10-vite-admin-html-entry`, `q-g10-neg-vite-server-mock` | 19 of 25 (`far` 10 of 10, `near` 9 of 15) | 6, all `near` — `q-g10-neg-login-sms-2fa`, `q-g10-neg-chat-voice-message`, `q-g10-neg-callable-app-check`, `q-g10-neg-vite-precompress`, `q-g10-neg-vite-sitemap`, `q-g10-neg-vite-image-webp` |
| `fixture-catalog` | 3 of 9 — `q-fc-billable-weight`, `q-fc-surcharge-compounding`, `q-fc-verify-callback` | 3 of 3 | none |
| `self-docs` | 2 of 15 — `q-sd-new-config-key`, `q-sd-run-gates` | 5 of 5 | none |

On the two committed corpora the observed scores bear out the censored reading: every negative is below
`0.30`, the highest `q-sd-negative-grpc` at `0.28913185000419617`, and the positives that abstain are
the five the censored run already had as `null`. On `gate10-catalog` no single value separates the two
sides: six `near` negatives score above `0.32` and six positives below it.

**The floor and the generated blocks are untouched.** `evals/docs-retrieval/floor.json` is
byte-identical and the `fixture-catalog` block is not regenerated, because the value did not move;
the commit that decided the constant ran no gate 11 prediction, the method having returned
`cannot-separate`, and left gate 11 as it was. The
`self-docs` and `gate10-catalog` blocks are not regenerated either — each keeps the provenance of the
threshold it was taken under, `0.32`, which is still the one in force.

### The limit on this calibration

- **One real catalog.** `gate10-catalog` is a single private product-and-framework catalog of 1,960
  chunks; the other two corpora are small and committed — 41 and 213 chunks.
- **One host and one query-set author.** Every point was taken on one machine in one day, and every
  query set was written by one author, the real-catalog set by a model
  (`## The decision, applied to the real catalog` → `### The limits, stated with the verdict`).
- **Two query shapes in one pool.** The real-catalog queries are agent-shaped keyword strings; the
  committed sets' are natural-language questions. The pool mixes them and the method grades them alike.
- **An earlier confirmation, not a calibration.** On 2026-09-22, `docs/development.md` §5 → gate 10 leg
  (iv) ran one positive and one negative query against the same catalog at `010c50e` with `0.32` in
  force; the positive returned the known section first at `1.000` and the negative abstained. Two
  queries confirm the value at both ends and observe no distribution.

**What would move the value next.** Nothing on this branch: the withdrawn outcome removes the constant
with the tool (roadmap item 18). Were that decision reversed, the method returns a value only when some
`near` negative scores below the lowest grade-3 positive and at most one positive pays for it; on this
reranker the positive tail reaches `0.00004109544534003362`, so that takes a different reranker or a
different query set, measured and pooled the same way.

### The re-calibration method, fixed before the real-catalog run

**Fixed on 2026-09-23, before any real-catalog score or any uncensored score existed**; the commit that
adds this subsection precedes every one of them. It is applied once, to the pooled observed
distributions, and is kept as written when the rest of this section is rewritten from its result.

**The score** is `bestRerankScore` — the top reranker score `fused-rerank` compares against
`ABSTAIN_SCORE_THRESHOLD`, recorded whether or not the query abstained (`cli/src/retrieval/search.ts` →
`SearchResult.bestRerankScore`). A positive's **best score** is its `bestRerankScore`. A point whose
`bestRerankScore` is `null` — no candidate to rerank — is excluded and listed by id.

**The pool** is the real catalog **plus** both committed corpora, each committed corpus regenerated with
the uncensored field first, so every point is observed rather than bounded. The committed sets' negatives
are classed `far` / `near` by meaning **before** their scores become observable.

**Separable** — every negative's score below every positive's: the new value is the midpoint of the
highest negative and the lowest positive, rounded half-up to two decimals.

**Overlapping** — otherwise:

- `L` is the lowest best score among the positives carrying a grade-3 label.
- `N` is the `near` negatives scoring below `L`.
- The value is the smallest two-decimal number strictly greater than every score in `N`, so
  `best < ABSTAIN_SCORE_THRESHOLD` abstains on each of them.
- The **price** is every positive, of any grade, whose score falls below that value — counted over the
  pooled set and published by id.
- If `N` is empty, or the price is **more than one positive query**, the finding is that *a threshold
  cannot separate this catalog*, and the constant is left unchanged.

**On a *withdrawn* verdict** the distributions are recorded here and the constant goes with the tool.

**How the committed sets' negatives were classed, before their scores were observable.** Judged on
2026-09-23 from each query's text and its corpus's documents alone — `fixture-catalog`'s `docs/`, and
this repository's `docs/` plus its conventions documents for `self-docs` — with no score and no quoted
distribution read; the class is each record's `negativeKind`:
`q-fc-negative-recruitment` **near** — couriers, delivery attempts and handover are covered, hiring is not;
`q-fc-negative-lattice` **far** — no physics anywhere in a parcel-routing catalog;
`q-fc-negative-datastore` **near** — the shipment record is cited throughout, its storage engine never;
`q-sd-negative-ingress` **far** — nothing covers Kubernetes, ingress or cluster networking;
`q-sd-negative-tungsten` **far** — materials science, unrelated to anything indexed;
`q-sd-negative-blog` **near** — publishing `main`, `llms.txt` and the package is covered, a blog or website is not;
`q-sd-negative-grpc` **near** — the retrieval index and the stdio MCP server that serves it are covered, gRPC is not;
`q-sd-negative-migration` **near** — the PGlite index store and the config `version` migration are covered, a production database rollback is not.

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
build belongs is then no longer a timeout question at all. `docs/retrieval.md` carries that decision, and it
is taken on **coverage** rather than on any figure in this section: the first `search_docs` call is the only
mechanism that serves every entry point, so the build stays there and roadmap item 17 is cancelled. What the
figures below bear on is the **cost** side — what warming would be worth to the worktree that pays it —
which is what would reopen the question rather than what settles it. They are recorded for two corpora, each
with its own host and corpus stamp.

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
- **Size missed, by 5.5×.** The index is **37.9 kB per chunk** at 1,960 chunks (`apparentBytes` 74,195,245
  ÷ 1,960) against the **244 kB** per chunk the extrapolation used — both figures apparent, which is the
  basis the 177-chunk table's own 244 kB row is on. The **~366 MB** that extrapolation projected at ~1,500
  chunks overshoots by **5.5×**: the fit gives ~66 MB there. The two-point fit, over its two anchors on that
  same apparent basis — **43,163,949 B (43.2 MB) @ 177 chunks** and **74,195,245 B (74.2 MB) @ 1,960
  chunks** — is **~40.1 MB fixed overhead plus ~17.4 kB per chunk**: the index is fixed-cost dominated, and
  the original number was a fixed cost divided by a small chunk count — the same error shape as the struck
  60-second rule and as the six-minute download prediction leg (i) replaced. (The `du -sh` **72M** in the
  runs table is the allocated figure rounded to the megabyte, which is why the fit is stated on the apparent
  pair rather than on it.) **No projection beyond those two anchors is published here**: one further data
  point buys a fit, not a third extrapolation.

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
| Library-level arm E (`fused-rerank`), `docs/retrieval-eval-results.md` generated region, at `{ files: 14, chunks: 213 }` (2026-09-23T19:27:46.757Z) — a different corpus from this pass's | 1005.1 | 1225.7 |
| Library-level arm E at `{ files: 13, chunks: 177 }` (2026-09-21T19:00:20.828Z), since regenerated — the row the gap and provenance below are read against | 1145.3 | 1263.5 |
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
the library-level arm E row it is read against was taken at `{ files: 13, chunks: 177 }` under threshold `0.32`
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

## The real-catalog query set

**Who reads this, and what it owns.** The operator approving `evals/docs-retrieval/queries/gate10-catalog.jsonl`
before anything is scored against it, and whoever later reads a `gate10-catalog` figure and needs to know
what set it was taken over. This section is the one record of what that set is and how it was made.

**The catalog.** The private real catalog `### The real-catalog build — 1,960 chunks, 2026-09-22` measured,
now at commit `57a6c25` — a `PROVENANCE.md`-only commit whose `docs/` the operator verified byte-identical
to gate 10's `010c50e` — **156 files, 1,960 chunks**. Its eval id is `gate10-catalog`.

**The counts**, re-derived from the file's own `labels`, `negativeKind`, `intent` and `origin` fields by a
counting script in the run's scratch directory that reads the file through `loadQueries`
(`bash scripts/scratch-run.sh harness-runs/scratch/task14_counts.mjs`):

| Slice | Count |
| --- | --- |
| Records | 69 |
| Positives | 44 — 24 answered under `docs/expause-web/`, 20 under `docs/vite/`; none spans both halves |
| Negatives | 25 — 15 `near` (11 about Expause, 4 about Vite), 10 `far` |
| Intent, all records | `surroundings` 33 · `contract` 17 · `convention` 19 |
| Intent, positives | `surroundings` 17 · `contract` 14 · `convention` 13 |
| Intent, negatives | `surroundings` 16 · `contract` 3 · `convention` 6 |
| Origin | `written` 69 · `harvested` 0 |

**`1 / positives` for this set is `1 / 44 = 0.0227`** — one positive query is worth 2.27 percentage points
of recall@5.

**No harvested query.** The task prompt's optional query-log harvest (operator checklist row 8) read `Open`
when authoring started, so every record is written.

**How it was made.**

- **Situation first.** Each record's `situation` — one line of a plausible Expause or Vite task prompt,
  plan step or review finding — was written before its query, and is committed beside it.
- **Query from the situation alone.** Short, identifier-dense phrases of the kind the plan writer and the
  reviewers send; a feature, function or option name the situation carries is fair, a term only the target
  section uses is not, and no heading was copied in.
- **Labels by reading.** Every `ref` was found by reading the catalog, never by searching it. Every positive
  carries at least one grade-3 label; grades 2 and 1 were assigned deliberately, for a section more than
  related and a section related and useful.
- **Negatives confirmed uncovered by reading.** Each negative was checked against the documents its subject
  would live in, read until no section answered it; a term with no match was where that reading started,
  never the proof. `near` — a feature Expause plausibly has but does not document, a Vite option that does
  not exist, a topic adjacent to a documented one — and `far` — plausible in a software project, off this
  catalog's subject — were judged by meaning before any score existed.
- **Nothing searched or scored while authoring.** The method forbids `docs search`, the MCP tool and every
  eval arm from the first positive until the operator's approval; what executes against the catalog is the
  label pre-flight below, which builds an index and checks chunk keys.

**Limits, disclosed rather than harmonised.**

- **The set is not neutral.** Its author is a model and so is arm A's navigator: queries, labels and the
  `near` / `far` judgement share a reader with one of the arms they grade.
- **Its phrasing differs from the committed sets'.** This set is agent-shaped; `fixture-catalog` and
  `self-docs` carry natural-language questions, so a `gate10-catalog` figure beside a committed-corpus figure
  is not a comparison over like-phrased sets.

**The label pre-flight.** A launcher in the run's scratch directory reads `HARNESS_EVAL_CORPUS_ROOT`, reads
the conventions documents the catalog's own `harness.config.json` `layers[]` names, and calls
`corpusConfig({ repoRoot, docsRoot: 'docs', conventions, corpusId: 'gate10-catalog' })` → `buildIndex` in
memory → `loadQueries` → `assertLabelsResolve`, and nothing else. Run on 2026-09-23 over the complete set,
and re-run the same day after the operator's corrections below:

```
bash scripts/scratch-run.sh harness-runs/scratch/task12_preflight.mjs
```

The re-run printed:

```
loaded 69 queries
snapshot: { files: 156, chunks: 1960 }
labels resolve
```

That snapshot **equals** gate 10's `{ files: 156, chunks: 1960 }`: the composition is the 98 files under
`docs/expause-web/`, the 57 under `docs/vite/` and the catalog's one conventions document, which its
`layers[]` names — the file count gate 10 stamped.

**Operator approval.** Approved with corrections on 2026-09-23. The operator spot-checked the grade-3
labels and the negatives and returned the corrections below, each applied to the named record only; every
other record is byte-identical to the set submitted. The counts, `1 / positives` and the pre-flight output
above are the ones taken after them. **No arm had scored this set when it was approved.** Refs below
omit their prefix: `docs/vite/` for the records whose id carries `vite`, `docs/expause-web/` for the rest.

- Labels added: `q-g10-ew-mark-notification-read` ← `features/inbox.md#data` grade 3;
  `q-g10-vite-mock-updated-event` ← `guide/api-plugin.md#handlehotupdate` grade 3;
  `q-g10-ew-watch-later-feed-signal` ← `features/saved-content.md#domain` grade 2;
  `q-g10-ew-new-notification-tap` ← `features/inbox.md#presentation` grade 2;
  `q-g10-ew-group-room-agora-token` ← `features/community-live-streaming.md#cloud-functions` grade 2.
- Grades changed: `q-g10-ew-unlock-payload` → `features/unlock-premium-content.md#cloud-functions` 2 to 3;
  `q-g10-vite-wsl-file-save` → `guide/troubleshooting.md#vite-does-not-detect-a-file-change` 3 to 2.
- Label removed: `q-g10-vite-dev-api-forward` → `config/server-options.md#servercors`.
- Negatives converted to positives, `negativeKind` removed: `q-g10-neg-vite-server-mock` →
  `guide/api-plugin.md#configureserver` grade 3, `config/server-options.md#serverproxy` grade 1;
  `q-g10-neg-coin-promo-code` → `product/product-decision-rate-card.md#34-accompanying-mechanics-relabeled-honestly`
  grade 3, `features/wallet-coins.md#business-behaviour` grade 1.
- Negatives deleted: `q-g10-neg-sendgift-rate-limit`, `q-g10-neg-vite-dev-basic-auth`.
- Situations reworded: `q-g10-neg-storybook-stories`, `q-g10-neg-group-chat`.

**What the corrections say about the method.** The operator found two of the `near` negatives answered by
the catalog and dropped two more, so four of the negatives the reading-only check had passed did not
survive review — a measured instance of *the set is not neutral* above: the same reader that judged them
uncovered is a model. The two converted records keep their `q-g10-neg-` ids, because an id is a stable key;
their `labels` and missing `negativeKind`, not their ids, make them positives.

## Arm A — the real-catalog hand run

**Who reads this, and what it owns.** Whoever reads an arm A figure for `gate10-catalog` and needs to know
how the run behind it was taken — on what, by whom, at what cost and with what in each session's context.
The figures themselves follow this record.

**What arm A measures.** Navigation by an agent: the alternative the docs-retrieval tool has to beat. An
agent is started in a documentation catalog with a read-only tool set — `Read`, `Grep`, `Glob` — and
answers with nothing but the `path#heading` references of the sections it would use, the same `ref`
spelling the query sets label and the other arms return, so recall, MRR and latency are computed over its
answer by the same code that scores arms B–E. It runs in two variants that differ in their instruction
alone: **A-index** is told to read the catalog's `INDEX.md` first and follow its links, **A-search** is
told only that the catalog is rooted in its working directory (`docs/retrieval-eval.md` →
`## The decision rule` → `### Two arm A variants, and how they combine`). Its cost column is the one that
is not `local`: each session bills agent tokens, and the transcript carries its usage block.

**Why an operator ran it.** Arm A needs a nested agent session, and no automated route in this repository
may start one: the unattended permission profile carries no grant for the agent binary, and an unmatched
tool call stalls in print mode rather than refusing; the scratch-runner route to the same subprocess is
declined on purpose, because it would put an unsupervised agent session with its own auth and no token
cap inside an unattended run. So the operator ran both variants at a terminal, by the procedure in
`docs/retrieval-eval.md` → `## Running arm A by hand`, and the run recorded here only what the operator
reported and what the transcripts carry.

**The run.**

- **Catalog:** `gate10-catalog`, the private real catalog of `## The real-catalog query set`, at commit
  `57a6c25` — **156 files, 1,960 chunks** — over that section's 69-record set,
  `evals/docs-retrieval/queries/gate10-catalog.jsonl`.
- **Date:** 2026-09-23. **Host:** `darwin 24.6.0`, `Mac16,12` (arm64). **Agent CLI:** Claude Code
  `2.1.280`. **Model:** `claude-opus-5-5`, requested as `--model opus`; the operator checked that every
  assistant turn of all 690 sessions reports `claude-opus-5-5`.
- **Passes:** both variants, five repetitions each — **all ten passes done, none stopped**, no variant
  partial. Ten transcripts of 69 records each, one per query id in the set's own order: **690 agent
  sessions**.
- **Sequential:** strictly one session at a time, so each record's `durationMs` is uncontended wall time.
- **Snapshot held:** the operator checked after every pass that the catalog stayed at `57a6c25` with
  `docs/` unchanged, and the run re-checked it after the answer — catalog `HEAD` `57a6c25`,
  `git diff --quiet 57a6c25 -- docs` exit 0.

**Per repetition, as the operator read it.** Each repetition ran as one pair, A-index then A-search back
to back, and the operator read the 5-hour and 7-day usage windows before and after **each pair**, not each
variant. So a window rise below belongs to the pair; no per-variant rise was measured, and none is
recorded here. Times are the operator's local time.

| Rep | A-index | A-search | 5-hour window, before → after | 7-day window, before → after | Operator time |
| --- | --- | --- | --- | --- | --- |
| 1 | 18:24:30–18:36:15 | 18:36:27–18:49:15 | 4% → 19% | 8% → 9% | 2 min |
| 2 | 18:58:07–19:10:08 | 19:10:22–19:22:48 | 19% → 25% | 9% → 10% | 2 min |
| 3 | 19:32:05–19:43:52 | 19:44:03–19:56:17 | 25% → 31% | 10% → 11% | 1–2 min |
| 4 | 20:13:39–20:25:31 | 20:25:45–20:37:57 | 31% → 37% | 11% → 12% | 2 min |
| 5 | 20:40:41–20:52:33 | 20:52:46–21:04:44 | 37% → 43% | 12% → 12% | 2 min |

**The cost checkpoint passed.** Repetition 1 was the checkpoint: its pair rose **+15 points** on the
5-hour window, and five repetitions projected under ~90% of the window for each variant, so the run
continued. The operator's **estimate** of how that +15 splits — ~63% A-index, ~37% A-search — comes from
token usage weighted by relative price; it is not a window reading. Repetitions 2–5 rose **+6 each**. The
operator puts the drop down to the prompt cache staying warm between passes, and observed cache writes
falling from 3.20 M tokens (A-index) and 1.70 M (A-search) in repetition 1 to about 1.1–1.4 M and 0.35 M
after; those are per-pass totals over a pass's 69 sessions. The measured record of cost is each
transcript's per-query `usage` block, and the figures that follow are computed from those.

**Flags verified before any token was spent.** The agent CLI's own `--help` — the only agent-CLI call the
run made — lists all seven flags `evals/docs-retrieval/arm-a/run-arm-a.sh` passes: `-p`,
`--output-format` (listing `stream-json`), `--verbose`, `--allowed-tools`, `--disallowed-tools`,
`--strict-mcp-config` and `--model`. The script needed no change.

**What each session loaded.** The catalog's root carries `.claude/CLAUDE.md`, `.claude/settings.json`,
`.claude/settings.autonomous.json` and `.mcp.json`, and no root `CLAUDE.md`. A session started there:

- ran with the catalog's `autonomous-sdlc-harness` plugin enabled and its `.claude/CLAUDE.md` loaded —
  the realistic setup for an agent navigating a harness-adopted repository, accepted as such by the
  operator;
- fired **no hook**: the plugin's only hook is a `PreToolUse` hook matching `Bash`, which the runner
  disallows;
- had **no MCP server** from the plugin, which declares none, and none from the catalog: its own
  docs-search server in `.mcp.json` was kept out by `--strict-mcp-config`;
- carried, from the plugin, its **agent, command and skill listings in the system prompt** — that is
  what it added.

The plugin is also enabled in the operator's user-level settings, so disabling it in the catalog alone
would not have removed it.

**What the transcripts show without scoring.** The operator checked each file's first record — bare
`path#anchor` refs or the bare `none` token — and saw only `Read`, `Grep` and `Glob` calls; the run's own
read of all ten files found no ref carrying a code fence in any record, and `toolCalls` naming `Read` and
`Grep` in every A-index pass and `Read`, `Grep` and `Glob` in every A-search pass.

**Three records carry a prose sentence beside `none`**, left verbatim by the operator and not repaired:

| Pass | Query id | Kind |
| --- | --- | --- |
| `index-rep2` | `q-g10-vite-health-middleware` | positive |
| `index-rep5` | `q-g10-vite-mock-updated-event` | positive |
| `search-rep5` | `q-g10-neg-android-keystore` | `far` negative |

`evals/docs-retrieval/arm-a/score-transcript.mjs` abstains only on a lone `none` or no refs, so each of
the three scores as an **answered miss** with two hits — the sentence and `none` — and none as an
abstention. For the two positives that is a miss; for the `far` negative it costs A-search one abstention
on repetition 5. That matches the operator's reading, and was checked by scoring all three files through
`scoreTranscript`.

**Redactions and out-of-fence tool use.** *None.* All ten transcripts are committed byte-for-byte under
`evals/docs-retrieval/transcripts/gate10-catalog/`. Every record was read: keys exactly `id`, `query`,
`refs`, `durationMs`, `usage`, `variant`, `toolCalls`, with `id` and `query` matching the approved set in
order. No ref is absolute, climbs with `../` or names a machine-local directory — the three prose sentences
above included. The `usage` blocks carry token counts and four non-identifying strings (`service_tier`,
`inference_geo`, `speed`, `iterations[].type`) and no identifier. `toolCalls` names only `Read`, `Grep` and
`Glob`. Scoring each committed file through `scoreTranscript` gives records identical to the scratch copy's.

**The figures follow.** Arm A's `gate10-catalog` rows are generated from the committed transcripts inside
the generated region, never typed; the spread, navigation and cost figures are recorded below this
record.

**How the figures below were computed.** Every figure in the four sub-sections that follow comes from
one launcher in the run's scratch directory, run on 2026-09-23:

```
bash scripts/scratch-run.sh harness-runs/scratch/task19_figures.mjs
```

It reads `HARNESS_EVAL_CORPUS_ROOT`, loads the approved set with `loadQueries`, builds the
`gate10-catalog` index in memory once for its chunk keys — the build reported
`{ files: 156, chunks: 1960 }`, the snapshot above — and calls `evals/docs-retrieval/arm-a/spread.mjs` →
`summarizeVariant` for each variant over its five committed transcripts in repetition order, then prints
the result as JSON. The counts it adds beside that summary — give-ups, refs naming no chunk, the costliest
queries, the billed split per pair — are taken from the same `scoreTranscript` records and `usage` blocks.
The window readings and operator times are quoted from the run record above, not computed.

### The figures, per variant

**Neither variant is partial**: `summarizeVariant` returned `partial: false` for both. Recall and MRR are
over the 44 positives, pooled and per half — 24 under `docs/expause-web/`, 20 under `docs/vite/`; strict
counts grade-3 labels only. `none` counts the negatives a repetition answered `none`, out of 10 `far` and
15 `near`. Latency is per-query `durationMs`, nearest-rank; every duration in all ten transcripts is a
whole number of seconds, so latency is resolved to 1 s. Billed tokens per query are
`input + output + cache_creation_input + cache_read_input` over the 69 records. The closing rows are the
nearest-rank median and p95 across the five repetitions — **with five values the p95 is the maximum**.

**A-index**

| Rep | recall@5 | MRR | expause-web recall@5 / MRR | vite recall@5 / MRR | strict recall@5 | strict MRR | `none`, far | `none`, near | p50 ms | p95 ms | billed tokens / query |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.432 | 0.409 | 0.792 / 0.750 | 0 / 0 | 0.432 | 0.343 | 10 / 10 | 15 / 15 | 9000 | 15000 | 179,799 |
| 2 | 0.432 | 0.409 | 0.792 / 0.750 | 0 / 0 | 0.432 | 0.347 | 10 / 10 | 15 / 15 | 10000 | 16000 | 185,002 |
| 3 | 0.455 | 0.432 | 0.833 / 0.792 | 0 / 0 | 0.432 | 0.369 | 10 / 10 | 15 / 15 | 10000 | 17000 | 183,261 |
| 4 | 0.455 | 0.432 | 0.833 / 0.792 | 0 / 0 | 0.432 | 0.357 | 10 / 10 | 15 / 15 | 10000 | 16000 | 185,264 |
| 5 | 0.455 | 0.432 | 0.833 / 0.792 | 0 / 0 | 0.455 | 0.375 | 10 / 10 | 15 / 15 | 10000 | 15000 | 180,794 |
| **median** | 0.455 | 0.432 | 0.833 / 0.792 | 0 / 0 | 0.432 | 0.357 | 10 | 15 | 10000 | 16000 | 183,261 |
| **p95 (max)** | 0.455 | 0.432 | 0.833 / 0.792 | 0 / 0 | 0.455 | 0.375 | 10 | 15 | 10000 | 17000 | 185,264 |

**A-search**

| Rep | recall@5 | MRR | expause-web recall@5 / MRR | vite recall@5 / MRR | strict recall@5 | strict MRR | `none`, far | `none`, near | p50 ms | p95 ms | billed tokens / query |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.909 | 0.835 | 0.875 / 0.792 | 0.950 / 0.888 | 0.909 | 0.756 | 10 / 10 | 15 / 15 | 11000 | 18000 | 142,158 |
| 2 | 0.909 | 0.847 | 0.833 / 0.771 | 1 / 0.938 | 0.886 | 0.773 | 10 / 10 | 15 / 15 | 10000 | 19000 | 136,641 |
| 3 | 0.932 | 0.881 | 0.875 / 0.833 | 1 / 0.938 | 0.886 | 0.801 | 10 / 10 | 15 / 15 | 11000 | 16000 | 139,463 |
| 4 | 0.955 | 0.866 | 0.917 / 0.806 | 1 / 0.938 | 0.909 | 0.782 | 10 / 10 | 15 / 15 | 11000 | 17000 | 139,636 |
| 5 | 0.932 | 0.881 | 0.875 / 0.833 | 1 / 0.938 | 0.909 | 0.797 | 9 / 10 | 15 / 15 | 10000 | 17000 | 137,766 |
| **median** | 0.932 | 0.866 | 0.875 / 0.806 | 1 / 0.938 | 0.909 | 0.782 | 10 | 15 | 11000 | 17000 | 139,463 |
| **p95 (max)** | 0.955 | 0.881 | 0.917 / 0.833 | 1 / 0.938 | 0.909 | 0.801 | 10 | 15 | 11000 | 19000 | 142,158 |

The share of all negatives answered `none` is **1** in every repetition of A-index, and **1, 1, 1, 1,
0.96** for A-search — median 1, p95 1.

**The generated `A-index` and `A-search` rows of the `gate10-catalog` block are repetition 1**, and the
launcher checked each against it: recall@5, MRR, strict recall@5 and strict MRR all equal. **The median
row is what `docs/retrieval-eval.md` → `### Two arm A variants, and how they combine` grades**, not the
generated row. For A-index the two differ — repetition 1 ties for its lowest, 0.432 recall@5 against a median
of 0.455 — and for A-search repetition 1 is below the median on recall@5 (0.909 against 0.932) and MRR
(0.835 against 0.866).

### Spread, repetitions and what moved

**Every repetition is kept**, the odd ones included: A-search's repetition 5, the one with a negative
not answered `none`, and A-index's repetition 1, its lowest strict MRR.

**The scored figures barely move.** Across five repetitions, A-index's recall@5 spans 0.432–0.455 and
A-search's 0.909–0.955; MRR spans 0.409–0.432 and 0.835–0.881. One positive is worth `1 / 44 = 0.0227`
of recall@5 (`## The real-catalog query set`), so A-index moved by one positive and A-search by two.

**The answers move a great deal.** `summarizeVariant`'s `disagreements` — queries whose ordered refs are
not identical in all five repetitions — number **22 of 69 for A-index** and **41 of 69 for A-search**:

- A-index: `q-g10-ew-gift-community-post`, `q-g10-ew-sendgift-chat-side-effects`,
  `q-g10-ew-blocked-suggested-creators`, `q-g10-ew-new-notification-tap`,
  `q-g10-ew-mark-notification-read`, `q-g10-ew-reaction-dislike`, `q-g10-ew-watch-later-feed-signal`,
  `q-g10-ew-deleted-account-subcollection`, `q-g10-ew-recent-signin-withdraw`,
  `q-g10-ew-second-browser-login`, `q-g10-ew-video-call-ended-summary`, `q-g10-ew-firestore-to-typed`,
  `q-g10-ew-tojson-optional-keys`, `q-g10-ew-withdrawal-labels-romanian`,
  `q-g10-ew-hardcoded-padding-colour`, `q-g10-ew-new-page-back-title`, `q-g10-ew-console-error-catch`,
  `q-g10-ew-callable-exists-check`, `q-g10-ew-unlock-payload`, `q-g10-ew-photo-comment-reply`,
  `q-g10-vite-health-middleware`, `q-g10-vite-mock-updated-event`.
- A-search: `q-g10-ew-gift-community-post`, `q-g10-ew-sendgift-chat-side-effects`,
  `q-g10-ew-blocked-suggested-creators`, `q-g10-ew-new-notification-tap`,
  `q-g10-ew-mark-notification-read`, `q-g10-ew-reaction-dislike`, `q-g10-ew-watch-later-feed-signal`,
  `q-g10-ew-deleted-account-subcollection`, `q-g10-ew-recent-signin-withdraw`,
  `q-g10-ew-second-browser-login`, `q-g10-ew-video-call-ended-summary`, `q-g10-ew-firestore-to-typed`,
  `q-g10-ew-tojson-optional-keys`, `q-g10-ew-withdraw-confirm-modal`,
  `q-g10-ew-withdrawal-labels-romanian`, `q-g10-ew-hardcoded-padding-colour`,
  `q-g10-ew-new-page-back-title`, `q-g10-ew-console-error-catch`, `q-g10-ew-callable-exists-check`,
  `q-g10-ew-unlock-payload`, `q-g10-ew-photo-comment-reply`, `q-g10-ew-group-room-agora-token`,
  `q-g10-vite-staging-build`, `q-g10-vite-dev-api-forward`, `q-g10-vite-github-pages-subpath`,
  `q-g10-vite-stale-chunk-deploy`, `q-g10-vite-linked-ui-package`, `q-g10-vite-admin-html-entry`,
  `q-g10-vite-plugin-package-name`, `q-g10-vite-virtual-routes`, `q-g10-vite-src-alias`,
  `q-g10-vite-robots-favicon`, `q-g10-vite-build-only-plugin`, `q-g10-vite-scoped-card-styles`,
  `q-g10-vite-config-reads-env`, `q-g10-vite-health-middleware`, `q-g10-vite-build-sha-meta`,
  `q-g10-vite-mock-updated-event`, `q-g10-vite-rails-manifest-tags`, `q-g10-neg-vite-server-mock`,
  `q-g10-neg-android-keystore`.

**Few of those disagreements reach a score.** Scoring each repetition through `metrics.mjs` → `scoreArm`
and comparing per query: the rank of the first relevant ref moved on **2** of A-index's 22 and **7** of
A-search's 41; whether that ref sat in the top 5 moved on 2 — `q-g10-ew-gift-community-post`,
`q-g10-ew-deleted-account-subcollection` — and 3 — `q-g10-ew-withdraw-confirm-modal`,
`q-g10-ew-group-room-agora-token`, `q-g10-neg-vite-server-mock`. Whether the answer was an abstention
moved on 4 for A-index (`q-g10-ew-gift-community-post`, `q-g10-ew-deleted-account-subcollection`,
`q-g10-vite-health-middleware`, `q-g10-vite-mock-updated-event`) and 3 for A-search
(`q-g10-ew-group-room-agora-token`, `q-g10-neg-vite-server-mock`, `q-g10-neg-android-keystore`). The
rest of the disagreement is order and extra refs below the first relevant one.

**Five repetitions are enough for the figures the decision rule reads, within a stated bound.** The
observed recall@5 range is at most two positives for either variant, MRR stays inside the ranges above,
and latency p50 moved by one 1-second step. A margin between arm A and another arm that is wider than that
range is not a repetition artefact at five; a margin inside it — within two positives — is not settled by
five repetitions of this arm on this set, and more repetitions would narrow the median's uncertainty
without changing the observed range, which is what a reader should hold such a margin against. Read at
the level of returned refs rather than scores, arm A is plainly non-deterministic — a third of A-index's
answers and more than half of A-search's differ somewhere across five runs — and that is a result in
itself, not noise to be averaged away.

### How arm A navigated a 156-file catalog

**Tool calls per query, by tool** (per repetition, 1 → 5; each is that tool's calls over the 69 queries):

| Variant | `Read` per query | `Grep` per query | `Glob` per query | Queries using `Grep` | Queries using `Glob` |
| --- | --- | --- | --- | --- | --- |
| A-index | 1.783, 1.768, 1.739, 1.754, 1.754 | 1.29, 1.42, 1.42, 1.406, 1.333 | 0 | 50, 52, 52, 54, 51 | 0 |
| A-search | 0.435, 0.464, 0.507, 0.565, 0.391 | 3.087, 2.942, 3, 3.029, 3.072 | 0.072, 0.014, 0.058, 0.029, 0.043 | 69 in every repetition | 5, 1, 4, 2, 3 |

**A-index did grep — on 50 to 54 of its 69 queries in each repetition** — although it was told to read
`INDEX.md` first; it read on 68 or 69 queries and never used `Glob`. A-search is a grep-first navigator:
`Grep` on every query, about three calls each, and a `Read` on 26 to 31 queries. **No tool outside the
fence was used**: `toolCalls` names only `Read`, `Grep` and `Glob` in all ten transcripts, as the
redaction record above states.

**Given up — `none` on a positive.** Per repetition, 1 → 5:

- **A-index: 23, 22, 22, 22, 21** of 44 — by half, `docs/expause-web/` 4, 4, 3, 3, 3 and `docs/vite/`
  19, 18, 19, 19, 18. The `docs/expause-web/` give-ups are `q-g10-ew-new-callable-unwrap`,
  `q-g10-ew-group-room-agora-token` and `q-g10-neg-coin-promo-code` in every repetition, plus
  `q-g10-ew-gift-community-post` in repetition 1 and `q-g10-ew-deleted-account-subcollection` in
  repetition 2.
- **A-search: 3, 3, 2, 2, 2** — `q-g10-ew-new-callable-unwrap` and `q-g10-neg-coin-promo-code` in every
  repetition, plus `q-g10-neg-vite-server-mock` in repetition 1 and `q-g10-ew-group-room-agora-token` in
  repetition 2.

Both variants abstained in every repetition on `q-g10-neg-coin-promo-code`, and A-index on
`q-g10-neg-vite-server-mock` — the two negatives the operator converted to positives at approval.

**Guessed — refs naming no chunk** (`unresolvedRefs`, counted against the in-memory build's chunk keys):
A-index **2, 3, 1, 2, 3** refs, on 2, 2, 1, 2, 2 queries; A-search **7, 5, 4, 6, 6** refs, on 7, 5, 4,
5, 5 queries. Those counts include the two non-chunk refs of each prose record below. The one guess both
variants make in every repetition is on `q-g10-ew-tojson-optional-keys`.

**Answered.** Positives answered with at least one ref: A-index 21, 22, 22, 22, 23; A-search 41, 41, 42,
42, 42. Negatives answered with anything but `none`: none, except A-search's
`q-g10-neg-android-keystore` in repetition 5.

**The three records with a prose sentence beside `none`**, as `score-transcript.mjs` scored each — the
launcher found them as the only records whose refs carry whitespace, and each scored `abstained: false`
with two hits:

| Pass | Query id | Kind | Scored as |
| --- | --- | --- | --- |
| `index-rep2` | `q-g10-vite-health-middleware` | positive | answered miss — two hits, neither a label |
| `index-rep5` | `q-g10-vite-mock-updated-event` | positive | answered miss — two hits, neither a label |
| `search-rep5` | `q-g10-neg-android-keystore` | `far` negative | answered — not an abstention |

**The operator's reading is confirmed**: a `none` among other refs scores as an answered miss, so
`q-g10-neg-android-keystore` costs A-search one `far` abstention on repetition 5 — its `far` count reads 9
of 10 there, and its share of negatives answered `none` 0.96. Both A-index sentences say in words that
the index does not reach Vite.

**The per-half result is A-index's index, not its navigation.** `docs/expause-web/INDEX.md` links no
`docs/vite/` file, and A-index returned **no `docs/vite/` ref in any repetition** — 81 or 82 refs per
repetition, every one under `docs/expause-web/` apart from the prose records' two. On the 20
`docs/vite/` positives it gave up on 18 or 19, answered `q-g10-vite-src-alias` with a
`docs/expause-web/` ref in every repetition, and wrote a prose `none` on the remaining one in repetitions
2 and 5: `docs/vite/` recall@5 is 0 in all five. On `docs/expause-web/`, which its index does cover,
A-index's median recall@5 is 0.833 against A-search's 0.875, and its MRR 0.792 against 0.806. This is the
variant's real behaviour on a mixed catalog with a partial index, reported and not corrected: no root
index was written and the catalog was not edited.

### What arm A cost to run

**Billed tokens per field, per repetition** (the per-query `usage` blocks are the committed transcripts
under `evals/docs-retrieval/transcripts/gate10-catalog/`):

| Variant | Rep | `input_tokens` | `output_tokens` | `cache_creation_input_tokens` | `cache_read_input_tokens` | Billed total |
| --- | --- | --- | --- | --- | --- | --- |
| A-index | 1 | 520 | 35,867 | 3,198,348 | 9,171,364 | 12,406,099 |
| A-index | 2 | 532 | 36,806 | 1,159,877 | 11,567,944 | 12,765,159 |
| A-index | 3 | 530 | 36,940 | 1,145,134 | 11,462,430 | 12,645,034 |
| A-index | 4 | 532 | 37,685 | 1,357,514 | 11,387,462 | 12,783,193 |
| A-index | 5 | 522 | 35,722 | 1,345,480 | 11,093,072 | 12,474,796 |
| A-search | 1 | 570 | 42,755 | 1,703,099 | 8,062,476 | 9,808,900 |
| A-search | 2 | 548 | 41,337 | 372,653 | 9,013,681 | 9,428,219 |
| A-search | 3 | 560 | 41,253 | 355,588 | 9,225,573 | 9,622,974 |
| A-search | 4 | 560 | 41,691 | 337,903 | 9,254,705 | 9,634,859 |
| A-search | 5 | 556 | 40,292 | 302,858 | 9,162,168 | 9,505,874 |

Over all five repetitions: **A-index 63,074,281** billed tokens, **A-search 48,000,826**.

**Per query.** Across repetitions, billed tokens per query are A-index median **183,261**, p95 185,264,
and A-search median **139,463**, p95 142,158. Within a repetition the per-query distribution is wider —
nearest-rank p50 / p95 / max:

| Rep | A-index p50 / p95 / max | A-search p50 / p95 / max |
| --- | --- | --- |
| 1 | 180,200 / 262,567 / 376,706 | 134,877 / 223,629 / 252,654 |
| 2 | 181,235 / 312,939 / 366,709 | 131,611 / 218,734 / 252,290 |
| 3 | 182,963 / 284,817 / 292,943 | 133,157 / 211,884 / 261,208 |
| 4 | 183,990 / 276,465 / 347,922 | 133,370 / 224,864 / 298,200 |
| 5 | 180,993 / 288,320 / 379,713 | 130,850 / 227,943 / 279,927 |

**The five costliest queries**, by billed tokens summed over the five repetitions:

| Variant | Query id | Kind | Billed tokens, five repetitions |
| --- | --- | --- | --- |
| A-index | `q-g10-neg-pin-comment` | `near` negative | 1,667,325 |
| A-index | `q-g10-ew-hardcoded-padding-colour` | positive | 1,441,322 |
| A-index | `q-g10-vite-stale-chunk-deploy` | positive | 1,344,694 |
| A-index | `q-g10-ew-deleted-account-subcollection` | positive | 1,319,838 |
| A-index | `q-g10-ew-callable-exists-check` | positive | 1,315,572 |
| A-search | `q-g10-ew-hardcoded-padding-colour` | positive | 1,224,189 |
| A-search | `q-g10-ew-firestore-to-typed` | positive | 1,178,461 |
| A-search | `q-g10-neg-pin-comment` | `near` negative | 1,105,579 |
| A-search | `q-g10-ew-callable-exists-check` | positive | 1,103,155 |
| A-search | `q-g10-ew-blocked-suggested-creators` | positive | 1,054,863 |

**The usage windows, per repetition pair.** The operator read the 5-hour and 7-day windows before and
after each pair — A-index then A-search — in whole percentage points, not per variant (the run record
above). No pair's rise is apportioned to one variant as a measured figure:

| Rep pair | 5-hour window rise | 7-day window rise | Billed tokens, A-index / A-search | Billed-token share, A-index / A-search |
| --- | --- | --- | --- | --- |
| 1 | +15 | +1 | 12,406,099 / 9,808,900 | 0.558 / 0.442 |
| 2 | +6 | +1 | 12,765,159 / 9,428,219 | 0.575 / 0.425 |
| 3 | +6 | +1 | 12,645,034 / 9,622,974 | 0.568 / 0.432 |
| 4 | +6 | +1 | 12,783,193 / 9,634,859 | 0.570 / 0.430 |
| 5 | +6 | +0 | 12,474,796 / 9,505,874 | 0.568 / 0.432 |

Repetition 1's **~63% / ~37%** split is the operator's **estimate**, weighted by relative token price;
the billed-token split the transcripts give for the same pair is **0.558 / 0.442**, unweighted, so the
two measure different things and neither is a window reading.

**The warm-cache drop.** The 5-hour window rose **+15** on repetition 1's pair and **+6** on each later
pair. Billed tokens did not fall with it — each variant's total stays within the range in the table
above — but their make-up did: `cache_creation_input_tokens` fell from 3,198,348 to 1,145,134–1,357,514
for A-index and from 1,703,099 to 302,858–372,653 for A-search, and `cache_read_input_tokens` rose in its
place. That is consistent with the operator's reading that the prompt cache stayed warm between passes;
the window drop itself is the operator's reading, not a figure the transcripts carry.

**Operator time**, from the run record: 2, 2, 1–2, 2 and 2 minutes for the five pairs — the commands
handed over, each pair started and its windows read. For that, the run settled all ten passes, both
variants complete, with no stop at the checkpoint. Whoever weighs re-running arm A on another catalog has
that price: the operator minutes above at the terminal, **111,075,107** billed tokens across ten passes
on a 156-file catalog, and a 5-hour window taken from 4% to 43% — with the first pair costing most. No
money figure is given: the transcripts carry tokens, not a charge.

## The decision, applied to the real catalog

**Who reads this, and what it decides.** Whoever has to act on whether docs retrieval stays in this
harness: the rule in `docs/retrieval-eval.md` → `## The decision rule`, with the readings its
`### Two arm A variants, and how they combine` committed before any figure existed, applied bar by bar
to `gate10-catalog`. The rule is applied here and not amended.

**The outcome: withdrawn.** Arm E (`fused-rerank`) does not clear the relevance bar against the stronger
arm A figure — A-search's — on either metric, and a relevance bar that does not clear names
**withdrawn** whatever the other two bars say. The change it names is roadmap item 18 in
`docs/development.md` → `## 6. The roadmap this tree defers to`; this branch takes the decision and
does not execute it.

| Graded against | Relevance | Cost | Failure | Outcome |
| --- | --- | --- | --- | --- |
| The stronger variant on each bar (the verdict) | does not clear | clears | does not clear | **withdrawn** |
| A-index alone | clears | clears | does not clear | stays opt-in |
| A-search alone | does not clear | clears | does not clear | withdrawn |

**Where each figure comes from.** Arm E's recall@5, MRR, p95, `abstainedOnNegative` and `negatives` are
the `gate10-catalog` generated block's; its per-half and `far` / `near` figures are
`evals/docs-retrieval/arm-a/spread.mjs` → `breakdown({ records, queries })` over that block's arm E
`perQuery` entries, read through `evals/docs-retrieval/results.mjs` → `readCorpusMachineHalf`. Arm A's
figures are the medians of `### The figures, per variant` above, every repetition cited from there. The
arithmetic was checked by one launcher in the run's scratch directory, run on 2026-09-23:

```
bash scripts/scratch-run.sh harness-runs/scratch/task20_bars.mjs
```

### Relevance

**The margins.** `positives` = **44**, so one positive query's worth is `1 / 44` = **0.0227** of recall@5
and `0.5 / 44` = **0.0114** of MRR. A lead must exceed each.

| Figure | recall@5 | MRR |
| --- | --- | --- |
| Arm E, pooled | 0.795 (35 of 44) | 0.677 |
| A-index, repetitions 1 → 5 | 0.432, 0.432, 0.455, 0.455, 0.455 | 0.409, 0.409, 0.432, 0.432, 0.432 |
| A-index, median | 0.455 (20 of 44) | 0.432 |
| A-search, repetitions 1 → 5 | 0.909, 0.909, 0.932, 0.955, 0.932 | 0.835, 0.847, 0.881, 0.866, 0.881 |
| A-search, median | 0.932 (41 of 44) | 0.866 |
| **The stronger figure** | **0.932, A-search** | **0.866, A-search** |

**Against the stronger figure** — A-search on both metrics, so the composite is one variant:

- recall@5: 0.795 − 0.932 = 35/44 − 41/44 = **−6/44 = −0.136**. A lead of −0.136 does not exceed 0.0227.
- MRR: 0.677 − 0.866 = **−0.189**. A lead of −0.189 does not exceed 0.0114.
- **Relevance does not clear.** Arm E trails by six positives. `### Spread, repetitions and what moved`
  bounds A-search's own movement across five repetitions at two positives, so this deficit is wider than
  anything repetition could account for.

**Against A-index alone:** recall@5 0.795 − 0.455 = 35/44 − 20/44 = **+15/44 = +0.341** > 0.0227; MRR
0.677 − 0.432 = **+0.245** > 0.0114. **Clears.** **Against A-search alone:** the stronger-figure
comparison above, since A-search is the stronger on both metrics. **Does not clear.**

**The per-half figures, reported beside the pooled grade** (arm A medians; the pooled figure decides,
per the committed reading):

| Half | Positives | Arm E recall@5 / MRR | A-index median | A-search median | E's lead over A-index | E's lead over A-search |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/expause-web/` | 24 | 0.750 / 0.533 | 0.833 / 0.792 | 0.875 / 0.806 | −0.083 / −0.259 | −0.125 / −0.273 |
| `docs/vite/` | 20 | 0.850 / 0.850 | 0 / 0 | 1 / 0.938 | +0.850 / +0.850 | −0.150 / −0.088 |

**Arm E's lead over A-index is all `docs/vite/`.** On `docs/expause-web/`, the half A-index's index
covers, arm E trails A-index on both metrics; the pooled lead exists because `docs/expause-web/INDEX.md`
links no `docs/vite/` file and A-index returned no `docs/vite/` ref in any repetition
(`### How arm A navigated a 156-file catalog`). Arm E trails A-search on both halves.

### Cost

**Per-query wall time.** Arm E's p95 is **1269.3 ms**. Arm A's per-query wall time is each variant's
median per-repetition p50: A-index **10000 ms**, A-search **11000 ms**, both resolved to whole seconds.

- Against A-index: 1269.3 / 10000 = **0.127**.
- Against A-search: 1269.3 / 11000 = **0.115**.
- Against the stronger — the lower, A-index: **0.127**, below 1. **Clears.**

**Token cost per query.** Arm E bills **0** tokens (`local — no billed tokens`, 69 embed and 69 rerank
calls). A-index's median is **183,261** billed tokens per query and A-search's **139,463**; the stronger
is the lower, A-search. 0 against 139,463: **clears**, and against 183,261 as well.

**Both clear by construction**, as the committed reading states they would: local milliseconds and zero
billed tokens against an agent session per lookup. This bar cannot discriminate here, and the verdict
turns on relevance and failure.

**The one-time charge**, cited and graded against nothing: `## Cold build and index size` →
`### The real-catalog build — 1,960 chunks, 2026-09-22` — about 111–114 s cold on a rested machine, and
72 MiB of index on disk. Not re-measured. **It is the same snapshot of `docs/`, at a later commit.** The
`gate10-catalog` block's own provenance stamp is `{ files: 156, chunks: 1960 }`, equal to that build's
156 files and 1,960 chunks. The catalog stood at `57a6c25` for arm A and arms B–E (`## Arm A — the
real-catalog hand run`), against gate 10's `010c50e`; `57a6c25` is a `PROVENANCE.md`-only commit whose
`docs/` the operator verified identical to `010c50e`'s (`## The real-catalog query set`).

### Failure

| Figure | All negatives | `far` | `near` |
| --- | --- | --- | --- |
| Arm E abstained | 19 / 25 = **0.76** | 10 / 10 = 1.00 | 9 / 15 = 0.60 |
| A-index, `none` share per repetition 1 → 5 | 1, 1, 1, 1, 1 | 10 / 10 in every repetition | 15 / 15 in every repetition |
| A-index, median | **1.00** | 10 / 10 | 15 / 15 |
| A-search, `none` share per repetition 1 → 5 | 1, 1, 1, 1, 0.96 | 10, 10, 10, 10, 9 of 10 | 15 / 15 in every repetition |
| A-search, median | **1.00** | 10 / 10 | 15 / 15 |

The stronger variant's median share is **1.00** (both variants). Arm E's 0.76 against 1.00: 0.76 − 1.00
= **−0.24**, six negatives, all six `near`. Arm E must be at least as high. **Does not clear** — against
the stronger, against A-index alone and against A-search alone.

### The verdict

- **Relevance** — graded against A-search, the stronger on both metrics: does not clear.
- **Cost** — graded against A-index for wall time and A-search for tokens, the lower of each: clears.
- **Failure** — graded against either variant, tied at 1.00: does not clear.

**Combined: relevance does not clear, so the outcome is withdrawn.** Against **A-index alone** the bars
read relevance and cost clearing with failure not, which the committed reading resolves as **stays
opt-in**, with arm E's negative-abstention rate, **0.76** (`near` 0.60), the figure to move. Against
**A-search alone** relevance does not clear: **withdrawn**. The verdict is the combined one, because the
rule grades against the stronger alternative an agent has.

**The change it names: roadmap item 18**, `docs/development.md` → `## 6. The roadmap this tree defers
to` — withdraw docs retrieval: the tool, its optional dependencies and the threshold constant with it. This branch records the decision and deliberately does not execute it: a
withdrawal removes a shipped verb, its optional peer dependencies and the plugin's grants, and none of
that belongs in the review of a measurement.

### Findings about the rule, recorded and not acted on

- **The cost bar did not discriminate**, as `### Two arm A variants, and how they combine` said it would
  not: the ratios are 0.115–0.127 and arm E bills no tokens, so the bar could only ever clear here.
- **The failure bar reads negatives alone.** A-index scores 1.00 on it while giving up — `none` on a
  positive — on 21 to 23 of its 44 positives per repetition (`### How arm A navigated a 156-file
  catalog`); arm E abstained on 6 of the 44. An arm that answers `none` freely is graded perfect on this
  bar. At these values it does not move the verdict, which relevance already decides.
- **The rule grades arm E alone, and its withdrawn outcome removes every mode.** At these values that
  discards no mode the relevance bar would have kept: in the same block, B `lexical` reads 0.909 / 0.753,
  C `vector` 0.841 / 0.579 and D `fused` 0.841 / 0.732, each below A-search's median 0.932 / 0.866 on both
  metrics. Those are single-repetition figures, and the rule is silent on them.

### The limits, stated with the verdict

- **The set is model-authored, and arm A's navigator is a model.** The queries, labels and `near` / `far`
  judgement share a reader with the arm they grade (`## The real-catalog query set`).
- **The variants' reach is not the same as arms B–E's.** Arms B–E index `docs/` plus the catalog's one
  conventions document; neither arm A variant is pointed at that document, though both can read it. No
  label lands in it. A-index's index does not link `docs/vite/`. Both limits come from
  `docs/retrieval-eval.md` → `## Running arm A by hand` → *What the comparison does not cover*, and
  neither is corrected: no root index was written and the catalog was not edited.
- **Whether agents would search the docs at all is not measured here, and cannot be on this corpus.**
  The operator's observation is that agents with a catalog and no retrieval almost never navigate from
  `INDEX.md` and go to the code instead, so the realistic alternative to retrieval is often *not
  consulting the docs*, and not arm A. This eval hands every arm the query and grades only where it
  looks. What would measure it: the query log switched on in a repository that has both code and a
  catalog, over real branches, counting `search_docs` calls per planning and review dispatch. This
  branch does not take that measurement.
