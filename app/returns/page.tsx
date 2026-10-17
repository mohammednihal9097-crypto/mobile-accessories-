import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { STORE } from "@/lib/config";

export const metadata = { title: "Returns and refunds" };

export default function ReturnsPage() {
  const l = STORE.legal;
  return (
    <PolicyPage title="Returns and refunds">
      <h2>Cancelling an order</h2>
      <ul>
        <li>You can ask us to cancel an order before it is shipped. Message us on WhatsApp or use the <Link href="/contact">contact page</Link>.</li>
        <li>Once an order has shipped, it can no longer be cancelled, but you can return it as described below.</li>
        <li>If you cancel a paid order, we refund the full amount.</li>
      </ul>

      <h2>Returns</h2>
      <p>You can request a return within <strong>{l.returnWindowDays} days</strong> of delivery if:</p>
      <ul>
        <li>the item arrived damaged or defective,</li>
        <li>you received the wrong item, or</li>
        <li>the item is unused, in its original packaging, and does not work with your device even though your model was listed as compatible.</li>
      </ul>
      <p>
        For hygiene and safety reasons we may not accept returns of opened earphones, or items that show signs of use, damage
        caused after delivery, or missing parts and accessories.
      </p>

      <h2>How to return</h2>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>Contact us with your order number and a photo or short video of the problem.</li>
        <li>We will confirm whether the return is accepted and tell you how to send the item back.</li>
        <li>Pack the item with everything that came with it.</li>
      </ol>

      <h2>Refunds</h2>
      <ul>
        <li>After we receive and check the returned item, we refund the amount to your original payment method within <strong>{l.refundDays} business days</strong>.</li>
        <li>Your bank may take a few more days to show it.</li>
        <li>Delivery charges are refunded when the return is because of our mistake or a faulty item.</li>
      </ul>

      <h2>Replacements</h2>
      <p>If an item is faulty, we can offer a replacement instead of a refund, if you prefer and stock is available.</p>

      <p>
        Questions? See the <Link href="/contact">contact page</Link>. This policy works alongside your rights under Indian consumer law.
      </p>
    </PolicyPage>
  );
}
