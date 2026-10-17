import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { formatMoney, STORE } from "@/lib/config";

export const metadata = { title: "Shipping and delivery" };

export default function ShippingPage() {
  const l = STORE.legal;
  const s = STORE.shipping;
  return (
    <PolicyPage title="Shipping and delivery">
      <h2>Where we deliver</h2>
      <p>{s.areaNote} Enter a full address with city and postal code at checkout so the courier can find you.</p>

      <h2>Delivery charges</h2>
      <ul>
        <li>Delivery costs {formatMoney(s.flatFee)} per order.</li>
        <li>Delivery is free on orders of {formatMoney(s.freeOver)} or more.</li>
      </ul>
      <p>The exact delivery charge is always shown at checkout before you pay.</p>

      <h2>How long it takes</h2>
      <ul>
        <li><strong>Dispatch:</strong> we usually ship within {l.dispatchTime} after payment is confirmed.</li>
        <li><strong>Delivery:</strong> usually {l.deliveryTime} after dispatch, depending on your location.</li>
      </ul>
      <p>These are estimates. Delays can happen because of couriers, weather, holidays or events outside our control.</p>

      <h2>Tracking your order</h2>
      <ul>
        <li>When your order ships, we send the courier name and tracking number to you on WhatsApp.</li>
        <li>You can also check your order any time on the <Link href="/track">track order</Link> page with your order number and WhatsApp number.</li>
      </ul>

      <h2>When your parcel arrives</h2>
      <p>
        Please check the parcel before accepting it. If the package looks damaged or tampered with, tell the courier and contact us
        straight away with photos. See our <Link href="/returns">returns and refunds policy</Link>.
      </p>
    </PolicyPage>
  );
}
