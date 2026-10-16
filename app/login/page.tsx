import { Suspense } from "react";
import { login } from "./actions";

export const metadata = { title: "Admin login" };

const MESSAGES: Record<string, string> = {
  invalid: "Email or password is not correct.",
  missing: "Please enter your email and password.",
  "not-admin": "This account is not an admin. Ask the store owner to add it.",
  "not-configured": "Supabase is not configured yet. Fill in .env.local first (see docs/stage3-setup.md).",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Admin login</h1>
      <Suspense>
        <ErrorMessage searchParams={searchParams} />
      </Suspense>
      <form action={login} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-sm">Email
          <input name="email" type="email" required autoComplete="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">Password
          <input name="password" type="password" required autoComplete="current-password" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <button className="w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white">Sign in</button>
      </form>
    </div>
  );
}

async function ErrorMessage({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  const text = typeof error === "string" ? MESSAGES[error] : undefined;
  return text ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{text}</p> : null;
}
