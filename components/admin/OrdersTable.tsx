"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/config";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { bulkSetOrderStatus } from "@/app/admin/actions";

export interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  whatsapp_number: string;
  total_minor: number;
  created_at: string;
}

const BULK_STATUS_OPTIONS = [
  { key: "paid", label: "Mark Paid" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersTable({ orders, emptyText }: { orders: OrderRow[]; emptyText: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkStatus = (statusKey: string) => {
    if (selected.size === 0) return;
    if (statusKey === "cancelled" && !confirm(`Are you sure you want to cancel ${selected.size} order(s)? Stock will be restored.`)) {
      return;
    }
    const fd = new FormData();
    fd.set("status", statusKey);
    selected.forEach((id) => fd.append("order_id", id));
    startTransition(async () => {
      await bulkSetOrderStatus(fd);
      setSelected(new Set());
    });
  };

  return (
    <div className="space-y-3">
      {/* Sticky Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-brand-300 bg-brand-50/95 p-3 shadow-md backdrop-blur">
          <span className="text-sm font-semibold text-brand-900">
            {selected.size} order{selected.size > 1 ? "s" : ""} selected
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-medium text-slate-600">Update status:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {BULK_STATUS_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                disabled={isPending}
                onClick={() => handleBulkStatus(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                  key === "cancelled"
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    : "bg-white text-slate-800 hover:bg-slate-100 border border-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-800 underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all orders"
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600 cursor-pointer"
                />
              </th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => {
              const isChecked = selected.has(o.id);
              return (
                <tr
                  key={o.id}
                  className={`transition ${isChecked ? "bg-brand-50/40" : "hover:bg-slate-50/60"}`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(o.id)}
                      aria-label={`Select order ${o.order_number}`}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-600 cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="p-3">
                    {o.customer_name}
                    <br />
                    <span className="text-xs text-slate-500">{o.whatsapp_number}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-900">{formatMoney(o.total_minor)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        ORDER_STATUS_COLOR[o.status] ?? "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {new Date(o.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
