import Breadcrumbs from "@/components/Breadcrumbs";
import TrackForm from "@/components/TrackForm";

export const metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track order" }]} />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Track your order</h1>
        <p className="text-slate-600">Enter your order number and the phone number you used when you ordered.</p>
      </header>
      <TrackForm />
    </div>
  );
}
