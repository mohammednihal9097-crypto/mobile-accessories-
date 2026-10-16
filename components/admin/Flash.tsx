import { Suspense } from "react";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Shows ?saved=1 / ?nochange=1 / ?error=... messages left by admin actions. */
export default function Flash({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense>
      <Inner searchParams={searchParams} />
    </Suspense>
  );
}

async function Inner({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (typeof sp.error === "string") {
    return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>;
  }
  if (sp.saved) return <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Saved.</p>;
  if (sp.nochange) return <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">No change: the order was already in that state.</p>;
  return null;
}
