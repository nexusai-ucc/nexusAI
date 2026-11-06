#!/usr/bin/env bash
# Prepara un droplet Ubuntu 24.04 recién creado para la demo.
# Se corre una sola vez, como root, en el servidor:
#
#   curl -fsSL https://raw.githubusercontent.com/nexusai-ucc/nexusAI/<rama>/NexusAI/deploy/demo/provision.sh | bash
#   (o copiándolo con scp)
#
# Hace: actualizaciones, Docker, firewall (22/80/443), swap de 4 GB,
# actualizaciones de seguridad automáticas y el clonado del repo en /opt/nexusai.
set -euo pipefail

[ "$(id -u)" = "0" ] || { echo "Correr como root" >&2; exit 1; }

REPO_URL="${REPO_URL:-https://github.com/nexusai-ucc/nexusAI.git}"
REPO_BRANCH="${REPO_BRANCH:-development}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl git ufw unattended-upgrades python3-venv

# Docker (repositorio oficial).
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Firewall: solo SSH y web.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# Swap de 4 GB (margen para picos de memoria).
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

dpkg-reconfigure -f noninteractive unattended-upgrades

# Repo.
if [ ! -d /opt/nexusai/.git ]; then
  git clone --branch "$REPO_BRANCH" "$REPO_URL" /opt/nexusai
fi

cat <<'MSG'

Servidor listo. Siguientes pasos (ver NexusAI/deploy/demo/README.md):
  cd /opt/nexusai/NexusAI/deploy/demo
  cp .env.example .env && nano .env        # dominio, contraseñas y keys
  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
  .venv/bin/python generar_cuentas.py --url https://TU-DOMINIO
  ./setup.sh
MSG
