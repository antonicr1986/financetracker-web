# 📊 FinanceTracker Web

**English** · [Español](README.es.md)

![CI](https://img.shields.io/github/actions/workflow/status/antonicr1986/financetracker-web/ci.yml?branch=main&style=for-the-badge&label=CI%2FCD&logo=githubactions&logoColor=white)
[![Demo](https://img.shields.io/badge/demo-online-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://financetracker-web.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

Web client for [FinanceTracker](https://github.com/antonicr1986/FinanceTracker),
a personal finance REST API built with .NET 8.

**[View the live application](https://financetracker-web.vercel.app)**

## 🚧 Status

Work in progress. The dashboard is visually complete but still runs on typed
sample data — it does not consume the real API yet.

That is deliberate. The types in `src/lib/types.ts` mirror the API DTOs, so
wiring up the backend once it is deployed means replacing the data layer
without touching a single component.

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
      lib/
        types.ts    Types mirroring the API DTOs
        mock.ts     Sample data used until the backend is live

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

- JWT authentication against the API
- Real data instead of sample data
- Full CRUD for transactions, categories and budgets

## ✍️ Author

Antonio Company - [GitHub](https://github.com/antonicr1986) ·
[LinkedIn](https://www.linkedin.com/in/antoniocompany/)
