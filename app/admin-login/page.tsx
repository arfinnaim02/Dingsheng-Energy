"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to login.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#061f2d] text-white lg:grid lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <Image src="/media/hero-products.jpg" alt="Dingsheng Energy industrial facility" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/40 to-[#061f2d]/88" />
        <div className="absolute bottom-16 left-16 max-w-xl">
          <div className="text-xs font-black uppercase tracking-[.2em] text-[#5ce0ad]">Dingsheng Control Center</div>
          <h1 className="mt-5 text-5xl font-black leading-[1.03] tracking-[-.04em]">Manage the catalogue with confidence.</h1>
          <p className="mt-5 text-sm leading-7 text-white/65">Products and services edited in the local admin panel update the public website immediately. The project is prepared for a later MySQL migration.</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-xl md:p-9">
          <Image src="/brand-logo-white.png" width={100} height={79} alt="Dingsheng Energy" className="h-auto w-20 object-contain" />
          <div className="mt-8 text-xs font-black uppercase tracking-[.18em] text-[#5ce0ad]">Administrator Access</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.03em]">Welcome back</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Enter the administrator password configured in your local environment file.</p>

          <form className="mt-8" onSubmit={submit}>
            <label className="text-xs font-extrabold text-white/70" htmlFor="password">Administrator password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-white/15 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-[#4fdba4] focus:ring-2 focus:ring-[#4fdba4]/15"
              autoFocus
              required
            />
            {error && <div className="mt-3 rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>}
            <button disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-[#0a9c63] text-xs font-black uppercase tracking-[.12em] transition hover:bg-[#087f52] disabled:opacity-60">
              {loading ? "Signing in..." : "Open Control Center →"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5 text-[11px] leading-5 text-white/40">
            Local default password: <strong className="text-white/70">dingsheng-admin</strong>. Change it through <code className="text-white/70">.env.local</code> before sharing the project.
          </div>
        </div>
      </section>
    </main>
  );
}
