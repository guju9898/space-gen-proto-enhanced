"use client";

export default function CancelPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white px-4 bg-black">
      <h1 className="text-3xl font-bold mb-4">❌ Checkout Canceled</h1>
      <p className="text-lg text-gray-300 mb-6">
        No worries — your card wasn't charged. You can restart the process anytime.
      </p>
      <a
        href="/pricing"
        className="text-violet-400 underline hover:text-violet-300 transition-colors"
      >
        Return to Pricing
      </a>
    </main>
  );
}
