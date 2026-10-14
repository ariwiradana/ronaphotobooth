# Security checklist

- Use a unique random `SESSION_SECRET` of 32+ characters.
- Keep `.env.local` out of source control.
- Use HTTPS for any remote deployment.
- Keep partner passwords private and unique.
- Login middleware protects routes, but the current operational UI still persists its records in localStorage. Do not deploy as the production financial source of truth until CRUD is backed by PostgreSQL and server-side authorization/validation is added to every mutation.
