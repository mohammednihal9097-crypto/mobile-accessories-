import { createElement } from "react";
import {
  BatteryCharging, Cable, Camera, Car, Gamepad2, Headphones, Keyboard, Laptop, Lightbulb, Package, PlugZap,
  ShieldCheck, Smartphone, Speaker, Tablet, Tv, Watch,
  type LucideIcon, type LucideProps,
} from "lucide-react";

// Line icons for categories. Admins pick one by key (stored in categories.icon). Older rows that hold an
// emoji or nothing get an icon guessed from the category name, so nothing shows an emoji any more.
export const CATEGORY_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  phone: { label: "Phones", Icon: Smartphone },
  tablet: { label: "Tablets", Icon: Tablet },
  laptop: { label: "Laptops & computers", Icon: Laptop },
  camera: { label: "Cameras", Icon: Camera },
  gaming: { label: "Gaming", Icon: Gamepad2 },
  smarthome: { label: "Smart home", Icon: Lightbulb },
  tv: { label: "TV & displays", Icon: Tv },
  keyboard: { label: "Keyboards & mice", Icon: Keyboard },
  case: { label: "Cases & covers", Icon: Smartphone },
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
  [/laptop|computer|notebook|pc\b/i, "laptop"],
  [/tablet|ipad/i, "tablet"],
  [/camera|drone|action|photo/i, "camera"],
  [/gam(e|ing)|console|controller/i, "gaming"],
  [/smart.?home|bulb|sensor|automation|alexa/i, "smarthome"],
  [/\btv\b|display|monitor|projector/i, "tv"],
  [/keyboard|mouse|mice/i, "keyboard"],
  [/phone|mobile/i, "phone"],
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