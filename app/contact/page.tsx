import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, PackageSearch, Phone } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { isBlank, STORE } from "@/lib/config";

export const metadata = { title: "Contact us" };

export default function ContactPage() {
  const l = STORE.legal;
  const rows = [
    !isBlank(l.whatsappDigits) && {
      Icon: MessageCircle, label: "WhatsApp (fastest)",
      value: <a className="font-medium text-brand-700 underline" href={`https://wa.me/${l.whatsappDigits}`} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a>,
    },
    !isBlank(l.email) && { Icon: Mail, label: "Email", value: <a className="font-medium text-brand-700 underline" href={`mailto:${l.email}`}>{l.email}</a> },
    !isBlank(l.phone) && { Icon: Phone, label: "Phone", value: <a className="font-medium text-brand-700 underline" href={`tel:${l.phone.replace(/[^\d+]/g, "")}`}>{l.phone}</a> },
    !isBlank(l.address) && { Icon: MapPin, label: "Address", value: <span>{l.businessName}<br />{l.address}</span> },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: React.ReactNode }[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Contact us</h1>
        <p className="text-slate-600">Questions about an order, a product or compatibility? We are happy to help.</p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Our contact details are being added. In the meantime, you can check your order on the{" "}
          <Link href="/track" className="font-medium text-brand-700 underline">track order</Link> page.
        </p>
      ) : (
        <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
          {rows.map(({ Icon, label, value }) => (
            <li key={label} className="flex items-start gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-slate-900">{value}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/track" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-md">
          <PackageSearch className="h-5 w-5 text-brand-600" strokeWidth={1.75} aria-hidden="true" />
          <span><span className="block font-semibold text-slate-900">Track your order</span><span className="text-sm text-slate-600">Status and delivery details</span></span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Clock className="h-5 w-5 text-brand-600" strokeWidth={1.75} aria-hidden="true" />
          <span><span className="block font-semibold text-slate-900">Complaints</span><span className="text-sm text-slate-600">Handled by {l.grievanceOfficer}</span></span>
        </div>
      </div>
    </div>
  );
}
