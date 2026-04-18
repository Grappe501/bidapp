/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTIONS_BASE_URL?: string;
  readonly VITE_DEFAULT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
