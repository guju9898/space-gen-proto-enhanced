"use client";

import { CTAButton } from "./CTAButton";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
  onSelect?: () => void;
  badge?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features = [],
  isPopular = false,
  isActive = false,
  onSelect,
  badge,
}: PricingCardProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md text-white relative">
      {isPopular && (
        <span className="absolute top-4 right-4 bg-violet-700 text-xs uppercase px-2 py-1 rounded-full">
          {badge || "Popular"}
        </span>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold">{price}</span>
          {price.includes("/") && <span className="text-gray-400 text-sm">/mo</span>}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{description}</p>

      {features.length > 0 && (
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="text-sm text-gray-300 flex items-start">
              <span className="mr-2 text-violet-700">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {isActive ? (
        <CTAButton animated disabled>
          Current Plan
        </CTAButton>
      ) : (
        <button
          onClick={onSelect}
          className="w-full h-14 rounded-lg border border-gray-600 text-white hover:bg-gray-800 transition-colors font-semibold text-base"
        >
          Select Plan
        </button>
      )}
    </div>
  );
}


