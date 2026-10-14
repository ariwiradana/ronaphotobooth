"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleUserRound, KeyRound, Save } from "lucide-react";

type Profile = { id: number; name: string; email: string; role: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/profile").then(async (res) => {
      if (res.status === 401) { window.location.replace("/login"); return; }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Profil tidak bisa dimuat.");
      setProfile(body.user); setName(body.user.name);
    }).catch((e) => setError(e.message || "Profil tidak bisa dimuat.")).finally(() => setLoading(false));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    if (newPassword && newPassword !== confirmPassword) { setError("Konfirmasi password baru tidak sama."); return; }
    if (newPassword && newPassword.length < 12) { setError("Password baru minimal 12 karakter."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      });
      if (response.status === 401) { window.location.replace("/login"); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Gagal menyimpan profil.");
      setProfile(body.user); setName(body.user.name); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setSuccess("Profil berhasil diperbarui.");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan profil."); }
    finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 text-[#20211f] sm:px-8">
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[#656960] hover:text-black"><ArrowLeft size={16}/> Kembali ke dashboard</Link>
      <div className="mb-7 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#20211f] text-white"><CircleUserRound size={27}/></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777b72]">Akun saya</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Profil & Pengaturan</h1><p className="mt-1 text-sm text-[#777b72]">Ubah nama profil atau password akun partner.</p></div>
      </div>

      {loading ? <div className="rounded-2xl border border-[#e5e6e0] bg-white p-8 text-sm text-[#777b72]">Memuat profil...</div> : <form onSubmit={save} className="space-y-5">
        <section className="rounded-2xl border border-[#e5e6e0] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-semibold">Informasi akun</h2><p className="mt-1 text-sm text-[#777b72]">Nama ini akan digunakan sebagai identitas partner pada aktivitas berikutnya.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-2 block text-sm font-medium">Nama profil</span><input value={name} onChange={(e)=>setName(e.target.value)} required minLength={2} maxLength={120} className="w-full rounded-xl border border-[#dfe1da] px-4 py-3 outline-none focus:border-[#777e70]" placeholder="Nama partner" /></label>
            <label className="block"><span className="mb-2 block text-sm font-medium">Email login</span><input value={profile?.email ?? ""} readOnly className="w-full rounded-xl border border-[#e6e7e2] bg-[#f7f7f5] px-4 py-3 text-[#777b72]" /><span className="mt-1 block text-xs text-[#92958d]">Email login tidak bisa diubah di halaman ini.</span></label>
          </div>
          <div className="mt-4 rounded-xl bg-[#f7f7f5] p-3 text-sm text-[#666a61]">Hak akses: <strong>Partner</strong> · setara dengan partner lainnya.</div>
        </section>

        <section className="rounded-2xl border border-[#e5e6e0] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><KeyRound size={18}/><h2 className="font-semibold">Ubah password</h2></div>
          <p className="mt-1 text-sm text-[#777b72]">Kosongkan jika tidak ingin mengganti password. Password baru minimal 12 karakter.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium">Password saat ini</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="w-full rounded-xl border border-[#dfe1da] px-4 py-3 outline-none focus:border-[#777e70]" placeholder="Wajib diisi jika mengganti password" /></label>
            <label className="block"><span className="mb-2 block text-sm font-medium">Password baru</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full rounded-xl border border-[#dfe1da] px-4 py-3 outline-none focus:border-[#777e70]" placeholder="Minimal 12 karakter" /></label>
            <label className="block"><span className="mb-2 block text-sm font-medium">Konfirmasi password baru</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-[#dfe1da] px-4 py-3 outline-none focus:border-[#777e70]" placeholder="Ulangi password baru" /></label>
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17}/>{success}</p>}
        <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#20211f] px-5 py-3 text-sm font-medium text-white hover:bg-[#383a36] disabled:opacity-60"><Save size={16}/>{saving ? "Menyimpan..." : "Simpan perubahan"}</button></div>
      </form>}
    </div>
  </main>;
}
