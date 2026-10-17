import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { STORE } from "@/lib/config";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  const l = STORE.legal;
  return (
    <PolicyPage title="Terms of service">
      <p>
        These terms apply when you buy from {STORE.name}, operated by {l.businessName} ({l.address}). By placing an order you
        agree to them.
      </p>

      <h2>Products and compatibility</h2>
      <ul>
        <li>We list the phone models and devices a product is compatible with, as provided by the maker or our own checks. Please check that your exact model is listed before you order.</li>
        <li>Photos and descriptions are for guidance. Colours and packaging can differ slightly.</li>
        <li>Stock shown on the website is checked again when you place the order. If an item runs out, we will tell you.</li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>Prices are in Indian rupees (INR). Delivery charges are shown before you order.</li>
        <li>Payment is made online through our payment provider. An order is confirmed as paid only after the provider confirms your payment.</li>
        <li>We may cancel an order if payment is not received within 24 hours, or if a pricing or stock error is found. We will refund any amount you paid.</li>
      </ul>

      <h2>Orders and delivery</h2>
      <p>
        Placing an order is an offer to buy. We accept it when we start processing it. Delivery times are estimates, see our{" "}
        <Link href="/shipping">shipping policy</Link>. You can follow your order on the <Link href="/track">track order</Link> page.
      </p>

      <h2>Returns and refunds</h2>
      <p>See our <Link href="/returns">returns and refunds policy</Link>.</p>

      <h2>Warranty</h2>
      <p>
        Gadgets may carry the manufacturer&apos;s warranty. Warranty terms come from the manufacturer. Keep your receipt and
        contact us if you need help claiming it.
      </p>

      <h2>Using the website</h2>
      <ul>
        <li>Give accurate details when you order.</li>
        <li>Do not misuse the site, try to break its security, or place orders you do not intend to pay for.</li>
      </ul>

      <h2>Our responsibility</h2>
      <p>
        We take care to describe products correctly and deliver them safely. To the extent the law allows, we are not
        responsible for indirect losses, or for delays caused by couriers, strikes, weather or other events outside our control.
        Nothing in these terms limits your rights under Indian consumer law.
      </p>

      <h2>Law and disputes</h2>
      <p>These terms follow the laws of India. Courts in {l.jurisdictionCity} have jurisdiction, subject to your consumer rights.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Use the <Link href="/contact">contact page</Link>.</p>
    </PolicyPage>
  );
}
