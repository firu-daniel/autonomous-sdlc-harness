# Postgres 18 carrying both extensions the store creates: `vector` (pgvector) and `pg_textsearch`.
#
# How this Postgres differs from the PGlite the TypeScript backend embeds — the records
# `## The seam, as found` (the package README) carries:
#
# 1. pg_textsearch: built here from the timescale/pg_textsearch release tag `v1.3.1`.
#    `@electric-sql/pglite-pg_textsearch` 0.0.10 states no upstream version in its package.json or
#    README; its bundled `dist/pg_textsearch.tar.gz` carries `pg_textsearch.control` with
#    `default_version = '1.3.1'` and the install script `pg_textsearch--1.3.1.sql`, read from the
#    archive without extracting it. The tag was chosen to match that, and its name is unverified
#    against the upstream repository: no network was reachable when this file was written. If the
#    build fails at the download, the tag spelling is the first thing to check.
# 2. pgvector: 0.8.1, from the `pgvector/pgvector:0.8.1-pg18` base. `@electric-sql/pglite-pgvector`
#    0.0.9 bundles `vector.control` with `default_version = '0.8.1'`, so the two match. The
#    Postgres major matches too: `@electric-sql/pglite` reports `PostgreSQL 18.3` in its bundle.
#    The server's minor here is whatever the pinned base image carries.
# 3. Server settings: pg_textsearch must be in `shared_preload_libraries`. PGlite supplies that
#    through the extension's `setup`, which returns `sharedPreloadLibraries: ["pg_textsearch"]`
#    (`@electric-sql/pglite-pg_textsearch` dist/index.js). Here compose.yaml passes it as
#    `-c shared_preload_libraries=pg_textsearch`; this image sets no server parameter itself.
#    pgvector needs no preload in either.

ARG PGVECTOR_IMAGE=pgvector/pgvector:0.8.1-pg18

FROM ${PGVECTOR_IMAGE} AS build

ARG PG_MAJOR_VERSION=18
ARG PG_TEXTSEARCH_TAG=v1.3.1

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        build-essential ca-certificates curl "postgresql-server-dev-${PG_MAJOR_VERSION}"; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN set -eux; \
    curl -fsSL "https://github.com/timescale/pg_textsearch/archive/refs/tags/${PG_TEXTSEARCH_TAG}.tar.gz" \
        | tar -xz --strip-components=1; \
    make PG_CONFIG="/usr/lib/postgresql/${PG_MAJOR_VERSION}/bin/pg_config"; \
    make install PG_CONFIG="/usr/lib/postgresql/${PG_MAJOR_VERSION}/bin/pg_config" DESTDIR=/out

FROM ${PGVECTOR_IMAGE}

# Only what `make install` placed: the shared library and the extension's control and SQL files.
COPY --from=build /out/ /
