import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Successful",
  description: "Thank you for subscribing to Space Gen! You now have full access.",
};

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


