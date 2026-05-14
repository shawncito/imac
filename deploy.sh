#!/bin/bash
set -e

SITE_DIR="/var/www/imac"
NGINX_CONF="/etc/nginx/sites-available/imac"
NGINX_ENABLED="/etc/nginx/sites-enabled/imac"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Instalando nginx..."
apt-get install -y nginx

echo "==> Copiando archivos..."
mkdir -p "$SITE_DIR"
cp -r "$SCRIPT_DIR/dist" "$SITE_DIR/"
chown -R www-data:www-data "$SITE_DIR"

echo "==> Configurando nginx..."
cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF"
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# Desactivar el sitio default si existe
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

echo "==> Verificando configuración..."
nginx -t

echo "==> Reiniciando nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "Listo. La app está corriendo en http://imac.rlp.lat"
