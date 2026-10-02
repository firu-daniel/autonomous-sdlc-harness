# The harness-docs-retrieval service image.
#
# Carries: CPython 3.12, the service package, and the locked runtime with the `models` extra —
# the Linux CPU-only `torch` that `uv.lock` resolves from the pytorch-cpu index, so no CUDA wheel.
# Does not carry: any model weight. `/models` is the weight cache, mounted read-only at run time
# (compose.yaml), never written into a layer. No `RUN` here downloads a model, and the container
# never does either: `HF_HUB_OFFLINE=1` plus the service's own `local_files_only` loads mean a
# missing cache refuses at start with `open_session`'s one-line message. Weights are provisioned
# only by an operator running `fetch-models` on the host.

FROM ghcr.io/astral-sh/uv:0.8.22 AS uv

FROM python:3.12.11-slim-bookworm

COPY --from=uv /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

# Dependencies first, so a source-only change reuses this layer.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --extra models --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev --extra models --no-editable

RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin harness

ENV PATH=/app/.venv/bin:$PATH \
    HF_HUB_OFFLINE=1 \
    HARNESS_DOCS_RETRIEVAL_MODEL_CACHE=/models

USER harness

# `--repo` defaults to the working directory, so `docker compose run --rm service index` reads
# the mounted corpus without restating the flag.
WORKDIR /repo

EXPOSE 8080

ENTRYPOINT ["harness-docs-retrieval"]
CMD ["serve-http", "--host", "0.0.0.0", "--port", "8080", "--repo", "/repo"]
