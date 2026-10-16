import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import Flash from "@/components/admin/Flash";

export const metadata = { title: "Checkout" };

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/cart" className="text-slate-500 hover:underline">← Back to cart</Link></p>
      <h1 className="text-2xl font-bold">Checkout</h1>
      <Flash searchParams={searchParams} />
      <CheckoutForm />
    </div>
  );
}