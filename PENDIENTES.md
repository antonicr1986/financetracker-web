# Pendientes

Mejoras identificadas que quedan para más adelante. Al terminar una, se marca
con `[x]` y se anota la fecha o el commit.

## DAST (OWASP ZAP)

- [ ] Revisar el primer `zap-report` (artefacto del job `dast`).
- [ ] **Cabeceras de seguridad** en `next.config.ts` (`headers()`): `X-Content-Type-Options`,
  `X-Frame-Options` / `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` y una
  `Content-Security-Policy` (probarla primero con `Content-Security-Policy-Report-Only`
  para no romper la web). HSTS ya lo pone Vercel.
- [ ] Pasar `fail_action` a `true` cuando el informe salga limpio (falsos positivos en `.zap/rules.tsv`).

## Despliegue

- [ ] Fijar la versión del CLI de Vercel en el job `deploy` (ahora `vercel@latest`).
- [ ] Required reviewers en el environment `production`.

## Repositorio y pipeline

- [ ] **SAST con CodeQL** (Settings → Code security → CodeQL, Default setup).
- [ ] Dependabot alerts + security updates, y secret scanning con push protection.
- [ ] Branch protection en `main` (PR obligatoria, checks en verde, sin force push).
- [ ] Fijar las actions por SHA y añadir `.github/dependabot.yml` con `github-actions`.
- [ ] Verificar el checksum de gitleaks al descargarlo.
- [ ] `SECURITY.md` con cómo reportar vulnerabilidades.
- [ ] `azure-pipelines.yml`: añadir el mismo análisis de dependencias que en GitHub Actions y `timeoutInMinutes`.

## Hecho

- [x] `permissions` globales de solo lectura, `timeout-minutes`, `concurrency` en `deploy` y job `dast` con ZAP.
