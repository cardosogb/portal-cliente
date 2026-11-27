# Rodando o app mobile no seu iPhone (via Expo Go)

Não existe um "instalador" simples pra iPhone fora da loja da Apple — tudo passa pelo
sistema de assinatura dela. O caminho grátis e rápido pra testar o app de verdade
agora é o **Expo Go**: um app da App Store que roda o nosso app dentro dele, sem
precisar de conta de desenvolvedor nem build nenhum.

## O que você precisa
- **Node.js** (versão 18+) no computador — https://nodejs.org
- O app **Expo Go** instalado no iPhone (grátis, na App Store)
- **Seu iPhone e este computador na MESMA rede Wi-Fi** — é assim que o celular
  encontra o app e a API rodando no computador. Não funciona em redes diferentes
  (ex.: celular no 4G/5G e computador no Wi-Fi), nem em Wi-Fi "de convidado" que
  isola os aparelhos entre si (comum em empresas/prédios).

## Passo a passo

**Mac/Linux**: abra o Terminal nesta pasta e rode:
```
./iniciar-mobile.sh
```
(se der erro de permissão: `chmod +x iniciar-mobile.sh` antes)

**Windows**: dois cliques em `iniciar-mobile.bat`.

O script descobre o IP deste computador na rede, sobe a API e mostra um **QR code**
no terminal. No iPhone, abra a câmera (ou o próprio Expo Go) e aponte pro QR code —
ele abre o app.

## Se o QR code não conectar
- **"Could not connect to the server" / o terminal mostra `exp://127.0.0.1:8081`**
  (em vez de um IP tipo `192.168.X.X`): o script já corrige isso forçando o IP
  certo, mas se ainda acontecer, descubra o IP manualmente (`ipconfig` no
  Windows, no bloco "Adaptador de Rede sem Fio Wi-Fi"; `ifconfig`/`ipconfig
  getifaddr en0` no Mac) e rode assim:
  - Windows: `set LAN_IP=SEU_IP_AQUI && iniciar-mobile.bat`
  - Mac/Linux: `LAN_IP=SEU_IP_AQUI ./iniciar-mobile.sh`
- Confirme que os dois estão na mesma rede Wi-Fi (não 4G/5G no celular).
- Firewall do computador pode estar bloqueando — libere o **Node.js** nos
  perfis "Privada" e "Pública" (Windows Defender Firewall → "Permitir um
  aplicativo pelo firewall"), ou libere as portas 8081 (Metro) e 4000 (API).
- Rede Wi-Fi com "isolamento de cliente" (comum em Wi-Fi de convidado, redes
  corporativas e alguns roteadores mesh) impede os aparelhos de se verem
  mesmo na mesma rede — tente outra rede Wi-Fi (ex.: a de casa) se puder.
- Em vez de escanear, você pode digitar a URL que aparece no terminal
  (algo como `exp://192.168.X.X:8081`) direto no Expo Go.

## Isso não é a mesma coisa que "instalar o app"

Rodando assim, o app só existe enquanto o Expo Go estiver aberto com essa conexão —
não fica um ícone permanente na tela de início como um app de verdade. Pra isso
(um app instalado, com ícone próprio, via TestFlight ou App Store), é preciso gerar
um build real (.ipa) com o EAS Build da Expo, o que exige uma conta Apple Developer
(US$ 99/ano). Se quiser seguir esse caminho depois, é só pedir.
