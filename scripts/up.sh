#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
(cd "$ROOT/terraform" && terraform apply "$@")
"$ROOT/scripts/update-gateway.sh"