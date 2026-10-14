"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Camera, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login gagal.");
      }

      const next = params.get("next") ?? "/";

      // Cegah redirect ke domain eksternal.
      const safeNext =
        next.startsWith("/") &&
        !next.startsWith("//") &&
        !next.startsWith("/\\")
          ? next
          : "/";

      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-10 text-[#20211f]">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#20211f] text-white">
            <Camera size={25} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7068]">
            Rona Photobooth Bali
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-[#73766f]">
            Masuk ke Rona Management
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={submit}
          className="rounded-3xl border border-[#e6e7e2] bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="mb-2 block text-sm font-medium" htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="partner@rona.com"
            className="mb-5 w-full rounded-xl border border-[#dfe1da] px-4 py-3 outline-none transition focus:border-[#777e70]"
          />

          <label className="mb-2 block text-sm font-medium" htmlFor="password">
            Password
          </label>

          <div className="relative mb-4">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-xl border border-[#dfe1da] px-4 py-3 pr-12 outline-none transition focus:border-[#777e70]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Lihat password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#73766f] hover:bg-[#f2f3ef]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20211f] px-4 py-3 font-medium text-white transition hover:bg-[#383a36] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole size={17} />
            {loading ? "Memeriksa..." : "Login"}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-[#858880]">
            Akses khusus partner Rona. Kedua partner memiliki hak akses yang
            setara.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-[#9a9c96]">
          Rona Management · Internal workspace
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
          <p className="text-sm text-[#73766f]">Memuat halaman login...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
