import type { Category, PhoneModel, Product } from "./types";

// ⚠️ SAMPLE DATA ONLY — 7 realistic gadget items with images for testing and model run showcase.
// When Supabase is connected with real database tables, getCatalog() serves live database records.

export const categories: Category[] = [
  { slug: "cases", name: "Cases & Covers", description: "Protective cases for everyday use.", icon: "📱" },
  { slug: "chargers", name: "Chargers & Cables", description: "Wall chargers, cables and power banks.", icon: "🔌" },
  { slug: "audio", name: "Earphones & Audio", description: "Wired and wireless earphones.", icon: "🎧" },
  { slug: "protection", name: "Screen Protectors", description: "Tempered glass and film protectors.", icon: "🛡️" },
  { slug: "stands", name: "Stands & Holders", description: "Desk stands and car holders.", icon: "📐" },
];

export const phoneModels: PhoneModel[] = [
  { id: "sample-a1", brand: "Apple", name: "iPhone 16 Pro / 15 Pro" },
  { id: "sample-a2", brand: "Apple", name: "iPhone 16 / 15" },
  { id: "sample-b1", brand: "Samsung", name: "Galaxy S24 Ultra / S23" },
  { id: "sample-b2", brand: "OnePlus", name: "OnePlus 12 / 12R" },
];

export const products: Product[] = [
  {
    id: "sample-1",
    slug: "magsafe-clear-armor-case",
    name: "MagSafe Clear Armor Case",
    description: "Shockproof hybrid case with crystal-clear non-yellowing acrylic back, raised camera bezel, and built-in N52 magnetic ring for fast 15W wireless charging.",
    categorySlug: "cases",
    price: 49900,
    stock: 24,
    compatibleModelIds: ["sample-a1", "sample-a2"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80",
        alt: "MagSafe Clear Armor Case",
      },
    ],
    imageTint: "#dbeafe",
  },
  {
    id: "sample-2",
    slug: "heavy-duty-rugged-bumper-case",
    name: "Heavy-Duty Rugged Bumper Case",
    description: "Military-grade dual-layer drop protection with carbon fiber texture, tactile button covers, and reinforced impact-absorbing corner airbags.",
    categorySlug: "cases",
    price: 69900,
    stock: 15,
    compatibleModelIds: ["sample-b1", "sample-b2"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
        alt: "Heavy-Duty Rugged Bumper Case",
      },
    ],
    imageTint: "#e2e8f0",
  },
  {
    id: "sample-3",
    slug: "gan-65w-dual-port-fast-charger",
    name: "65W GaN Dual-Port Fast Charger",
    description: "Next-gen Gallium Nitride (GaN) fast wall charger with Type-C Power Delivery and USB-A QC 3.0. Powers phones, tablets, and laptops at peak speed.",
    categorySlug: "chargers",
    price: 129900,
    stock: 40,
    compatibleModelIds: [],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        alt: "65W GaN Dual-Port Fast Charger",
      },
    ],
    imageTint: "#fef3c7",
  },
  {
    id: "sample-4",
    slug: "braided-100w-usbc-cable",
    name: "Braided 100W USB-C Cable (1.5m)",
    description: "Tangle-free high-density nylon braided cable with integrated E-Marker chip supporting 100W Power Delivery (5A) and 480Mbps high-speed sync.",
    categorySlug: "chargers",
    price: 34900,
    stock: 50,
    compatibleModelIds: [],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80",
        alt: "Braided 100W USB-C Cable",
      },
    ],
    imageTint: "#fee2e2",
  },
  {
    id: "sample-5",
    slug: "pro-anc-true-wireless-earbuds",
    name: "Pro ANC True Wireless Earbuds",
    description: "Premium Bluetooth 5.3 earbuds featuring 35dB Active Noise Cancellation, environmental noise cancellation for HD calls, and 32-hour playback case.",
    categorySlug: "audio",
    price: 219900,
    stock: 18,
    compatibleModelIds: [],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
        alt: "Pro ANC True Wireless Earbuds",
      },
    ],
    imageTint: "#ede9fe",
  },
  {
    id: "sample-6",
    slug: "privacy-tempered-glass-protector",
    name: "9H Privacy Tempered Glass Protector",
    description: "28° anti-peep micro-louver technology keeps your screen invisible to side onlookers. 9H surface hardness with oleophobic coating against smudges.",
    categorySlug: "protection",
    price: 29900,
    stock: 60,
    compatibleModelIds: ["sample-a1", "sample-a2", "sample-b1"],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80",
        alt: "9H Privacy Tempered Glass Protector",
      },
    ],
    imageTint: "#dcfce7",
  },
  {
    id: "sample-7",
    slug: "magsafe-rotating-car-mount",
    name: "MagSafe 360° Rotating Car Mount",
    description: "Ultra-secure air-vent magnetic mount featuring 16 high-grade neodymium magnets, 360-degree rotation ball joint, and anti-slip silicone padding.",
    categorySlug: "stands",
    price: 79900,
    stock: 22,
    compatibleModelIds: [],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80",
        alt: "MagSafe 360° Rotating Car Mount",
      },
    ],
    imageTint: "#ffedd5",
  },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const productsInCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
export const getPhoneModel = (id: string) => phoneModels.find((m) => m.id === id);
