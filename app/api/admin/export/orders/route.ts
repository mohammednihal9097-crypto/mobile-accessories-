import { requireAdmin } from "@/lib/supabase/auth";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET() {
  const { supabase } = await requireAdmin();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("order_number, status, customer_name, email, whatsapp_number, subtotal_minor, shipping_minor, total_minor, currency, created_at, order_items(product_name, quantity, unit_price_minor)")
    .order("created_at", { ascending: false });

  if (error || !orders) {
    return new Response("Failed to fetch orders for export", { status: 500 });
  }

  const headers = [
    "Order Number",
    "Date",
    "Time",
    "Status",
    "Customer Name",
    "Email",
    "Phone",
    "Subtotal (INR)",
    "Shipping (INR)",
    "Total (INR)",
    "Items"
  ];

  const rows = orders.map((o) => {
    const d = new Date(o.created_at);
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = d.toLocaleTimeString("en-IN", { hour12: false });
    const statusLabel = ORDER_STATUS_LABEL[o.status] || o.status;
    const itemsSummary = (o.order_items ?? [])
      .map((i: { product_name: string; quantity: number }) => `${i.product_name} (${i.quantity})`)
      .join("; ");

    return [
      escapeCsv(o.order_number),
      escapeCsv(dateStr),
      escapeCsv(timeStr),
      escapeCsv(statusLabel),
      escapeCsv(o.customer_name),
      escapeCsv(o.email || ""),
      escapeCsv(o.whatsapp_number),
      escapeCsv((o.subtotal_minor / 100).toFixed(2)),
      escapeCsv((o.shipping_minor / 100).toFixed(2)),
      escapeCsv((o.total_minor / 100).toFixed(2)),
      escapeCsv(itemsSummary),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trio-store-orders-${new Date().toISOString().split("T")[0]}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
