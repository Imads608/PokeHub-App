// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    POKEHUB_API_URL: string;
    NEXT_PUBLIC_POKEHUB_API_URL: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    AZURE_STORAGE_ACCOUNT_NAME: string;
    AZURE_STORAGE_ACCOUNT_KEY: string;
    // Add other environment variables here
  }
}
