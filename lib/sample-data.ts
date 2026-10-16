import type { Category, PhoneModel, Product } from "./types";

// ⚠️ SAMPLE DATA ONLY — every name, price, stock level and compatibility entry
// below is made up for layout testing. It is replaced by database records in Stage 3.
// Phone models are deliberately fake ("Sample Phone ...") so nothing can be mistaken for real fit data.

export const categories: Category[] = [
  { slug: "cases", name: "Cases & Covers", description: "Protective cases for everyday use.", icon: "📱" },
  { slug: "chargers", name: "Chargers & Cables", description: "Wall chargers, cables and power banks.", icon: "🔌" },
  { slug: "audio", name: "Earphones & Audio", description: "Wired and wireless earphones.", icon: "🎧" },
  { slug: "protection", name: "Screen Protectors", description: "Tempered glass and film protectors.", icon: "🛡️" },
  { slug: "stands", name: "Stands & Holders", description: "Desk stands and car holders.", icon: "📐" },
];

export const phoneModels: PhoneModel[] = [
  { id: "sample-a1", brand: "Sample Brand A", name: "Sample Phone A1" },
  { id: "sample-a2", brand: "Sample Brand A", name: "Sample Phone A2" },
  { id: "sample-b1", brand: "Sample Brand B", name: "Sample Phone B1" },
  { id: "sample-b2", brand: "Sample Brand B", name: "Sample Phone B2" },
];

export const products: Product[] = [
  {
    id: "sample-1", slug: "sample-clear-case", name: "Sample Clear Case",
    description: "Sample product. A transparent case with raised edges.",
    categorySlug: "cases", price: 39900, stock: 24,
    compatibleModelIds: ["sample-a1", "sample-a2"], photos: [], imageTint: "#dbeafe",
  },
  {
    id: "sample-2", slug: "sample-rugged-case", name: "Sample Rugged Case",
    description: "Sample product. A thick shock-absorbing case.",
    categorySlug: "cases", price: 59900, stock: 3,
    compatibleModelIds: ["sample-b1"], photos: [], imageTint: "#e2e8f0",
  },
  {
    id: "sample-3", slug: "sample-fast-charger", name: "Sample 20W Fast Charger",
    description: "Sample product. USB-C wall charger.",
    categorySlug: "chargers", price: 79900, stock: 40,
    compatibleModelIds: [], photos: [], imageTint: "#fef3c7",
  },
  {
    id: "sample-4", slug: "sample-usb-c-cable", name: "Sample USB-C Cable (1m)",
    description: "Sample product. Braided charging and data cable.",
    categorySlug: "chargers", price: 29900, stock: 0,
    compatibleModelIds: [], photos: [], imageTint: "#fee2e2",
  },
  {
    id: "sample-5", slug: "sample-wireless-earbuds", name: "Sample Wireless Earbuds",
    description: "Sample product. Bluetooth earbuds with charging case.",
    categorySlug: "audio", price: 149900, stock: 12,
    compatibleModelIds: [], photos: [], imageTint: "#ede9fe",
  },
  {
    id: "sample-6", slug: "sample-glass-protector", name: "Sample Tempered Glass",
    description: "Sample product. 9H tempered glass screen protector.",
    categorySlug: "protection", price: 24900, stock: 60,
    compatibleModelIds: ["sample-a1", "sample-b1"], photos: [], imageTint: "#dcfce7",
  },
  {
    id: "sample-7", slug: "sample-car-holder", name: "Sample Car Phone Holder",
    description: "Sample product. Dashboard-mount holder.",
    categorySlug: "stands", price: 44900, stock: 8,
    compatibleModelIds: [], photos: [], imageTint: "#ffedd5",
  },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const productsInCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
export const getPhoneModel = (id: string) => phoneModels.find((m) => m.id === id);
