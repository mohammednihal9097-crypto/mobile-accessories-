import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/supabase/auth";
import { logout } from "../login/actions";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-slate-500">Checking access…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium">
        <Link href="/admin" className="font-semibold">Admin</Link>
        <Link href="/admin/orders" className="hover:text-brand-600">Orders</Link>
        <Link href="/admin/products" className="hover:text-brand-600">Products</Link>
        <Link href="/admin/handoffs" className="hover:text-brand-600">WhatsApp chats</Link>
        <Link href="/admin/catalogue" className="hover:text-brand-600">Categories &amp; phones</Link>
        <span className="ml-auto text-xs font-normal text-slate-500">{email}</span>
        <form action={logout}><button className="text-red-700 hover:underline">Log out</button></form>
      </nav>
      {children}
    </div>
  );
}
