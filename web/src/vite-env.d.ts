/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM_API: string;
  readonly VITE_IDENTITY_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
