"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { id as localeID, enUS as localeEN } from "date-fns/locale";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from "recharts";
import { useMoneyData } from "@/hooks/useMoneyData";
import { Transaction } from "@/types";
import TransactionModal from "./TransactionModal";
import BudgetModal from "./BudgetModal";
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongRounded';
import AnalyticsIcon from '@mui/icons-material/AnalyticsRounded';
import PieChartIcon from '@mui/icons-material/PieChartRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';


type Page = "dashboard" | "transactions" | "analytics" | "budgets" | "profile";
type Theme = "light" | "dark";
type Language = "en" | "id";
type Currency = "USD" | "IDR";

// Kamus Translasi untuk UI iOS-Look
const TRANSLATIONS = {
  en: {
    overview: "Overview",
    transactions: "Transactions",
    analytics: "Analytics",
    budgets: "Budgets",
    profile: "Profile",
    income: "Income",
    expenses: "Expenses",
    balance: "Balance",
    savingsRate: "Savings Rate",
    recent: "Recent Activity",
    seeAll: "See all",
    topSpend: "Top Spend",
    dailyActivity: "Daily Activity",
    incomeVsExpense: "Income vs Expenses — Daily",
    noTransactions: "No transactions this month",
    entries: "entries",
    manage: "Manage",
    remaining: "remaining",
    overBy: "Over by",
    monthlyBudget: "Monthly budget",
    spent: "Spent",
    limit: "Limit",
    setBudget: "Set Budget",
    addTransaction: "Add Transaction",
    loading: "Loading assets…",
    theme: "Appearance",
    language: "Language",
    currency: "Currency",
    exportReport: "Export Financial Report (PDF)",
    accountDetails: "Account Details",
    preferences: "Preferences",
    date: "Date",
  },
  id: {
    overview: "Ringkasan",
    transactions: "Transaksi",
    analytics: "Analisis",
    budgets: "Anggaran",
    profile: "Profil",
    income: "Pemasukan",
    expenses: "Pengeluaran",
    balance: "Saldo",
    savingsRate: "Rasio Tabungan",
    recent: "Aktivitas Terakhir",
    seeAll: "Lihat semua",
    topSpend: "Pengeluaran Terbesar",
    dailyActivity: "Aktivitas Harian",
    incomeVsExpense: "Pemasukan vs Pengeluaran — Harian",
    noTransactions: "Tidak ada transaksi bulan ini",
    entries: "entri",
    manage: "Kelola",
    remaining: "tersisa",
    overBy: "Lebih dari",
    monthlyBudget: "Anggaran bulanan",
    spent: "Terpakai",
    limit: "Batas",
    setBudget: "Atur Anggaran",
    addTransaction: "Tambah Transaksi",
    loading: "Memuat data…",
    theme: "Tampilan",
    language: "Bahasa",
    currency: "Mata Uang",
    exportReport: "Cetak Laporan Keuangan (PDF)",
    accountDetails: "Detail Akun",
    preferences: "Preferensi",
    date: "Date",
  }
};

const NAV = [
  { id: "dashboard", labelKey: "overview", icon: <DashboardIcon fontSize="small" /> },
  { id: "transactions", labelKey: "transactions", icon: <ReceiptLongIcon fontSize="small" /> },
  { id: "analytics", labelKey: "analytics", icon: <AnalyticsIcon fontSize="small" /> },
  { id: "budgets", labelKey: "budgets", icon: <PieChartIcon fontSize="small" /> },
  { id: "profile", labelKey: "profile", icon: <PersonIcon fontSize="small" /> },
] as const;

const iOS_COLORS = ["#007AFF", "#34C759", "#FF3B30", "#FF9500", "#AF52DE", "#5AC8FA", "#FF2D55", "#4CD964"];
// ── DATA KATEGORI MULTI-BAHASA ──
const CATEGORY_META: Record<string, { icon: string; label: { id: string; en: string } }> = {
  food: { icon: "🍴", label: { id: "Makanan", en: "Food" } },
  transport: { icon: "🚗", label: { id: "Transportasi", en: "Transport" } },
  housing: { icon: "🏠", label: { id: "Tempat Tinggal", en: "Housing" } },
  utilities: { icon: "💡", label: { id: "Tagihan", en: "Utilities" } },
  fun: { icon: "🎮", label: { id: "Hiburan", en: "Fun" } },
  health: { icon: "❤", label: { id: "Kesehatan", en: "Health" } },
  shopping: { icon: "🛍", label: { id: "Belanja", en: "Shopping" } },
  education: { icon: "🎓", label: { id: "Pendidikan", en: "Education" } },
  travel: { icon: "✈", label: { id: "Liburan", en: "Travel" } },
  salary: { icon: "💼", label: { id: "Gaji", en: "Salary" } },
  freelance: { icon: "💻", label: { id: "Pekerjaan Lepas", en: "Freelance" } },
  investment: { icon: "📈", label: { id: "Investasi", en: "Investment" } },
  other: { icon: "💬", label: { id: "Lainnya", en: "Other" } },
};

const EXPENSE_CATEGORIES = ["food", "transport", "housing", "utilities", "fun", "health", "shopping", "education", "travel", "other"];
const INCOME_CATEGORIES = ["salary", "freelance", "investment", "other"];

export default function Dashboard() {
  const [page, setPage] = useState<Page>("dashboard");
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showBudget, setShowBudget] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Sembunyikan jika scroll ke bawah dan melewati batas toleransi 50px
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // User Preferences States (iOS Style Settings)
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("id");
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");
  const [txSort, setTxSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<"monthly" | "custom">("monthly");
  const [exportStartDate, setExportStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [exportEndDate, setExportEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exportIncludeTx, setExportIncludeTx] = useState(true);
  const [exportIncludeAnalytics, setExportIncludeAnalytics] = useState(true);

  // State untuk Profil User
  const [userName, setUserName] = useState("Yonda Eko Prasetyo");
  const [userBio, setUserBio] = useState("Spatial Data Analyst & Researcher");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempBio, setTempBio] = useState("");

  const { transactions, budgets, summary, loading, addTransaction, updateTransaction, deleteTransaction, setBudget, deleteBudget } = useMoneyData(currentMonth);

  // Sinkronisasi class tema ke HTML root element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const words = TRANSLATIONS[language];

  // Fungsi untuk mengambil icon dan label sesuai bahasa yang aktif
  const getCategoryMeta = useCallback((categoryId: string) => {
    const meta = CATEGORY_META[categoryId] || CATEGORY_META["other"];
    return {
      icon: meta.icon,
      label: meta.label[language as "en" | "id"],
    };
  }, [language]);

  // Format Mata Uang Adaptif Dinamis
  const formatCurrency = (n: number) => {
    const config = {
      USD: { locale: "en-US", symbol: "USD" },
      IDR: { locale: "id-ID", symbol: "IDR" }
    }[currency];

    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.symbol,
      maximumFractionDigits: 0
    }).format(n);
  };

  // Format angka ringkas untuk sumbu Y pada grafik (Contoh: 15.000 -> 15 rb)
  const formatCompact = (n: number) => {
    return new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(n);
  };

  const monthLabel = useMemo(() => {
    const dateObj = new Date(`${currentMonth}-01`);
    return format(dateObj, "MMMM yyyy", { locale: language === "id" ? localeID : localeEN });
  }, [currentMonth, language]);

  // Pengolah Laporan PDF (Metode Print Sempurna dengan CSS Media Laporan)
  const handleExportPDF = () => {
    window.print();
  };

  // Chart data pemrosesan aktivitas harian
  const dailyData = useMemo(() => {
    // Cari tahu bulan ini ada berapa hari (28/29/30/31)
    const [year, month] = currentMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    const map: Record<string, { income: number; expense: number }> = {};
    
    // Inisialisasi semua hari dalam bulan tersebut dengan angka 0
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      map[dayStr] = { income: 0, expense: 0 };
    }

    // Masukkan data transaksi yang ada
    for (const t of transactions) {
      const day = t.date.slice(8, 10);
      if (map[day]) {
        map[day][t.type] += t.amount;
      }
    }

    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, v]) => ({ day: parseInt(day), ...v }));
  }, [transactions, currentMonth]);

  // Logika Pemrosesan Transaksi (Filter -> Group by Date -> Sort)
  const processedTransactions = useMemo(() => {
    // 1. Filter
    let filtered = transactions;
    if (txFilter !== "all") {
      filtered = filtered.filter((t) => t.type === txFilter);
    }

    // 2. Group by Date
    const groups: Record<string, { date: string; items: Transaction[]; totalIn: number; totalOut: number }> = {};
    filtered.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = { date: t.date, items: [], totalIn: 0, totalOut: 0 };
      groups[t.date].items.push(t);
      if (t.type === "income") groups[t.date].totalIn += t.amount;
      else groups[t.date].totalOut += t.amount;
    });

    // 3. Ubah jadi Array dan urutkan grup dari tanggal terbaru ke terlama
    const groupedArray = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));

    // 4. Urutkan item di dalam masing-masing grup (Tertinggi / Terendah)
    groupedArray.forEach((group) => {
      group.items.sort((a, b) => {
        if (txSort === "highest") return b.amount - a.amount;
        if (txSort === "lowest") return a.amount - b.amount;
        return 0; // "newest" akan mengikuti urutan asli (terbaru)
      });
    });

    return groupedArray;
  }, [transactions, txFilter, txSort]);

  // Kategori data breakdown
  const categoryData = useMemo(() => {
    return Object.entries(summary.byCategory)
      .filter(([cat]) => transactions.find((t) => t.category === cat && t.type === "expense"))
      .map(([cat, amount]) => {
        const meta = getCategoryMeta(cat as any);
        return { name: meta.label, icon: meta.icon, value: amount, category: cat };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [summary, transactions, getCategoryMeta]);

  const cashflowData = useMemo(() => {
    let cumulative = 0;
    return dailyData.map((d) => {
      cumulative += (d.income - d.expense);
      return {
        day: d.day,
        "Net Saldo": cumulative
      };
    });
  }, [dailyData]);

  // Menghitung sisa hari di bulan yang sedang dipilih
  const daysRemaining = useMemo(() => {
    const today = new Date();
    const currentSelected = new Date(`${currentMonth}-01`);
    
    // Jika melihat bulan lalu/depan, tidak relevan menampilkan sisa hari
    if (today.getMonth() !== currentSelected.getMonth() || today.getFullYear() !== currentSelected.getFullYear()) {
      return null; 
    }

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return lastDayOfMonth - today.getDate();
  }, [currentMonth]);

  const expenseByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    for (const t of transactions.filter((t) => t.type === "expense")) {
      result[t.category] = (result[t.category] ?? 0) + t.amount;
    }
    return result;
  }, [transactions]);

  // Menghitung ringkasan total seluruh anggaran
  const totalBudgetSummary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;

    budgets.forEach(b => {
      totalLimit += b.limit;
      totalSpent += (expenseByCategory[b.category] ?? 0);
    });

    return { totalLimit, totalSpent };
  }, [budgets, expenseByCategory]);

  const savingsRate = summary.totalIncome > 0
    ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
    : 0;

  // Filter khusus untuk data yang akan dicetak ke PDF
  const exportData = useMemo(() => {
    // Jika pilihannya "Bulanan", cukup gunakan seluruh transaksi di bulan tersebut
    if (exportPeriod === "monthly") {
      return transactions;
    }
    
    // Jika "Rentang Tanggal", filter transaksi berdasarkan tanggal awal dan akhir
    return transactions.filter(t => {
      // Mengubah string tanggal (YYYY-MM-DD) menjadi angka agar mudah dibandingkan
      const txDate = new Date(t.date).getTime();
      const start = new Date(exportStartDate).getTime();
      const end = new Date(exportEndDate).getTime();
      
      return txDate >= start && txDate <= end;
    });
  }, [transactions, exportPeriod, exportStartDate, exportEndDate]);

  // Hitung ulang ringkasan (Pemasukan/Pengeluaran) khusus untuk data yang difilter ini
  const exportSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    exportData.forEach(t => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [exportData]);

  return (
    <div className={`app-layout ${theme === "dark" ? "ios-dark" : "ios-light"}`}>
      {/* Sidebar Desktop */}
      <aside className="sidebar iOs-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <SavingsRoundedIcon style={{ fontSize: 24, color: "#007AFF" }} />
          </div>
          <div>
            <div className="sidebar-logo-text">MoFlow</div>
            <div className="sidebar-logo-sub">Track your money flow.</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {words[item.labelKey as keyof typeof words]}
            </button>
          ))}
        </nav>
        <button className="btn btn-primary ios-btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: "auto" }}>
          + {words.addTransaction}
        </button>
      </aside>

      {/* Konten Utama */}
      <main className="main-content printable-area">
        {/* Header Konten */}
        <div className="page-header non-printable">
          <h1 className="page-title">{words[NAV.find((n) => n.id === page)?.labelKey as keyof typeof words]}</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="month-nav ios-month-nav">
              <button 
                className="month-nav-btn" 
                onClick={() => setCurrentMonth(format(subMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM"))}
              >
                <ChevronLeftIcon />
              </button>
              
              <span className="month-label">{monthLabel}</span>
              
              <button 
                className="month-nav-btn" 
                onClick={() => setCurrentMonth(format(addMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM"))}
              >
                <ChevronRightIcon />
              </button>
            </div>
            {/* <button className="btn btn-ghost add-btn-desktop ios-btn-secondary" onClick={() => setShowAdd(true)}>
              + Add
            </button> */}
          </div>
        </div>

        {loading ? (
          <div className="loader-container">
            <div className="ios-spinner"></div>
            <p className="loader-text">{words.loading}</p>
          </div>
        ) : (
          <>
            {/* ── 1. DASHBOARD VIEW ── */}
            {page === "dashboard" && (
              <>
                <div className="summary-grid">
                  <div className="summary-card ios-card income">
                    <div className="summary-label">{words.income}</div>
                    <div className="summary-amount">{formatCurrency(summary.totalIncome)}</div>
                    <div className="summary-sub">{transactions.filter((t) => t.type === "income").length} {words.entries}</div>
                  </div>
                  <div className="summary-card ios-card expense">
                    <div className="summary-label">{words.expenses}</div>
                    <div className="summary-amount">{formatCurrency(summary.totalExpense)}</div>
                    <div className="summary-sub">{transactions.filter((t) => t.type === "expense").length} {words.entries}</div>
                  </div>
                  <div className="summary-card ios-card balance">
                    <div className="summary-label">{words.balance}</div>
                    <div className="summary-amount dynamic-color">
                      {formatCurrency(summary.balance)}
                    </div>
                    <div className="summary-sub">{words.savingsRate}: {savingsRate}%</div>
                  </div>
                </div>

                <div className="grid-sidebar">
                  <div>
                    <div className="card ios-card section">
                      <div className="section-header">
                        <span className="section-title">{words.dailyActivity}</span>
                      </div>
                      {dailyData.length > 0 ? (
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={dailyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#FF3B30" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              
                              {/* Garis bantu horizontal yang tipis */}
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-border-light)" />
                              
                              <XAxis 
                                dataKey="day" 
                                tick={{ fontSize: 11, fill: "#8E8E93" }} 
                                axisLine={false} 
                                tickLine={false} 
                                tickMargin={10} 
                              />
                              <YAxis hide />
                              <Tooltip
                                contentStyle={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "none", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                formatter={(value: any) => formatCurrency(value)}
                                labelFormatter={(label) => `${words.date || 'Tanggal'} ${label}`}
                              />
                              
                              {/* Area Pemasukan (Hijau) */}
                              <Area 
                                type="monotone" 
                                dataKey="income" 
                                stroke="#34C759" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorIncome)" 
                              />
                              {/* Area Pengeluaran (Merah) */}
                              <Area 
                                type="monotone" 
                                dataKey="expense" 
                                stroke="#FF3B30" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorExpense)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-text">{words.noTransactions}</div>
                        </div>
                      )}
                    </div>

                    <div className="card ios-card">
                      <div className="section-header">
                        <span className="section-title">{words.recent}</span>
                        <button className="btn-action-small" onClick={() => setPage("transactions")}>
                          {words.seeAll}
                        </button>
                      </div>
                      <div className="tx-list">
                        {transactions.slice(0, 5).map((t) => {
                          const meta = getCategoryMeta(t.category);
                          return (
                            <div key={t.id} className="tx-item ios-tx-item" onClick={() => setEditTx(t)}>
                              <div className={`tx-icon circle-icon ${t.type}`}>{meta.icon}</div>
                              <div className="tx-details">
                                <div className="tx-note">{t.note}</div>
                                <div className="tx-meta">{meta.label}</div>
                              </div>
                              <div className={`tx-amount ios-amount ${t.type}`}>
                                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="card ios-card section">
                      <div className="section-header">
                        <span className="section-title">{words.budgets}</span>
                        <button className="btn-action-small" onClick={() => setShowBudget(true)}>
                          {words.manage}
                        </button>
                      </div>
                      {budgets.map((b) => {
                        const meta = getCategoryMeta(b.category);
                        const spent = expenseByCategory[b.category] ?? 0;
                        const pct = Math.min((spent / b.limit) * 100, 100);
                        return (
                          <div key={b.id} className="budget-item ios-budget">
                            <div className="budget-header" style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 5 }}>
                              <span className="budget-label">{meta.icon} {meta.label}</span>
                              <span className="budget-amounts" style={{ fontWeight: 600 }}>{formatCurrency(spent)} / {formatCurrency(b.limit)}</span>
                            </div>
                            <div className="budget-bar-track ios-track">
                              <div className="budget-bar-fill" style={{ width: `${pct}%`, background: spent > b.limit ? "#FF3B30" : pct > 75 ? "#FF9500" : "#34C759" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="card ios-card">
                      <div className="section-header"><span className="section-title">{words.topSpend}</span></div>
                      {categoryData.slice(0, 4).map((c, i) => (
                        <div key={c.category} className="ios-category-row">
                          <span className="row-icon">{c.icon}</span>
                          <span className="row-name">{c.name}</span>
                          <span className="row-value">{formatCurrency(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── 2. TRANSACTIONS VIEW ── */}
            {page === "transactions" && (
              <div className="transactions-page">
                
                {/* Filter & Sort Controls (Tampilan iOS Native) */}
                <div className="ios-filter-bar">
                  
                  {/* Segmented Control untuk Filter */}
                  <div className="ios-segment-container">
                    <button className={`ios-segment-btn ${txFilter === "all" ? "active" : ""}`} onClick={() => setTxFilter("all")}>
                      Semua
                    </button>
                    <button className={`ios-segment-btn income ${txFilter === "income" ? "active" : ""}`} onClick={() => setTxFilter("income")}>
                      {words.income}
                    </button>
                    <button className={`ios-segment-btn expense ${txFilter === "expense" ? "active" : ""}`} onClick={() => setTxFilter("expense")}>
                      {words.expenses}
                    </button>
                  </div>

                  {/* Dropdown untuk Sort */}
                  <div style={{ flex: "1 1 120px" }}>
                    <select
                      className="ios-sort-select"
                      value={txSort}
                      onChange={(e) => setTxSort(e.target.value as any)}
                    >
                      <option value="newest">Terbaru</option>
                      <option value="highest">Tertinggi</option>
                      <option value="lowest">Terendah</option>
                    </select>
                  </div>

                </div>

                {/* Grouped List */}
                {processedTransactions.length > 0 ? (
                  processedTransactions.map((group) => (
                    <div key={group.date} className="card ios-card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                      
                      {/* Group Header (Summary Harian) */}
                      <div style={{ background: "var(--ios-input)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ios-text-muted)" }}>
                          {format(parseISO(group.date), "dd MMMM yyyy", { locale: language === "id" ? localeID : localeEN })}
                        </span>
                        <div style={{ fontSize: 12, fontWeight: 600, display: "flex", gap: 12 }}>
                          {group.totalIn > 0 && <span style={{ color: "var(--ios-success)" }}>+{formatCurrency(group.totalIn)}</span>}
                          {group.totalOut > 0 && <span style={{ color: "var(--ios-danger)" }}>-{formatCurrency(group.totalOut)}</span>}
                        </div>
                      </div>

                      {/* Transaction Items */}
                      <div className="tx-list" style={{ padding: "0 16px" }}>
                        {group.items.map((t) => {
                          const meta = getCategoryMeta(t.category);
                          return (
                            <div key={t.id} className="tx-item ios-tx-item" onClick={() => setEditTx(t)}>
                              <div className={`tx-icon circle-icon ${t.type}`}>{meta.icon}</div>
                              <div className="tx-details">
                                <div className="tx-note">{t.note}</div>
                                <div className="tx-meta">{meta.label}</div>
                              </div>
                              <div className={`tx-amount ios-amount ${t.type}`}>
                                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                    </div>
                  ))
                ) : (
                  <div className="empty-state card ios-card" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div className="empty-text" style={{ color: "var(--ios-text-muted)" }}>{words.noTransactions}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── 3. ANALYTICS VIEW ── */}
            {page === "analytics" && (
              <div className="analytics-page">
                
                {/* 1. KARTU RINGKASAN JAJAR SAMPING + INDIKATOR PERBANDINGAN */}
                <div className="analytics-summary-grid">
                  <div className="summary-card ios-card income">
                    <div className="summary-label">{words.income}</div>
                    <div className="summary-amount" style={{ fontSize: 24 }}>{formatCurrency(summary.totalIncome)}</div>
                    <div className="analytics-mom-badge up">
                      ▲ 12.4% <span className="mom-text">vs bulan lalu</span>
                    </div>
                  </div>
                  <div className="summary-card ios-card expense">
                    <div className="summary-label">{words.expenses}</div>
                    <div className="summary-amount" style={{ fontSize: 24 }}>{formatCurrency(summary.totalExpense)}</div>
                    <div className="analytics-mom-badge down">
                      ▼ 4.8% <span className="mom-text">vs bulan lalu</span>
                    </div>
                  </div>
                </div>

                {/* 2. BARIS GRAFIK BREAKDOWN (DONAT + LEGENDA PERSENTASE) & PENGELUARAN TERBESAR */}
                <div className="analytics-main-grid">
                  
                  {/* Grafik Donat + Legenda */}
                  <div className="card ios-card">
                    <div className="section-header">
                      <span className="section-title">Breakdown Kategori</span>
                    </div>
                    {categoryData.length > 0 ? (
                      <div className="pie-analytics-container">
                        <div className="pie-chart-wrapper">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={categoryData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={55} 
                                outerRadius={75} 
                                paddingAngle={3}
                              >
                                {categoryData.map((_, i) => (
                                  <Cell key={i} fill={iOS_COLORS[i % iOS_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Keterangan Kategori + Persentase Dinamis */}
                        <div className="pie-legend-wrapper">
                          {categoryData.map((c, i) => {
                            const pct = summary.totalExpense > 0 ? ((c.value / summary.totalExpense) * 100).toFixed(1) : 0;
                            return (
                              <div key={c.category} className="analytics-legend-item">
                                <span className="legend-dot" style={{ backgroundColor: iOS_COLORS[i % iOS_COLORS.length] }} />
                                <span className="legend-icon">{c.icon}</span>
                                <span className="legend-name">{c.name}</span>
                                <span className="legend-pct">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state" style={{ padding: "40px 0", textAlign: "center", color: "var(--ios-text-muted)" }}>
                        {words.noTransactions}
                      </div>
                    )}
                  </div>

                  {/* Pengeluaran Terbesar Progresif */}
                  <div className="card ios-card">
                    <div className="section-header">
                      <span className="section-title">{words.topSpend}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {categoryData.slice(0, 4).map((c, i) => (
                        <div key={c.category}>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 13, marginBottom: 5 }}>
                            <span>{c.icon} {c.name}</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(c.value)}</span>
                          </div>
                          <div className="budget-bar-track ios-track">
                            <div 
                              className="budget-bar-fill" 
                              style={{ 
                                width: `${summary.totalExpense > 0 ? (c.value / summary.totalExpense) * 100 : 0}%`, 
                                background: iOS_COLORS[i % iOS_COLORS.length] 
                              }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* 3. GRAFIK TREN SALDO KORIDOR PENUH (CASHFLOW TREN) */}
                <div className="card ios-card" style={{ marginTop: 16 }}>
                  <div className="section-header">
                    <div>
                      <span className="section-title">Tren Arus Kas Bulanan</span>
                      <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginTop: 2 }}>
                        Melihat akumulasi bersih (Pemasukan - Pengeluaran) harian
                      </div>
                    </div>
                  </div>
                  {dailyData.length > 0 ? (
                    <div className="chart-container" style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cashflowData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-border-light)" />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} />
                          
                          {/* Y-Axis diperbaiki di sini */}
                          <YAxis 
                            tickFormatter={formatCompact} 
                            tick={{ fontSize: 11, fill: "#8E8E93" }} 
                            axisLine={false} 
                            tickLine={false} 
                            width={45} 
                          />
                          
                          <Tooltip
                            contentStyle={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "none", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            formatter={(value: any) => formatCurrency(value)}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Net Saldo" 
                            stroke="#007AFF" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#007AFF" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: "40px 0", textAlign: "center", color: "var(--ios-text-muted)" }}>
                      {words.noTransactions}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── 4. BUDGETS VIEW ── */}
            {page === "budgets" && (
              <div className="budgets-page">
                
                {/* Bagian Atas: Tombol Tambah & Ringkasan Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                  <button className="btn btn-primary ios-btn-primary" style={{ maxWidth: 180 }} onClick={() => setShowBudget(true)}>
                    + {words.setBudget}
                  </button>

                  {budgets.length > 0 && (
                    <div style={{ textAlign: "right", color: "var(--ios-text-muted)", fontSize: 14 }}>
                      <div>Total Anggaran: <span style={{ color: "var(--ios-text-main)", fontWeight: 600 }}>{formatCurrency(totalBudgetSummary.totalLimit)}</span></div>
                      <div>Total Terpakai: <span style={{ color: "var(--ios-danger)", fontWeight: 600 }}>{formatCurrency(totalBudgetSummary.totalSpent)}</span></div>
                      {daysRemaining !== null && (
                        <div style={{ marginTop: 4, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          ⏱ <span style={{ fontWeight: 500 }}>{words.remaining} {daysRemaining} hari</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {budgets.length > 0 ? (
                  <div className="budgets-grid">
                    {budgets.map((b) => {
                      const meta = getCategoryMeta(b.category);
                      const spent = expenseByCategory[b.category] ?? 0;
                      const pct = Math.min((spent / b.limit) * 100, 100);
                      const remaining = b.limit - spent;
                      
                      // Logika warna progress bar
                      let barColor = "#34C759"; // Hijau aman
                      if (pct >= 90) barColor = "#FF3B30"; // Merah bahaya
                      else if (pct >= 75) barColor = "#FF9500"; // Oranye peringatan

                      return (
                        <div key={b.id} className="card ios-card budget-card-compact" onClick={() => setShowBudget(true)} style={{ cursor: "pointer" }}>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div className={`tx-icon circle-icon expense`} style={{ width: 40, height: 40, fontSize: 18 }}>
                                {meta.icon}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{meta.label}</div>
                                <div style={{ fontSize: 12, color: "var(--ios-text-muted)" }}>{words.monthlyBudget}</div>
                              </div>
                            </div>
                            <div className={`ios-badge ${remaining < 0 ? "danger" : pct >= 75 ? "warning" : "success"}`}>
                              {Math.round(pct)}%
                            </div>
                          </div>

                          <div className="budget-bar-track ios-track" style={{ height: 8, marginBottom: 12, background: "var(--ios-border-light)" }}>
                            <div className="budget-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ios-text-secondary)" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 11, color: "var(--ios-text-muted)", marginBottom: 2 }}>{words.spent}</span>
                              <span style={{ fontWeight: 600, color: "var(--ios-text-main)" }}>{formatCurrency(spent)}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                              <span style={{ fontSize: 11, color: "var(--ios-text-muted)", marginBottom: 2 }}>
                                {remaining < 0 ? words.overBy : "Sisa Anggaran"}
                              </span>
                              <span style={{ fontWeight: 600, color: remaining < 0 ? "var(--ios-danger)" : "var(--ios-text-main)" }}>
                                {formatCurrency(Math.abs(remaining))}
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state card ios-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                    <div className="empty-text" style={{ color: "var(--ios-text-muted)", marginBottom: 16 }}>Belum ada anggaran yang dibuat.</div>
                    <button className="btn-action-small" onClick={() => setShowBudget(true)} style={{ fontSize: 14, padding: "8px 16px" }}>
                      Buat Anggaran Pertama
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── 5. USER PROFILE & PREFERENCES VIEW (NEW) ── */}
            {page === "profile" && (
              <div className="ios-profile-container">

                {/* User Info Header Card */}
                <div className="card ios-card user-hero" style={{ position: "relative" }}>
                  {/* Tombol Edit */}
                  <button 
                    onClick={() => { 
                      setTempName(userName); 
                      setTempBio(userBio); 
                      setShowProfileModal(true); 
                    }}
                    style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "var(--ios-primary)", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                  >
                    Edit
                  </button>

                  <div className="avatar-circle">
                    {userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <h2>{userName}</h2>
                    <p>{userBio}</p>
                  </div>
                </div>

                {/* User Info Header Card */}
                {/* <div className="card ios-card user-hero">
                  <div className="avatar-circle">YP</div>
                  <div className="user-meta">
                    <h2>Yonda Eko Prasetyo</h2>
                    <p>Spatial Data Analyst & Researcher</p>
                  </div>
                </div> */}

                {/* Settings System Grouped List */}
                <div className="ios-settings-group">
                  <div className="group-title">{words.preferences}</div>
                  <div className="card ios-card grouped-list-card">
                    
                    {/* Tampilan Kontrol */}
                    <div className="setting-row">
                      <div className="row-left">✨ {words.theme}</div>
                      <div className="row-right">
                        <button className={`toggle-segment ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>Light</button>
                        <button className={`toggle-segment ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>Dark</button>
                      </div>
                    </div>

                    {/* Bahasa Kontrol */}
                    <div className="setting-row">
                      <div className="row-left">🌐 {words.language}</div>
                      <div className="row-right">
                        <button className={`toggle-segment ${language === "en" ? "active" : ""}`} onClick={() => setLanguage("en")}>EN</button>
                        <button className={`toggle-segment ${language === "id" ? "active" : ""}`} onClick={() => setLanguage("id")}>ID</button>
                      </div>
                    </div>

                    {/* Mata Uang Kontrol */}
                    <div className="setting-row">
                      <div className="row-left">💵 {words.currency}</div>
                      <div className="row-right">
                        <button className={`toggle-segment ${currency === "USD" ? "active" : ""}`} onClick={() => setCurrency("USD")}>USD ($)</button>
                        <button className={`toggle-segment ${currency === "IDR" ? "active" : ""}`} onClick={() => setCurrency("IDR")}>IDR (Rp)</button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Action Controls Card */}
                <div className="ios-settings-group">
                  <div className="card ios-card grouped-list-card action-card">
                    <button className="ios-list-action-btn" onClick={() => setShowExportModal(true)}>
                      <span className="action-icon"><FileDownloadIcon /></span>
                      {words.exportReport}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="bottom-nav ios-bottom-nav non-printable">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <span className="bottom-nav-item-icon">{item.icon}</span>
            <span className="bottom-nav-item-label">{words[item.labelKey as keyof typeof words]}</span>
          </button>
        ))}
      </nav>

      {/* FAB Mobile Button */}
      {!showAdd && !editTx && !showBudget && (
        <button 
          className={`fab ios-fab non-printable ${isVisible ? "" : "hide"}`} 
          onClick={() => setShowAdd(true)}>
          <AddIcon />
        </button>
      )}

      {/* Modals Core Controls - Tambahkan prop currentLang={language} */}
      {showAdd && (
        <TransactionModal 
          onClose={() => setShowAdd(false)} 
          onSave={addTransaction} 
          currentLang={language} 
        />
      )}

      {editTx && (
        <TransactionModal
          onClose={() => setEditTx(null)}
          onSave={(data) => updateTransaction(editTx.id, data)}
          onDelete={deleteTransaction}
          initial={editTx}
          currentLang={language}
        />
      )}

      {showBudget && (
        <BudgetModal
          onClose={() => setShowBudget(false)}
          onSave={setBudget}
          onDelete={deleteBudget}
          budgets={budgets}
          spentByCategory={expenseByCategory}
          currentLang={language}
        />
      )}

      {/* ── Modal Pengaturan Cetak PDF ── */}
      {showExportModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowExportModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Pengaturan Laporan</h2>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            {/* Pilihan Periode */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Periode Laporan</label>
              <div className="ios-segment-container" style={{ width: "100%", margin: 0 }}>
                <button 
                  className={`ios-segment-btn ${exportPeriod === "monthly" ? "active" : ""}`} 
                  onClick={() => setExportPeriod("monthly")}
                >
                  Bulanan
                </button>
                <button 
                  className={`ios-segment-btn ${exportPeriod === "custom" ? "active" : ""}`} 
                  onClick={() => setExportPeriod("custom")}
                >
                  Rentang Tanggal
                </button>
              </div>
            </div>

            {/* Pilihan Waktu (Dinamis: Bulanan / Rentang Tanggal) */}
            <div className="form-group" style={{ marginBottom: 24, padding: "16px", background: "var(--ios-card-bg)", borderRadius: 12, border: "1px solid var(--ios-border-light)" }}>
              <label className="form-label" style={{ marginBottom: 12 }}>
                {exportPeriod === "monthly" ? "Pilih Bulan Laporan" : "Pilih Tanggal Awal & Akhir"}
              </label>
              
              {exportPeriod === "monthly" ? (
                <input 
                  type="month" 
                  className="form-input" 
                  style={{ width: "100%", margin: 0, height: 40, border: "none", backgroundColor: "var(--ios-input)", borderRadius: 10, padding: "0 12px" }}
                  value={currentMonth} 
                  onChange={(e) => setCurrentMonth(e.target.value)} 
                />
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "var(--ios-text-muted)", marginBottom: 4, fontWeight: 600 }}>Mulai</div>
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ width: "100%", margin: 0, height: 40, border: "none", backgroundColor: "var(--ios-input)", borderRadius: 10, padding: "0 12px", fontSize: 13 }}
                      value={exportStartDate} 
                      onChange={(e) => setExportStartDate(e.target.value)} 
                    />
                  </div>
                  <span style={{ color: "var(--ios-text-muted)", marginTop: 18 }}>-</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "var(--ios-text-muted)", marginBottom: 4, fontWeight: 600 }}>Sampai</div>
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ width: "100%", margin: 0, height: 40, border: "none", backgroundColor: "var(--ios-input)", borderRadius: 10, padding: "0 12px", fontSize: 13 }}
                      value={exportEndDate} 
                      onChange={(e) => setExportEndDate(e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pilihan Konten Laporan */}
            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label" style={{ marginBottom: 12 }}>Konten Laporan</label>
              <div style={{ background: "var(--ios-card-bg)", borderRadius: 12, border: "1px solid var(--ios-border-light)", overflow: "hidden" }}>
                
                <label className="setting-row" style={{ cursor: "pointer", borderBottom: "1px solid var(--ios-border-light)", padding: "16px" }}>
                  <div className="row-left" style={{ fontSize: 14 }}>📊 Analisis & Ringkasan</div>
                  <div className="row-right">
                    <input 
                      type="checkbox" 
                      className="ios-checkbox"
                      checked={exportIncludeAnalytics}
                      onChange={(e) => setExportIncludeAnalytics(e.target.checked)}
                    />
                  </div>
                </label>

                <label className="setting-row" style={{ cursor: "pointer", padding: "16px" }}>
                  <div className="row-left" style={{ fontSize: 14 }}>🧾 Daftar Transaksi Rinci</div>
                  <div className="row-right">
                    <input 
                      type="checkbox" 
                      className="ios-checkbox"
                      checked={exportIncludeTx}
                      onChange={(e) => setExportIncludeTx(e.target.checked)}
                    />
                  </div>
                </label>

              </div>
            </div>

            <button 
              className="btn btn-primary ios-btn-primary" 
              onClick={() => {
                setShowExportModal(false);
                // Nanti kita akan buat logika print khusus di sini
                setTimeout(() => window.print(), 300);
              }}
              disabled={!exportIncludeAnalytics && !exportIncludeTx}
            >
              Cetak PDF Sekarang
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Edit Profil ── */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowProfileModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profil</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input 
                className="form-input" 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Bio / Pekerjaan</label>
              <input 
                className="form-input" 
                type="text" 
                value={tempBio} 
                onChange={(e) => setTempBio(e.target.value)} 
              />
            </div>

            <button 
              className="btn btn-primary ios-btn-primary" 
              onClick={() => {
                setUserName(tempName);
                setUserBio(tempBio);
                setShowProfileModal(false);
              }}
            >
              Simpan Profil
            </button>
          </div>
        </div>
      )}

      {/* ── KANVAS RAHASIA UNTUK CETAK PDF (Hanya Muncul Saat Print) ── */}
      <div className="print-only-canvas">
        <div style={{ textAlign: "center", marginBottom: 30, borderBottom: "2px solid #000", paddingBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Laporan Keuangan MoFlow</h1>
          <p style={{ margin: "8px 0 0 0", color: "#666" }}>
            Periode: {exportPeriod === "monthly" 
              ? monthLabel 
              : `${format(new Date(exportStartDate), "dd MMM yyyy")} - ${format(new Date(exportEndDate), "dd MMM yyyy")}`}
          </p>
        </div>

        {/* Bagian Analisis Print */}
        {exportIncludeAnalytics && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Ringkasan Arus Kas</h2>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="card ios-card" style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#666" }}>Total Pemasukan</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#34C759" }}>{formatCurrency(exportSummary.income)}</div>
              </div>
              <div className="card ios-card" style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#666" }}>Total Pengeluaran</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#FF3B30" }}>{formatCurrency(exportSummary.expense)}</div>
              </div>
              <div className="card ios-card" style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#666" }}>Surplus / Defisit</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: exportSummary.balance >= 0 ? "#007AFF" : "#FF3B30" }}>
                  {formatCurrency(exportSummary.balance)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bagian Transaksi Print */}
        {exportIncludeTx && (
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Daftar Transaksi Rinci</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                  <th style={{ padding: "8px 4px" }}>Tanggal</th>
                  <th style={{ padding: "8px 4px" }}>Kategori</th>
                  <th style={{ padding: "8px 4px" }}>Catatan</th>
                  <th style={{ padding: "8px 4px", textAlign: "right" }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {exportData
                  .sort((a, b) => b.date.localeCompare(a.date)) // Urutkan dari terbaru
                  .map(t => {
                    const meta = getCategoryMeta(t.category);
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px 4px" }}>{t.date}</td>
                        <td style={{ padding: "8px 4px" }}>{meta.icon} {meta.label}</td>
                        <td style={{ padding: "8px 4px", color: "#666" }}>{t.note || "-"}</td>
                        <td style={{ padding: "8px 4px", textAlign: "right", color: t.type === "income" ? "#34C759" : "#FF3B30", fontWeight: "bold" }}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    )
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "#999" }}>
          Dicetak secara otomatis dari sistem MoFlow pada {format(new Date(), "dd MMMM yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}