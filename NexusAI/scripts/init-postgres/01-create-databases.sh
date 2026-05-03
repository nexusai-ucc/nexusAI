#!/bin/bash
# Crea las dos bases de datos que NexusAI necesita en el servidor PostgreSQL.
# Este script lo ejecuta automáticamente la imagen oficial de pgvector/postgres
# UNA SOLA VEZ durante la primera inicialización del volumen.
#
# - nexusai: tablas del backend (nexusai_documents, nexusai_chunks, etc.)
# - moodle:  base de Moodle (usada con `docker compose --profile full`)

set -e

POSTGRES="psql --username ${POSTGRES_USER} --dbname postgres"

create_db_if_not_exists() {
    local db=$1
    if ! $POSTGRES -tc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1; then
        echo "==> Creando base de datos: $db"
        $POSTGRES -c "CREATE DATABASE $db OWNER ${POSTGRES_USER};"
    else
        echo "==> Base de datos ya existe: $db (skip)"
    fi
}

echo "==> Inicializando bases de datos de NexusAI"
create_db_if_not_exists nexusai
create_db_if_not_exists moodle
echo "==> Bases de datos listas"
