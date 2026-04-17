"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid username or password");
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md px-8 py-10 rounded-2xl shadow-2xl" style={{ background: "#0f131d", border: "1px solid rgba(79,70,229,0.2)" }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mb-4 shadow-[0_10px_24px_rgba(79,70,229,0.18)]">
            <img src="/512x512.png" alt="Bensly Labs" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white font-sans tracking-tight">Bensly Labs Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage your apps</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-500"
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-500"
              placeholder=""
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(147,0,10,0.3)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}
          >
            {loading ? "Signing in" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

