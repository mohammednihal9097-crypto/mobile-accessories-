// Draws the payment receipt PDF that is attached to the customer's payment email.
// Pure (no server imports) so it is easy to test. Uses the built-in Helvetica font, so text is limited to Latin
// characters and "Rs." stands in for the rupee sign; anything else is replaced by "?".
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ReceiptData = {
  storeName: string;
  storeAddress: string;
  storeEmail: string;
  storePhone: string;
  storeWebsite: string;
  /** Shown only when set. */
  gstin?: string;
  orderNumber: string;
  paidAt: Date;
  customerName: string;
  customerEmail: string;
  address: string;
  items: { name: string; quantity: number; unitMinor: number }[];
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  paymentRef: string;
};

const clean = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

function money(minor: number, currency: string): string {
  const n = (minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency === "INR" ? "Rs." : currency} ${n}`;
}

/** Shortens text with "..." until it fits the width. */
function fit(text: string, font: PDFFont, size: number, width: number): string {
  let t = clean(text);
  if (font.widthOfTextAtSize(t, size) <= width) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > width) t = t.slice(0, -1);
  return `${t}...`;
}

export async function buildReceiptPdf(d: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.12, 0.16);
  const grey = rgb(0.4, 0.43, 0.48);
  const line = rgb(0.85, 0.87, 0.9);
  const green = rgb(0.09, 0.55, 0.3);
  const W = 595, H = 842, M = 50, R = W - M;

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const text = (t: string, x: number, size = 10, font = regular, color = ink) =>
    page.drawText(clean(t), { x, y, size, font, color });
  const right = (t: string, xr: number, size = 10, font = regular, color = ink) =>
    page.drawText(clean(t), { x: xr - font.widthOfTextAtSize(clean(t), size), y, size, font, color });
  const rule = () => page.drawLine({ start: { x: M, y }, end: { x: R, y }, thickness: 0.7, color: line });

  // Header: logo, company details, receipt title
  const purple = rgb(0.404, 0.239, 0.902);
  const rr = (x: number, y0: number, w: number, h: number, r: number) =>
    `M${x + r},${y0} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y0 + r} V${y0 + h - r} A${r},${r} 0 0 1 ${x + w - r},${y0 + h} H${x + r} A${r},${r} 0 0 1 ${x},${y0 + h - r} V${y0 + r} A${r},${r} 0 0 1 ${x + r},${y0} Z`;
  const mark = (path: string, color: ReturnType<typeof rgb>) =>
    page.drawSvgPath(path, { x: M, y: H - M + 2, scale: 0.8, color, borderWidth: 0 });
  mark(rr(0, 0, 64, 64, 16), purple);
  mark(rr(12, 15, 18, 10, 3), rgb(1, 1, 1));
  mark(rr(34, 15, 18, 10, 3), rgb(1, 1, 1));
  mark(rr(25, 29, 14, 22, 3), rgb(1, 1, 1));
  const tx = M + 62;
  y -= 14;
  text(d.storeName, tx, 20, bold);
  right("PAYMENT RECEIPT", R, 14, bold);
  y -= 15;
  text(d.storeAddress, tx, 9, regular, grey);
  right("PAID", R, 11, bold, green);
  y -= 12;
  text(`${d.storeEmail}   |   ${d.storePhone}`, tx, 9, regular, grey);
  y -= 12;
  text(d.storeWebsite, tx, 9, regular, grey);
  if (d.gstin) {
    y -= 12;
    text(`GSTIN: ${d.gstin}`, tx, 9, regular, grey);
  }
  y -= 16;
  rule();
  y -= 22;

  // Order and customer
  const col2 = 330;
  text("Order number", M, 8, regular, grey);
  text("Billed to", col2, 8, regular, grey);
  y -= 13;
  text(d.orderNumber, M, 11, bold);
  text(d.customerName, col2, 11, bold);
  y -= 15;
  text(`Paid on ${d.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}`, M, 9, regular, grey);
  text(fit(d.customerEmail, regular, 9, R - col2), col2, 9, regular, grey);
  y -= 13;
  text(`Payment reference: ${fit(d.paymentRef, regular, 9, 200)}`, M, 9, regular, grey);
  text(fit(d.address, regular, 9, R - col2), col2, 9, regular, grey);
  y -= 28;

  // Items table
  const qtyX = 360, unitR = 470, totalR = R;
  const header = () => {
    text("Item", M, 9, bold, grey);
    text("Qty", qtyX, 9, bold, grey);
    right("Price", unitR, 9, bold, grey);
    right("Amount", totalR, 9, bold, grey);
    y -= 8;
    rule();
    y -= 16;
  };
  header();
  for (const it of d.items) {
    if (y < 150) {
      page = pdf.addPage([W, H]);
      y = H - M;
      header();
    }
    text(fit(it.name, regular, 10, qtyX - M - 10), M, 10);
    text(String(it.quantity), qtyX, 10);
    right(money(it.unitMinor, d.currency), unitR, 10);
    right(money(it.unitMinor * it.quantity, d.currency), totalR, 10);
    y -= 18;
  }
  y += 6;
  rule();
  y -= 20;

  // Totals
  const lab = 380;
  text("Subtotal", lab, 10, regular, grey);
  right(money(d.subtotalMinor, d.currency), totalR, 10);
  y -= 16;
  text("Delivery", lab, 10, regular, grey);
  right(d.shippingMinor > 0 ? money(d.shippingMinor, d.currency) : "Free", totalR, 10);
  y -= 8;
  page.drawLine({ start: { x: lab, y }, end: { x: R, y }, thickness: 0.7, color: line });
  y -= 18;
  text("Amount paid", lab, 12, bold);
  right(money(d.totalMinor, d.currency), totalR, 12, bold);
  y -= 50;

  // Thanks
  text("Thank you for your purchase!", M, 12, bold);
  y -= 16;
  text(`Questions about your order? Write to ${d.storeEmail}.`, M, 9, regular, grey);
  y -= 12;
  text("This is a computer-generated receipt and needs no signature.", M, 9, regular, grey);

  return pdf.save();
}
