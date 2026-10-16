export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: string; // emoji placeholder until real category art exists
};

export type PhoneModel = {
  id: string;
  brand: string;
  name: string;
};

export type ProductPhoto = {
  /** Image URL. Real photos come from Supabase Storage in Stage 3. */
  url: string;
  alt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  price: number; // smallest currency unit
  stock: number;
  /** Phone models this fits. Empty array = universal (not tied to a phone). */
  compatibleModelIds: string[];
  /** Empty array = show a placeholder tile. */
  photos: ProductPhoto[];
  /** Placeholder tile colour used while a product has no photos. */
  imageTint: string;
};

export type CartLine = { productId: string; quantity: number };
