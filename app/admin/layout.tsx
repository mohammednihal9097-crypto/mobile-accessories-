import Link from "next/link";
import { Suspense } from "react";
import {
  BellRing,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  ShoppingCart,
  Tags,
  Users,
  Tag,
  Settings,
  ShieldCheck,
} from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { requireAdmin } from "@/lib/supabase/auth";
import { logout } from "../login/actions";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Revenue & Datasheet", Icon: FileSpreadsheet },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/coupons", label: "Coupons", Icon: Tag },
  { href: "/admin/handoffs", label: "WhatsApp chats", Icon: MessageCircle },
  { href: "/admin/notifications", label: "WhatsApp alerts", Icon: BellRing },
  { href: "/admin/catalogue", label: "Categories & phones", Icon: Tags },
  { href: "/admin/instagram", label: "Instagram", Icon: InstagramIcon },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/admins", label: "Admin team", Icon: ShieldCheck },
];

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
      <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-sm font-medium">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </Link>
        ))}
        <span className="ml-auto hidden px-2 text-xs font-normal text-slate-500 md:inline">{email}</span>
        <form action={logout}>
          <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-red-700 transition hover:bg-red-50">
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Log out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
