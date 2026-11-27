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

rem Prioriza o adaptador de Wi-Fi via PowerShell (mais confiavel que ler o
rem texto do "ipconfig" quando existe VPN/adaptador virtual na maquina,
rem que senao pode ser escolhido no lugar do Wi-Fi de verdade). Se LAN_IP
rem ja foi definido manualmente antes de rodar este script, respeita isso
rem e nao tenta detectar sozinho.
if defined LAN_IP goto ip_pronto
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -match 'Wi-?Fi' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress)"') do set LAN_IP=%%i

if not defined LAN_IP (
  for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1 -ExpandProperty IPAddress)"') do set LAN_IP=%%i
)

if not defined LAN_IP (
  echo Nao consegui descobrir o IP desta maquina na rede automaticamente.
  echo Rode "ipconfig", procure o "Endereco IPv4" da sua rede Wi-Fi ^(geralmente 192.168.x.x,
  echo no bloco "Adaptador de Rede sem Fio Wi-Fi"^) e rode de novo assim:
  echo   set LAN_IP=SEU_IP_AQUI ^&^& iniciar-mobile.bat
  pause
  exit /b 1
)

:ip_pronto
echo IP desta maquina na rede: %LAN_IP%
echo Confira que esse e o IP da sua rede Wi-Fi mesmo ^(rode "ipconfig" e compare
echo com o "Endereco IPv4" do bloco "Adaptador de Rede sem Fio Wi-Fi"^).
echo Confira tambem que seu iPhone/Android esta na MESMA rede Wi-Fi.
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
rem Sem isso, o Expo as vezes anuncia "127.0.0.1" no QR code em vez do IP
rem da rede (o celular nao alcanca "127.0.0.1" dele mesmo) — foi
rem exatamente esse o problema visto no "Metro waiting on exp://127.0.0.1:8081".
set REACT_NATIVE_PACKAGER_HOSTNAME=%LAN_IP%
call npx --yes expo start
exit /b 0

:erro
echo.
echo Algo deu errado durante a instalacao. Veja a mensagem acima.
pause
exit /b 1
