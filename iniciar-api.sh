#!/usr/bin/env bash
# API do Portal do Cliente — roda localmente, com dados reais do ADVBOX
# (o token já vem configurado em apps/api/.env).
# Uso: abra o Terminal nesta pasta e rode:  ./iniciar-api.sh
set -e
cd "$(dirname "$0")"

echo "== API do Portal do Cliente =="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado nesta máquina."
  echo "Instale em https://nodejs.org (versão 18 ou mais recente) e rode este script de novo."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Instalando o pnpm..."
  corepack enable >/dev/null 2>&1 || npm install -g pnpm
fi

echo "Instalando dependências (só demora na primeira vez)..."
pnpm install --filter @portal/api...

echo
echo "Iniciando a API na porta 4000..."
echo "Deixe esta janela aberta. Abra portal-visual.html no navegador em outra janela."
echo "Pra PARAR: aperte Ctrl+C aqui."
echo

cd apps/api && pnpm exec tsx src/server.ts
