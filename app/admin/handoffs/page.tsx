import Flash from "@/components/admin/Flash";
import { requireAdmin } from "@/lib/supabase/auth";
import { resolveHandoff } from "../actions";

export default async function Handoffs({ searchParams }: PageProps<"/admin/handoffs">) {
  const { supabase } = await requireAdmin();
  const { data: open } = await supabase
    .from("handoff_requests")
    .select("id, whatsapp_number, customer_name, reason, last_message, updated_at")
    .eq("status", "open")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">WhatsApp chats needing a person</h1>
      <Flash searchParams={searchParams} />
      <p className="text-sm text-slate-600">
        The bot could not help with these. Reply to the customer from your WhatsApp Business app or inbox, then mark it done here.
      </p>
      <ul className="space-y-3">
        {(open ?? []).map((h) => (
          <li key={h.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="font-semibold">{h.customer_name ?? "Customer"} <span className="font-normal text-slate-500">{h.whatsapp_number}</span></p>
            <p className="text-slate-600">Why: {h.reason}</p>
            {h.last_message && <p className="mt-1 rounded bg-slate-50 p-2">&ldquo;{h.last_message}&rdquo;</p>}
            <p className="mt-1 text-xs text-slate-500">{new Date(h.updated_at).toLocaleString()}</p>
            <form action={resolveHandoff} className="mt-2">
              <input type="hidden" name="id" value={h.id} />
              <button className="rounded-xl border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">Mark as done</button>
            </form>
          </li>
        ))}
        {(open ?? []).length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">Nothing waiting.</li>}
      </ul>
    </div>
  );
}
