# Como rodar o Portal do Cliente na sua máquina

## O que você precisa ter instalado
- **Node.js** (versão 18 ou mais recente) — baixe em https://nodejs.org se não tiver.

Não precisa instalar mais nada manualmente; o script cuida do resto (pnpm, dependências, build).

## Windows
1. Extraia este .zip numa pasta.
2. Dê dois cliques em **`iniciar.bat`**.
3. Na primeira vez, vai demorar alguns minutos (instalando e compilando). Depois disso é rápido.
4. O navegador abre sozinho em `http://localhost:3000`.
5. Pra parar: feche as duas janelas pretas que abriram (API e Site).

## Mac / Linux
1. Extraia este .zip numa pasta.
2. Abra o Terminal nessa pasta e rode:
   ```
   ./iniciar.sh
   ```
   (se der erro de permissão, rode antes `chmod +x iniciar.sh`)
3. O navegador abre sozinho em `http://localhost:3000`.
4. Pra parar: volte no Terminal e aperte `Ctrl+C`.

## Login de teste (dados fictícios de demonstração)
- **Cliente**: CPF `12345678909`, nascimento `1204`
- **Equipe (painel interno)**: CPF `11122233396` (ou telefone `27998210707`), nascimento `2207`
- **Equipe + dashboard executivo (CEO/Diretoria/TI)**: CPF `44455566627`, nascimento `0311`

## O que isso é (e o que não é)
Isso roda o site **localmente, no seu computador** — não é um programa instalado que fica no menu
iniciar/Launchpad, e não está publicado na internet. Enquanto o site estiver rodando, só quem está
usando esse computador consegue acessar `http://localhost:3000`. Se quiser publicar de verdade
(endereço acessível por qualquer pessoa, pela internet), isso é um passo diferente — é só pedir.
