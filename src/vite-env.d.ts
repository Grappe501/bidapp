/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTIONS_BASE_URL?: string;
  readonly VITE_DEFAULT_PROJECT_ID?: string;
  /** Must match Netlify `INTERNAL_API_KEY` when `VITE_STRICT_DB_MODE=true`. */
  readonly VITE_INTERNAL_API_KEY?: string;
  /** When true, `VITE_INTERNAL_API_KEY` is required and the UI enforces DB-first config. */
  readonly VITE_STRICT_DB_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
