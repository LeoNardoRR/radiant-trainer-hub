# Feature-Sliced Design (FSD) no Radiant Trainer Hub

À medida que o MVP escala para um SaaS, estamos migrando gradualmente nossa arquitetura para o **Feature-Sliced Design**.

## Como funciona?

A pasta `src/features/` conterá módulos de negócios isolados. Em vez de agrupar por *tipo técnico* (hooks/, components/, pages/), agrupamos por *domínio de negócio*.

### Estrutura de uma Feature
Cada pasta dentro de `features/` (ex: `auth`, `workouts`, `billing`) deve seguir a estrutura:

```
src/features/<feature-name>/
├── api/        # Requisições Supabase / Edge Functions
├── model/      # Hooks de estado global, interfaces, stores
├── ui/         # Componentes React visuais estritos a esta feature
└── index.ts    # Public API (apenas o que está exportado aqui pode ser usado fora)
```

### Regras de Ouro
1. **Unidirecional:** Uma feature não pode importar arquivos internos de outra feature diretamente. Use sempre a Public API (`index.ts`).
2. **Gradual:** Não mova todas as pastas de `src/components` agora. Ao criar algo novo, faça dentro de `features/`. Componentes legados devem ser refatorados sob demanda.

### Próximo passo de refatoração
A migração começará pela feature de **Autenticação** (`src/features/auth`) e **Gamificação** (`src/features/gamification`).
