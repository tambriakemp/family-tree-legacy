import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "sonner";

const plans = [
  {
    name: "Monthly",
    price: "$6",
    period: "per month",
    description: "Perfect for getting started",
    features: [
      "Unlimited family trees",
      "Unlimited family members",
      "Invite unlimited collaborators",
      "Shared family calendars",
      "Photo galleries with tagging",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Yearly",
    price: "$48",
    period: "per year",
    description: "Best value - save $24/year",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Early access to new features",
      "Advanced tree analytics",
      "Export family data",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
    badge: "Save 33%",
  },
];

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-light/30 border border-accent/30 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent-foreground">
              Simple, transparent pricing
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            One Plan, All Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hidden fees, no feature limits. Get full access to everything FamilyFlow offers.
            Try free for 14 days.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              selectedPlan === "monthly"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all relative",
              selectedPlan === "yearly"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
            <span className="absolute -top-2 -right-4 px-2 py-0.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
              -33%
            </span>
          </button>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative rounded-3xl border-2 border-primary bg-card shadow-large overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 px-4 py-2 bg-gradient-sage text-primary-foreground text-sm font-medium rounded-bl-2xl">
              Most Popular
            </div>

            <div className="p-8 md:p-10">
              <div className="mb-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  {selectedPlan === "yearly" ? "Yearly Plan" : "Monthly Plan"}
                </h3>
                <p className="text-muted-foreground">
                  {selectedPlan === "yearly" ? "Best value - save $24/year" : "Perfect for getting started"}
                </p>
              </div>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-display text-5xl font-bold text-foreground">
                  {selectedPlan === "yearly" ? "$48" : "$6"}
                </span>
                <span className="text-muted-foreground">
                  /{selectedPlan === "yearly" ? "year" : "month"}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited family trees",
                  "Unlimited family members",
                  "Invite unlimited collaborators",
                  "Shared family calendars",
                  "Photo galleries with tagging",
                  "Priority support",
                  ...(selectedPlan === "yearly" ? ["2 months free", "Early access to new features"] : []),
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button variant="hero" size="xl" className="w-full">
                  Start 14-Day Free Trial
                </Button>
              </Link>

              <p className="text-center text-sm text-muted-foreground mt-4">
                No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>Secure payments</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
