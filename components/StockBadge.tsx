import { CircleAlert, CircleCheck, CircleX } from "lucide-react";

const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";

export default function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0)
    return <span className={`${base} bg-red-50 text-red-700 ring-1 ring-red-100`}><CircleX className="h-3.5 w-3.5" aria-hidden="true" />Out of stock</span>;
  if (stock <= 5)
    return <span className={`${base} bg-amber-50 text-amber-800 ring-1 ring-amber-100`}><CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />Only {stock} left</span>;
  return <span className={`${base} bg-green-50 text-green-700 ring-1 ring-green-100`}><CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />In stock</span>;
}
