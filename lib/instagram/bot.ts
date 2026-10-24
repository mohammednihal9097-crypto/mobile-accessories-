import { formatMoney, STORE } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";

const SITE_URL = process.env.SITE_URL?.replace(/\/$/, "") || "https://triostore-india.vercel.app";

export async function processInstagramMessage(rawText: string): Promise<string> {
  const query = rawText.trim().toLowerCase();
  const supabase = createPublicClient();

  // 1. Order tracking inquiry
  if (query.includes("track") || query.includes("where is my order") || /order\s*#?\d+/i.test(query)) {
    return (
      `📦 Track Your Trio Store Order:\n\n` +
      `You can check live tracking anytime by visiting:\n` +
      `${SITE_URL}/track\n\n` +
      `Just enter your phone number or order number to see courier & delivery updates!`
    );
  }

  // 2. Discounts, coupons, or offers
  if (
    query.includes("coupon") ||
    query.includes("discount") ||
    query.includes("offer") ||
    query.includes("code") ||
    query.includes("promo")
  ) {
    return (
      `🎉 Welcome Instagram Shopper!\n\n` +
      `Use exclusive code: INSTA10 at checkout for 10% OFF on all phone accessories & gadgets!\n\n` +
      `🛍️ Shop now: ${SITE_URL}/instagram\n` +
      `⚡ Free delivery across India on orders over ₹${(STORE.shipping.freeOver / 100).toFixed(0)}!`
    );
  }

  // 3. Specific product inquiries (cases, chargers, covers, cables, screen protectors)
  const productKeywords = ["case", "cover", "charger", "cable", "screen", "protector", "iphone", "samsung", "pixel"];
  const matchesKeyword = productKeywords.some((k) => query.includes(k));

  if (matchesKeyword) {
    try {
      const { data: products } = await supabase
        .from("products")
        .select("name, slug, price_minor")
        .eq("is_active", true)
        .limit(3);

      if (products && products.length > 0) {
        const productList = products
          .map((p) => `• ${p.name} - ${formatMoney(p.price_minor)}\n  ${SITE_URL}/products/${p.slug}`)
          .join("\n\n");

        return (
          `✨ Here are our popular gadgets matching your interest:\n\n` +
          `${productList}\n\n` +
          `👉 Browse our full catalog: ${SITE_URL}/instagram`
        );
      }
    } catch {
      // Fallback if db query fails
    }
  }

  // 4. Greetings or default welcome reply
  return (
    `👋 Hello from Trio Store!\n\n` +
    `Thanks for reaching out to us on Instagram. How can we help you today?\n\n` +
    `• 🛍️ Shop Gadgets: ${SITE_URL}/instagram\n` +
    `• 🏷️ Use code INSTA10 for 10% OFF\n` +
    `• 📦 Track Order: ${SITE_URL}/track\n` +
    `• 💬 WhatsApp Support: https://wa.me/${STORE.legal.whatsappDigits}\n\n` +
    `Reply with "CASE", "CHARGER", or your order number, or ask us any question!`
  );
}
