import CartView from "@/components/CartView";

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      <CartView />
    </div>
  );
}
