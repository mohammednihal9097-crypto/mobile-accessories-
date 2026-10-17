import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import CheckoutForm from "@/components/CheckoutForm";
import Flash from "@/components/admin/Flash";

export const metadata = { title: "Checkout" };

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/cart" className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to cart
        </Link>
      </p>
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        <Lock className="h-6 w-6 text-brand-600" strokeWidth={1.75} aria-hidden="true" />
        Checkout
      </h1>
      <Flash searchParams={searchParams} />
      <CheckoutForm />
    </div>
  );
}
