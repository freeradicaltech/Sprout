#!/bin/sh
set -e

# Ensure the schema is applied to the mounted volume DB on first boot.
echo "[sprout] applying database schema..."
npx prisma db push --skip-generate

# Seed only if the DB has no household yet.
if [ "${SPROUT_SEED:-0}" = "1" ]; then
  echo "[sprout] seeding demo data..."
  node prisma/seed.js || echo "[sprout] seed skipped/failed (continuing)"
fi

exec "$@"
