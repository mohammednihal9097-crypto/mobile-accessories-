export default function PaymentNotice() {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Online payment is not switched on yet</p>
      <p>
        Your order is saved as &quot;Pending payment&quot; and your items are held for you.
        It only becomes &quot;Paid&quot; after the payment provider confirms the payment.
      </p>
    </div>
  );
}