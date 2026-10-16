import Link from "next/link";
import { Suspense } from "react";
import SaveWaLink from "@/components/SaveWaLink";
import { verifyWaLink } from "@/lib/order-token";

export const metadata = { title: "Continue to the shop", robots: { index: false, follow: false } };

// Landing page for the secure link sent over WhatsApp. It checks the signature, remembers the
// customer's number for checkout, then opens the shop.
export default function StartPage({ searchParams }: PageProps<"/start">) {
  return (
    <Suspense fallback={<p className="text-slate-600">Opening the shop…</p>}>
      <Check searchParams={searchParams} />
    </Suspense>
  );
}

async function Check({ searchParams }: { searchParams: PageProps<"/start">["searchParams"] }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  if (get("wa") && get("exp") && get("sig") && verifyWaLink(get("wa"), get("exp"), get("sig"))) {
    return <SaveWaLink link={{ wa: get("wa"), exp: get("exp"), sig: get("sig") }} />;
  }
  return (
    <div className="mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-bold">This link has expired</h1>
      <p className="text-slate-600">Message us on WhatsApp for a new link, or just browse the shop.</p>
      <Link href="/products" className="inline-block rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white">Go to the shop</Link>
    </div>
  );
}
