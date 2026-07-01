#!/usr/bin/env bash
# Script de automatización de despliegue en GCP Compute Engine
# Diseñado para Ubuntu 22.04 LTS y superiores

set -e

echo "====================================================="
echo "🏥 Iniciando Configuración de Jóvenes con Salud VM"
echo "====================================================="

# 1. Actualización básica
echo "➔ Actualizando paquetes del sistema..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget build-essential gnupg

# 2. Instalar Node.js 20 LTS
echo "➔ Instalando Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PostgreSQL
echo "➔ Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Generar contraseñas/claves seguras
DB_PASS=$(openssl rand -hex 16)
JWT_SEC=$(openssl rand -hex 32)

echo "➔ Configurando base de datos de PostgreSQL..."
# Ejecutar comandos de creación de base de datos como el usuario postgres
sudo -i -u postgres psql <<EOF
CREATE DATABASE jovenes_con_salud_prod;
CREATE USER jcs_user WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE jovenes_con_salud_prod TO jcs_user;
ALTER DATABASE jovenes_con_salud_prod OWNER TO jcs_user;
EOF

# 4. Clonar el repositorio
echo "➔ Clonando repositorio desde GitHub..."
rm -rf jovenes-con-salud
git clone https://github.com/MajoTorres12/jovenes-con-salud.git
cd jovenes-con-salud/server

# 5. Instalar dependencias del servidor
echo "➔ Instalando dependencias de Node..."
npm install

# 6. Crear archivo .env
echo "➔ Creando configuración de entorno (.env)..."
cat <<EOF > .env
NODE_ENV=production
PORT=3001
DB_NAME=jovenes_con_salud_prod
DB_USER=jcs_user
DB_PASSWORD=$DB_PASS
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=$JWT_SEC
EOF

# 7. Ejecutar seeds / migraciones
echo "➔ Inicializando la base de datos con catálogo inicial..."
npm run seed

# 8. Configurar PM2
echo "➔ Instalando e iniciando PM2 para ejecución persistente..."
sudo npm install -y -g pm2
pm2 start server.js --name "jcs-backend"
pm2 save

echo "====================================================="
echo "✅ CONFIGURACIÓN COMPLETADA CON ÉXITO"
echo "====================================================="
echo ""
echo "Información Importante (Guarda estos datos):"
echo "--------------------------------------------"
echo "Usuario DB: jcs_user"
echo "Password DB: $DB_PASS"
echo "JWT Secret: $JWT_SEC"
echo ""
echo "Pasos siguientes:"
echo "1. Consigue la IP pública de esta máquina de GCP."
echo "2. Configura VITE_API_URL = http://<IP_PÚBLICA>:3001/api en Vercel."
echo "3. Vuelve a desplegar tu frontend en Vercel."
echo "====================================================="
