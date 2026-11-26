# Rodando a API com dados reais do ADVBOX, no seu computador

O que aconteceu: a API que respondia em `http://localhost:4000` só existia dentro da
sessão de nuvem onde eu trabalhei — "localhost" ali era o endereço *daquela* máquina,
não do seu computador. Por isso a página `portal-visual.html` não conseguia falar com
ela quando aberta localmente. Este pacote resolve isso: a API roda no seu computador.

## O que você precisa ter instalado
- **Node.js** (versão 18 ou mais recente) — https://nodejs.org

## Passo a passo

**Windows**: dois cliques em `iniciar-api.bat`.
**Mac/Linux**: no Terminal, nesta pasta, rode `./iniciar-api.sh` (se der erro de
permissão: `chmod +x iniciar-api.sh` antes).

Na primeira vez demora um pouco (instalando dependências). Quando aparecer
`[api] Portal do Cliente API rodando em http://localhost:4000`, deixe essa janela
aberta e abra `portal-visual.html` no navegador — ele já aponta para
`http://localhost:4000` por padrão.

## Sobre o token do ADVBOX

O arquivo `apps/api/.env` já vem com o token configurado — é o mesmo que você me
passou antes. Trate esse arquivo com o mesmo cuidado que trataria uma senha: não
suba esta pasta pra nenhum repositório público, não mande esse arquivo pra mais
ninguém. Se achar que ele foi exposto em algum momento, o mais seguro é gerar um
token novo com a ADVBOX e substituir o valor em `apps/api/.env`.

## Login com dados reais

Use o CPF (ou telefone, se for da equipe) e a data de nascimento (DDMM) de um
cliente/funcionário real do escritório — os mesmos que você usaria no sistema de
verdade. Não existe mais usuário de demonstração quando o token está configurado.

## Primeira vez acessando o Painel interno

A primeira consulta ao painel interno sincroniza TODOS os processos do escritório
(são ~30 mil registros) respeitando o limite de 30 chamadas/minuto do ADVBOX — isso
leva cerca de 1-2 minutos na primeira vez. Depois disso fica em cache por 20 minutos.
