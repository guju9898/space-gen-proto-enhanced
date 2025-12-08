"use client";

import { useEffect } from "react";

export default function SuccessPage() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.location.href = "/studio/interior";
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white px-4 bg-black">
      <h1 className="text-3xl font-bold mb-4">🎉 Payment Successful</h1>
      <p className="text-lg text-gray-300 mb-6">
        Welcome to Space Gen. You now have full access to AI design generation.
      </p>
      <a
        href="/studio/interior"
        className="bg-gradient-to-r from-orange-500 to-violet-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:brightness-110 transition-all"
      >
        Start Designing
      </a>
    </main>
  );
}
