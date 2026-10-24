import Link from "next/link";
import { Search, Users, ShoppingCart, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "Customers CRM - Admin" };

type CustomerRecord = {
  phone: string;
  name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  ordersCount: number;
  totalSpentMinor: number;
  lastOrderDate: string;
};

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const { search } = await searchParams;
  const { supabase } = await requireAdmin();
  const q = typeof search === "string" ? search.trim().toLowerCase() : "";

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, whatsapp_number, email, shipping_address, total_minor, status, created_at")
    .order("created_at", { ascending: false });

  const customerMap = new Map<string, CustomerRecord>();

  for (const o of orders ?? []) {
    const phone = o.whatsapp_number?.trim() || "Unknown";
    const addr = (o.shipping_address as Record<string, string>) || {};
    const city = addr.city || addr.town || null;
    const state = addr.state || null;

    const existing = customerMap.get(phone);
    if (!existing) {
      customerMap.set(phone, {
        phone,
        name: o.customer_name || "Guest Customer",
        email: o.email || null,
        city,
        state,
        ordersCount: 1,
        totalSpentMinor: ["paid", "processing", "shipped", "delivered"].includes(o.status) ? o.total_minor : 0,
        lastOrderDate: o.created_at,
      });
    } else {
      existing.ordersCount += 1;
      if (["paid", "processing", "shipped", "delivered"].includes(o.status)) {
        existing.totalSpentMinor += o.total_minor;
      }
      if (!existing.email && o.email) existing.email = o.email;
      if (!existing.city && city) existing.city = city;
      if (!existing.state && state) existing.state = state;
    }
  }

  let customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpentMinor - a.totalSpentMinor);

  if (q) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }

  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpentMinor, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <Users className="h-6 w-6 text-brand-600" />
            Customers CRM
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View customer order histories, total spend, and contact information.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Customers</span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{customerMap.size}</p>
          <p className="mt-0.5 text-xs text-slate-500">Unique phone numbers placed orders</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue Generated</span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-brand-600">{formatMoney(totalSpentAll)}</p>
          <p className="mt-0.5 text-xs text-slate-500">Across customer orders</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Repeat Customers</span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {Array.from(customerMap.values()).filter((c) => c.ordersCount > 1).length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Placed 2 or more orders</p>
        </div>
      </div>

      {/* Search Input */}
      <form method="GET" className="relative flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            name="search"
            defaultValue={q}
            placeholder="Search by name, phone, email, or city…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button type="submit" className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Orders</th>
                <th className="p-3.5">Total Spend</th>
                <th className="p-3.5">Last Order</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.phone} className="transition-colors hover:bg-slate-50/60">
                  <td className="p-3.5 font-medium text-slate-900">
                    <p className="font-semibold">{c.name}</p>
                    {c.ordersCount > 1 && (
                      <span className="inline-block mt-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                        Repeat ({c.ordersCount})
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {c.city || c.state ? (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{[c.city, c.state].filter(Boolean).join(", ")}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-1">
                      <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                      {c.ordersCount}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-green-700">
                    {formatMoney(c.totalSpentMinor)}
                  </td>
                  <td className="p-3.5 text-xs text-slate-500">
                    {new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3.5">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(c.phone)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                    >
                      View orders
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                    {q ? "No customers found matching your search." : "No customer records yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
