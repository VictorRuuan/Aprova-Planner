# Aprova Planner

![Aprova Planner](public/aprova-planner-logo.png)

Aplicacao para organizar estudos para concursos, com login, cadastro de concursos, materias, cronograma, sessoes de estudo e relatorios.

## Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase

## Como rodar

```bash
npm install
npm.cmd run dev
```

## Variaveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

## Banco de dados

O app usa as tabelas:

- `exams`
- `subjects`
- `study_sessions`
- `schedule_items`

Para criar a tabela do cronograma, execute no Supabase o SQL em:

```text
database/schedule_items.sql
```

## Comandos úteis

```bash
npm.cmd run lint
npm.cmd run build
```
