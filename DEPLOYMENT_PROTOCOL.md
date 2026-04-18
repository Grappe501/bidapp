# Deployment protocol

**Host:** Netlify (per product plan)

## Build settings (placeholder)

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Publish directory | `dist` |

## Branch / context

- Deploy on milestone readiness (see `BUILD_BLUEPRINT.md`), not ad hoc pushes.
- Pair each deploy with a short release note, known limitations, and next priority.

## Environment

Configure production environment variables in the Netlify UI when backend and AI services are wired. Document any required variables in `ENVIRONMENT_SETUP.md` and keep secrets out of the repository.
