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
  LucideChevronLeft,
  LucideChevronRight,
  Menu,
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
  autoReimbursementId?: string;
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

  bookings: [],

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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [data, setData] = useState<State>(seed);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "loading" | "saved" | "saving" | "error"
  >("loading");
  const [canSync, setCanSync] = useState(false);
  const [search, setSearch] = useState("");
  const [bookingPage, setBookingPage] = useState(1);
  const [transactionDirectionFilter, setTransactionDirectionFilter] = useState<
    "Semua" | "Masuk" | "Keluar"
  >("Semua");
  const [transactionPage, setTransactionPage] = useState(1);
  const [reimbursementPage, setReimbursementPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
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
    .filter(
      (t) =>
        t.direction === "Keluar" &&
        t.affectsCash !== false &&
        t.paidBy === "Kas bisnis",
    )
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
  const upcomingBookings = data.bookings
    .filter((b) => b.status !== "Dibatalkan" && b.date >= today())
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const filteredBookings = data.bookings.filter((b) =>
    `${b.client} ${b.event} ${b.id} ${b.packageName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const bookingPageSize = 10;
  const totalBookingPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / bookingPageSize),
  );
  const safeBookingPage = Math.min(bookingPage, totalBookingPages);
  const paginatedBookings = filteredBookings.slice(
    (safeBookingPage - 1) * bookingPageSize,
    safeBookingPage * bookingPageSize,
  );
  const filteredTx = data.transactions.filter((t) => {
    const matchesSearch = `${t.description} ${t.category} ${t.paidBy}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesDirection =
      transactionDirectionFilter === "Semua" ||
      t.direction === transactionDirectionFilter;
    return matchesSearch && matchesDirection;
  });
  const transactionPageSize = 10;
  const sortedFilteredTx = filteredTx.slice().sort((a, b) => {
    // Input type="date" stores dates as YYYY-MM-DD; sort newest date first.
    const dateA = String(a.date || "");
    const dateB = String(b.date || "");
    const dateOrder = dateB.localeCompare(dateA);
    if (dateOrder !== 0) return dateOrder;
    // Keep the order deterministic when multiple transactions share a date.
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
  const totalTransactionPages = Math.max(
    1,
    Math.ceil(sortedFilteredTx.length / transactionPageSize),
  );
  const safeTransactionPage = Math.min(transactionPage, totalTransactionPages);
  const paginatedTx = sortedFilteredTx.slice(
    (safeTransactionPage - 1) * transactionPageSize,
    safeTransactionPage * transactionPageSize,
  );
  const reimbursementPageSize = 10;
  const totalReimbursementPages = Math.max(
    1,
    Math.ceil(data.reimbursements.length / reimbursementPageSize),
  );
  const safeReimbursementPage = Math.min(
    reimbursementPage,
    totalReimbursementPages,
  );
  const paginatedReimbursements = data.reimbursements.slice(
    (safeReimbursementPage - 1) * reimbursementPageSize,
    safeReimbursementPage * reimbursementPageSize,
  );
  const inventoryPageSize = 10;
  const totalInventoryPages = Math.max(
    1,
    Math.ceil(data.assets.length / inventoryPageSize),
  );
  const safeInventoryPage = Math.min(inventoryPage, totalInventoryPages);
  const paginatedAssets = data.assets.slice(
    (safeInventoryPage - 1) * inventoryPageSize,
    safeInventoryPage * inventoryPageSize,
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
            description: `Pembayaran booking ${booking.id} · ${booking.client}`,
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
      const isPartnerPaidExpense =
        direction === "Keluar" && paidBy !== "Kas bisnis" && paidBy !== "Klien";
      const oldAutoReimbursement = old.autoReimbursementId
        ? data.reimbursements.find((r) => r.id === old.autoReimbursementId)
        : undefined;
      if (
        oldAutoReimbursement &&
        !isPartnerPaidExpense &&
        oldAutoReimbursement.paid > 0
      ) {
        alert(
          "Reimburse untuk transaksi ini sudah dibayar sebagian. Selesaikan atau batalkan pembayaran reimburse terlebih dahulu sebelum mengganti sumber pembayaran.",
        );
        return;
      }
      if (oldAutoReimbursement && amount < oldAutoReimbursement.paid) {
        alert(
          "Nominal transaksi tidak boleh lebih kecil dari reimburse yang sudah dibayar.",
        );
        return;
      }
      const autoReimbursementId = isPartnerPaidExpense
        ? old.autoReimbursementId || `REI-${String(Date.now()).slice(-5)}`
        : undefined;
      const updated: Transaction = {
        ...old,
        date,
        direction,
        category,
        description,
        amount,
        paidBy,
        account: "Kas Rona",
        autoReimbursementId,
        affectsCash:
          direction === "Masuk"
            ? paidBy === "Kas bisnis" || paidBy === "Klien"
            : paidBy === "Kas bisnis",
      };
      setData((prev) => {
        let reimbursements = prev.reimbursements;
        if (oldAutoReimbursement && !isPartnerPaidExpense) {
          reimbursements = reimbursements.filter(
            (r) => r.id !== oldAutoReimbursement.id,
          );
        } else if (isPartnerPaidExpense) {
          const existing = reimbursements.find(
            (r) => r.id === autoReimbursementId,
          );
          const reimbursement: Reimbursement = {
            id: autoReimbursementId!,
            partner: paidBy,
            date,
            description: description || category,
            amount: Math.max(amount, existing?.paid || 0),
            paid: existing?.paid || 0,
            status: existing?.status || "Menunggu",
            type: category || "Operasional",
          };
          reimbursements = existing
            ? reimbursements.map((r) =>
                r.id === autoReimbursementId ? reimbursement : r,
              )
            : [reimbursement, ...reimbursements];
        }
        return {
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === editingTransaction ? updated : t,
          ),
          reimbursements,
        };
      });
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
    const isPartnerPaidExpense =
      direction === "Keluar" && paidBy !== "Kas bisnis" && paidBy !== "Klien";
    const reimbursementId = isPartnerPaidExpense
      ? `REI-${String(Date.now() + 1).slice(-5)}`
      : undefined;
    const transactionId = id();
    const tx: Transaction = {
      id: transactionId,
      date,
      direction,
      category: recordAsAsset ? "Pembelian aset" : category,
      description,
      amount,
      account: "Kas Rona",
      paidBy,
      affectsCash:
        direction === "Masuk"
          ? paidBy === "Kas bisnis" || paidBy === "Klien"
          : paidBy === "Kas bisnis",
      linkedAssetId: assetId,
      // Keep this link for the existing asset deletion/payment flow only.
      linkedReimbursement: recordAsAsset ? reimbursementId : undefined,
      autoReimbursementId: !recordAsAsset ? reimbursementId : undefined,
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
              description: recordAsAsset
                ? `Pembelian aset: ${description}`
                : description || category,
              amount,
              paid: 0,
              status: "Menunggu" as const,
              type: recordAsAsset ? "Aset" : category || "Operasional",
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
  function scrollToPaginationSection(
    sectionId:
      | "booking-list"
      | "transaction-list"
      | "reimbursement-list"
      | "inventory-list",
  ) {
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
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
    if (tx.autoReimbursementId) {
      const autoReimbursement = data.reimbursements.find(
        (r) => r.id === tx.autoReimbursementId,
      );
      if (autoReimbursement?.paid) {
        alert(
          "Transaksi ini memiliki reimburse yang sudah dibayar. Hapus atau koreksi pembayaran reimburse terlebih dahulu.",
        );
        return;
      }
    }
    setData((prev) => {
      let reimbursements = prev.reimbursements;
      let assets = prev.assets;
      let transactions = prev.transactions.filter((t) => t.id !== tid);
      if (tx.autoReimbursementId) {
        reimbursements = reimbursements.filter(
          (r) => r.id !== tx.autoReimbursementId,
        );
      }
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-5 lg:flex lg:flex-col">
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

      <main className="min-w-0 flex-1 lg:ml-[248px]">
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
        <div className="mx-auto max-w-[1440px] space-y-6 p-5 pb-28 md:p-8 md:pb-28 lg:pb-8">
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
              <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4 sm:p-5">
                    <div>
                      <h3 className="font-semibold">Booking</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Ringkasan Jadwal Booking
                      </p>
                    </div>
                    <Button secondary onClick={() => setTab("Booking")}>
                      Lihat booking
                    </Button>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {upcomingBookings.map((b) => (
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
                    {upcomingBookings.length === 0 && (
                      <Empty text="Tidak ada booking mendatang." />
                    )}
                  </div>
                </section>
                <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-100 p-4 sm:p-5">
                    <h3 className="font-semibold">Transaksi terbaru</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Kas masuk dan keluar
                    </p>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {data.transactions
                      .slice()
                      .sort((a, b) => {
                        const dateOrder = String(b.date || "").localeCompare(
                          String(a.date || ""),
                        );
                        if (dateOrder !== 0) return dateOrder;
                        return String(b.id || "").localeCompare(
                          String(a.id || ""),
                        );
                      })
                      .slice(0, 5)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex min-w-0 items-center gap-2 p-3 sm:gap-3 sm:p-4"
                        >
                          <div
                            className={`shrink-0 rounded-xl p-2 sm:p-2.5 ${t.direction === "Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
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
                            className={`shrink-0 whitespace-nowrap text-xs font-semibold sm:text-sm ${t.direction === "Masuk" ? "text-emerald-700" : ""}`}
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
            <section
              id="booking-list"
              className="scroll-mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Daftar booking</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {data.bookings.length} booking tersimpan
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={16}
                  />
                  <input
                    className="pr-9"
                    placeholder="Cari klien, event, kode..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setBookingPage(1);
                      setTransactionPage(1);
                    }}
                  />
                </div>
                <Button secondary onClick={exportBookings}>
                  <Download size={15} /> CSV
                </Button>
              </div>
              <div className="divide-y divide-zinc-100 md:hidden">
                {paginatedBookings.map((b) => (
                  <article key={b.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-zinc-900">
                          {b.client}
                        </p>
                        <p className="mt-1 break-words text-xs text-zinc-500">
                          {b.event} · {b.id}
                        </p>
                        <p className="mt-1 break-words text-xs text-zinc-400">
                          {b.phone || "Tanpa nomor telepon"}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold">
                        {rupiah(b.total)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-zinc-500">Tanggal event</p>
                        <p className="mt-1 break-words font-medium">
                          {dateLabel(b.date)}
                        </p>
                        <p className="mt-1 break-words text-zinc-400">
                          {b.venue}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Paket</p>
                        <p className="mt-1 break-words font-medium">
                          {b.packageName}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Dibayar</p>
                        <p className="mt-1 font-medium">{rupiah(b.paid)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Sisa</p>
                        <p className="mt-1 font-medium">
                          {rupiah(Math.max(0, b.total - b.paid))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                      <div>
                        <select
                          aria-label="Status booking"
                          value={b.status}
                          onChange={(e) =>
                            updateBookingStatus(b.id, e.target.value)
                          }
                          className="min-w-0 text-xs"
                        >
                          <option>Inquiry</option>
                          <option>Penawaran</option>
                          <option>Dikonfirmasi</option>
                          <option>Selesai</option>
                          <option>Dibatalkan</option>
                        </select>
                      </div>
                      <div className="flex shrink-0 gap-2">
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
                    </div>
                  </article>
                ))}
                {filteredBookings.length === 0 && (
                  <Empty text="Booking tidak ditemukan." />
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
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
                    {paginatedBookings.map((b) => (
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
              {filteredBookings.length > 0 && (
                <div className="flex flex-col items-center gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-center text-xs text-zinc-500 sm:text-left">
                    Menampilkan {(safeBookingPage - 1) * bookingPageSize + 1}–
                    {Math.min(
                      safeBookingPage * bookingPageSize,
                      filteredBookings.length,
                    )}{" "}
                    dari {filteredBookings.length} booking
                  </p>
                  <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingPage((page) => Math.max(1, page - 1));
                        scrollToPaginationSection("booking-list");
                      }}
                      disabled={safeBookingPage === 1}
                      className="rounded-lg border border-zinc-200 p-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman booking sebelumnya"
                    >
                      <LucideChevronLeft size={16} />
                    </button>
                    <span className="min-w-24 text-center text-xs text-zinc-500">
                      Halaman {safeBookingPage} / {totalBookingPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingPage((page) =>
                          Math.min(totalBookingPages, page + 1),
                        );
                        scrollToPaginationSection("booking-list");
                      }}
                      disabled={safeBookingPage === totalBookingPages}
                      className="rounded-lg border border-zinc-200 p-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman booking berikutnya"
                    >
                      <LucideChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "Kas & Transaksi" && (
            <section
              id="transaction-list"
              className="scroll-mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Ledger kas</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Saldo berjalan sederhana dari transaksi yang dicatat
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <select
                    aria-label="Filter arah transaksi"
                    className="w-full sm:w-40"
                    value={transactionDirectionFilter}
                    onChange={(e) => {
                      setTransactionDirectionFilter(
                        e.target.value as "Semua" | "Masuk" | "Keluar",
                      );
                      setTransactionPage(1);
                    }}
                  >
                    <option value="Semua">Semua transaksi</option>
                    <option value="Masuk">Kas masuk</option>
                    <option value="Keluar">Kas keluar</option>
                  </select>
                  <div className="relative w-full sm:w-64">
                    <Search
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={16}
                    />
                    <input
                      className="pr-9"
                      placeholder="Cari transaksi..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setTransactionPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="divide-y divide-zinc-100 md:hidden">
                {paginatedTx.map((t) => (
                  <article key={t.id} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 shrink-0 rounded-xl p-2 ${t.direction === "Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {t.direction === "Masuk" ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold leading-5 text-zinc-900">
                          {t.description || "Tanpa deskripsi"}
                        </p>
                        <p className="mt-1 break-words text-xs text-zinc-500">
                          {dateLabel(t.date)} · {t.category}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 max-w-[46%] break-words text-right text-sm font-semibold ${t.direction === "Masuk" ? "text-emerald-700" : "text-zinc-900"}`}
                      >
                        {t.direction === "Masuk" ? "+" : "−"}
                        {rupiah(t.amount)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-2 rounded-xl bg-zinc-50 p-3 text-xs">
                      <div>
                        <p className="text-zinc-500">Sumber</p>
                        <p className="mt-1 break-words font-medium">
                          {t.paidBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Arah</p>
                        <div className="mt-1">
                          <Pill
                            tone={t.direction === "Masuk" ? "green" : "red"}
                          >
                            {t.direction}
                          </Pill>
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-500">Akun</p>
                        <p className="mt-1 break-words">
                          {t.account}
                          {t.affectsCash === false
                            ? " · Tidak memengaruhi saldo kas (dibayar pribadi)"
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
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
                  </article>
                ))}
                {filteredTx.length === 0 && (
                  <Empty text="Belum ada transaksi." />
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500">
                    <tr>
                      {[
                        "Tanggal",
                        "Deskripsi",
                        "Kategori",
                        "Sumber",
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
                    {paginatedTx.map((t) => (
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
              {filteredTx.length > 0 && (
                <div className="flex flex-col items-center gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-center text-xs text-zinc-500 sm:text-left">
                    Menampilkan{" "}
                    {(safeTransactionPage - 1) * transactionPageSize + 1}–
                    {Math.min(
                      safeTransactionPage * transactionPageSize,
                      sortedFilteredTx.length,
                    )}{" "}
                    dari {sortedFilteredTx.length} transaksi
                  </p>
                  <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionPage((page) => Math.max(1, page - 1));
                        scrollToPaginationSection("transaction-list");
                      }}
                      disabled={safeTransactionPage === 1}
                      className="rounded-lg border border-zinc-200 p-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LucideChevronLeft className="text-xs" />
                    </button>
                    <span className="min-w-20 text-center text-xs text-zinc-500">
                      Halaman {safeTransactionPage} / {totalTransactionPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionPage((page) =>
                          Math.min(totalTransactionPages, page + 1),
                        );
                        scrollToPaginationSection("transaction-list");
                      }}
                      disabled={safeTransactionPage === totalTransactionPages}
                      className="rounded-lg border border-zinc-200 p-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LucideChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "Reimburse" && (
            <section
              id="reimbursement-list"
              className="scroll-mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
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
              <div className="divide-y divide-zinc-100 md:hidden">
                {paginatedReimbursements.map((r) => (
                  <article key={r.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-zinc-900">
                          {r.description}
                        </p>
                        <p className="mt-1 break-words text-xs text-zinc-500">
                          {r.partner} · {r.id}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {dateLabel(r.date)} · {r.type}
                        </p>
                      </div>
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
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-3 text-xs">
                      <div>
                        <p className="text-zinc-500">Total reimburse</p>
                        <p className="mt-1 break-words font-semibold text-zinc-900">
                          {rupiah(r.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Sudah dibayar</p>
                        <p className="mt-1 break-words font-semibold text-zinc-900">
                          {rupiah(r.paid)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-zinc-500">Sisa pembayaran</p>
                        <p className="mt-1 break-words font-medium">
                          {rupiah(Math.max(0, r.amount - r.paid))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                      {r.status === "Menunggu" && (
                        <button
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              reimbursements: prev.reimbursements.map((x) =>
                                x.id === r.id
                                  ? { ...x, status: "Disetujui" }
                                  : x,
                              ),
                            }))
                          }
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-medium hover:bg-zinc-50"
                        >
                          <span className="text-sm">Setujui</span>
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
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white"
                        >
                          <span className="text-sm">Bayar</span>
                        </button>
                      )}
                      <button
                        title="Edit reimburse"
                        onClick={() => editReimbursement(r)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
                        aria-label={`Edit reimburse ${r.id}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title="Hapus reimburse"
                        onClick={() => removeReimbursement(r.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                        aria-label={`Hapus reimburse ${r.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))}
                {data.reimbursements.length === 0 && (
                  <Empty text="Belum ada reimburse." />
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
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
                    {paginatedReimbursements.map((r) => (
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
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 px-2 text-xs hover:bg-zinc-50"
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
                                className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-950 px-2 text-xs text-white"
                              >
                                Bayar
                              </button>
                            )}
                            <button
                              title="Edit reimburse"
                              onClick={() => editReimbursement(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
                              aria-label={`Edit reimburse ${r.id}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              title="Hapus reimburse"
                              onClick={() => removeReimbursement(r.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
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
              {data.reimbursements.length > 0 && (
                <div className="flex flex-col items-center gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row sm:justify-between">
                  <p className="text-center text-xs text-zinc-500 sm:text-left">
                    Menampilkan{" "}
                    {(safeReimbursementPage - 1) * reimbursementPageSize + 1}–
                    {Math.min(
                      safeReimbursementPage * reimbursementPageSize,
                      data.reimbursements.length,
                    )}{" "}
                    dari {data.reimbursements.length} reimburse
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReimbursementPage((page) => Math.max(1, page - 1));
                        scrollToPaginationSection("reimbursement-list");
                      }}
                      disabled={safeReimbursementPage === 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman reimburse sebelumnya"
                    >
                      <LucideChevronLeft size={16} />
                    </button>
                    <span className="min-w-24 text-center text-xs text-zinc-500">
                      Halaman {safeReimbursementPage} /{" "}
                      {totalReimbursementPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReimbursementPage((page) =>
                          Math.min(totalReimbursementPages, page + 1),
                        );
                        scrollToPaginationSection("reimbursement-list");
                      }}
                      disabled={
                        safeReimbursementPage === totalReimbursementPages
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman reimburse berikutnya"
                    >
                      <LucideChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
              <div className="border-t border-zinc-100 bg-zinc-50/70 p-4 text-xs leading-5 text-zinc-500">
                Pembayaran reimburse dicatat sebagai arus kas keluar dan
                mengurangi saldo kewajiban. Nilai pembelian aset tidak dihitung
                sebagai pengeluaran kedua kali saat reimburse dibayar.
              </div>
            </section>
          )}

          {tab === "Inventaris" && (
            <section
              id="inventory-list"
              className="scroll-mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
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
              <div className="divide-y divide-zinc-100 md:hidden">
                {paginatedAssets.map((a) => (
                  <article key={a.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-zinc-900">
                          {a.name}
                        </p>
                        <p className="mt-1 break-words text-xs text-zinc-500">
                          {a.id} · {a.category}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Aset milik Rona · {dateLabel(a.date)}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold">
                        {rupiah(a.price)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-3 text-xs">
                      <div>
                        <p className="text-zinc-500">Dibeli oleh</p>
                        <p className="mt-1 break-words font-medium text-zinc-900">
                          {a.paidBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Kondisi</p>
                        <p className="mt-1 break-words font-medium text-zinc-900">
                          {a.condition}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-zinc-500">Lokasi penyimpanan</p>
                        <p className="mt-1 break-words font-medium text-zinc-900">
                          {a.location || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
                      <button
                        title="Edit aset"
                        onClick={() => editAsset(a)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
                        aria-label={`Edit aset ${a.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title="Hapus aset"
                        onClick={() => removeAsset(a.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                        aria-label={`Hapus aset ${a.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))}
                {data.assets.length === 0 && (
                  <Empty text="Belum ada aset. Tambahkan pembelian aset pertama." />
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
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
                    {paginatedAssets.map((a) => (
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
                            className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
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
              {data.assets.length > 0 && (
                <div className="flex flex-col items-center gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row sm:justify-between">
                  <p className="text-center text-xs text-zinc-500 sm:text-left">
                    Menampilkan{" "}
                    {(safeInventoryPage - 1) * inventoryPageSize + 1}–
                    {Math.min(
                      safeInventoryPage * inventoryPageSize,
                      data.assets.length,
                    )}{" "}
                    dari {data.assets.length} aset
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInventoryPage((page) => Math.max(1, page - 1));
                        scrollToPaginationSection("inventory-list");
                      }}
                      disabled={safeInventoryPage === 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman inventaris sebelumnya"
                    >
                      <LucideChevronLeft size={16} />
                    </button>
                    <span className="min-w-24 text-center text-xs text-zinc-500">
                      Halaman {safeInventoryPage} / {totalInventoryPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setInventoryPage((page) =>
                          Math.min(totalInventoryPages, page + 1),
                        );
                        scrollToPaginationSection("inventory-list");
                      }}
                      disabled={safeInventoryPage === totalInventoryPages}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Halaman inventaris berikutnya"
                    >
                      <LucideChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
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

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Navigasi utama mobile"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-2 pt-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
            {[
              {
                label: "Dashboard" as Tab,
                short: "Home",
                icon: LayoutDashboard,
              },
              { label: "Booking" as Tab, short: "Booking", icon: CalendarDays },
              {
                label: "Kas & Transaksi" as Tab,
                short: "Transaksi",
                icon: Wallet,
              },
              {
                label: "Laporan" as Tab,
                short: "Laporan",
                icon: ChartNoAxesCombined,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setTab(item.label);
                    setSearch("");
                    setMoreMenuOpen(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition ${active ? "text-zinc-950" : "text-zinc-500 hover:bg-zinc-50"}`}
                >
                  <span
                    className={`flex h-7 w-10 items-center justify-center rounded-full ${active ? "bg-zinc-950 text-white" : "text-zinc-500"}`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                  </span>
                  <span className="truncate text-sm">{item.short}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreMenuOpen((open) => !open)}
              aria-expanded={moreMenuOpen}
              aria-label="Buka menu lainnya"
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition ${moreMenuOpen || ["Reimburse", "Inventaris", "Partner & Modal"].includes(tab) ? "text-zinc-950" : "text-zinc-500 hover:bg-zinc-50"}`}
            >
              <span
                className={`flex h-7 w-10 items-center justify-center rounded-full ${moreMenuOpen || ["Reimburse", "Inventaris", "Partner & Modal"].includes(tab) ? "bg-zinc-950 text-white" : "text-zinc-500"}`}
              >
                {moreMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </span>
              <span className="text-sm">Lainnya</span>
            </button>
          </div>
        </nav>

        <div
          className={`fixed inset-0 z-50 flex items-end bg-black/30 transition-opacity duration-300 ease-out lg:hidden ${moreMenuOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0 delay-100"}`}
          onClick={() => setMoreMenuOpen(false)}
          aria-hidden={!moreMenuOpen}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Menu lainnya"
            className={`w-full rounded-t-3xl border border-zinc-200 bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl transition-transform duration-300 ease-out ${moreMenuOpen ? "translate-y-0" : "translate-y-full"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-200" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900">Menu lainnya</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Pilih modul yang ingin dibuka
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Reimburse" as Tab,
                  icon: ReceiptText,
                  description: "Penggantian dana",
                },
                {
                  label: "Inventaris" as Tab,
                  icon: Package,
                  description: "Aset Rona",
                },
                {
                  label: "Partner & Modal" as Tab,
                  icon: Users,
                  description: "Modal & kontribusi",
                  shortLabel: "Partner",
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = tab === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setTab(item.label);
                      setSearch("");
                      setMoreMenuOpen(false);
                    }}
                    className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${active ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    <span
                      className={`rounded-xl p-2 ${active ? "bg-white/10" : "bg-zinc-100"}`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="text-xs font-semibold leading-tight">
                      {"shortLabel" in item ? item.shortLabel : item.label}
                    </span>
                    <span
                      className={`text-[10px] leading-tight ${active ? "text-zinc-300" : "text-zinc-500"}`}
                    >
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
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
            defaultValue={initial?.packageName || "Digital Only"}
          >
            <option>Digital Only</option>
            <option>Print + Print</option>
            <option>Mingle</option>
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
            <option>Subscription</option>
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
        {/* <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <p className="text-xs font-medium text-zinc-500">Akun kas</p>
          <p className="mt-1 text-sm font-semibold">Kas Rona</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Semua transaksi bisnis masuk ke satu kas utama.
          </p>
        </div> */}
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
