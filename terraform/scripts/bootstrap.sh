#!/bin/bash
set -euxo pipefail

#debugging command
#cloud-init status (display current execution state of cloud-init initialization status)
#cat /var/log/code-runner-bootstrap.log (did the bootstrap process complete successfully?)
#sudo bash /var/lib/cloud/instance/scripts/part-001 (Run script manually; -x prints each command as it executes)

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

# gVisor install
curl -fsSL https://gvisor.dev/archive.key | gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | tee /etc/apt/sources.list.d/gvisor.list > /dev/null

apt-get update -y
apt-get install -y runsc

mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'DOCKERCONFIG'
{
    "runtimes":{
        "runsc":{
            "path": "/usr/bin/runsc"
        }
    }
}
DOCKERCONFIG

systemctl restart docker

# pm2 install
npm install -g pm2 

# Application clone & install
mkdir -p /opt/code-runner
chown ubuntu:ubuntu /opt/code-runner
sudo -H -u ubuntu git clone https://github.com/shouk12345/Web-Code-Runner.git /opt/code-runner
cd /opt/code-runner
sudo -H -u ubuntu npm ci
sudo -H -u ubuntu npm run build

# Runner images (rebuilded at destroy/apply)
docker build -t runner-node:latest ./docker/node
docker build -t runner-python:latest ./docker/python

# pm2 start
sudo -H -u ubuntu pm2 start dist/index.js --name code-runner
env PATH=$$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo -H -u ubuntu pm2 save

echo "bootstrap complete" > /var/log/code-runner-bootstrap.log