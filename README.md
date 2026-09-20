# 📊 FinanceTracker Web

**English** · [Español](README.es.md)

![CI](https://img.shields.io/github/actions/workflow/status/antonicr1986/financetracker-web/ci.yml?branch=main&style=for-the-badge&label=CI%2FCD&logo=githubactions&logoColor=white)
[![Demo](https://img.shields.io/badge/demo-online-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://financetracker-web-tau.vercel.app/login)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

Web client for [FinanceTracker](https://github.com/antonicr1986/FinanceTracker),
a personal finance REST API built with .NET 8.

**[View the live application](https://financetracker-web-tau.vercel.app/login)** — one click gets you in with
the demo account.

## 🚧 Status

Running end to end against the real API: sign-up and JWT sign-in, data from
Azure SQL and a dashboard computed from it.

There is a **public demo account**. The button on the sign-in screen uses it and
loads data seeded by the backend, so the app can be explored without
registering.

When no API is configured the interface falls back to sample data rather than
breaking, which keeps it runnable without a backend.

Still missing: transactions can be created, but not yet edited or deleted.

## ✨ What it does

- **Sign-up and sign-in** with JWT. Registering seeds a starting set of
  categories, so the first transaction can be recorded without any setup.
- **Monthly dashboard** with totals, a trend across the year, a breakdown by
  category and a transaction table. Every block collapses and, once collapsed,
  sums itself up in a single line.
- **Creating transactions** in a dialog, with categories filtered by type: the
  API rejects an expense filed under an income category, so it is never offered.
- **Filters** by description, type and category, resolved on the client over the
  data already loaded.
- **Spanish and English**, switchable from the header. Not just the wording:
  dates, amounts and month names follow the language too.
- **Light and dark themes**, with no flash on load.

## 🖼️ Preview

Dashboard, light and dark:

![Dashboard in light mode](screenshots/dashboard-light.png)
![Dashboard in dark mode](screenshots/dashboard-dark.png)

Sign in:

![Sign in screen](screenshots/login.png)

## 🧰 Stack

- **Next.js 16** with the App Router
- **TypeScript**
- **Tailwind CSS 4**
- Deployed on **Vercel**, with automatic deployments on every push to `main`

No charting or component libraries. The category breakdown is plain CSS:
pulling in a dependency for five horizontal bars is not worth the weight.

## ⚙️ Running locally

Requires Node 20 or later.

    npm install
    npm run dev

The app runs at http://localhost:3000.

Other commands:

    npm run build    # production build
    npm run lint     # static analysis with ESLint

## 📁 Project structure

    src/
      app/          Routes and pages (App Router)
      components/   Header, chart, dialogs and reusable pieces
      lib/
        api/        HTTP client, session and demo mode
        i18n/       Dictionaries, active language and per-language formats
        derive.ts   Totals, series and groupings built from the transactions
        types.ts    Types mirroring the API DTOs
        mock.ts     Sample data used when no API is configured

## 🌍 Languages

The copy lives in `src/lib/i18n/messages.ts`, in two flat dictionaries. The
English one is typed as `Record<MessageKey, string>`, so **adding a key without
translating it breaks the build** — the cheap way to keep both versions from
drifting apart.

The language is stored in the browser and, when nothing is stored, inferred from
the browser itself. Amounts and dates are formatted with `Intl` for the active
language, so Spanish reads `1.234,56 €` and English `€1,234.56`.

Error messages do not travel as sentences: the API returns a code
(`email_already_exists`, `category_type_mismatch`...) and the frontend decides
what is read, and in which language.

## 🔌 Connecting to the API

The API URL is resolved in this order: whatever the user saved on the Settings
screen and, failing that, the `NEXT_PUBLIC_API_URL` environment variable. If
neither is set, sample data is used.

`NEXT_PUBLIC_*` is inlined at build time rather than read at startup: changing
it on Vercel requires a redeploy to take effect.

## 🔄 Automation

- **CI** on every push and pull request: installs dependencies, runs the
  linter and builds for production, so a type or build error is caught before
  it reaches production.
- **Secret scanning** with gitleaks across the full history.
- **Protected `main` branch** against force pushes and deletion.
- **Deployment from the pipeline**: production deploys run as a final job that
  only starts once secret scanning and the build are green. Vercel's own Git
  deployments are switched off, so nothing reaches production without clearing
  the checks first.

Wiring the deploy into the pipeline costs something: pull requests no longer
get automatic preview URLs from Vercel. That was worth trading. Before, the two
systems listened to the same push independently and Vercel usually finished
first, so a red pipeline did not stop a release - the checks were reporting on
code that was already live.

## 🗺️ Roadmap

- Editing and deleting transactions
- Creating categories from the new-transaction form
- Budgets

## ✍️ Author

Antonio Company - [GitHub](https://github.com/antonicr1986) ·
[LinkedIn](https://www.linkedin.com/in/antoniocompany/)
