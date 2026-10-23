/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend REST API, e.g. https://api.example.com/api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
