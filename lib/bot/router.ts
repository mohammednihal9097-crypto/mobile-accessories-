// WhatsApp chat logic. A plain function with no database or network code inside, so it can be tested
// with fake data (see router.test.ts). Every number, stock level, price and compatibility fact in a reply
// comes from `deps` (the database). Nothing is invented. If we are unsure we ask a question or hand over to a person.

export type BotCatalog = {
  categories: { slug: string; name: string }[];
  phones: { id: string; brand: string; name: string }[];
  products: {
    id: string; slug: string; name: string; categorySlug: string;
    price: number; stock: number; compatibleModelIds: string[];
  }[];
};

export type BotOrder = {
  orderNumber: string;
  status: string;
  totalMinor: number;
  items: { name: string; quantity: number }[];
};

export type BotDeps = {
  catalog: BotCatalog;
  storeName: string;
  siteUrl: string;
  formatMoney: (minor: number) => string;
  statusLabel: Record<string, string>;
  /** Orders placed from THIS WhatsApp number only. Optionally narrowed to one order number. */
  findOrders: (whatsapp: string, orderNumber?: string) => Promise<BotOrder[]>;
  makeCheckoutLink: (whatsapp: string) => string;
};

export type BotInput = { whatsapp: string; name?: string; text: string };
export type BotResult = { intent: string; reply: string; handoff?: { reason: string } };

const MAX_PRODUCTS = 5;

function norm(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}
function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(` ${w} `));
}
function stem(w: string): string {
  return w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
}

export function menu(deps: BotDeps, name?: string): string {
  return [
    `Hi${name ? ` ${name}` : ""}! Welcome to ${deps.storeName}. Reply with a number:`,
    "1  Browse categories",
    "2  Check what fits my phone",
    "3  Order status",
    "4  Get a checkout link",
    "5  Talk to a person",
  ].join("\n");
}

function stockLabel(stock: number): string {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return `Only ${stock} left`;
  return "In stock";
}

export async function handleMessage(input: BotInput, deps: BotDeps): Promise<BotResult> {
  const raw = input.text.trim();
  const t = norm(raw);
  const { catalog } = deps;

  if (!raw) return { intent: "greeting", reply: menu(deps, input.name) };

  // 1. Order number typed => order status
  const orderMatch = /ord[-\s]?(\d{3,12})/i.exec(raw);
  if (orderMatch) return orderStatus(input, deps, `ORD-${orderMatch[1]}`);

  // 2. Menu numbers and clear keywords
  if (t.trim() === "5" || has(t, ["human", "agent", "person", "representative", "someone", "complaint", "refund", "return", "replacement"])) {
    return {
      intent: "handoff",
      reply: "I've asked our team to take over. Someone will reply here as soon as they can.",
      handoff: { reason: "customer asked for a person" },
    };
  }
  if (t.trim() === "3" || has(t, ["track", "status"]) || t.includes(" my order") || t.includes(" where is my order")) {
    return orderStatus(input, deps);
  }
  if (t.trim() === "4" || has(t, ["checkout", "buy", "purchase", "pay", "link"]) || t.includes(" place order") || t.includes(" order now")) {
    return {
      intent: "checkout_link",
      reply: `Here is your secure checkout link, made for this chat. It expires in 24 hours:\n${deps.makeCheckoutLink(input.whatsapp)}`,
    };
  }
  if (t.trim() === "1" || has(t, ["categories", "category", "catalog", "catalogue", "products", "shop", "browse"]) || t.includes(" what do you sell")) {
    if (catalog.categories.length === 0) return { intent: "categories", reply: "Our catalogue is being set up. Please check back soon, or reply 5 to talk to a person." };
    return {
      intent: "categories",
      reply: ["We sell:", ...catalog.categories.map((c) => `• ${c.name}`), "", "Reply with a category name, or tell me your phone model and what you need (for example: case for <your phone>)."].join("\n"),
    };
  }
  if (t.trim() === "2") {
    const example = catalog.phones[0]?.name;
    return {
      intent: "ask_phone",
      reply: `Tell me your exact phone model${example ? ` (for example: ${example})` : ""} and what you are looking for, like a case or charger.`,
    };
  }
  if (has(t, ["thanks", "thank", "thx", "ok", "okay"]) && t.trim().split(" ").length <= 3) {
    return { intent: "thanks", reply: "You're welcome! Reply *menu* any time to see what I can do." };
  }
  if (has(t, ["hi", "hello", "hey", "hii", "namaste", "menu", "start", "help"]) && t.trim().split(" ").length <= 3) {
    return { intent: "greeting", reply: menu(deps, input.name) };
  }

  // 3. Product questions: phone model + category/keyword, all matched against real records
  const phone = [...catalog.phones]
    .sort((a, b) => b.name.length - a.name.length)
    .find((p) => t.includes(norm(p.name)));
  const category = catalog.categories.find((c) => {
    const words = norm(c.name).trim().split(" ").filter((w) => w.length > 2 && w !== "and");
    return t.includes(norm(c.slug)) || words.some((w) => t.split(" ").map(stem).includes(stem(w)));
  });
  const stop = new Set(["for", "the", "and", "with", "have", "you", "any", "does", "this", "that", "fit", "fits", "need", "want", "looking", "show", "price", "cost", "stock", "available", "compatible", "work", "works"]);
  const keywords = t.trim().split(" ").filter((w) => w.length > 2 && !stop.has(w));
  const nameHit = (name: string) => keywords.some((k) => norm(name).split(" ").map(stem).includes(stem(k)));

  let matches = catalog.products;
  if (category) matches = matches.filter((p) => p.categorySlug === category.slug);
  else matches = matches.filter((p) => nameHit(p.name));

  if (matches.length === 0 && !phone) {
    if (has(t, ["fit", "fits", "compatible", "work", "works"])) {
      return { intent: "ask_phone", reply: "Which phone model do you have? Please send the exact model name." };
    }
    return {
      intent: "handoff",
      reply: "I'm not sure about that one, so I've asked our team to help. Someone will reply here soon.",
      handoff: { reason: "message not understood" },
    };
  }

  if (phone) {
    const fitting = matches.filter((p) => p.compatibleModelIds.length === 0 || p.compatibleModelIds.includes(phone.id));
    if (fitting.length === 0) {
      return {
        intent: "product_fit",
        reply: `I don't have any listed ${category ? category.name.toLowerCase() : "product"} for ${phone.name}. Reply 5 if you'd like our team to check for you.`,
      };
    }
    return { intent: "product_fit", reply: productList(fitting, deps, `For your ${phone.name}:`, phone.name) };
  }

  const needsPhone = matches.some((p) => p.compatibleModelIds.length > 0);
  const tail = needsPhone ? "\n\nSome of these only fit certain phones. Tell me your phone model and I'll check which ones fit." : "";
  return { intent: "product_list", reply: productList(matches, deps, "Here is what we have:") + tail };
}

function productList(products: BotCatalog["products"], deps: BotDeps, heading: string, phoneName?: string): string {
  const shown = products.slice(0, MAX_PRODUCTS);
  const lines = shown.flatMap((p) => {
    const fit = p.compatibleModelIds.length === 0
      ? "Fits all phones"
      : phoneName ? `Listed as compatible with ${phoneName}` : "Fits specific phones only";
    return [`*${p.name}*: ${deps.formatMoney(p.price)} (${stockLabel(p.stock)})`, fit, `${deps.siteUrl}/products/${p.slug}`, ""];
  });
  const more = products.length > MAX_PRODUCTS ? [`…and ${products.length - MAX_PRODUCTS} more: ${deps.siteUrl}/products`] : [];
  return [heading, "", ...lines, ...more].join("\n").trim();
}

async function orderStatus(input: BotInput, deps: BotDeps, orderNumber?: string): Promise<BotResult> {
  const orders = await deps.findOrders(input.whatsapp, orderNumber);
  if (orders.length === 0) {
    return {
      intent: "order_status",
      reply: orderNumber
        ? `I can't find ${orderNumber} for this WhatsApp number. Please check the number, or reply 5 to talk to a person.`
        : "I can't find any orders for this WhatsApp number. If you ordered with a different number, send me the order number (like ORD-1001) from that number, or reply 5 to talk to a person.",
    };
  }
  const lines = orders.slice(0, 3).map((o) =>
    `*${o.orderNumber}*: ${deps.statusLabel[o.status] ?? o.status}\nTotal ${deps.formatMoney(o.totalMinor)}. ${o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}`,
  );
  return { intent: "order_status", reply: lines.join("\n\n") };
}
