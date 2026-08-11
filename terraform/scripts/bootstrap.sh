#!/bin/bash
set -euxo pipefail

# Docker install
apt-get update -y
apt-get install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

DOCKER_ARCH=$(dpkg --print-architecture)
UBUNTU_CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
echo "deb [arch=${DOCKER_ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME} stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker ubuntu

systemctl enable docker
systemctl start docker

# node.js install
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "bootstrap complete" > /var/log/code-runner-bootstrap.log