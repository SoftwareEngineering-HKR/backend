#!/bin/bash
psql -U "$POSTGRES_USER" -c "CREATE DATABASE test_db;"
psql -U "$POSTGRES_USER" -d test_db -f /tmp/tables.sql
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/tables.sql
