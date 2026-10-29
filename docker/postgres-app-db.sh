#!/bin/sh
# Creates the database of the Docker app (profile "app") if it does not exist yet.
# It is separate from the dev database, which `pnpm dev` manages with schema push.
set -eu
psql -v ON_ERROR_STOP=1 -h postgres -U "$POSTGRES_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$APP_DB'" | grep -q 1 \
  || psql -v ON_ERROR_STOP=1 -h postgres -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$APP_DB\""
echo "Database '$APP_DB' ready."
