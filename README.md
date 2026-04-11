# FitApp — Personal Trainer App

> Plataforma mobile-first para personal trainers gerenciarem agenda, alunos, treinos, pagamentos e retenção.

## 🚀 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Animações | Framer Motion |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| State | TanStack Query v5 |
| PWA | vite-plugin-pwa (Workbox) |
| Roteamento | React Router DOM v6 |

## 📂 Estrutura

```
src/
├── components/       # UI compartilhados (AppLayout, OnboardingTour, etc.)
│   └── ui/          # shadcn/ui primitivos
├── contexts/         # AuthContext, DemoModeContext, ThemeContext
├── hooks/            # Data hooks (useSessions, useStudents, usePayments…)
├── integrations/     # Supabase client + types gerados
├── pages/            # Uma pasta por rota
└── App.tsx           # Router raiz + providers
```

## ⚙️ Setup local

### Pré-requisitos
- Node.js 18+ ou Bun 1.x
- Conta Supabase (gratuita)

### 1. Clonar e instalar

```bash
git clone https://github.com/LeoNardoRR/radiant-trainer-hub.git
cd radiant-trainer-hub
npm install        # ou: bun install
```

### 2. Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

> Esses valores ficam em **Supabase → Project Settings → API**.

### 3. Banco de dados

Execute as migrations na order cronológica:

```bash
# Via Supabase CLI (recomendado)
supabase db push

# Ou manualmente: copie cada arquivo em supabase/migrations/ e cole no SQL Editor do dashboard
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse: [http://localhost:8080](http://localhost:8080)

---

## 🗂️ Fluxo de uso

### Como Personal Trainer
1. Crie sua conta em `/signup` (role: trainer)
2. Em **Ajustes → Convites**, gere um código de convite
3. Compartilhe o link ou QR Code com seus alunos
4. Gerencie sessões, aprove solicitações, acompanhe pagamentos e analytics

### Como Aluno
1. Acesse o link de convite do seu personal (`/invite/:code`)
2. Crie sua conta (role: student, já vinculado ao trainer)
3. Solicite sessões via **Agenda**, acompanhe seu progresso e ranking

---

## 📱 PWA (Progressive Web App)

O app pode ser instalado como app nativo:
- **iOS**: Safari → Compartilhar → "Adicionar à Tela de Início"
- **Android**: Chrome → Menu → "Instalar aplicativo"

---

## 🧪 Testes

```bash
npm run test          # Vitest (unit)
npm run test:watch    # Watch mode
```

---

## 🏗️ Build para produção

```bash
npm run build
npm run preview       # Preview local do build
```

---

## 📄 Licença

MIT © 2026 FitApp
