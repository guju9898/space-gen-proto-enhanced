import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description: "Compare Space Gen plans — Personal, Pro, and Business tiers.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


