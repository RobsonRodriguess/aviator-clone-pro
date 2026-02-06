# 🎰 Aviator Clone Pro

> Um clone funcional, moderno e **ético** do jogo "Aviator" (Crash Game), focado em performance, WebSockets e transparência.

![Preview do Projeto](./assets/preview.png)

## ⚖️ A Filosofia do Projeto (Fair Play)
Este simulador foi construído com **aleatoriedade pura** (`Math.random()`). 

> **Nota do Desenvolvedor:** > O objetivo deste projeto é demonstrar como jogos de aposta **deveriam ser**: transparentes e baseados na sorte real. 
> 
> Diferente deste clone, a grande maioria das casas de apostas reais utiliza algoritmos manipulados e sistemas de RTP (Return to Player) projetados matematicamente para garantir que a "casa" sempre lucre e o usuário perca a longo prazo. Aqui, o código é aberto e o jogo é honesto.

## 🚀 Tecnologias
- **Frontend:** Next.js 14, TailwindCSS, Framer Motion, Lucide Icons.
- **Backend:** NestJS, Socket.io (Realtime).
- **Features:**
  - 📡 Comunicação em Tempo Real (WebSockets)
  - 📈 Gráfico SVG Dinâmico (Curvas de Bezier)
  - 🤖 Simulação de Bots e Multiplayer
  - 🛡️ Validação de Saldo e Segurança de Aposta
  - 🎨 UI "Dark Neon" Profissional (Estilo Stake/Blaze)

## 🛠️ Como Rodar Localmente

### Pré-requisitos
- Node.js instalado
- Git instalado

### Instalação

1. Clone o repositório:
```bash
git clone [https://github.com/RobsonRodriguess/aviator-clone-pro.git](https://github.com/RobsonRodriguess/aviator-clone-pro.git)

cd backend
npm install
npm run start:dev

cd frontend
npm install
npm run dev

http://localhost:3000

---

### 📤 Como atualizar no GitHub agora:

Abra seu terminal no VS Code e mande a atualização:

```bash
git add README.md
git commit -m "Docs: Adiciona nota sobre manipulação em casas de apostas"
git push

