/// <reference types="vite/client" />

// Exposed by vite to client code via import.meta.env
// Set in `.env` locally
interface ImportMetaEnv {
  // ... whatever
  readonly VITE_PUBLIC_ZERO_SERVER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
