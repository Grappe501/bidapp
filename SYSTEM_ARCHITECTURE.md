# System architecture

High-level direction for the Bid Assembly Application (subject to refinement as build packets land).

| Layer | Choice |
|--------|--------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Backend | TBD |
| Database | TBD |
| File storage | TBD |
| AI | OpenAI API (bounded workflows per blueprint) |
| Deployment | Netlify |

Separation of concerns:

- **UI** — `src/app`, `src/pages`, `src/components`
- **Shared utilities** — `src/lib`
- **Types** — `src/types`
- **API and integrations** — `src/services` (to be populated in later phases)
