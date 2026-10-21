import { BellRing, Trash2 } from "lucide-react";
import Flash from "@/components/admin/Flash";
import { requireAdmin } from "@/lib/supabase/auth";
import { addAdminNumber, deleteAdminNumber } from "../actions";

const input = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  sending: "bg-brand-50 text-brand-700",
  sent: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
};

export default async function NotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  const { supabase } = await requireAdmin();
  const [{ data: numbers }, { data: log }] = await Promise.all([
    supabase.from("admin_whatsapp_numbers").select("id, number, label").order("created_at"),
    supabase
      .from("notifications")
      .select("id, template, audience, whatsapp_number, status, attempts, last_error, created_at, params")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          <BellRing className="h-6 w-6 text-brand-600" strokeWidth={1.75} aria-hidden="true" />
          WhatsApp alerts
        </h1>
        <p className="mt-1 text-slate-600">Who gets order alerts, and what has been sent.</p>
      </div>
      <Flash searchParams={searchParams} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Admin numbers</h2>
        <p className="text-sm text-slate-600">
          These numbers get a WhatsApp message with the full order details when an order is <strong>placed</strong>,
          <strong> paid</strong> or <strong>cancelled</strong>. Customers get their own receipt and delivery updates separately.
        </p>
        <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
          {(numbers ?? []).map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span><span className="font-medium">{n.number}</span>{n.label && <span className="ml-2 text-slate-500">{n.label}</span>}</span>
              <form action={deleteAdminNumber}>
                <input type="hidden" name="id" value={n.id} />
                <button aria-label={`Remove ${n.number}`} className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />Remove
                </button>
              </form>
            </li>
          ))}
          {(numbers ?? []).length === 0 && <li className="px-4 py-4 text-sm text-slate-500">No admin numbers yet. Add yours to start getting order alerts.</li>}
        </ul>
        <form action={addAdminNumber} className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
          <input name="number" required inputMode="tel" placeholder="+91 98765 43210" className={input} aria-label="WhatsApp number" />
          <input name="label" placeholder="Label, e.g. Owner (optional)" className={input} aria-label="Label" />
          <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Add number</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent messages</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="p-3">When</th><th className="p-3">To</th><th className="p-3">Message</th><th className="p-3">Order</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y">
              {(log ?? []).map((m) => (
                <tr key={m.id}>
                  <td className="p-3 text-slate-500">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="p-3">{m.audience === "admin" ? "Admin" : "Customer"}<br /><span className="text-xs text-slate-500">{m.whatsapp_number}</span></td>
                  <td className="p-3">{m.template}</td>
                  <td className="p-3">{(m.params as { order_number?: string } | null)?.order_number ?? "-"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[m.status] ?? ""}`}>{m.status}</span>
                    {m.last_error && <p className="mt-1 max-w-xs break-words text-xs text-red-700">{m.last_error}</p>}
                  </td>
                </tr>
              ))}
              {(log ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nothing yet. Messages appear here when orders change.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">&quot;pending&quot; means waiting for the website or n8n to send it. &quot;failed&quot; shows why WhatsApp refused it.</p>
      </section>
    </div>
  );
}
