#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTANCE_TAG="code-runner-server"

ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=${INSTANCE_TAG}" "Name=instance-state-name,Values=stopped" \
  --query "Reservations[0].Instances[0].InstanceId" --output text)
if [ -z "$ID" ] || [ "$ID" = "None" ]; then
  echo "No stopped instance found. Use ./scripts/up.sh to create one." >&2
  exit 1
fi

aws ec2 start-instances --instance-ids "$ID" > /dev/null
"$ROOT/scripts/update-gateway.sh"