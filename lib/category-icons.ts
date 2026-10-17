import { createElement } from "react";
import {
  BatteryCharging, Cable, Car, Headphones, Package, PlugZap, ShieldCheck, Smartphone, Speaker, Watch,
  type LucideIcon, type LucideProps,
} from "lucide-react";

// Line icons for categories. Admins pick one by key (stored in categories.icon). Older rows that hold an
// emoji or nothing get an icon guessed from the category name, so nothing shows an emoji any more.
export const CATEGORY_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  case: { label: "Phone / case", Icon: Smartphone },
  charger: { label: "Charger", Icon: PlugZap },
  cable: { label: "Cable", Icon: Cable },
  power: { label: "Power bank", Icon: BatteryCharging },
  audio: { label: "Earphones", Icon: Headphones },
  speaker: { label: "Speaker", Icon: Speaker },
  protector: { label: "Screen protector", Icon: ShieldCheck },
  car: { label: "Car / holder", Icon: Car },
  watch: { label: "Watch / wearable", Icon: Watch },
  other: { label: "Other", Icon: Package },
};

const GUESSES: [RegExp, string][] = [
  [/case|cover|back/i, "case"],
  [/charg|adapter|plug/i, "charger"],
  [/cable|wire|cord/i, "cable"],
  [/power|bank|battery/i, "power"],
  [/audio|ear|head|bud|sound/i, "audio"],
  [/speaker/i, "speaker"],
  [/protect|glass|screen|guard/i, "protector"],
  [/car|holder|stand|mount/i, "car"],
  [/watch|band|wear/i, "watch"],
];

export function categoryIcon(c: { icon?: string | null; name: string; slug?: string }): LucideIcon {
  if (c.icon && CATEGORY_ICONS[c.icon]) return CATEGORY_ICONS[c.icon].Icon;
  const text = `${c.name} ${c.slug ?? ""}`;
  const hit = GUESSES.find(([re]) => re.test(text));
  return CATEGORY_ICONS[hit?.[1] ?? "other"].Icon;
}

/** Renders the line icon for a category. */
export function CategoryIcon({ category, ...props }: { category: { icon?: string | null; name: string; slug?: string } } & LucideProps) {
  return createElement(categoryIcon(category), { strokeWidth: 1.75, "aria-hidden": true, ...props });
}