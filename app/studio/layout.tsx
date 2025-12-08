import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — Generate Designs",
  description: "Select a style and generate stunning AI-based designs in seconds.",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


