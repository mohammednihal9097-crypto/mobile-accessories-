export default function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0)
    return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Out of stock</span>;
  if (stock <= 5)
    return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Only {stock} left</span>;
  return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">In stock</span>;
}
