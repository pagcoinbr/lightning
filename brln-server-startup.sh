#!/bin/bash

# BRLN-OS Lightning + Elements Server Startup Script
# Garante que as dependências estejam instaladas antes de iniciar

set -e

echo "🔧 BRLN Lightning + Elements Server - Inicializando..."

# Navegar para o diretório do projeto
cd /root/brln-os/lightning

# Verificar e instalar dependências se necessário
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "📦 Instalando dependências do Node.js..."
    npm install --production
    if [ $? -eq 0 ]; then
        echo "✅ Dependências instaladas com sucesso"
    else
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
else
    echo "✅ Dependências já estão disponíveis"
fi

# Verificar se o arquivo principal existe
if [ ! -f "server/brln-server.js" ]; then
    echo "❌ Arquivo do servidor não encontrado: server/brln-server.js"
    exit 1
fi

echo "🚀 Iniciando BRLN Lightning + Elements Server..."
exec /usr/bin/node /root/brln-os/lightning/server/brln-server.js
