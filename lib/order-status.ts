export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-blue-100 text-blue-900",
  processing: "bg-indigo-100 text-indigo-900",
  shipped: "bg-purple-100 text-purple-900",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-700",
};

/** The single forward step for each status. The database enforces the same rules. */
export const NEXT_STATUS: Record<string, string | undefined> = {
  pending_payment: "paid",
  paid: "processing",
  processing: "shipped",
  shipped: "delivered",
};

export const CAN_CANCEL = ["pending_payment", "paid", "processing"];
