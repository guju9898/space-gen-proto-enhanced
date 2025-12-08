"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Trash2, Download } from "lucide-react";

async function postJson(url: string, body?: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export default function ProfilePage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { subscription, loading: subLoading } = useSubscription();
  const supabase = createClientComponentClient();

  const pricePersonal = process.env.NEXT_PUBLIC_STRIPE_PRICE_PERSONAL!;
  const pricePro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
  const priceBusiness = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS!;
  const priceTemp = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEMP!;

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        setProfile(data);
      }
      setLoading(false);
    }
    loadUser();
  }, [supabase]);

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

  async function portal() {
    setBusy("portal");
    try {
      const { url } = await postJson("/api/stripe/portal");
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(null);
    }
  }

  const getPlanName = (priceId?: string | null) => {
    if (!priceId) return "No Plan";
    if (priceId === pricePersonal) return "Personal";
    if (priceId === pricePro) return "Pro";
    if (priceId === priceBusiness) return "Business";
    if (priceId === priceTemp) return "Temporary Access";
    return "Unknown Plan";
  };

  const getPlanPrice = (priceId?: string | null) => {
    if (priceId === pricePersonal) return "$37.99";
    if (priceId === pricePro) return "$98";
    if (priceId === priceBusiness) return "$249.99";
    if (priceId === priceTemp) return "$9.99";
    return "$0";
  };

  // Mock invoice data - in real app, fetch from Stripe API
  const invoices = [
    { id: "inv_1", date: "2024-01-15", amount: "$98.00", status: "paid" },
    { id: "inv_2", date: "2023-12-15", amount: "$98.00", status: "paid" },
    { id: "inv_3", date: "2023-11-15", amount: "$98.00", status: "paid" },
  ];

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Personal Info + Payment Method */}
          <div className="space-y-8">
            {/* Personal Info Form */}
            <div className="rounded-xl bg-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>
              <form className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="h-12 w-full px-4 rounded-md bg-gray-800 border border-gray-700 text-white placeholder-gray-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={profile?.full_name || ""}
                    placeholder="Enter your full name"
                    className="h-12 w-full px-4 rounded-md bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto h-12 px-6 rounded-md bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Payment Method Card */}
            <div className="rounded-xl bg-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Payment Method</h2>
              {profile?.stripe_customer_id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-400">Expires 12/25</p>
                      </div>
                    </div>
                    <button className="text-red-500 hover:text-red-400 rounded-md p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={portal}
                    className="text-sm text-violet-500 hover:underline"
                  >
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">No payment method on file</p>
                  <button
                    onClick={portal}
                    className="text-sm text-violet-500 hover:underline"
                  >
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Subscription Card + Invoice History */}
          <div className="space-y-8">
            {/* Subscription Summary */}
            <div className="rounded-xl bg-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
              {subscription?.status === "active" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{getPlanName(subscription.price_id)}</h3>
                    <p className="text-2xl font-semibold text-white mt-2">{getPlanPrice(subscription.price_id)}/mo</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => portal()}
                      disabled={busy !== null}
                      className="w-full sm:w-auto h-12 px-6 rounded-md bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      Upgrade Plan
                    </button>
                    <button
                      onClick={portal}
                      disabled={busy !== null}
                      className="w-full sm:w-auto h-12 px-6 rounded-md border border-gray-600 text-white hover:bg-gray-700 text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                  {subscription.current_period_end && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-400">
                        Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        Status: <span className="text-green-500">Active</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400">No active subscription</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => go(pricePersonal)}
                      disabled={busy !== null}
                      className="w-full h-12 px-6 rounded-md bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 text-left"
                    >
                      Personal — $37.99/mo
                    </button>
                    <button
                      onClick={() => go(pricePro)}
                      disabled={busy !== null}
                      className="w-full h-12 px-6 rounded-md bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 text-left"
                    >
                      Pro — $98/mo
                    </button>
                    <button
                      onClick={() => go(priceBusiness)}
                      disabled={busy !== null}
                      className="w-full h-12 px-6 rounded-md bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 text-left"
                    >
                      Business — $249.99/mo
                    </button>
                    <button
                      onClick={() => go(priceTemp)}
                      disabled={busy !== null}
                      className="w-full h-12 px-6 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 text-left"
                    >
                      Temporary Access — $9.99 (one-time)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice History */}
            <div className="rounded-xl bg-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Invoice History</h2>
              {invoices.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="py-4 flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="text-white">{new Date(invoice.date).toLocaleDateString()}</p>
                        <p className="text-gray-400 mt-1">{invoice.amount}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="bg-green-700 text-white rounded-full px-2 py-1 text-xs">
                          {invoice.status === "paid" ? "Paid" : invoice.status}
                        </span>
                        <button className="text-violet-500 hover:underline text-sm flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No invoices yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
