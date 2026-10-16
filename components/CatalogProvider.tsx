"use client";

import { createContext, useContext } from "react";
import type { Catalog } from "@/lib/catalog";

const Ctx = createContext<Catalog | null>(null);

export default function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  return <Ctx.Provider value={catalog}>{children}</Ctx.Provider>;
}

/** Client components read the shared catalogue from here (loaded once in the root layout). */
export function useCatalog(): Catalog {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCatalog must be used inside CatalogProvider");
  return c;
}
