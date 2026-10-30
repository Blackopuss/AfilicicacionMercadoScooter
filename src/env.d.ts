// Variables de entorno de build (ver .env.example). Ambas son públicas por diseño: la seguridad vive en RLS.
interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
}
