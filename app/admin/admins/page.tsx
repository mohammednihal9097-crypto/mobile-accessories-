import { ShieldCheck, UserPlus, Trash2, Mail, Calendar, Key } from "lucide-react";
import Flash from "@/components/admin/Flash";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSecretClient } from "@/lib/supabase/admin";
import { addAdminUser, removeAdminUser } from "../actions";

export const metadata = { title: "Admin Management - Admin" };

const inputClass =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default async function AdminManagementPage({ searchParams }: PageProps<"/admin/admins">) {
  const current = await requireAdmin();
  const sc = createSecretClient();

  const [{ data: adminRows }, { data: authUsersData }] = await Promise.all([
    sc.from("admin_users").select("user_id, created_at"),
    sc.auth.admin.listUsers(),
  ]);

  const userEmailMap = new Map<string, { email: string; createdAt: string }>();
  for (const u of authUsersData?.users ?? []) {
    userEmailMap.set(u.id, {
      email: u.email ?? "Unknown",
      createdAt: u.created_at,
    });
  }

  const admins = (adminRows ?? []).map((row) => {
    const authUser = userEmailMap.get(row.user_id);
    return {
      userId: row.user_id,
      email: authUser?.email ?? "Unknown User",
      isSelf: row.user_id === current.userId,
      addedAt: row.created_at,
    };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
            Admin Team Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Authorize team members with access to the store management dashboard.
          </p>
        </div>
        <Flash searchParams={searchParams} />
      </div>

      {/* Add Admin Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <UserPlus className="h-4 w-4 text-brand-600" />
          Grant Admin Access
        </h2>
        <p className="text-xs text-slate-500">
          Enter the email address of the team member. Note: They must have already signed up or logged into the site once.
        </p>

        <form action={addAdminUser} className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              name="email"
              type="email"
              required
              placeholder="teammember@gmail.com"
              className={`${inputClass} pl-9`}
            />
          </div>
          <button
            type="submit"
            className="btn-press inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Grant Admin Role
          </button>
        </form>
      </div>

      {/* Admins List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Active Admin Accounts</h2>
          <span className="text-xs text-slate-500">{admins.length} administrator{admins.length === 1 ? "" : "s"}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-3.5">Admin User</th>
                <th className="p-3.5">User ID</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.userId} className="transition-colors hover:bg-slate-50/60">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-brand-600 shrink-0" />
                      <span className="font-semibold text-slate-900">{admin.email}</span>
                      {admin.isSelf && (
                        <span className="rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-xs text-slate-400">
                    {admin.userId.slice(0, 16)}…
                  </td>
                  <td className="p-3.5 text-xs font-medium text-slate-700">
                    Full Administrator
                  </td>
                  <td className="p-3.5 text-right">
                    {admin.isSelf ? (
                      <span className="text-xs text-slate-400 italic">Current Session</span>
                    ) : (
                      <form action={removeAdminUser} className="inline-block">
                        <input type="hidden" name="user_id" value={admin.userId} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm(`Revoke admin access for ${admin.email}?`)) {
                              e.preventDefault();
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
