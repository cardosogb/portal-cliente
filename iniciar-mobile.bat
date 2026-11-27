@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo == App mobile - Portal do Cliente ==
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado nesta maquina.
  echo Instale em https://nodejs.org ^(versao 18 ou mais recente^) e rode este arquivo de novo.
  pause
  exit /b 1
)

set LAN_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  if not defined LAN_IP set LAN_IP=%%a
)
set LAN_IP=%LAN_IP: =%

if not defined LAN_IP (
  echo Nao consegui descobrir o IP desta maquina na rede automaticamente.
  echo Rode "ipconfig", procure o "Endereco IPv4" da sua rede Wi-Fi ^(geralmente 192.168.x.x^)
  echo e defina a variavel EXPO_PUBLIC_API_URL antes de rodar este script.
  pause
  exit /b 1
)

echo IP desta maquina na rede: %LAN_IP%
echo (confira que seu iPhone/Android esta na MESMA rede Wi-Fi)
echo.

echo Instalando dependencias ^(so demora na primeira vez^)...
call npx --yes pnpm install --filter @portal/mobile... --filter @portal/api...
if errorlevel 1 goto erro

echo.
echo Iniciando a API na porta 4000...
start "Portal - API (nao feche)" cmd /k "cd /d "%~dp0apps\api" && npx --yes pnpm exec tsx src\server.ts"

timeout /t 2 >nul

echo.
echo ==================================================
echo  No seu iPhone: instale o app "Expo Go" (App Store, gratis)
echo  e escaneie o QR code abaixo pela camera do iPhone.
echo  (Android: o proprio app Expo Go tem um leitor de QR code.)
echo ==================================================
echo.

cd apps\mobile
set EXPO_PUBLIC_API_URL=http://%LAN_IP%:4000
call npx --yes expo start
exit /b 0

:erro
echo.
echo Algo deu errado durante a instalacao. Veja a mensagem acima.
pause
exit /b 1
