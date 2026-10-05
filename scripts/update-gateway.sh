#!/bin/bash
set -euo pipefail

# Git bashが"/{proxy}"などの因子をwindowsのパスとして解釈することを防ぐ
export MSYS_NO_PATHCONV=1

API_NAME="code-runner-api"
INSTANCE_TAG="code-runner-server"
PORT=3000

API_ID=$(aws apigatewayv2 get-apis \
--query "Items[?Name=='${API_NAME}'].ApiId | [0]" --output text)
if [ -z "$API_ID"] || ["$API_ID" == "None"]; then
    echo "API Gateway '${API_NAME}' not found."
    exit 1
fi

INTEG_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" \
--query "Items[0].IntegrationId" --output text)

# pending/ running状態のInstanceを取得
ID=$(aws ec2 describe-instances \
--filters "Name=tag:Name,Values=${INSTANCE_TAG}" "Name=instance-state-name,Values=pending,running" \
--query "Reservations[0].Instances[0].InstanceId" --output text)

if [ -z "$ID" ] || [ "$ID" = "None" ]; then
  echo "No pending/running instance found for '${INSTANCE_TAG}'" >&2
  exit 1
fi

# Instanceがrunning状態になり公認IPが取得できるまで待機
aws ec2 wait instance-running --instance-ids "$ID"

IP=$(aws ec2 describe-instances --instance-ids "$ID" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
if [ -z "$IP" ] || [ "$IP" = "None" ]; then
  echo "No public IP found for instance ${ID}" >&2
  exit 1
fi

aws apigatewayv2 update-integration \
--api-id "$API_ID"  --integration-id "$INTEG_ID" \
--integration-uri "http://${IP}:${PORT}/{proxy}" > /dev/null

echo "Gateway integration updated -> http://${IP}:${PORT}"
echo "Server may still be bootstrapping; 502 is expected for the first few minutes." 
