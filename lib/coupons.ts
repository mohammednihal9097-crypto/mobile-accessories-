import { createPublicClient } from "@/lib/supabase/public";

export type CouponValidationResult =
  | {
      valid: true;
      code: string;
      discountType: "percent" | "flat";
      discountValue: number;
      discountMinor: number;
      minOrderMinor: number;
    }
  | {
      valid: false;
      error: string;
    };

export async function validateCoupon(
  rawCode: string,
  subtotalMinor: number
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, error: "Enter a coupon code." };
  }

  try {
    const supabase = createPublicClient();
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !coupon) {
      // Hardcoded fallback coupons in case table isn't migrated yet
      if (code === "WELCOME10") {
        const discountMinor = Math.round(subtotalMinor * 0.1);
        return {
          valid: true,
          code: "WELCOME10",
          discountType: "percent",
          discountValue: 10,
          discountMinor,
          minOrderMinor: 0,
        };
      }
      return { valid: false, error: "Invalid or expired coupon code." };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: "This coupon code has expired." };
    }

    if (coupon.max_uses && coupon.usage_count >= coupon.max_uses) {
      return { valid: false, error: "This coupon has reached its usage limit." };
    }

    if (coupon.min_order_minor && subtotalMinor < coupon.min_order_minor) {
      const minFormatted = (coupon.min_order_minor / 100).toFixed(0);
      return {
        valid: false,
        error: `Order subtotal must be at least ₹${minFormatted} to use this coupon.`,
      };
    }

    let discountMinor = 0;
    if (coupon.discount_type === "percent") {
      discountMinor = Math.round((subtotalMinor * coupon.discount_value) / 100);
      if (coupon.max_discount_minor && discountMinor > coupon.max_discount_minor) {
        discountMinor = coupon.max_discount_minor;
      }
    } else {
      discountMinor = coupon.discount_value;
    }

    // Discount cannot exceed subtotal
    if (discountMinor > subtotalMinor) {
      discountMinor = subtotalMinor;
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountMinor,
      minOrderMinor: coupon.min_order_minor ?? 0,
    };
  } catch {
    return { valid: false, error: "Unable to validate coupon right now." };
  }
}
