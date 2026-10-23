"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { placeOrder } from "@/app/checkout/actions";
import { useCatalog } from "./CatalogProvider";
import { OrderSummary, useCartDetails } from "./CartView";
import PaymentNotice from "./PaymentNotice";
import { useWaLink } from "@/lib/wa-link";
import { STORE } from "@/lib/config";
import { COUNTRIES, DEFAULT_DIAL } from "@/lib/country-codes";

const box = "rounded-xl border border-slate-300 bg-white px-3 py-2.5";
const field = `w-full ${box}`;

/** One key per page load: pressing "Place order" twice can never create two orders. */
function IdempotencyKey() {
  const [key] = useState(() => crypto.randomUUID());
  return <input type="hidden" name="idempotency_key" value={key} />;
}

export default function CheckoutForm() {
  const { items } = useCartDetails();
  const signedWhatsapp = useWaLink();
  const { isSample } = useCatalog();
  const [busy, setBusy] = useState(false);

  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Your cart is empty.</p>;
  }

  const cart = JSON.stringify(items.map((i) => ({ productId: i.product.id, quantity: i.quantity })));
  const whatsappMessage = [
    `Hi ${STORE.name}, I'd like to ask about this cart:`,
    ...items.map(({ product, quantity }) => `- ${product.name} x ${quantity}`),
  ].join("\n");
  const whatsappHref = /^\d{8,15}$/.test(STORE.legal.whatsappDigits)
    ? `https://wa.me/${STORE.legal.whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  return (
    <form action={placeOrder} onSubmit={() => setBusy(true)} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <input type="hidden" name="cart" value={cart} />
      <IdempotencyKey />
      {signedWhatsapp && (
        <>
          <input type="hidden" name="wa" value={signedWhatsapp.wa} />
          <input type="hidden" name="exp" value={signedWhatsapp.exp} />
          <input type="hidden" name="sig" value={signedWhatsapp.sig} />
        </>
      )}
      {/* Honeypot: invisible to people, bots fill it in */}
      <div className="hidden" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="space-y-4">
        <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <legend className="px-1 font-semibold">Your details</legend>
          <label className="block text-sm">Full name<input name="name" required minLength={2} className={field} autoComplete="name" /></label>
          <label className="block text-sm">
            WhatsApp number
            {signedWhatsapp ? (
              <input name="whatsapp" required type="tel" className={field} autoComplete="tel" defaultValue={signedWhatsapp.wa} readOnly />
            ) : (
              <span className="flex gap-2">
                <select name="country_code" defaultValue={DEFAULT_DIAL} aria-label="Country code" className={`${box} w-24 shrink-0 px-2`}>
                  {COUNTRIES.map((c) => <option key={`${c.name}`} value={c.dial}>{c.dial} {c.name}</option>)}
                </select>
                <input
                  name="whatsapp" required type="tel" inputMode="tel" className={`${box} min-w-0 flex-1`} autoComplete="tel-national"
                  placeholder="98765 43210" pattern="[0-9 ()\-+]{5,20}" title="Your number without the country code"
                />
              </span>
            )}
            <span className="text-xs text-slate-500">Choose your country, then type your number without the code. Used by the courier for delivery.</span>
          </label>
          <label className="block text-sm">Email (for order confirmation, updates and receipt)<input name="email" type="email" required className={field} autoComplete="email" /></label>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <legend className="px-1 font-semibold">Delivery address</legend>
          <label className="block text-sm">Address<textarea name="address" required rows={3} className={field} autoComplete="street-address" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">City<input name="city" required className={field} /></label>
            <label className="block text-sm">Postal code<input name="postal_code" required className={field} autoComplete="postal-code" /></label>
          </div>
          {/* TODO(decision): state/region list and serviceable-area check depend on your delivery area */}
        </fieldset>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        <OrderSummary />
        <PaymentNotice />
        <button
          disabled={isSample || busy}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-600"
        >
          {isSample ? "Place order (unavailable in demo mode)" : busy ? "Placing order…" : "Place order"}
        </button>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-800 hover:bg-slate-50"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Ask about this cart on WhatsApp
          </a>
        )}
        {whatsappHref && <p className="text-center text-xs text-slate-500">Opens WhatsApp with your cart items only. Your contact and delivery details are not shared.</p>}
        <p className="text-center text-xs text-slate-500">Placing the order reserves your items. You pay on the next screen once payments are switched on.</p>
      </div>
    </form>
  );
}
