"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  ReceiptText,
  Package,
  Users,
  ChartNoAxesCombined,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Trash2,
  CheckCircle2,
  Clock3,
  X,
  Download,
  CircleDollarSign,
  Banknote,
  Pencil,
  RotateCcw,
  LogOut,
  CircleUserRound,
} from "lucide-react";

type Tab =
  | "Dashboard"
  | "Booking"
  | "Kas & Transaksi"
  | "Reimburse"
  | "Inventaris"
  | "Partner & Modal"
  | "Laporan";
type Booking = {
  id: string;
  client: string;
  phone: string;
  event: string;
  date: string;
  venue: string;
  packageName: string;
  total: number;
  paid: number;
  status: string;
  notes: string;
};
type Transaction = {
  id: string;
  date: string;
  direction: "Masuk" | "Keluar";
  category: string;
  description: string;
  amount: number;
  account: string;
  paidBy: string;
  linkedReimbursement?: string;
  linkedAssetId?: string;
  affectsCash?: boolean;
};
type Reimbursement = {
  id: string;
  partner: string;
  date: string;
  description: string;
  amount: number;
  paid: number;
  status: "Menunggu" | "Disetujui" | "Dibayar sebagian" | "Lunas" | "Ditolak";
  type: string;
};
type Asset = {
  id: string;
  name: string;
  category: string;
  date: string;
  price: number;
  paidBy: string;
  reimbursementId: string;
  condition: string;
  location: string;
};
type Partner = { id: string; name: string };
type State = {
  bookings: Booking[];
  transactions: Transaction[];
  reimbursements: Reimbursement[];
  assets: Asset[];
  partners: Partner[];
};

const KEY = "rona-management-v2";
const today = () => new Date().toISOString().slice(0, 10);
const id = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const dateLabel = (d: string) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const seed: State = {
  partners: [
    { id: "p1", name: "Partner 1" },
    { id: "p2", name: "Partner 2" },
  ],

  bookings: [
    {
      id: "RNA-001",
      client: "Contoh Klien",
      phone: "",
      event: "Event",
      date: "",
      venue: "",
      packageName: "Paket Photobooth",
      total: 0,
      paid: 0,
      status: "Inquiry",
      notes: "",
    },
  ],

  transactions: [],

  reimbursements: [],

  assets: [],
};

function readState(): State {
  if (typeof window === "undefined") return seed;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as State;
    localStorage.setItem(KEY, JSON.stringify(seed));
  } catch {}
  return seed;
}
function saveState(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\\r\\n");
  const blob = new Blob(["\\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
const nav: { label: Tab; icon: typeof Wallet }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Booking", icon: CalendarDays },
  { label: "Kas & Transaksi", icon: Wallet },
  { label: "Reimburse", icon: ReceiptText },
  { label: "Inventaris", icon: Package },
  { label: "Partner & Modal", icon: Users },
  { label: "Laporan", icon: ChartNoAxesCombined },
];

function Button({
  children,
  onClick,
  secondary = false,
  danger = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  danger?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${danger ? "border border-rose-200 text-rose-700 hover:bg-rose-50" : secondary ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
    >
      {children}
    </button>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
function Metric({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="rounded-xl bg-zinc-100 p-2.5 text-zinc-700">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "amber" | "red" | "blue";
}) {
  const cls = {
    gray: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
  }[tone];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-zinc-400">{text}</div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [data, setData] = useState<State>(seed);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "loading" | "saved" | "saving" | "error"
  >("loading");
  const [canSync, setCanSync] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<
    "booking" | "transaction" | "reimbursement" | "asset" | "partner" | null
  >(null);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(
    null,
  );
  const [loggedInUser, setLoggedInUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/workspace", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Data workspace gagal dimuat.");
        if (active) {
          setData(body.state);
          setSyncStatus("saved");
          setCanSync(true);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setSyncStatus("error");
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/profile")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Profil tidak bisa dimuat");
        if (active)
          setLoggedInUser({ name: body.user.name, email: body.user.email });
      })
      .catch(() => {
        if (active) setLoggedInUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }
  useEffect(() => {
    if (!ready || !canSync) return;
    setSyncStatus("saving");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: data }),
        });
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Gagal menyimpan ke database.");
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [data, ready, canSync]);

  const totalBookingValue = data.bookings
    .filter((b) => b.status !== "Dibatalkan")
    .reduce((s, b) => s + b.total, 0);
  const totalReceived = data.transactions
    .filter((t) => t.direction === "Masuk" && t.affectsCash !== false)
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = data.transactions
    .filter((t) => t.direction === "Keluar" && t.affectsCash !== false)
    .reduce((s, t) => s + t.amount, 0);
  const cashBalance = totalReceived - totalOut;
  const outstanding = data.reimbursements
    .filter((r) => r.status !== "Ditolak")
    .reduce((s, r) => s + Math.max(0, r.amount - r.paid), 0);
  const outstandingClient = data.bookings.reduce(
    (s, b) => s + Math.max(0, b.total - b.paid),
    0,
  );
  const inventoryValue = data.assets
    .filter((a) => a.condition !== "Dijual" && a.condition !== "Dihapus")
    .reduce((s, a) => s + a.price, 0);
  const filteredBookings = data.bookings.filter((b) =>
    `${b.client} ${b.event} ${b.id} ${b.packageName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const filteredTx = data.transactions.filter((t) =>
    `${t.description} ${t.category} ${t.paidBy}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function addBooking(form: FormData) {
    const total = Number(form.get("total") || 0);
    const paid = Number(form.get("paid") || 0);
    const booking: Booking = {
      id: editingBooking || `RNA-${String(Date.now()).slice(-5)}`,
      client: String(form.get("client") || ""),
      phone: String(form.get("phone") || ""),
      event: String(form.get("event") || ""),
      date: String(form.get("date") || today()),
      venue: String(form.get("venue") || ""),
      packageName: String(form.get("packageName") || "Custom"),
      total,
      paid,
      status: String(form.get("status") || "Inquiry"),
      notes: String(form.get("notes") || ""),
    };
    setData((prev) => {
      const old = prev.bookings.find((b) => b.id === editingBooking);
      let transactions = prev.transactions;
      if (!old && paid > 0)
        transactions = [
          ...transactions,
          {
            id: id(),
            date: today(),
            direction: "Masuk",
            category: "Pembayaran booking",
            description: `Pembayaran awal ${booking.id} · ${booking.client}`,
            amount: paid,
            account: "Kas Rona",
            paidBy: "Klien",
          },
        ];
      if (old && paid > old.paid)
        transactions = [
          ...transactions,
          {
            id: id(),
            date: today(),
            direction: "Masuk",
            category: "Pembayaran booking",
            description: `Pembayaran booking ${booking.id}`,
            amount: paid - old.paid,
            account: "Kas Rona",
            paidBy: "Klien",
          },
        ];
      return {
        ...prev,
        bookings: old
          ? prev.bookings.map((b) => (b.id === editingBooking ? booking : b))
          : [booking, ...prev.bookings],
        transactions,
      };
    });
    setModal(null);
    setEditingBooking(null);
  }
  function addTransaction(form: FormData) {
    const amount = Number(form.get("amount") || 0);
    const date = String(form.get("date") || today());
    const direction = String(form.get("direction") || "Keluar") as
      | "Masuk"
      | "Keluar";
    const category = String(form.get("category") || "Lainnya");
    const description = String(form.get("description") || "");
    const paidBy = String(form.get("paidBy") || "Kas bisnis");
    const recordAsAsset = form.get("recordAsAsset") === "on";

    if (editingTransaction) {
      const old = data.transactions.find((t) => t.id === editingTransaction);
      if (!old) return;
      if (old.linkedAssetId || old.linkedReimbursement) {
        alert(
          "Transaksi terhubung ke inventaris/reimburse dan tidak bisa diedit langsung agar saldo tetap konsisten. Edit catatan terkait atau batalkan catatan pembelian terlebih dahulu.",
        );
        return;
      }
      if (recordAsAsset) {
        alert(
          "Untuk menautkan transaksi lama ke inventaris, buat ulang transaksi dengan checkbox inventaris agar hubungan aset dan reimburse terbentuk dengan benar.",
        );
        return;
      }
      const updated: Transaction = {
        ...old,
        date,
        direction,
        category,
        description,
        amount,
        paidBy,
        account: "Kas Rona",
        affectsCash: paidBy === "Kas bisnis" || paidBy === "Klien",
      };
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === editingTransaction ? updated : t,
        ),
      }));
      setModal(null);
      setEditingTransaction(null);
      return;
    }

    if (recordAsAsset && direction !== "Keluar") {
      alert("Inventaris hanya bisa dicatat dari transaksi pengeluaran.");
      return;
    }
    const assetId = recordAsAsset
      ? `AST-${String(Date.now()).slice(-5)}`
      : undefined;
    const reimbursementId =
      recordAsAsset && paidBy !== "Kas bisnis" && paidBy !== "Klien"
        ? `REI-${String(Date.now() + 1).slice(-5)}`
        : undefined;
    const tx: Transaction = {
      id: id(),
      date,
      direction,
      category: recordAsAsset ? "Pembelian aset" : category,
      description,
      amount,
      account: "Kas Rona",
      paidBy,
      affectsCash: !(
        recordAsAsset &&
        paidBy !== "Kas bisnis" &&
        paidBy !== "Klien"
      ),
      linkedAssetId: assetId,
      linkedReimbursement: reimbursementId,
    };
    setData((prev) => {
      const assets = recordAsAsset
        ? [
            {
              id: assetId!,
              name: description,
              category: "Perlengkapan",
              date,
              price: amount,
              paidBy: paidBy === "Kas bisnis" ? "Kas Rona" : paidBy,
              reimbursementId: reimbursementId || "",
              condition: "Baik",
              location: "",
            },
            ...prev.assets,
          ]
        : prev.assets;
      const reimbursements = reimbursementId
        ? [
            {
              id: reimbursementId,
              partner: paidBy,
              date,
              description: `Pembelian aset: ${description}`,
              amount,
              paid: 0,
              status: "Menunggu" as const,
              type: "Aset",
            },
            ...prev.reimbursements,
          ]
        : prev.reimbursements;
      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        assets,
        reimbursements,
      };
    });
    setModal(null);
    setEditingTransaction(null);
  }
  function addReimbursement(form: FormData) {
    const partner = String(
      form.get("partner") || data.partners[0]?.name || "Saya",
    );
    const amount = Number(form.get("amount") || 0);
    const type = String(form.get("type") || "Operasional");
    const reimbursement: Reimbursement = {
      id: `REI-${String(Date.now()).slice(-5)}`,
      partner,
      date: String(form.get("date") || today()),
      description: String(form.get("description") || ""),
      amount,
      paid: 0,
      status: "Menunggu",
      type,
    };
    setData((prev) => ({
      ...prev,
      reimbursements: [reimbursement, ...prev.reimbursements],
    }));
    setModal(null);
  }
  function addAsset(form: FormData) {
    const assetId = `AST-${String(Date.now()).slice(-5)}`;
    const name = String(form.get("name") || "");
    const price = Number(form.get("price") || 0);
    const paidBy = String(
      form.get("paidBy") || data.partners[0]?.name || "Saya",
    );
    const reimbursementId = `REI-${String(Date.now()).slice(-5)}`;
    const r: Reimbursement = {
      id: reimbursementId,
      partner: paidBy,
      date: String(form.get("date") || today()),
      description: `Pembelian aset: ${name}`,
      amount: price,
      paid: 0,
      status: "Menunggu",
      type: "Aset",
    };
    const asset: Asset = {
      id: assetId,
      name,
      category: String(form.get("category") || "Peralatan"),
      date: String(form.get("date") || today()),
      price,
      paidBy,
      reimbursementId,
      condition: String(form.get("condition") || "Baik"),
      location: String(form.get("location") || ""),
    };
    setData((prev) => ({
      ...prev,
      assets: [asset, ...prev.assets],
      reimbursements: [r, ...prev.reimbursements],
    }));
    setModal(null);
  }
  function payReimbursement(rid: string, amount: number) {
    const r = data.reimbursements.find((x) => x.id === rid);
    if (!r) return;
    const paidNow = Math.min(Math.max(amount, 0), r.amount - r.paid);
    if (paidNow <= 0) return;
    setData((prev) => ({
      ...prev,
      reimbursements: prev.reimbursements.map((x) =>
        x.id === rid
          ? {
              ...x,
              paid: x.paid + paidNow,
              status:
                x.paid + paidNow >= x.amount ? "Lunas" : "Dibayar sebagian",
            }
          : x,
      ),
      transactions: [
        ...prev.transactions,
        {
          id: id(),
          date: today(),
          direction: "Keluar",
          category: "Pembayaran reimburse",
          description: `Reimburse ${r.partner} · ${r.description}`,
          amount: paidNow,
          account: "Kas Rona",
          paidBy: "Kas bisnis",
          linkedReimbursement: rid,
        },
      ],
    }));
  }
  function updateBookingStatus(bid: string, status: string) {
    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === bid ? { ...b, status } : b)),
    }));
  }
  function removeTransaction(tid: string) {
    const tx = data.transactions.find((t) => t.id === tid);
    if (!tx) return;
    const linkedAsset = tx.linkedAssetId
      ? data.assets.find((a) => a.id === tx.linkedAssetId)
      : undefined;
    const linkedReimburse = tx.linkedReimbursement
      ? data.reimbursements.find((r) => r.id === tx.linkedReimbursement)
      : undefined;
    const warning = [
      `Hapus transaksi “${tx.description}” sebesar ${rupiah(tx.amount)}?`,
      linkedAsset
        ? `Aset ${linkedAsset.name} dan reimburse terkait juga akan dihapus.`
        : "",
      linkedReimburse && !linkedAsset
        ? "Nilai pembayaran akan dikembalikan ke saldo reimburse terkait."
        : "",
      "Saldo kas dan laporan akan dihitung ulang.",
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!confirm(warning)) return;
    setData((prev) => {
      let reimbursements = prev.reimbursements;
      let assets = prev.assets;
      let transactions = prev.transactions.filter((t) => t.id !== tid);
      if (linkedAsset) {
        const rid = linkedAsset.reimbursementId;
        assets = assets.filter((a) => a.id !== linkedAsset.id);
        reimbursements = reimbursements.filter((r) => r.id !== rid);
        transactions = transactions.filter(
          (t) =>
            t.linkedAssetId !== linkedAsset.id && t.linkedReimbursement !== rid,
        );
      } else if (linkedReimburse) {
        const newPaid = Math.max(0, linkedReimburse.paid - tx.amount);
        reimbursements = reimbursements.map((r) =>
          r.id === linkedReimburse.id
            ? {
                ...r,
                paid: newPaid,
                status:
                  newPaid === 0
                    ? "Menunggu"
                    : newPaid >= r.amount
                      ? "Lunas"
                      : "Dibayar sebagian",
              }
            : r,
        );
      }
      return { ...prev, transactions, assets, reimbursements };
    });
  }
  function editReimbursement(r: Reimbursement) {
    const description = prompt("Keterangan reimburse:", r.description);
    if (description === null) return;
    const amountText = prompt(
      "Total reimburse (Rp), minimal sebesar yang sudah dibayar:",
      String(r.amount),
    );
    if (amountText === null) return;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount < r.paid || amount <= 0) {
      alert(
        "Nominal tidak valid atau lebih kecil dari nominal yang sudah dibayar.",
      );
      return;
    }
    const partner = prompt("Nama partner pembayar:", r.partner);
    if (partner === null) return;
    const date = prompt("Tanggal (YYYY-MM-DD):", r.date);
    if (date === null) return;
    const type = prompt("Jenis reimburse:", r.type);
    if (type === null) return;
    const status: Reimbursement["status"] =
      r.paid >= amount ? "Lunas" : r.paid > 0 ? "Dibayar sebagian" : r.status;
    setData((prev) => ({
      ...prev,
      reimbursements: prev.reimbursements.map((x) =>
        x.id === r.id
          ? { ...x, description, amount, partner, date, type, status }
          : x,
      ),
    }));
  }
  function editAsset(a: Asset) {
    const name = prompt("Nama aset:", a.name);
    if (name === null) return;
    const category = prompt("Kategori:", a.category);
    if (category === null) return;
    const priceText = prompt("Harga perolehan (Rp):", String(a.price));
    if (priceText === null) return;
    const price = Number(priceText);
    if (!Number.isFinite(price) || price <= 0) {
      alert("Harga tidak valid.");
      return;
    }
    const linkedReimburseCurrent = data.reimbursements.find(
      (r) => r.id === a.reimbursementId,
    );
    if (linkedReimburseCurrent && price < linkedReimburseCurrent.paid) {
      alert(
        "Harga aset tidak boleh lebih kecil dari reimburse yang sudah dibayar.",
      );
      return;
    }
    const date = prompt("Tanggal beli (YYYY-MM-DD):", a.date);
    if (date === null) return;
    const condition = prompt("Kondisi:", a.condition);
    if (condition === null) return;
    const location = prompt("Lokasi penyimpanan:", a.location);
    if (location === null) return;
    setData((prev) => ({
      ...prev,
      assets: prev.assets.map((x) =>
        x.id === a.id
          ? { ...x, name, category, price, date, condition, location }
          : x,
      ),
      reimbursements: a.reimbursementId
        ? prev.reimbursements.map((r) =>
            r.id === a.reimbursementId
              ? {
                  ...r,
                  description: `Pembelian aset: ${name}`,
                  amount: price,
                  date,
                }
              : r,
          )
        : prev.reimbursements,
      transactions: prev.transactions.map((t) =>
        t.linkedAssetId === a.id
          ? { ...t, description: name, amount: price, date }
          : t,
      ),
    }));
  }
  function removeBooking(bid: string) {
    if (
      confirm(
        "Hapus booking ini? Riwayat transaksi yang sudah tercatat tidak ikut dihapus.",
      )
    )
      setData((prev) => ({
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== bid),
      }));
  }
  function removeReimbursement(rid: string) {
    const reimbursement = data.reimbursements.find((r) => r.id === rid);
    if (!reimbursement) return;
    const linkedAsset = data.assets.find((a) => a.reimbursementId === rid);
    const linkedPayments = data.transactions.filter(
      (t) => t.linkedReimbursement === rid,
    ).length;
    const warning =
      `Hapus reimburse ${reimbursement.id} — ${reimbursement.description}?\n\n` +
      (linkedAsset
        ? `Aset terkait “${linkedAsset.name}” juga akan dihapus.\n`
        : "") +
      (linkedPayments
        ? `${linkedPayments} transaksi pembayaran terkait juga akan dihapus dari laporan kas.\n`
        : "") +
      `Tindakan ini untuk membatalkan catatan yang salah dan tidak bisa diurungkan.`;
    if (!confirm(warning)) return;
    setData((prev) => ({
      ...prev,
      reimbursements: prev.reimbursements.filter((r) => r.id !== rid),
      assets: prev.assets.filter((a) => a.reimbursementId !== rid),
      transactions: prev.transactions.filter(
        (t) =>
          t.linkedReimbursement !== rid &&
          !prev.assets.some(
            (a) => a.reimbursementId === rid && t.linkedAssetId === a.id,
          ),
      ),
    }));
  }
  function removeAsset(assetId: string) {
    const asset = data.assets.find((a) => a.id === assetId);
    if (!asset) return;
    const linkedReimbursement = data.reimbursements.find(
      (r) => r.id === asset.reimbursementId,
    );
    const linkedPayments = data.transactions.filter(
      (t) => t.linkedReimbursement === asset.reimbursementId,
    ).length;
    const warning =
      `Hapus aset “${asset.name}” (${asset.id})?\n\n` +
      (linkedReimbursement
        ? `Reimburse terkait ${linkedReimbursement.id} juga akan dihapus.\n`
        : "") +
      (linkedPayments
        ? `${linkedPayments} transaksi pembayaran reimburse terkait juga akan dihapus dari laporan kas.\n`
        : "") +
      `Gunakan ini hanya jika catatan pembelian memang salah. Tindakan ini tidak bisa diurungkan.`;
    if (!confirm(warning)) return;
    setData((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== assetId),
      reimbursements: prev.reimbursements.filter(
        (r) => r.id !== asset.reimbursementId,
      ),
      transactions: prev.transactions.filter(
        (t) =>
          t.linkedReimbursement !== asset.reimbursementId &&
          t.linkedAssetId !== assetId,
      ),
    }));
  }
  function addPartner(form: FormData) {
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    setData((prev) => ({
      ...prev,
      partners: [...prev.partners, { id: id(), name }],
    }));
    setModal(null);
  }
  function exportTransactions() {
    downloadCsv("rona-transactions.csv", [
      [
        "Tanggal",
        "Arah",
        "Kategori",
        "Deskripsi",
        "Nominal",
        "Akun",
        "Pembayar",
      ],
      ...data.transactions.map((t) => [
        t.date,
        t.direction,
        t.category,
        t.description,
        t.amount,
        t.account,
        t.paidBy,
      ]),
    ]);
  }
  function exportBookings() {
    downloadCsv("rona-bookings.csv", [
      [
        "Kode",
        "Klien",
        "Event",
        "Tanggal",
        "Paket",
        "Total",
        "Dibayar",
        "Sisa",
        "Status",
      ],
      ...data.bookings.map((b) => [
        b.id,
        b.client,
        b.event,
        b.date,
        b.packageName,
        b.total,
        b.paid,
        Math.max(0, b.total - b.paid),
        b.status,
      ]),
    ]);
  }

  const heading: Record<Tab, string> = {
    Dashboard: "Dashboard",
    Booking: "Booking management",
    "Kas & Transaksi": "Kas & transaksi",
    Reimburse: "Reimburse partner",
    Inventaris: "Inventaris aset",
    "Partner & Modal": "Partner & modal",
    Laporan: "Laporan keuangan",
  };
  const subheading: Record<Tab, string> = {
    Dashboard: "Ringkasan operasional dan keuangan Rona.",
    Booking: "Kelola klien, paket, jadwal, dan pembayaran.",
    "Kas & Transaksi": "Catat semua uang yang benar-benar masuk dan keluar.",
    Reimburse: "Pantau penggantian uang pribadi partner oleh bisnis.",
    Inventaris:
      "Aset milik Rona, termasuk yang dibeli menggunakan uang pribadi partner.",
    "Partner & Modal": "Daftar partner dan catatan kontribusi/pembelian.",
    Laporan: "Ringkasan berdasarkan transaksi yang sudah tercatat di aplikasi.",
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-[248px] shrink-0 border-r border-zinc-200 bg-white p-5 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <Camera size={21} />
          </div>
          <div>
            <p className="font-semibold tracking-tight">
              rona<span className="text-zinc-400">.</span>
            </p>
            <p className="text-[11px] text-zinc-500">PHOTObooth management</p>
          </div>
        </div>
        <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Workspace
        </p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setTab(item.label);
                setSearch("");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${tab === item.label ? "bg-zinc-950 font-medium text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs font-semibold">Rona Photobooth Bali</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Booking, aset, kas, dan keuangan partner.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${syncStatus === "saved" ? "bg-emerald-500" : syncStatus === "error" ? "bg-rose-500" : "bg-amber-400"}`}
            />
            <span className="text-[11px] text-zinc-500">
              {syncStatus === "saved"
                ? "Tersinkron ke PostgreSQL"
                : syncStatus === "saving"
                  ? "Menyimpan..."
                  : syncStatus === "loading"
                    ? "Memuat data..."
                    : "Gagal sinkron · cek koneksi"}
            </span>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 md:px-8">
          <div>
            <p className="text-xs text-zinc-400">Rona / Workspace</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              {heading[tab]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <CircleUserRound size={16} />
              <span className="hidden sm:inline">
                {loggedInUser?.name || "Profil & Pengaturan"}
              </span>
              <span className="sm:hidden">Profil</span>
            </Link>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">
                {loggingOut ? "Keluar..." : "Logout"}
              </span>
            </button>
          </div>
        </header>
        <div
          className={`border-b px-5 py-2.5 text-xs md:px-8 ${syncStatus === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
        >
          {syncStatus === "error"
            ? "Data belum tersimpan ke PostgreSQL. Periksa DATABASE_URL dan migrasi database sebelum melanjutkan transaksi."
            : "Data workspace disimpan ke PostgreSQL dan digunakan bersama oleh kedua partner."}
        </div>
        <div className="mx-auto max-w-[1440px] space-y-6 p-5 md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-zinc-500">{dateLabel(today())}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {heading[tab]}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{subheading[tab]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tab === "Booking" && (
                <Button
                  onClick={() => {
                    setEditingBooking(null);
                    setModal("booking");
                  }}
                >
                  <Plus size={16} /> Booking baru
                </Button>
              )}
              {tab === "Kas & Transaksi" && (
                <>
                  <Button secondary onClick={exportTransactions}>
                    <Download size={15} /> Ekspor CSV
                  </Button>
                  <Button onClick={() => setModal("transaction")}>
                    <Plus size={16} /> Transaksi
                  </Button>
                </>
              )}
              {tab === "Reimburse" && (
                <Button onClick={() => setModal("reimbursement")}>
                  <Plus size={16} /> Ajukan reimburse
                </Button>
              )}
              {tab === "Inventaris" && (
                <Button onClick={() => setModal("asset")}>
                  <Plus size={16} /> Tambah aset
                </Button>
              )}

              {tab === "Laporan" && (
                <Button secondary onClick={exportTransactions}>
                  <Download size={15} /> Ekspor transaksi
                </Button>
              )}
            </div>
          </div>

          {tab === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  title="Saldo kas tercatat"
                  value={rupiah(cashBalance)}
                  hint="Total kas masuk dikurangi kas keluar"
                  icon={Wallet}
                />
                <Metric
                  title="Nilai booking"
                  value={rupiah(totalBookingValue)}
                  hint="Nilai booking yang tidak dibatalkan"
                  icon={CalendarDays}
                />
                <Metric
                  title="Piutang klien"
                  value={rupiah(outstandingClient)}
                  hint="Total booking dikurangi pembayaran tercatat"
                  icon={CircleDollarSign}
                />
                <Metric
                  title="Reimburse belum dibayar"
                  value={rupiah(outstanding)}
                  hint="Kewajiban Rona kepada partner"
                  icon={ReceiptText}
                />
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-100 p-5">
                    <div>
                      <h3 className="font-semibold">Booking terdekat</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Jadwal event mendatang
                      </p>
                    </div>
                    <Button secondary onClick={() => setTab("Booking")}>
                      Lihat booking
                    </Button>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {data.bookings
                      .filter((b) => b.status !== "Dibatalkan")
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .slice(0, 5)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-4"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {b.client}{" "}
                              <span className="text-xs text-zinc-400">
                                · {b.id}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {b.event} · {dateLabel(b.date)} · {b.packageName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {rupiah(b.total)}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Sisa {rupiah(Math.max(0, b.total - b.paid))}
                            </p>
                          </div>
                        </div>
                      ))}
                    {data.bookings.length === 0 && (
                      <Empty text="Belum ada booking. Tambahkan booking pertama." />
                    )}
                  </div>
                </section>
                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-100 p-5">
                    <h3 className="font-semibold">Transaksi terbaru</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Kas masuk dan keluar
                    </p>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {data.transactions
                      .slice(-5)
                      .reverse()
                      .map((t) => (
                        <div key={t.id} className="flex items-center gap-3 p-4">
                          <div
                            className={`rounded-xl p-2.5 ${t.direction === "Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {t.direction === "Masuk" ? (
                              <ArrowDownLeft size={17} />
                            ) : (
                              <ArrowUpRight size={17} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {t.description}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {t.category} · {dateLabel(t.date)}
                            </p>
                          </div>
                          <p
                            className={`whitespace-nowrap text-sm font-semibold ${t.direction === "Masuk" ? "text-emerald-700" : ""}`}
                          >
                            {t.direction === "Masuk" ? "+" : "−"}
                            {rupiah(t.amount)}
                          </p>
                        </div>
                      ))}
                    {data.transactions.length === 0 && (
                      <Empty text="Belum ada transaksi." />
                    )}
                  </div>
                </section>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric
                  title="Nilai inventaris"
                  value={rupiah(inventoryValue)}
                  hint={`${data.assets.length} aset tercatat`}
                  icon={Package}
                />
                <Metric
                  title="Total kas masuk"
                  value={rupiah(totalReceived)}
                  hint="Termasuk pembayaran booking"
                  icon={ArrowDownLeft}
                />
                <Metric
                  title="Total kas keluar"
                  value={rupiah(totalOut)}
                  hint="Termasuk reimburse yang dibayar"
                  icon={ArrowUpRight}
                />
              </div>
            </div>
          )}

          {tab === "Booking" && (
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Daftar booking</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {data.bookings.length} booking tersimpan
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="absolute left-3 top-3 text-zinc-400"
                    size={16}
                  />
                  <input
                    className="pl-9"
                    placeholder="Cari klien, event, kode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button secondary onClick={exportBookings}>
                  <Download size={15} /> CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500">
                    <tr>
                      {[
                        "Klien / event",
                        "Tanggal",
                        "Paket",
                        "Nilai booking",
                        "Dibayar / sisa",
                        "Status",
                        "Aksi",
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="border-t border-zinc-100">
                        <td className="px-4 py-4">
                          <p className="font-medium">{b.client}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {b.event} · {b.id}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {b.phone || "Tanpa nomor telepon"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {dateLabel(b.date)}
                          <p className="mt-1 text-xs text-zinc-400">
                            {b.venue}
                          </p>
                        </td>
                        <td className="px-4 py-4">{b.packageName}</td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium">
                          {rupiah(b.total)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {rupiah(b.paid)}
                          <p className="mt-1 text-xs text-zinc-500">
                            Sisa {rupiah(Math.max(0, b.total - b.paid))}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            aria-label="Status booking"
                            value={b.status}
                            onChange={(e) =>
                              updateBookingStatus(b.id, e.target.value)
                            }
                            className="max-w-36 text-xs"
                          >
                            <option>Inquiry</option>
                            <option>Penawaran</option>
                            <option>Dikonfirmasi</option>
                            <option>Selesai</option>
                            <option>Dibatalkan</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              title="Edit booking"
                              onClick={() => {
                                setEditingBooking(b.id);
                                setModal("booking");
                              }}
                              className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              title="Hapus booking"
                              onClick={() => removeBooking(b.id)}
                              className="rounded-lg border border-zinc-200 p-2 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBookings.length === 0 && (
                  <Empty text="Booking tidak ditemukan." />
                )}
              </div>
            </section>
          )}

          {tab === "Kas & Transaksi" && (
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Ledger kas</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Saldo berjalan sederhana dari transaksi yang dicatat
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="absolute left-3 top-3 text-zinc-400"
                    size={16}
                  />
                  <input
                    className="pl-9"
                    placeholder="Cari transaksi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500">
                    <tr>
                      {[
                        "Tanggal",
                        "Deskripsi",
                        "Kategori",
                        "Pembayar / sumber",
                        "Arah",
                        "Nominal",
                        "Aksi",
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx
                      .slice()
                      .reverse()
                      .map((t) => (
                        <tr key={t.id} className="border-t border-zinc-100">
                          <td className="whitespace-nowrap px-4 py-4">
                            {dateLabel(t.date)}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {t.description}
                          </td>
                          <td className="px-4 py-4">{t.category}</td>
                          <td className="px-4 py-4">
                            {t.paidBy}
                            <p className="mt-1 text-xs text-zinc-400">
                              {t.account}
                              {t.affectsCash === false
                                ? " · Tidak memengaruhi saldo kas (dibayar pribadi)"
                                : ""}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <Pill
                              tone={t.direction === "Masuk" ? "green" : "red"}
                            >
                              {t.direction}
                            </Pill>
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-4 font-semibold ${t.direction === "Masuk" ? "text-emerald-700" : ""}`}
                          >
                            {t.direction === "Masuk" ? "+" : "−"}
                            {rupiah(t.amount)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                title="Edit transaksi"
                                onClick={() => {
                                  setEditingTransaction(t.id);
                                  setModal("transaction");
                                }}
                                className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                title="Hapus transaksi"
                                onClick={() => removeTransaction(t.id)}
                                className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {filteredTx.length === 0 && (
                  <Empty text="Belum ada transaksi." />
                )}
              </div>
            </section>
          )}

          {tab === "Reimburse" && (
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Daftar reimburse</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Pembelian pribadi untuk kebutuhan bisnis yang harus
                      diganti Rona.
                    </p>
                  </div>
                  <Pill tone="amber">{rupiah(outstanding)} belum dibayar</Pill>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500">
                    <tr>
                      {[
                        "Tanggal",
                        "Partner",
                        "Keterangan",
                        "Jenis",
                        "Total",
                        "Dibayar",
                        "Status",
                        "Aksi",
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.reimbursements.map((r) => (
                      <tr key={r.id} className="border-t border-zinc-100">
                        <td className="whitespace-nowrap px-4 py-4">
                          {dateLabel(r.date)}
                        </td>
                        <td className="px-4 py-4 font-medium">{r.partner}</td>
                        <td className="px-4 py-4">
                          {r.description}
                          <p className="mt-1 text-xs text-zinc-400">{r.id}</p>
                        </td>
                        <td className="px-4 py-4">{r.type}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {rupiah(r.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {rupiah(r.paid)}
                          <p className="mt-1 text-xs text-zinc-500">
                            Sisa {rupiah(r.amount - r.paid)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <Pill
                            tone={
                              r.status === "Lunas"
                                ? "green"
                                : r.status === "Ditolak"
                                  ? "red"
                                  : r.status === "Menunggu"
                                    ? "amber"
                                    : "blue"
                            }
                          >
                            {r.status}
                          </Pill>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {r.status === "Menunggu" && (
                              <button
                                onClick={() =>
                                  setData((prev) => ({
                                    ...prev,
                                    reimbursements: prev.reimbursements.map(
                                      (x) =>
                                        x.id === r.id
                                          ? { ...x, status: "Disetujui" }
                                          : x,
                                    ),
                                  }))
                                }
                                className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs hover:bg-zinc-50"
                              >
                                Setujui
                              </button>
                            )}
                            {r.status !== "Lunas" && r.status !== "Ditolak" && (
                              <button
                                onClick={() => {
                                  const remain = r.amount - r.paid;
                                  const input = prompt(
                                    `Nominal pembayaran (sisa ${rupiah(remain)}):`,
                                    String(remain),
                                  );
                                  if (input !== null && Number(input) > 0)
                                    payReimbursement(r.id, Number(input));
                                }}
                                className="rounded-lg bg-zinc-950 px-2 py-1.5 text-xs text-white"
                              >
                                Bayar
                              </button>
                            )}
                            <button
                              title="Edit reimburse"
                              onClick={() => editReimbursement(r)}
                              className="rounded-lg border border-zinc-200 p-1.5 hover:bg-zinc-50"
                              aria-label={`Edit reimburse ${r.id}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              title="Hapus reimburse"
                              onClick={() => removeReimbursement(r.id)}
                              className="rounded-lg border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50"
                              aria-label={`Hapus reimburse ${r.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.reimbursements.length === 0 && (
                  <Empty text="Belum ada reimburse." />
                )}
              </div>
              <div className="border-t border-zinc-100 bg-zinc-50/70 p-4 text-xs leading-5 text-zinc-500">
                Pembayaran reimburse dicatat sebagai arus kas keluar dan
                mengurangi saldo kewajiban. Nilai pembelian aset tidak dihitung
                sebagai pengeluaran kedua kali saat reimburse dibayar.
              </div>
            </section>
          )}

          {tab === "Inventaris" && (
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 p-5">
                <div>
                  <h3 className="font-semibold">Inventaris Rona</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {data.assets.length} aset · total harga perolehan{" "}
                    {rupiah(inventoryValue)}
                  </p>
                </div>
                <Package className="text-zinc-400" size={20} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500">
                    <tr>
                      {[
                        "Kode",
                        "Nama aset",
                        "Kategori",
                        "Tanggal beli",
                        "Harga perolehan",
                        "Dibeli oleh",
                        "Kondisi / lokasi",
                        "Aksi",
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets.map((a) => (
                      <tr key={a.id} className="border-t border-zinc-100">
                        <td className="px-4 py-4 text-xs text-zinc-500">
                          {a.id}
                        </td>
                        <td className="px-4 py-4 font-medium">
                          {a.name}
                          <p className="mt-1 text-xs text-zinc-400">
                            Aset milik Rona
                          </p>
                        </td>
                        <td className="px-4 py-4">{a.category}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {dateLabel(a.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium">
                          {rupiah(a.price)}
                        </td>
                        <td className="px-4 py-4">
                          {a.paidBy}
                          <p className="mt-1 text-xs text-zinc-400">
                            Reimburse terkait
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {a.condition}
                          <p className="mt-1 text-xs text-zinc-400">
                            {a.location || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            title="Edit aset"
                            onClick={() => editAsset(a)}
                            className="mr-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50"
                            aria-label={`Edit aset ${a.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            title="Hapus aset"
                            onClick={() => removeAsset(a.id)}
                            className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"
                            aria-label={`Hapus aset ${a.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.assets.length === 0 && (
                  <Empty text="Belum ada aset. Tambahkan pembelian aset pertama." />
                )}
              </div>
            </section>
          )}

          {tab === "Partner & Modal" && (
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold">Daftar partner</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Nama partner untuk penandaan pembayar dan reimburse.
                </p>
                <div className="mt-4 space-y-3">
                  {data.partners.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold">
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Partner {i + 1}
                        </p>
                      </div>
                      <Pill>Aktif</Pill>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
                  Akun partner dikelola melalui login dan halaman Profil. Untuk
                  menambah atau mengganti akun, perbarui akun pengguna melalui
                  konfigurasi admin/database.
                </div>
              </section>
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold">
                  Kontribusi pembelian per partner
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Nilai pembelian pribadi untuk aset Rona. Ini bukan otomatis
                  persentase kepemilikan.
                </p>
                <div className="mt-5 space-y-5">
                  {data.partners.map((p) => {
                    const assets = data.assets
                      .filter((a) => a.paidBy === p.name)
                      .reduce((s, a) => s + a.price, 0);
                    const reimburse = data.reimbursements
                      .filter(
                        (r) => r.partner === p.name && r.status !== "Ditolak",
                      )
                      .reduce((s, r) => s + Math.max(0, r.amount - r.paid), 0);
                    return (
                      <div key={p.id}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-right">
                            <b>{rupiah(assets)}</b>
                            <span className="block text-xs text-zinc-500">
                              Reimburse tersisa {rupiah(reimburse)}
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100">
                          <div
                            className="h-2 rounded-full bg-violet-500"
                            style={{
                              width: `${Math.min(100, (assets / Math.max(1, inventoryValue)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">
                  Pembelian barang yang dibayar partner dicatat sebagai aset
                  milik Rona sekaligus kewajiban reimburse. Jangan hitung
                  pembelian yang sama sebagai setoran modal kecuali memang
                  disepakati sebagai modal.
                </p>
              </section>
            </div>
          )}

          {tab === "Laporan" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  title="Total booking"
                  value={rupiah(totalBookingValue)}
                  hint={`${data.bookings.length} booking tercatat`}
                  icon={CalendarDays}
                />
                <Metric
                  title="Kas masuk"
                  value={rupiah(totalReceived)}
                  hint="Seluruh transaksi masuk"
                  icon={ArrowDownLeft}
                />
                <Metric
                  title="Kas keluar"
                  value={rupiah(totalOut)}
                  hint="Termasuk pembayaran reimburse"
                  icon={ArrowUpRight}
                />
                <Metric
                  title="Saldo kas neto"
                  value={rupiah(cashBalance)}
                  hint="Masuk dikurangi keluar, belum termasuk saldo awal"
                  icon={Wallet}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <h3 className="font-semibold">Ringkasan kewajiban</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Reimburse yang masih harus dibayar kepada partner.
                  </p>
                  <div className="mt-4 space-y-3">
                    {data.partners.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between border-b border-zinc-100 pb-3 text-sm"
                      >
                        <span>{p.name}</span>
                        <span className="font-semibold">
                          {rupiah(
                            data.reimbursements
                              .filter(
                                (r) =>
                                  r.partner === p.name &&
                                  r.status !== "Ditolak",
                              )
                              .reduce(
                                (s, r) => s + Math.max(0, r.amount - r.paid),
                                0,
                              ),
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between rounded-xl bg-amber-50 p-3 text-sm">
                    <span className="font-medium text-amber-900">
                      Total reimburse tersisa
                    </span>
                    <b className="text-amber-900">{rupiah(outstanding)}</b>
                  </div>
                </section>
                <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <h3 className="font-semibold">Ringkasan inventaris</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Harga perolehan aset aktif.
                  </p>
                  <div className="mt-5 text-3xl font-semibold">
                    {rupiah(inventoryValue)}
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    {data.assets.length} aset terdaftar
                  </p>
                  <Button
                    secondary
                    onClick={() =>
                      downloadCsv("rona-inventory.csv", [
                        [
                          "Kode",
                          "Nama",
                          "Kategori",
                          "Tanggal",
                          "Harga",
                          "Pembayar",
                          "Reimburse ID",
                          "Kondisi",
                          "Lokasi",
                        ],
                        ...data.assets.map((a) => [
                          a.id,
                          a.name,
                          a.category,
                          a.date,
                          a.price,
                          a.paidBy,
                          a.reimbursementId,
                          a.condition,
                          a.location,
                        ]),
                      ])
                    }
                  >
                    <Download size={15} /> Ekspor inventaris
                  </Button>
                </section>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                <b>Catatan akuntansi:</b> laporan ini merupakan ringkasan
                operasional, bukan laporan akuntansi final. Laba belum dihitung
                secara akrual dan pembelian aset perlu perlakuan akuntansi
                terpisah. Data operasional disimpan sebagai satu workspace JSONB
                di PostgreSQL; untuk laporan audit yang lebih kompleks, tahap
                berikutnya adalah memindahkan tiap modul ke tabel relasional dan
                menambah audit log.
              </div>
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModal(null);
              setEditingBooking(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <div>
                <h3 className="font-semibold">
                  {modal === "booking"
                    ? editingBooking
                      ? "Edit booking"
                      : "Booking baru"
                    : modal === "transaction"
                      ? editingTransaction
                        ? "Edit transaksi kas"
                        : "Tambah transaksi kas"
                      : modal === "reimbursement"
                        ? "Ajukan reimburse"
                        : modal === "asset"
                          ? "Tambah aset Rona"
                          : "Tambah partner"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Isi data transaksi dengan nominal rupiah.
                </p>
              </div>
              <button
                onClick={() => {
                  setModal(null);
                  setEditingBooking(null);
                }}
                className="rounded-lg p-2 hover:bg-zinc-100"
              >
                <X size={18} />
              </button>
            </div>
            {modal === "booking" && (
              <BookingForm
                initial={data.bookings.find((b) => b.id === editingBooking)}
                onSubmit={addBooking}
                onCancel={() => {
                  setModal(null);
                  setEditingBooking(null);
                }}
              />
            )}
            {modal === "transaction" && (
              <TransactionForm
                partners={data.partners}
                initial={data.transactions.find(
                  (t) => t.id === editingTransaction,
                )}
                onSubmit={addTransaction}
                onCancel={() => {
                  setModal(null);
                  setEditingTransaction(null);
                }}
              />
            )}
            {modal === "reimbursement" && (
              <ReimbursementForm
                partners={data.partners}
                onSubmit={addReimbursement}
                onCancel={() => setModal(null)}
              />
            )}
            {modal === "asset" && (
              <AssetForm
                partners={data.partners}
                onSubmit={addAsset}
                onCancel={() => setModal(null)}
              />
            )}
          </div>
        </div>
      )}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <select
          aria-label="Navigasi"
          value={tab}
          onChange={(e) => setTab(e.target.value as Tab)}
          className="w-48 rounded-xl border border-zinc-300 bg-white shadow-lg"
        >
          {nav.map((n) => (
            <option key={n.label}>{n.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function BookingForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Booking;
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama klien *">
          <input name="client" required defaultValue={initial?.client} />
        </Field>
        <Field label="Nomor WhatsApp">
          <input
            name="phone"
            defaultValue={initial?.phone}
            placeholder="08xx..."
          />
        </Field>
        <Field label="Nama event">
          <input
            name="event"
            defaultValue={initial?.event}
            placeholder="Wedding, birthday..."
          />
        </Field>
        <Field label="Tanggal event *">
          <input
            name="date"
            type="date"
            required
            defaultValue={initial?.date || today()}
          />
        </Field>
        <Field label="Lokasi event">
          <input
            name="venue"
            defaultValue={initial?.venue}
            placeholder="Venue / area"
          />
        </Field>
        <Field label="Paket">
          <select
            name="packageName"
            defaultValue={initial?.packageName || "Digital Booth"}
          >
            <option>Digital Booth</option>
            <option>Print Basic</option>
            <option>Print Premium</option>
            <option>Custom</option>
          </select>
        </Field>
        <Field label="Total harga (Rp) *">
          <input
            name="total"
            type="number"
            min="0"
            required
            defaultValue={initial?.total || ""}
          />
        </Field>
        <Field label="Total sudah dibayar (Rp)">
          <input
            name="paid"
            type="number"
            min="0"
            defaultValue={initial?.paid || 0}
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={initial?.status || "Inquiry"}>
            <option>Inquiry</option>
            <option>Penawaran</option>
            <option>Dikonfirmasi</option>
            <option>Selesai</option>
            <option>Dibatalkan</option>
          </select>
        </Field>
      </div>
      <Field label="Catatan">
        <textarea name="notes" rows={2} defaultValue={initial?.notes} />
      </Field>
      {!initial && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Jika pembayaran awal diisi, transaksi kas masuk akan dibuat otomatis.
          Pastikan angka pembayaran benar.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button secondary onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          <CheckCircle2 size={15} /> Simpan booking
        </Button>
      </div>
    </form>
  );
}
function TransactionForm({
  partners,
  initial,
  onSubmit,
  onCancel,
}: {
  partners: Partner[];
  initial?: Transaction;
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal">
          <input
            name="date"
            type="date"
            defaultValue={initial?.date || today()}
            required
          />
        </Field>
        <Field label="Arah transaksi">
          <select
            name="direction"
            defaultValue={initial?.direction || "Keluar"}
          >
            <option>Keluar</option>
            <option>Masuk</option>
          </select>
        </Field>
        <Field label="Kategori">
          <select
            name="category"
            defaultValue={initial?.category || "Operasional"}
          >
            <option>Operasional</option>
            <option>Pembayaran booking</option>
            <option>Pemasukan lain</option>
            <option>Transportasi</option>
            <option>Perlengkapan print</option>
            <option>Maintenance</option>
            <option>Refund klien</option>
            <option>Lainnya</option>
          </select>
        </Field>
        <Field label="Nominal (Rp)">
          <input
            name="amount"
            type="number"
            min="1"
            required
            defaultValue={initial?.amount || ""}
          />
        </Field>
        <Field label="Deskripsi">
          <input
            name="description"
            required
            defaultValue={initial?.description || ""}
            placeholder="Contoh: beli kertas foto / meja lipat"
          />
        </Field>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <p className="text-xs font-medium text-zinc-500">Akun kas</p>
          <p className="mt-1 text-sm font-semibold">Kas Rona</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Semua transaksi bisnis masuk ke satu kas utama.
          </p>
        </div>
        <Field label="Dibayar oleh / sumber">
          <select name="paidBy" defaultValue={initial?.paidBy || "Kas bisnis"}>
            <option>Kas bisnis</option>
            {partners.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
            <option>Klien</option>
          </select>
        </Field>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">
            Catat sebagai inventaris
          </span>
          <span className="mt-1 block text-xs leading-5 text-zinc-500">
            Aktifkan jika pengeluaran ini membeli barang milik Rona, misalnya
            meja lipat, printer, kamera, atau lighting. Jika dibayar partner,
            sistem juga membuat reimburse otomatis dan tidak mengurangi kas Rona
            sampai reimburse dibayar.
          </span>
        </span>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            type="checkbox"
            name="recordAsAsset"
            role="switch"
            aria-label="Catat sebagai inventaris"
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="h-6 w-11 rounded-full bg-zinc-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
          />
        </span>
      </label>
      <p className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500">
        Jangan centang untuk pengeluaran seperti transportasi, konsumsi, atau
        biaya operasional yang bukan aset.
      </p>
      <div className="flex justify-end gap-2">
        <Button secondary onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initial ? "Simpan perubahan" : "Simpan transaksi"}
        </Button>
      </div>
    </form>
  );
}
function ReimbursementForm({
  partners,
  onSubmit,
  onCancel,
}: {
  partners: Partner[];
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Partner yang membayar">
          <select name="partner">
            {partners.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal pembelian">
          <input name="date" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Jenis">
          <select name="type">
            <option>Operasional</option>
            <option>Aset</option>
            <option>Transportasi</option>
            <option>Lainnya</option>
          </select>
        </Field>
        <Field label="Nominal reimburse (Rp)">
          <input name="amount" type="number" min="1" required />
        </Field>
      </div>
      <Field label="Keterangan">
        <input
          name="description"
          required
          placeholder="Contoh: tinta printer dibeli pakai uang pribadi"
        />
      </Field>
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        Pengajuan ini membuat kewajiban reimburse. Kas Rona baru berkurang saat
        kamu mencatat pembayaran reimburse.
      </p>
      <div className="flex justify-end gap-2">
        <Button secondary onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Ajukan reimburse</Button>
      </div>
    </form>
  );
}
function AssetForm({
  partners,
  onSubmit,
  onCancel,
}: {
  partners: Partner[];
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama aset">
          <input name="name" required placeholder="Contoh: Sony a6400" />
        </Field>
        <Field label="Kategori">
          <select name="category" defaultValue="Perlengkapan">
            <option>Kamera</option>
            <option>Printer</option>
            <option>Laptop</option>
            <option>Lighting</option>
            <option>Stand / backdrop</option>
            <option>Perlengkapan</option>
            <option>Lainnya</option>
          </select>
        </Field>
        <Field label="Tanggal beli">
          <input name="date" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Harga beli (Rp)">
          <input name="price" type="number" min="1" required />
        </Field>
        <Field label="Dibayar oleh partner">
          <select name="paidBy">
            {partners.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Kondisi">
          <select name="condition">
            <option>Baik</option>
            <option>Baru</option>
            <option>Perlu perbaikan</option>
          </select>
        </Field>
        <Field label="Lokasi penyimpanan">
          <input name="location" placeholder="Contoh: rumah / storage" />
        </Field>
      </div>
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        Saat disimpan, barang masuk inventaris milik Rona dan sistem membuat
        reimburse otomatis kepada partner yang membayar. Jangan ajukan reimburse
        terpisah untuk pembelian yang sama.
      </p>
      <div className="flex justify-end gap-2">
        <Button secondary onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan aset & reimburse</Button>
      </div>
    </form>
  );
}
function PartnerForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-4 p-5">
      <Field label="Nama partner">
        <input
          name="name"
          required
          placeholder="Nama panggilan / nama partner"
        />
      </Field>
      <p className="text-xs text-zinc-500">
        Nama partner akan tersedia sebagai pilihan pada pembelian aset dan
        pengajuan reimburse.
      </p>
      <div className="flex justify-end gap-2">
        <Button secondary onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Tambah partner</Button>
      </div>
    </form>
  );
}
