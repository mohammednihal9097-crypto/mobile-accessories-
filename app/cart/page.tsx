import { ShoppingBag } from "lucide-react";
import CartView from "@/components/CartView";

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        <ShoppingBag className="h-6 w-6 text-brand-600" strokeWidth={1.75} aria-hidden="true" />
        Your cart
      </h1>
      <CartView />
    </div>
  );
}
