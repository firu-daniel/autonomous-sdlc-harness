# Postgres 18 carrying both extensions the store creates: `vector` (pgvector) and `pg_textsearch`.
#
# How this Postgres differs from the PGlite the TypeScript backend embeds — the records
# `## The seam, as found` (the package README) carries:
#
# 1. pg_textsearch: built here from the timescale/pg_textsearch release tag `v1.5.1`.
#    `@electric-sql/pglite-pg_textsearch` 0.0.12's bundled `dist/pg_textsearch.tar.gz` carries
#    `pg_textsearch.control` with `default_version = '1.5.1'` and `pg_textsearch--1.5.1.sql` as its
#    only install script, read from the archive without extracting it. The tag was chosen to match
#    that, and it is verified against the upstream repository: this image's build downloads it.
# 2. pgvector: 0.8.7, from the `pgvector/pgvector:0.8.7-pg18` base, whose server is
#    PostgreSQL 18.6. `@electric-sql/pglite-pgvector` 0.0.11 bundles `vector.control` with
#    `default_version = '0.8.7'`, so the two match, and `@electric-sql/pglite` 0.5.10 reports
#    `PostgreSQL 18.6` in its bundle. The base moved from `0.8.1-pg18` (server 18.2) because
#    pg_textsearch 1.5.1 needs a server of 18.4 or newer: the build stage compiles against the
#    newest `postgresql-server-dev-18` apt serves, whose headers from 18.4 on route `palloc_array`
#    through `palloc_mul`, and an 18.2 server refused the library with
#    `undefined symbol: palloc_mul`. The base and the build-stage headers can still drift apart
#    by minor, since apt is not pinned.
# 3. Server settings: pg_textsearch must be in `shared_preload_libraries`. PGlite supplies that
#    through the extension's `setup`, which returns `sharedPreloadLibraries: ["pg_textsearch"]`
#    (`@electric-sql/pglite-pg_textsearch` dist/index.js). Here compose.yaml passes it as
#    `-c shared_preload_libraries=pg_textsearch`; this image sets no server parameter itself.
#    pgvector needs no preload in either.

ARG PGVECTOR_IMAGE=pgvector/pgvector:0.8.7-pg18

FROM ${PGVECTOR_IMAGE} AS build

ARG PG_MAJOR_VERSION=18
ARG PG_TEXTSEARCH_TAG=v1.5.1

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
