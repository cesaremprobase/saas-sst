# Skill Registry - app-emprobase

## Compact Rules

### SaaS Factory V4
- **Architecture**: Feature-First (`src/features/[feature]/{components,hooks,services,types,store}`).
- **Stack**: Next.js 16, React 19, Supabase, Tailwind CSS, Zod, Zustand.
- **Naming**: camelCase for variables, PascalCase for components, kebab-case for files.
- **Rules**: KISS, YAGNI, DRY. Max 500 lines per file, 50 per function.
- **Testing**: Playwright CLI for QA.

## User Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| add-emails | email, mail, notification | Add email functionality |
| add-login | auth, login, register, oauth | Add Supabase Auth |
| add-mobile | pwa, mobile, responsive | Mobile optimization and PWA |
| add-payments | stripe, payment, checkout | Add payment integration |
| ai | ai, chat, rag, openai, vercel-ai | AI features with Vercel AI SDK |
| playwright-cli | test, qa, screenshot, verify | Automated QA with Playwright |
| supabase | db, sql, table, migration | Supabase database management |
| judgment-day | review, judge, audit | Adversarial code review |

## Project Instructions
- **GEMINI.md**: Core factory rules and agent-first philosophy.
- **CLAUDE.md**: Developer-specific instructions and project context.
