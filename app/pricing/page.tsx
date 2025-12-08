"use client";

import { useState } from "react";
import { PricingCard } from "@/components/PricingCard";
import { PlanSwitcher } from "@/components/PlanSwitcher";
import { useSubscription } from "@/hooks/useSubscription";

async function postJson(url: string, body?: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export default function PricingPage() {
  const [planPeriod, setPlanPeriod] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const { subscription, loading } = useSubscription();

  const pricePersonal = process.env.NEXT_PUBLIC_STRIPE_PRICE_PERSONAL!;
  const pricePro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
  const priceBusiness = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS!;
  const priceTemp = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEMP!;

  async function go(priceId: string) {
    setBusy(priceId);
    try {
      const { url } = await postJson("/api/stripe/create-checkout-session", { priceId });
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(null);
    }
  }

  const plans = [
    {
      name: "Personal",
      price: "$37.99",
      description: "Perfect for individuals getting started",
      features: ["10 renders/month", "Standard quality", "Email support"],
      priceId: pricePersonal,
      isPopular: false,
    },
    {
      name: "Pro",
      price: "$98",
      description: "For professionals and small teams",
      features: ["50 renders/month", "High quality", "Priority support", "API access"],
      priceId: pricePro,
      isPopular: true,
    },
    {
      name: "Business",
      price: "$249.99",
      description: "For growing businesses",
      features: ["Unlimited renders", "Premium quality", "24/7 support", "Custom integrations"],
      priceId: priceBusiness,
      isPopular: false,
    },
    {
      name: "Temporary Access",
      price: "$9.99",
      description: "One-time payment for trial access",
      features: ["5 renders", "Standard quality", "7-day access"],
      priceId: priceTemp,
      isPopular: false,
    },
  ];

  const currentPriceId = subscription?.price_id;

  return (
    <div 
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #0B0B0B 0%, #000000 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-white text-3xl font-bold text-center mb-8">
          Choose Your Plan
        </h1>

        <div className="flex justify-center mb-12">
          <PlanSwitcher value={planPeriod} onChange={setPlanPeriod} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isActive = currentPriceId === plan.priceId;
            return (
              <PricingCard
                key={plan.priceId}
                name={plan.name}
                price={plan.price}
                description={plan.description}
                features={plan.features}
                isPopular={plan.isPopular}
                isActive={isActive}
                onSelect={() => go(plan.priceId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
