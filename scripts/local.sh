#!/usr/bin/env bash
# (Re)starts the site on http://localhost:3000 against the dev database.
#   npm run local                    restart the local server
#   npm run local -- --fresh-data    re-copy production data into the dev database first
set -euo pipefail
cd "$(dirname "$0")/.."

# Never run localhost against the production database
db=$(grep -E '^MONGODB_URI=' .env.local 2>/dev/null | head -1 | sed -E 's#.*mongodb(\+srv)?://[^/]*/?([^?"'"'"']*).*#\2#' || true)
if [[ "$db" != *-dev ]]; then
  echo "Refusing to start: .env.local points at database \"${db:-<none>}\", not a -dev database."
  echo "Point MONGODB_URI at stl-gathering-dev first (see README > Getting Started)."
  exit 1
fi

# Stop any server already running on port 3000
if pids=$(lsof -ti tcp:3000); then
  echo "Stopping the existing server on port 3000..."
  kill $pids 2>/dev/null || true
  while lsof -ti tcp:3000 >/dev/null; do sleep 0.2; done
fi

if [[ "${1:-}" == "--fresh-data" ]]; then
  npm run db:sync-dev
fi

echo "Starting http://localhost:3000 (database: $db). Press Ctrl+C to stop."
exec npm run dev
