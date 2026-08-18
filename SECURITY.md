# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report privately via GitHub's
[security advisories](https://github.com/lolimmlost/app-map-appahouse/security/advisories/new).
We'll acknowledge receipt and work with you on a fix and disclosure timeline.

## Scope & notes

- **Authentication:** protected routes require a valid session but do **not** enforce
  roles — any account the configured provider authenticates can use the app. When
  using Authentik SSO, restrict access with an Authentik Application → group binding.
- **Secrets:** never commit `.env`, tokens, or client secrets. `.env` is gitignored;
  only `.env.example` (placeholders) is tracked.
- **Supported versions:** the latest release on `main` receives security fixes.
