import { STORE } from "@/lib/config";

/** The Trio Store mark: a "T" built from three rounded pieces (the trio) on a purple tile. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="16" fill="#673DE6" />
      <rect x="12" y="15" width="18" height="10" rx="3" fill="#fff" />
      <rect x="34" y="15" width="18" height="10" rx="3" fill="#fff" />
      <rect x="25" y="29" width="14" height="22" rx="3" fill="#fff" />
    </svg>
  );
}

export default function Logo() {
  const [first, ...rest] = STORE.name.split(" ");
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl leading-none tracking-tight">
        <span className="font-bold text-slate-900">{first}</span>
        {rest.length > 0 && <span className="ml-1.5 font-medium text-slate-600">{rest.join(" ")}</span>}
      </span>
    </span>
  );
}
