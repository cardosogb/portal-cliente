@echo off
setlocal
cd /d "%~dp0"

echo == Portal do Cliente ==
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado nesta maquina.
  echo Instale em https://nodejs.org ^(versao 18 ou mais recente^) e rode este arquivo de novo.
  pause
  exit /b 1
)

echo Instalando dependencias ^(so demora na primeira vez^)...
call npx --yes pnpm install --filter @portal/web... --filter @portal/api...
if errorlevel 1 goto erro

set NEXT_PUBLIC_API_URL=http://localhost:4000

echo.
echo Compilando o site...
call npx --yes pnpm --filter @portal/web build
if errorlevel 1 goto erro

echo.
echo Iniciando a API na porta 4000...
start "Portal - API (nao feche)" cmd /k "cd /d "%~dp0apps\api" && npx --yes pnpm exec tsx src\server.ts"

timeout /t 2 >nul

echo Iniciando o site na porta 3000...
start "Portal - Site (nao feche)" cmd /k "cd /d "%~dp0apps\web" && set NEXT_PUBLIC_API_URL=http://localhost:4000 && npx --yes pnpm start"

timeout /t 3 >nul
start http://localhost:3000

echo.
echo Pronto! O site esta rodando em http://localhost:3000
echo Pra PARAR: feche as duas janelas pretas que abriram (API e Site).
pause
exit /b 0

:erro
echo.
echo Algo deu errado durante a instalacao/compilacao. Veja a mensagem acima.
pause
exit /b 1
