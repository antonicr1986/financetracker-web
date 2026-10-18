# Pendientes

Mejoras identificadas que quedan para más adelante. Al terminar una, se marca
con `[x]` y se anota la fecha o el commit.

## DAST (OWASP ZAP)

- [x] Revisar el primer `zap-report` (octubre de 2026): 0 High, 3 Medium, 4 Low.
- [x] **Cabeceras de seguridad** en `next.config.ts`: CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`. Probada en un navegador
  sin violaciones de CSP en ninguna página.
  - Riesgos aceptados: `Access-Control-Allow-Origin: *` (lo pone Vercel en los estáticos públicos) y
    `Cross-Origin-Embedder-Policy` (`require-corp` puede romper recursos y aporta poco aquí).
    Documentarlos en `.zap/rules.tsv` al pasar `fail_action` a `true`.
- [ ] Endurecer la CSP con un nonce por petición (middleware) para quitar `'unsafe-inline'` de `script-src`.
- [x] `fail_action: true` con los riesgos aceptados documentados como INFO en `.zap/rules.tsv`.

## Despliegue

- [ ] Fijar la versión del CLI de Vercel en el job `deploy` (ahora `vercel@latest`).
- [ ] Required reviewers en el environment `production`.

## Repositorio y pipeline

- [x] **SAST con CodeQL** (Settings → Code security → CodeQL, Default setup).
- [x] Dependabot alerts + security updates, y secret scanning con push protection.
- [x] Ruleset `proteger-main`: sin borrado ni force push en `main` (sin PR obligatoria: se trabaja con push directo).
- [ ] Fijar las actions por SHA y añadir `.github/dependabot.yml` con `github-actions`.
- [ ] Verificar el checksum de gitleaks al descargarlo.
- [ ] `SECURITY.md` con cómo reportar vulnerabilidades.
- [ ] `azure-pipelines.yml`: añadir el mismo análisis de dependencias que en GitHub Actions y `timeoutInMinutes`.

## Hecho

- [x] `permissions` globales de solo lectura, `timeout-minutes`, `concurrency` en `deploy` y job `dast` con ZAP.
