import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { STORE } from "@/lib/config";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  const l = STORE.legal;
  return (
    <PolicyPage title="Privacy policy">
      <p>
        {STORE.name} (operated by {l.businessName}) respects your privacy. This page explains what personal information we
        collect when you shop with us, why we collect it, who we share it with, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Order details:</strong> your name, WhatsApp number, delivery address and the items you order. Your email address is optional.</li>
        <li><strong>Payment details:</strong> payments are handled by our payment provider on its own page. We never see or store your card, UPI or bank details. We receive only a confirmation and a payment reference.</li>
        <li><strong>Your messages:</strong> if you chat with us on WhatsApp, we keep the messages needed to answer you.</li>
        <li><strong>On your device:</strong> your cart and your chosen phone model are saved in your browser so the shop remembers them. We do not use advertising trackers.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To process, deliver and support your order.</li>
        <li>To send you your receipt and delivery updates on WhatsApp.</li>
        <li>To prevent fraud and keep the shop secure.</li>
        <li>To meet legal, tax and accounting duties.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Who we share it with</h2>
      <p>Only the services we need to run the shop, each handling data for that purpose:</p>
      <ul>
        <li>Our database and hosting providers (Supabase and our web host).</li>
        <li>Our payment provider (Razorpay) to take and confirm payments.</li>
        <li>WhatsApp (Meta) to send your messages, and our automation tool (n8n) that passes them on.</li>
        <li>Courier companies, who receive your name, phone number and address to deliver your parcel.</li>
        <li>If we turn on language translation, the text of your chat messages may be processed by Sarvam to translate it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep order records for as long as the law requires for tax and accounting, and for as long as needed to handle
        returns or disputes. After that we delete or anonymise them.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Ask to see, correct or delete the personal information we hold about you.</li>
        <li>Stop WhatsApp updates by messaging us. Note that order and delivery messages are part of your order.</li>
        <li>Clear your browser data to remove the saved cart and phone choice.</li>
      </ul>
      <p>To make a request or a complaint, contact us on the <Link href="/contact">contact page</Link>. Grievance officer: {l.grievanceOfficer}.</p>

      <h2>Security</h2>
      <p>
        We use access controls, encrypted connections and limited staff access to protect your information. No system is
        perfectly secure, so please contact us at once if you think your information has been misused.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy. The date at the top shows when it last changed.</p>
    </PolicyPage>
  );
}
