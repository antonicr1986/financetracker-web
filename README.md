# FinanceTracker Web

**English** · [Español](README.es.md)

Web client for [FinanceTracker](https://github.com/antonicr1986/FinanceTracker),
a personal finance REST API built with .NET 8.

**[View the live application](https://financetracker-web.vercel.app)**

## Status

Work in progress. The dashboard is visually complete but still runs on typed
sample data — it does not consume the real API yet.

That is deliberate. The types in `src/lib/types.ts` mirror the API DTOs, so
wiring up the backend once it is deployed means replacing the data layer
without touching a single component.

## Stack

- **Next.js 16** with the App Router
- **TypeScript**
- **Tailwind CSS 4**
- Deployed on **Vercel**, with automatic deployments on every push to `main`

No charting or component libraries. The category breakdown is plain CSS:
pulling in a dependency for five horizontal bars is not worth the weight.

## Running locally

Requires Node 20 or later.

    npm install
    npm run dev

The app runs at http://localhost:3000.

Other commands:

    npm run build    # production build
    npm run lint     # static analysis with ESLint

## Project structure

    src/
      app/          Routes and pages (App Router)
      lib/
        types.ts    Types mirroring the API DTOs
        mock.ts     Sample data used until the backend is live

## Automation

- **CI** on every push and pull request: installs dependencies, runs the
  linter and builds for production, so a type or build error is caught before
  it reaches production.
- **Secret scanning** with gitleaks across the full history.
- **Protected `main` branch** against force pushes and deletion.
- **Continuous deployment** on Vercel: every push to `main` ships, and every
  pull request gets its own preview URL.

## Roadmap

- JWT authentication against the API
- Real data instead of sample data
- Full CRUD for transactions, categories and budgets

## Author

Antonio Company - [GitHub](https://github.com/antonicr1986) ·
[LinkedIn](https://www.linkedin.com/in/antoniocompany/)
