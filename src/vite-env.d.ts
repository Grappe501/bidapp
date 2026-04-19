/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTIONS_BASE_URL?: string;
  readonly VITE_DEFAULT_PROJECT_ID?: string;
  /** Must match Netlify `INTERNAL_API_KEY` when `VITE_STRICT_DB_MODE=true`. */
  readonly VITE_INTERNAL_API_KEY?: string;
  /** When true, `VITE_INTERNAL_API_KEY` is required and the UI enforces DB-first config. */
  readonly VITE_STRICT_DB_MODE?: string;
  /** Stakeholder demo: polished AllCare branding and curated navigation. */
  readonly VITE_DEMO_MODE?: string;
  /** Display label for demo shell (e.g. AllCare Pharmacy). */
  readonly VITE_DEMO_CLIENT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
