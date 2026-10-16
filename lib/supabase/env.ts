// Reads Supabase settings. Public values only here; the secret key is read in admin.ts.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False until you fill in .env.local. The storefront then falls back to sample data. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl?.startsWith("http") && supabasePublishableKey && !supabasePublishableKey.startsWith("your-"),
  );
}

export function photoPublicUrl(storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/product-images/${storagePath}`;
}
