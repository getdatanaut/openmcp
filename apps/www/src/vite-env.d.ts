/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROXY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
