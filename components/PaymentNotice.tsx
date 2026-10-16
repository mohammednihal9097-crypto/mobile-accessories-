export default function PaymentNotice() {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Payment: placeholder</p>
      <p>
        No payment provider is connected yet (waiting for the selling country and provider decision).
        Orders are saved as &quot;Pending payment&quot;. They only become &quot;Paid&quot; after the payment provider confirms.
      </p>
    </div>
  );
}
