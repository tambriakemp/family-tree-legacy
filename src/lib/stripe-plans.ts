export const STRIPE_PLANS = {
  monthly: {
    price_id: "price_1T8ohsFZQY3Q8TGLEWWg8Qoe",
    product_id: "prod_U72npFbzfgdwn7",
    name: "Monthly",
    price: 6,
    interval: "month" as const,
  },
  yearly: {
    price_id: "price_1T8ojlFZQY3Q8TGLsiC6ERkA",
    product_id: "prod_U72pu8L5oJ1M0V",
    name: "Yearly",
    price: 48,
    interval: "year" as const,
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.product_id === productId) return key as PlanKey;
  }
  return null;
}
