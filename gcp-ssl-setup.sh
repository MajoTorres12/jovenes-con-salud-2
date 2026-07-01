#!/usr/bin/env bash
# Script para configurar Nginx, sslip.io y SSL Let's Encrypt en GCP VM
set -e

echo "====================================================="
echo "🔒 Configurando HTTPS y SSL para Jóvenes con Salud"
echo "====================================================="

# 1. Obtener la IP pública actual de la máquina virtual
echo "➔ Detectando IP pública de la máquina..."
IP_ADDR=$(curl -s https://icanhazip.com || curl -s https://ifconfig.me)
if [ -z "$IP_ADDR" ]; then
  echo "❌ No se pudo detectar la IP pública de la máquina."
  exit 1
fi
echo "IP detectada: $IP_ADDR"

# Reemplazar puntos por guiones para formar el dominio de sslip.io
IP_DASHED=$(echo "$IP_ADDR" | tr '.' '-')
DOMAIN="${IP_DASHED}.sslip.io"
echo "Dominio asignado: $DOMAIN"

# 2. Instalar Nginx, Certbot y dependencias
echo "➔ Instalando Nginx y Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Crear archivo de configuración de Nginx como proxy reverso para port 3001
echo "➔ Creando archivo de configuración en Nginx..."
sudo tee /etc/nginx/sites-available/jcs-api <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Habilitar el sitio y deshabilitar el default de Nginx
sudo ln -sf /etc/nginx/sites-available/jcs-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Probar la sintaxis de Nginx y reiniciar
echo "➔ Verificando configuración de Nginx..."
sudo nginx -t
sudo systemctl restart nginx

# 4. Solicitar y configurar el certificado SSL de Let's Encrypt automáticamente
echo "➔ Solicitando certificado SSL gratuito de Let's Encrypt..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m 121380559@cdvictoria.tecnm.mx

# Reiniciar Nginx una vez más para asegurar que cargue los certificados
sudo systemctl restart nginx

echo "====================================================="
echo "✅ ¡HTTPS CONFIGURADO CON ÉXITO!"
echo "====================================================="
echo ""
echo "Tu nueva URL segura de API es:"
echo "👉 https://$DOMAIN/api"
echo ""
echo "Pasos siguientes:"
echo "1. Ve a tu panel de Vercel ➔ Settings ➔ Environment Variables."
echo "2. Cambia VITE_API_URL a: https://$DOMAIN/api"
echo "3. Haz click en Redeploy en tu último despliegue de Vercel."
echo "====================================================="
