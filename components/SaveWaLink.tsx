"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveWaLink, type WaLink } from "@/lib/wa-link";

export default function SaveWaLink({ link }: { link: WaLink }) {
  const router = useRouter();
  useEffect(() => {
    saveWaLink(link);
    router.replace("/products");
  }, [link, router]);
  return <p className="text-slate-600">Opening the shop…</p>;
}
