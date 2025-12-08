import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile & Subscription",
  description: "Manage your account, update payment info, and view billing history.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


