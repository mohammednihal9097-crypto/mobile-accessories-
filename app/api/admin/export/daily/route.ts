import { requireAdmin } from "@/lib/supabase/auth";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

const PAID_STATUSES = new Set(["paid", "processing", "shipped", "delivered"]);

export async function GET() {
  const { supabase } = await requireAdmin();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("status, total_minor, created_at")
    .order("created_at", { ascending: false });

  if (error || !orders) {
    return new Response("Failed to fetch daily orders", { status: 500 });
  }

  type DailyStat = {
    date: string;
    totalOrders: number;
    paidOrders: number;
    revenueMinor: number;
    pendingOrders: number;
    cancelledOrders: number;
  };

  const map = new Map<string, DailyStat>();

  for (const o of orders) {
    const d = new Date(o.created_at).toISOString().split("T")[0];
    const stat = map.get(d) ?? {
      date: d,
      totalOrders: 0,
      paidOrders: 0,
      revenueMinor: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
    };

    stat.totalOrders += 1;
    if (PAID_STATUSES.has(o.status)) {
      stat.paidOrders += 1;
      stat.revenueMinor += o.total_minor;
    } else if (o.status === "pending_payment") {
      stat.pendingOrders += 1;
    } else if (o.status === "cancelled") {
      stat.cancelledOrders += 1;
    }
    map.set(d, stat);
  }

  const headers = [
    "Date",
    "Total Orders",
    "Paid Orders",
    "Total Revenue (INR)",
    "Pending Orders",
    "Cancelled Orders",
    "Average Order Value (INR)",
  ];

  const rows = Array.from(map.values()).map((s) => {
    const aov = s.paidOrders > 0 ? (s.revenueMinor / 100 / s.paidOrders).toFixed(2) : "0.00";
    return [
      escapeCsv(s.date),
      escapeCsv(s.totalOrders),
      escapeCsv(s.paidOrders),
      escapeCsv((s.revenueMinor / 100).toFixed(2)),
      escapeCsv(s.pendingOrders),
      escapeCsv(s.cancelledOrders),
      escapeCsv(aov),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trio-store-daily-revenue-${new Date().toISOString().split("T")[0]}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
