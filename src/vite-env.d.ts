/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORMSPREE_ENDPOINT: string;
  readonly VITE_ASSISTANT_ENABLED?: string;
  readonly VITE_ASSISTANT_API_URL?: string;
  readonly VITE_GOATCOUNTER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
