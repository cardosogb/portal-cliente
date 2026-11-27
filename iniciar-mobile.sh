#!/usr/bin/env bash
# App mobile (iPhone/Android) com dados reais — roda no seu computador.
# Seu celular precisa estar na MESMA REDE WI-FI que este computador.
# Uso: abra o Terminal nesta pasta e rode:  ./iniciar-mobile.sh
set -e
cd "$(dirname "$0")"

echo "== App mobile — Portal do Cliente =="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado nesta máquina."
  echo "Instale em https://nodejs.org (versão 18 ou mais recente) e rode este script de novo."
  exit 1
fi

# Descobre o IP desta máquina na rede local, pra o celular conseguir
# chamar a API — "localhost" no celular aponta pro próprio celular, não
# pra este computador.
LAN_IP=""
if command -v ipconfig >/dev/null 2>&1; then
  LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
fi
if [ -z "$LAN_IP" ] && command -v hostname >/dev/null 2>&1; then
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LAN_IP" ]; then
  echo "Não consegui descobrir o IP desta máquina na rede automaticamente."
  echo "Rode 'ifconfig' (Mac/Linux) e procure o IP da sua rede Wi-Fi (geralmente 192.168.x.x),"
  echo "depois rode:  EXPO_PUBLIC_API_URL=http://SEU_IP:4000 ./iniciar-mobile.sh"
  exit 1
fi

echo "IP desta máquina na rede: $LAN_IP"
echo "(confira que seu iPhone/Android está na MESMA rede Wi-Fi)"
echo

echo "Instalando dependências (só demora na primeira vez)..."
npx --yes pnpm install --filter @portal/mobile... --filter @portal/api...

echo
echo "Iniciando a API na porta 4000..."
(cd apps/api && npx --yes pnpm exec tsx src/server.ts) &
API_PID=$!
trap "kill $API_PID 2>/dev/null" EXIT

sleep 2

echo
echo "=================================================="
echo " No seu iPhone: instale o app \"Expo Go\" (App Store, grátis)"
echo " e escaneie o QR code abaixo pela câmera do iPhone."
echo " (Android: o próprio app Expo Go tem um leitor de QR code.)"
echo "=================================================="
echo

cd apps/mobile && EXPO_PUBLIC_API_URL="http://$LAN_IP:4000" npx --yes expo start
