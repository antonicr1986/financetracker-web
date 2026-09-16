# 📊 FinanceTracker Web

**English** · [Español](README.es.md)

![CI](https://img.shields.io/github/actions/workflow/status/antonicr1986/financetracker-web/ci.yml?branch=main&style=for-the-badge&label=CI%2FCD&logo=githubactions&logoColor=white)
[![Demo](https://img.shields.io/badge/demo-online-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://financetracker-web-tau.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

Web client for [FinanceTracker](https://github.com/antonicr1986/FinanceTracker),
a personal finance REST API built with .NET 8.

**[View the live application](https://financetracker-web-tau.vercel.app)**

## 🚧 Status

Running end to end against the real API: JWT sign-in, data from Azure SQL and a
dashboard computed from it.

There is a **public demo account**. The button on the sign-in screen uses it and
loads data seeded by the backend, so the app can be explored without
registering.

When no API is configured the interface falls back to sample data rather than
breaking, which keeps it runnable without a backend.

Still missing: the app only reads. Creating, editing and deleting transactions
cannot be done from the interface yet.

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
      components/   Header, chart and reusable pieces
      lib/
        api/        HTTP client, session and demo mode
        types.ts    Types mirroring the API DTOs
        mock.ts     Sample data used when no API is configured

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

- Full CRUD for transactions, categories and budgets
- Read-only demo account
- Transaction filters and search

## ✍️ Author

Antonio Company - [GitHub](https://github.com/antonicr1986) ·
[LinkedIn](https://www.linkedin.com/in/antoniocompany/)
