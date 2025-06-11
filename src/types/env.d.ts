namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string;

    // Auth
    JWT_SECRET: string;

    // API
    NEXT_PUBLIC_API_URL: string;

    // Cloudflare R2
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    CLOUDFLARE_R2_ENDPOINT: string;
    CLOUDFLARE_R2_BUCKET_NAME: string;
    CLOUDFLARE_R2_PUBLIC_URL: string;
  }
}
