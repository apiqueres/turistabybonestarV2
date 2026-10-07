#!/usr/bin/env bash
# Prepara el VPS (Ubuntu 24.04) para la web: instala Docker + Compose, da permiso al usuario
# y activa el sitio de Nginx (HTTP). Ejecutar UNA vez como root:
#
#   cd /opt/turistabybonestar/turistabybonestarV2 && sudo ./deploy/vps-setup.sh
#
# Después (ya sin sudo, en una sesión nueva para que aplique el grupo docker):
#   docker compose up -d --build
# Y cuando el DNS apunte aquí:
#   sudo certbot --nginx -d turistabybonestar.com -d www.turistabybonestar.com
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="${SUDO_USER:-$(id -un)}"

if [ "$(id -u)" -ne 0 ]; then echo "Ejecuta con sudo." >&2; exit 1; fi

echo "== Docker"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
usermod -aG docker "$APP_USER"
docker --version && docker compose version

echo "== Nginx"
apt-get install -y nginx certbot python3-certbot-nginx
install -m 0644 "$PROJECT_DIR/deploy/nginx-http.conf" /etc/nginx/sites-available/turistabybonestar.conf
ln -sf /etc/nginx/sites-available/turistabybonestar.conf /etc/nginx/sites-enabled/turistabybonestar.conf
nginx -t && systemctl reload nginx

echo "== Carpetas"
mkdir -p "$PROJECT_DIR/data/uploads" "$PROJECT_DIR/backups"
chown -R "$APP_USER":"$APP_USER" "$PROJECT_DIR/data" "$PROJECT_DIR/backups"

echo
echo "Listo. Ahora, como $APP_USER y en una sesión nueva:"
echo "  cd $PROJECT_DIR && docker compose up -d --build"
echo "  curl -s localhost:3000/api/health"
echo "Cuando el DNS de turistabybonestar.com apunte a este servidor:"
echo "  sudo certbot --nginx -d turistabybonestar.com -d www.turistabybonestar.com"
