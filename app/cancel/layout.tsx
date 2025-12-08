import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Canceled",
  description: "Your checkout was canceled. Feel free to try again anytime.",
};

export default function CancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


