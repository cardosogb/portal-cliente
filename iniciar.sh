#!/usr/bin/env bash
# Portal do Cliente — inicia o site (e a API) localmente.
# Uso: abra o Terminal nesta pasta e rode:  ./iniciar.sh
set -e
cd "$(dirname "$0")"

echo "== Portal do Cliente =="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado nesta máquina."
  echo "Instale em https://nodejs.org (versão 18 ou mais recente) e rode este script de novo."
  exit 1
fi

echo "Instalando dependências (só demora na primeira vez)..."
npx --yes pnpm install --filter @portal/web... --filter @portal/api...

export NEXT_PUBLIC_API_URL="http://localhost:4000"

echo
echo "Compilando o site..."
npx --yes pnpm --filter @portal/web build

echo
echo "Iniciando a API na porta 4000..."
(cd apps/api && npx --yes pnpm exec tsx src/server.ts) &
API_PID=$!

sleep 2

echo "Iniciando o site na porta 3000..."
(cd apps/web && NEXT_PUBLIC_API_URL="http://localhost:4000" npx --yes pnpm start) &
WEB_PID=$!

sleep 3
URL="http://localhost:3000"
echo
echo "Pronto! Abrindo $URL no navegador..."
( command -v open >/dev/null 2>&1 && open "$URL" ) || \
( command -v xdg-open >/dev/null 2>&1 && xdg-open "$URL" ) || \
echo "Abra manualmente: $URL"

echo
echo "O site está rodando em $URL"
echo "Pra PARAR: volte aqui e aperte Ctrl+C."

trap "echo; echo 'Encerrando...'; kill $API_PID $WEB_PID 2>/dev/null" EXIT
wait
