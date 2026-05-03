#!/bin/bash
# Habilita la extensión pgvector en la DB nexusai.
# Sin esto, no se puede usar el tipo `vector(N)` ni los operadores `<=>`, `<->`, `<#>`.

set -e

echo "==> Habilitando extensión pgvector en DB nexusai"
psql --username "${POSTGRES_USER}" --dbname "nexusai" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    -- Verificar:
    SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
EOSQL
echo "==> pgvector habilitada"
