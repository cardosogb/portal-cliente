@echo off
setlocal
cd /d "%~dp0"

echo == API do Portal do Cliente ==
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado nesta maquina.
  echo Instale em https://nodejs.org ^(versao 18 ou mais recente^) e rode este arquivo de novo.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo Instalando o pnpm...
  call corepack enable >nul 2>nul
)

echo Instalando dependencias ^(so demora na primeira vez^)...
call pnpm install --filter @portal/api...
if errorlevel 1 goto erro

echo.
echo Iniciando a API na porta 4000...
echo Deixe esta janela aberta. Abra portal-visual.html no navegador em outra janela.
echo Pra PARAR: feche esta janela.
echo.

cd apps\api
call pnpm exec tsx src\server.ts
exit /b 0

:erro
echo.
echo Algo deu errado durante a instalacao. Veja a mensagem acima.
pause
exit /b 1
