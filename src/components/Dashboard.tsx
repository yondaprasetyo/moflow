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
import AddIcon from '@mui/icons-material/AddRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import { changeUserPassword, logOut } from "@/lib/firebase";

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
    preferences: "Preferences",
    date: "Date",
    // Tambahan baru untuk halaman dalam
    sortNewest: "Sort by: Newest",
    sortHighest: "Sort by: Highest",
    sortLowest: "Sort by: Lowest",
    vsLastMonth: "vs last month",
    categoryBreakdown: "Category Breakdown",
    cashflowTrend: "Monthly Cashflow Trend",
    cashflowDesc: "Viewing daily net accumulation (Income - Expenses)",
    totalBudget: "Total Budget",
    totalSpent: "Total Spent",
    remainingBudget: "Remaining Budget",
    noBudget: "No budgets created yet.",
    createFirstBudget: "Create First Budget",
    editProfile: "Edit Profile",
    fullName: "Full Name",
    bioJob: "Bio / Occupation",
    saveProfile: "Save Profile",
    changePassword: "Change Password",
    newPassword: "New Password",
    enterNewPassword: "Enter new password",
    savePassword: "Save Password",
    logout: "Log Out",
    reportSettings: "Report Settings",
    reportPeriod: "Report Period",
    monthly: "Monthly",
    dateRange: "Date Range",
    selectReportMonth: "Select Report Month",
    selectStartEndDate: "Select Start & End Date",
    start: "Start",
    end: "End",
    reportContent: "Report Content",
    analyticsSummary: "Analytics & Summary",
    detailedTxList: "Transaction List",
    printPdfNow: "Print PDF Now",
    financialReport: "MoFlow Financial Report",
    period: "Period",
    cashflowSummary: "Cashflow Summary",
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    surplusDeficit: "Surplus / Deficit",
    colDate: "Date",
    colCategory: "Category",
    colNote: "Note",
    colAmount: "Amount",
    printedAutomatically: "Printed automatically from MoFlow system on"
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
    preferences: "Preferensi",
    date: "Tanggal",
    // Tambahan baru untuk halaman dalam
    sortNewest: "Urutkan: Terbaru",
    sortHighest: "Urutkan: Tertinggi",
    sortLowest: "Urutkan: Terendah",
    vsLastMonth: "vs bulan lalu",
    categoryBreakdown: "Breakdown Kategori",
    cashflowTrend: "Tren Arus Kas Bulanan",
    cashflowDesc: "Melihat akumulasi bersih (Pemasukan - Pengeluaran) harian",
    totalBudget: "Total Anggaran",
    totalSpent: "Total Terpakai",
    remainingBudget: "Sisa Anggaran",
    noBudget: "Belum ada anggaran yang dibuat.",
    createFirstBudget: "Buat Anggaran Pertama",
    editProfile: "Edit Profil",
    fullName: "Nama Lengkap",
    bioJob: "Bio / Pekerjaan",
    saveProfile: "Simpan Profil",
    changePassword: "Ubah Password",
    newPassword: "Password Baru",
    enterNewPassword: "Masukkan password baru",
    savePassword: "Simpan Password",
    logout: "Keluar (Logout)",
    reportSettings: "Pengaturan Laporan",
    reportPeriod: "Periode Laporan",
    monthly: "Bulanan",
    dateRange: "Rentang Tanggal",
    selectReportMonth: "Pilih Bulan Laporan",
    selectStartEndDate: "Pilih Tanggal Awal & Akhir",
    start: "Mulai",
    end: "Sampai",
    reportContent: "Konten Laporan",
    analyticsSummary: "Analisis & Ringkasan",
    detailedTxList: "Daftar Transaksi",
    printPdfNow: "Cetak PDF Sekarang",
    financialReport: "Laporan Keuangan",
    period: "Periode",
    cashflowSummary: "Ringkasan Arus Kas",
    totalIncome: "Total Pemasukan",
    totalExpense: "Total Pengeluaran",
    surplusDeficit: "Surplus / Defisit",
    colDate: "Tanggal",
    colCategory: "Kategori",
    colNote: "Catatan",
    colAmount: "Nominal",
    printedAutomatically: "Dicetak secara otomatis dari sistem MoFlow pada"
  }
};

const NAV = [
  { id: "dashboard", labelKey: "overview", icon: <DashboardIcon fontSize="small" /> },
  { id: "transactions", labelKey: "transactions", icon: <ReceiptLongIcon fontSize="small" /> },
  { id: "analytics", labelKey: "analytics", icon: <AnalyticsIcon fontSize="small" /> },
  { id: "budgets", labelKey: "budgets", icon: <PieChartIcon fontSize="small" /> },
] as const;

const iOS_COLORS = ["#007AFF", "#34C759", "#FF3B30", "#FF9500", "#AF52DE", "#5AC8FA", "#FF2D55", "#4CD964"];

const CATEGORY_META: Record<string, { icon: string; label: { id: string; en: string } }> = {
  // Pengeluaran
  food: { icon: "🍴", label: { id: "Makanan", en: "Food" } },
  transport: { icon: "🚗", label: { id: "Transportasi", en: "Transport" } },
  housing: { icon: "🏠", label: { id: "Tempat Tinggal", en: "Housing" } },
  utilities: { icon: "💡", label: { id: "Tagihan", en: "Utilities" } },
  entertainment: { icon: "🎮", label: { id: "Hiburan", en: "Entertainment" } }, // Sudah diperbaiki dari 'fun'
  health: { icon: "❤", label: { id: "Kesehatan", en: "Health" } },
  shopping: { icon: "🛍", label: { id: "Belanja", en: "Shopping" } },
  education: { icon: "🎓", label: { id: "Pendidikan", en: "Education" } },
  travel: { icon: "✈", label: { id: "Liburan", en: "Travel" } },
  other_expense: { icon: "💸", label: { id: "Pengeluaran Lainnya", en: "Other Expense" } }, // Tambahan baru
  
  // Pemasukan
  salary: { icon: "💼", label: { id: "Gaji", en: "Salary" } },
  freelance: { icon: "💻", label: { id: "Pekerjaan Lepas", en: "Freelance" } },
  investment: { icon: "📈", label: { id: "Investasi", en: "Investment" } },
  gift: { icon: "🎁", label: { id: "Hadiah", en: "Gift" } }, // Tambahan baru
  other_income: { icon: "💵", label: { id: "Pemasukan Lainnya", en: "Other Income" } }, // Tambahan baru
  
  // // Fallback (Jaga-jaga jika ada data lama)
  // other: { icon: "💬", label: { id: "Lainnya", en: "Other" } },
};

export default function Dashboard() {
  const [page, setPage] = useState<Page>("dashboard");
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showBudget, setShowBudget] = useState(false);

  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("id");
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");
  const [txSort, setTxSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [txSearch, setTxSearch] = useState("");
  const [txCategoryFilter, setTxCategoryFilter] = useState("all");
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<"monthly" | "custom">("monthly");
  const [exportStartDate, setExportStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [exportEndDate, setExportEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exportIncludeTx, setExportIncludeTx] = useState(true);
  const [exportIncludeAnalytics, setExportIncludeAnalytics] = useState(true);

  const [userName, setUserName] = useState("Yonda Eko Prasetyo");
  const [userBio, setUserBio] = useState("Spatial Data Analyst & Researcher");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempBio, setTempBio] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState(""); 

  const handleChangePassword = async () => {
    try {
      await changeUserPassword(newPassword);
      alert("Password berhasil diubah!");
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (error: any) {
      alert("Gagal: " + error.message);
    }
  };

  const { transactions, budgets, summary, loading, addTransaction, updateTransaction, deleteTransaction, setBudget, deleteBudget } = useMoneyData(currentMonth);

  // --- MENGAMBIL DATA BULAN LALU ---
  const prevMonthStr = useMemo(() => format(subMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM"), [currentMonth]);
  const { summary: prevSummary } = useMoneyData(prevMonthStr);

  // --- KALKULASI PERSENTASE (Month-over-Month) ---
  const momIncome = useMemo(() => {
    if (!prevSummary || prevSummary.totalIncome === 0) return summary.totalIncome > 0 ? 100 : 0;
    return ((summary.totalIncome - prevSummary.totalIncome) / prevSummary.totalIncome) * 100;
  }, [summary.totalIncome, prevSummary]);

  const momExpense = useMemo(() => {
    if (!prevSummary || prevSummary.totalExpense === 0) return summary.totalExpense > 0 ? 100 : 0;
    return ((summary.totalExpense - prevSummary.totalExpense) / prevSummary.totalExpense) * 100;
  }, [summary.totalExpense, prevSummary]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const words = TRANSLATIONS[language];

  const getCategoryMeta = useCallback((categoryId: string) => {
    const meta = CATEGORY_META[categoryId] || CATEGORY_META["other"];
    return {
      icon: meta.icon,
      label: meta.label[language as "en" | "id"],
    };
  }, [language]);

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

  const formatCompact = (n: number) => {
    return new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(n);
  };

  const monthLabel = useMemo(() => {
    const dateObj = new Date(`${currentMonth}-01`);
    return format(dateObj, "MMM yyyy", { locale: language === "id" ? localeID : localeEN });
  }, [currentMonth, language]);

  const dailyData = useMemo(() => {
    const [year, month] = currentMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    const map: Record<string, { income: number; expense: number }> = {};
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      map[dayStr] = { income: 0, expense: 0 };
    }

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

  const processedTransactions = useMemo(() => {
    let filtered = transactions;
    if (txFilter !== "all") {
      filtered = filtered.filter((t) => t.type === txFilter);
    }
    
    if (txCategoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === txCategoryFilter);
    }

    if (txSearch.trim() !== "") {
      const query = txSearch.toLowerCase();
      filtered = filtered.filter((t) => 
        t.note.toLowerCase().includes(query) || 
        getCategoryMeta(t.category).label.toLowerCase().includes(query)
      );
    }

    const groups: Record<string, { date: string; items: Transaction[]; totalIn: number; totalOut: number }> = {};
    filtered.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = { date: t.date, items: [], totalIn: 0, totalOut: 0 };
      groups[t.date].items.push(t);
      if (t.type === "income") groups[t.date].totalIn += t.amount;
      else groups[t.date].totalOut += t.amount;
    });

    const groupedArray = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));

    groupedArray.forEach((group) => {
      group.items.sort((a, b) => {
        if (txSort === "highest") return b.amount - a.amount;
        if (txSort === "lowest") return a.amount - b.amount;
        return 0; 
      });
    });

    return groupedArray;
  }, [transactions, txFilter, txSort, txCategoryFilter, txSearch, getCategoryMeta]);

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

  const daysRemaining = useMemo(() => {
    const today = new Date();
    const currentSelected = new Date(`${currentMonth}-01`);
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

  const exportData = useMemo(() => {
    if (exportPeriod === "monthly") return transactions;
    return transactions.filter(t => {
      const txDate = new Date(t.date).getTime();
      const start = new Date(exportStartDate).getTime();
      const end = new Date(exportEndDate).getTime();
      return txDate >= start && txDate <= end;
    });
  }, [transactions, exportPeriod, exportStartDate, exportEndDate]);

  // --- SMART INSIGHTS / ASISTEN KEUANGAN ---
  const smartInsight = useMemo(() => {
    if (transactions.length === 0) {
      return { 
        text: language === 'id' ? "Belum ada transaksi bulan ini. Yuk, mulai catat keuanganmu!" : "No transactions this month. Let's record now!", 
        icon: "👋", 
        type: "neutral" 
      };
    }

    // Cek Anggaran (Paling krusial untuk diperingatkan)
    if (totalBudgetSummary.totalLimit > 0) {
      const budgetUsedPct = (totalBudgetSummary.totalSpent / totalBudgetSummary.totalLimit) * 100;
      if (budgetUsedPct >= 90) {
        return { 
          text: language === 'id' ? `Awas! Pengeluaranmu sudah mencapai ${Math.round(budgetUsedPct)}% dari total anggaran bulan ini. Rem sekarang!` : `Watch out! You've spent ${Math.round(budgetUsedPct)}% of your total budget.`, 
          icon: "🚨", 
          type: "danger" 
        };
      } else if (budgetUsedPct >= 75) {
        return { 
          text: language === 'id' ? `Hati-hati, kamu sudah memakai ${Math.round(budgetUsedPct)}% dari anggaran. Tetap terkendali, ya.` : `Careful, spending has reached ${Math.round(budgetUsedPct)}% of your budget.`, 
          icon: "⚠️", 
          type: "warning" 
        };
      }
    }

    // Cek Besar Pasak daripada Tiang
    if (summary.totalExpense > summary.totalIncome && summary.totalIncome > 0) {
      return { 
        text: language === 'id' ? "Pengeluaranmu melebihi pemasukan bulan ini. Yuk, evaluasi lagi pengeluaran terbesarmu!" : "Your expenses exceed your income this month. Let's evaluate!", 
        icon: "📉", 
        type: "danger" 
      };
    }

    // Cek Tabungan Sehat
    if (savingsRate >= 20) {
      return { 
        text: language === 'id' ? `Keren! Rasio tabunganmu sangat sehat di angka ${savingsRate}%. Pertahankan!` : `Awesome! Your savings rate is very healthy at ${savingsRate}%.`, 
        icon: "🌟", 
        type: "success" 
      };
    }

    // Default jika semua aman
    return { 
      text: language === 'id' ? "Arus kas bulan ini terpantau stabil. Terus pantau transaksimu!" : "Your cashflow looks stable this month. Keep tracking!", 
      icon: "💡", 
      type: "primary" 
    };
  }, [transactions.length, totalBudgetSummary, summary, savingsRate, language]);

  // --- ANALISIS KEBIASAAN (TOP NOTES) ---
  const topNotesData = useMemo(() => {
    // Objek untuk mengelompokkan catatan transaksi
    const notesMap: Record<string, { note: string; amount: number; count: number; category: string }> = {};

    transactions.forEach((t) => {
      // Kita hanya peduli pada pengeluaran yang punya catatan
      if (t.type === "expense" && t.note) {
        const rawNote = t.note.trim();
        const key = rawNote.toLowerCase(); // Samakan huruf besar/kecil agar "Warteg" dan "warteg" terhitung sama

        if (!key) return;

        if (!notesMap[key]) {
          notesMap[key] = { note: rawNote, amount: 0, count: 0, category: t.category };
        }
        notesMap[key].amount += t.amount;
        notesMap[key].count += 1; // Menghitung seberapa sering transaksi ini terjadi
      }
    });

    // Ubah ke array, urutkan dari yang nominalnya paling besar, dan ambil top 5
    return Object.values(notesMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const exportSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    exportData.forEach(t => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  }, [exportData]);

  const getPageTitle = () => {
    if (page === "profile") return words.profile;
    const navItem = NAV.find((n) => n.id === page);
    return navItem ? words[navItem.labelKey as keyof typeof words] : "";
  };

  return (
    <div className={`app-layout ${theme === "dark" ? "ios-dark" : "ios-light"}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .smart-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 900;
          padding: 16px 20px;
          border-bottom: 1px solid var(--ios-border-light);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: ${theme === "dark" ? "rgba(28, 28, 30, 0.82)" : "rgba(242, 242, 247, 0.82)"};
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
          box-sizing: border-box;
        }
        .smart-main {
          padding-top: 88px;
          padding-bottom: 110px;
        }
        .mobile-only-logo { display: flex; }
        .smart-bottom-nav { display: flex; }

        @media (min-width: 768px) {
          .smart-header {
            position: sticky;
            top: 0; left: auto; right: auto;
            padding: 16px 0; margin-bottom: 24px;
          }
          .smart-main {
            padding-top: 0; 
            padding-bottom: 40px;
            
            /* Penyesuaian khusus Desktop & Tab */
            max-width: none !important; 
            width: auto !important;
            flex: 1 !important;
            padding-right: 32px !important;
            box-sizing: border-box;
          }
          .mobile-only-logo { display: none !important; }
          .smart-bottom-nav { display: none !important; }
        }
      `}} />

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sidebar iOs-sidebar non-printable">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <SavingsRoundedIcon fontSize="large" style={{ color: "#007AFF" }} />
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

      {/* ── KONTEN UTAMA ── */}
      <main className="main-content smart-main printable-area">
        
        <header className="app-header smart-header non-printable">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="mobile-only-logo" style={{ color: "var(--ios-primary)" }}>
               <SavingsRoundedIcon fontSize="small" />
            </div>
            <h1 className="page-title" style={{ margin: 0, fontSize: "20px", fontWeight: 700, whiteSpace: "nowrap" }}>
              {getPageTitle()}
            </h1>
          </div>
          
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {page !== "profile" && (
              <div 
                className="month-nav ios-month-nav" 
                style={{ 
                  margin: 0, height: 34, padding: "0 4px", borderRadius: 17, 
                  display: "flex", alignItems: "center", backgroundColor: "var(--ios-input)"
                }}
              >
                <button 
                  className="month-nav-btn" 
                  style={{ padding: "4px", display: "flex", alignItems: "center", color: "var(--ios-primary)" }}
                  onClick={() => setCurrentMonth(format(subMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM"))}
                >
                  <ChevronLeftIcon fontSize="small" />
                </button>
                <span 
                  className="month-label" 
                  style={{ fontSize: 13, fontWeight: 600, margin: "0 4px", minWidth: 50, textAlign: "center" }}
                >
                  {monthLabel}
                </span>
                <button 
                  className="month-nav-btn" 
                  style={{ padding: "4px", display: "flex", alignItems: "center", color: "var(--ios-primary)" }}
                  onClick={() => setCurrentMonth(format(addMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM"))}
                >
                  <ChevronRightIcon fontSize="small" />
                </button>
              </div>
            )}

            <button 
              onClick={() => setPage("profile")}
              style={{
                width: 34, height: 34, borderRadius: "50%", 
                backgroundColor: "var(--ios-primary, #007AFF)", color: "#fff",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", flexShrink: 0
              }}
            >
              {userName ? userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
            </button>
          </div>
        </header>

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
                {/* BANNER SMART INSIGHT */}
                <div className="card ios-card" style={{
                  marginBottom: 16,
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: 
                    smartInsight.type === "danger" ? "rgba(255, 59, 48, 0.1)" :
                    smartInsight.type === "warning" ? "rgba(255, 149, 0, 0.1)" :
                    smartInsight.type === "success" ? "rgba(52, 199, 89, 0.1)" :
                    "rgba(0, 122, 255, 0.1)",
                  border: `1px solid ${
                    smartInsight.type === "danger" ? "rgba(255, 59, 48, 0.3)" :
                    smartInsight.type === "warning" ? "rgba(255, 149, 0, 0.3)" :
                    smartInsight.type === "success" ? "rgba(52, 199, 89, 0.3)" :
                    "rgba(0, 122, 255, 0.3)"
                  }`
                }}>
                  <div style={{ fontSize: "28px" }}>{smartInsight.icon}</div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ios-text-main)", lineHeight: 1.4 }}>
                    {smartInsight.text}
                  </div>
                </div>

                {/* GRID BAWAAN */}
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

                <div className="grid-sidebar" style={{ gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card ios-card section">
                      <div className="section-header">
                        <span className="section-title">{words.dailyActivity}</span>
                      </div>
                      {dailyData.length > 0 ? (
                        <div className="chart-container" style={{ minHeight: 220 }}>
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
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-border-light)" />
                              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} tickMargin={10} />
                              <YAxis hide />
                              <Tooltip
                                contentStyle={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "none", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                formatter={(value: any) => formatCurrency(value)}
                                labelFormatter={(label) => `${words.date} ${label}`}
                              />
                              <Area type="monotone" dataKey="income" stroke="#34C759" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                              <Area type="monotone" dataKey="expense" stroke="#FF3B30" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
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

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card ios-card section">
                      <div className="section-header">
                        <span className="section-title">{words.budgets}</span>
                        <button className="btn-action-small" onClick={() => setShowBudget(true)}>
                          {words.manage}
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    </div>

                    <div className="card ios-card Section">
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
                <div className="ios-filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                  <div className="ios-segment-container" style={{ flex: "1 1 240px", margin: 0 }}>
                    <button className={`ios-segment-btn ${txFilter === "all" ? "active" : ""}`} onClick={() => setTxFilter("all")}>
                      {language === "id" ? "Semua" : "All"}
                    </button>
                    <button className={`ios-segment-btn income ${txFilter === "income" ? "active" : ""}`} onClick={() => setTxFilter("income")}>
                      {words.income}
                    </button>
                    <button className={`ios-segment-btn expense ${txFilter === "expense" ? "active" : ""}`} onClick={() => setTxFilter("expense")}>
                      {words.expenses}
                    </button>
                  </div>

                  <div style={{ position: "relative", flex: "1 1 120px" }}>
                    <select
                      className="ios-sort-select"
                      value={txSort}
                      onChange={(e) => setTxSort(e.target.value as any)}
                      style={{
                        width: "100%", padding: "10px 16px 10px 16px", borderRadius: "10px",
                        border: "none", backgroundColor: "var(--ios-card-bg)", color: "var(--ios-text-main)",
                        fontSize: "14px", fontWeight: 600,
                        appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                        backgroundImage: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", cursor: "pointer"
                      }}
                    >
                      <option value="newest">{words.sortNewest}</option>
                      <option value="highest">{words.sortHighest}</option>
                      <option value="lowest">{words.sortLowest}</option>
                    </select>
                    <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ios-text-muted)", display: "flex", alignItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {/* Kolom Pencarian */}
                  <input 
                    type="text" 
                    placeholder={language === "id" ? "Cari catatan..." : "Search notes..."}
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, height: 40, border: "none", backgroundColor: "var(--ios-card-bg)", borderRadius: 10, padding: "0 12px", outline: "none" }}
                  />
                  
                  {/* Dropdown Kategori */}
                  <select 
                    value={txCategoryFilter}
                    onChange={(e) => setTxCategoryFilter(e.target.value)}
                    style={{ flex: 1, height: 40, border: "none", backgroundColor: "var(--ios-card-bg)", borderRadius: 10, padding: "0 12px", outline: "none", WebkitAppearance: "none" }}
                  >
                    <option value="all">{language === "id" ? "Semua Kategori" : "All Categories"}</option>
                    {Object.keys(CATEGORY_META).map(key => (
                      <option key={key} value={key}>{getCategoryMeta(key).label}</option>
                    ))}
                  </select>
                </div>

                {processedTransactions.length > 0 ? (
                  processedTransactions.map((group) => (
                    <div key={group.date} className="card ios-card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                      <div style={{ background: "var(--ios-input)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ios-text-muted)" }}>
                          {format(parseISO(group.date), "dd MMMM yyyy", { locale: language === "id" ? localeID : localeEN })}
                        </span>
                        <div style={{ fontSize: 12, fontWeight: 600, display: "flex", gap: 12 }}>
                          {group.totalIn > 0 && <span style={{ color: "var(--ios-success)" }}>+{formatCurrency(group.totalIn)}</span>}
                          {group.totalOut > 0 && <span style={{ color: "var(--ios-danger)" }}>-{formatCurrency(group.totalOut)}</span>}
                        </div>
                      </div>

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
                <div className="analytics-summary-grid">
                  {/* --- KARTU PEMASUKAN --- */}
                  <div className="summary-card ios-card income">
                    <div className="summary-label">{words.income}</div>
                    <div className="summary-amount" style={{ fontSize: 24 }}>{formatCurrency(summary.totalIncome)}</div>
                    
                    <div className={`analytics-mom-badge ${momIncome >= 0 ? "up" : "down"}`}>
                      {momIncome >= 0 ? "▲" : "▼"} {Math.abs(momIncome).toFixed(1)}% <span className="mom-text">{words.vsLastMonth}</span>
                    </div>
                  </div>

                  {/* --- KARTU PENGELUARAN --- */}
                  <div className="summary-card ios-card expense">
                    <div className="summary-label">{words.expenses}</div>
                    <div className="summary-amount" style={{ fontSize: 24 }}>{formatCurrency(summary.totalExpense)}</div>
                    
                    <div className={`analytics-mom-badge ${momExpense > 0 ? "down" : "up"}`} style={{ color: momExpense > 0 ? "#FF3B30" : "#34C759", backgroundColor: momExpense > 0 ? "rgba(255,59,48,0.1)" : "rgba(52,199,89,0.1)" }}>
                      {momExpense > 0 ? "▲" : "▼"} {Math.abs(momExpense).toFixed(1)}% <span className="mom-text">{words.vsLastMonth}</span>
                    </div>
                  </div>
                </div>

                <div className="analytics-main-grid">
                  <div className="card ios-card section">
                    <div className="section-header">
                      <span className="section-title">{words.categoryBreakdown}</span>
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
                                cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3}
                              >
                                {categoryData.map((_, i) => (
                                  <Cell key={i} fill={iOS_COLORS[i % iOS_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
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

                  <div className="card ios-card section">
                    <div className="section-header" style={{ marginBottom: 16 }}>
                      <span className="section-title">{words.topSpend}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {categoryData.slice(0, 4).map((c, i) => (
                        <div key={c.category}>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 13, marginBottom: 5 }}>
                            <span>{c.icon} {c.name}</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(c.value)}</span>
                          </div>
                          <div className="budget-bar-track ios-track">
                            <div className="budget-bar-fill" style={{ width: `${summary.totalExpense > 0 ? (c.value / summary.totalExpense) * 100 : 0}%`, background: iOS_COLORS[i % iOS_COLORS.length] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- ANALISIS KEBIASAAN (TOP NOTES) --- */}
                <div className="card ios-card section" style={{ marginTop: 16 }}>
                  <div className="section-header" style={{ marginBottom: 16 }}>
                    <div>
                      <span className="section-title">
                        {language === "id" ? "Kebiasaan Pengeluaran" : "Top Spending Habits"}
                      </span>
                      <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginTop: 2 }}>
                        {language === "id" ? "Pengeluaran terbesar berdasarkan catatan spesifik" : "Largest expenses based on specific notes"}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {topNotesData.length > 0 ? topNotesData.map((item, i) => {
                      const meta = getCategoryMeta(item.category);
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 13, marginBottom: 5 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: "18px" }}>{meta.icon}</span>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600 }}>{item.note}</span>
                                <span style={{ fontSize: 11, color: "var(--ios-text-muted)" }}>
                                  {item.count} {language === "id" ? "kali transaksi" : "transactions"}
                                </span>
                              </div>
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--ios-danger)" }}>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="budget-bar-track ios-track">
                            <div className="budget-bar-fill" style={{ 
                              width: `${summary.totalExpense > 0 ? (item.amount / summary.totalExpense) * 100 : 0}%`, 
                              background: "#FF3B30" 
                            }} />
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="empty-text" style={{ color: "var(--ios-text-muted)", textAlign: "center", padding: "10px 0" }}>
                        {words.noTransactions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card ios-card section" style={{ marginTop: 16 }}>
                  <div className="section-header">
                    <div>
                      <span className="section-title">{words.cashflowTrend}</span>
                      <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginTop: 2 }}>
                        {words.cashflowDesc}
                      </div>
                    </div>
                  </div>
                  {dailyData.length > 0 ? (
                    <div className="chart-container" style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cashflowData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-border-light)" />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} width={45} />
                          <Tooltip contentStyle={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "none", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(value: any) => formatCurrency(value)} />
                          <Line type="monotone" dataKey="Net Saldo" stroke="#007AFF" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: "#007AFF" }} />
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
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                  {budgets.length > 0 && (
                    <div className="card ios-card" style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", textAlign: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginBottom: 4 }}>{words.totalBudget}</div>
                          <div style={{ fontSize: 18, color: "var(--ios-text-main)", fontWeight: 700 }}>{formatCurrency(totalBudgetSummary.totalLimit)}</div>
                        </div>
                        <div style={{ width: 1, backgroundColor: "var(--ios-border-light)", margin: "0 16px" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginBottom: 4 }}>{words.totalSpent}</div>
                          <div style={{ fontSize: 18, color: "var(--ios-danger)", fontWeight: 700 }}>{formatCurrency(totalBudgetSummary.totalSpent)}</div>
                        </div>
                      </div>
                      
                      {daysRemaining !== null && (
                        <div style={{ marginTop: 4, fontSize: 12, color: "var(--ios-text-muted)", backgroundColor: "var(--ios-bg)", padding: "4px 12px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                          ⏱ <span style={{ fontWeight: 500 }}>{words.remaining} {daysRemaining} {language === 'en' ? 'days' : 'hari'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    className="btn btn-primary ios-btn-primary" 
                    style={{ width: "100%", padding: "14px", justifyContent: "center", fontSize: 16 }} 
                    onClick={() => setShowBudget(true)}
                  >
                    + {words.setBudget}
                  </button>
                </div>

                {budgets.length > 0 ? (
                  <div className="budgets-grid">
                    {budgets.map((b) => {
                      const meta = getCategoryMeta(b.category);
                      const spent = expenseByCategory[b.category] ?? 0;
                      const pct = Math.min((spent / b.limit) * 100, 100);
                      const remaining = b.limit - spent;
                      const safeToSpend = daysRemaining && daysRemaining > 0 && remaining > 0 
                        ? remaining / daysRemaining 
                        : 0;
                      
                      let barColor = "#34C759";
                      if (pct >= 90) barColor = "#FF3B30";
                      else if (pct >= 75) barColor = "#FF9500";

                      return (
                        <div key={b.id} className="card ios-card budget-card-compact section" onClick={() => setShowBudget(true)} style={{ cursor: "pointer" }}>
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
                                {remaining < 0 ? words.overBy : words.remainingBudget}
                              </span>
                              <span style={{ fontWeight: 600, color: remaining < 0 ? "var(--ios-danger)" : "var(--ios-text-main)" }}>
                                {formatCurrency(Math.abs(remaining))}
                              </span>
                              {safeToSpend > 0 && (
                                <span style={{ fontSize: 11, color: "var(--ios-success)", marginTop: 4 }}>
                                  Batas: {formatCurrency(safeToSpend)} / hari
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state card ios-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                    <div className="empty-text" style={{ color: "var(--ios-text-muted)", marginBottom: 16 }}>{words.noBudget}</div>
                    <button className="btn-action-small" onClick={() => setShowBudget(true)} style={{ fontSize: 14, padding: "8px 16px" }}>
                      {words.createFirstBudget}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── 5. USER PROFILE & PREFERENCES VIEW ── */}
            {page === "profile" && (
              <div className="ios-profile-container">
                <div className="card ios-card user-hero section" style={{ position: "relative" }}>
                  <button 
                    onClick={() => { 
                      setTempName(userName); 
                      setTempBio(userBio); 
                      setShowProfileModal(true); 
                    }}
                    style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "var(--ios-primary)", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                  >
                    {words.editProfile.split(" ")[0]} {/* Ambil kata pertama saja "Edit" */}
                  </button>

                  <div className="avatar-circle">
                    {userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <h2>{userName}</h2>
                    <p>{userBio}</p>
                  </div>
                </div>

                <div className="ios-settings-group">
                  <div className="group-title">{words.preferences}</div>
                  <div className="card ios-card grouped-list-card section">
                    <div className="setting-row">
                      <div className="row-left">✨ {words.theme}</div>
                      <div className="row-right">
                        <button className={`toggle-segment ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>Light</button>
                        <button className={`toggle-segment ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>Dark</button>
                      </div>
                    </div>

                    <div className="setting-row">
                      <div className="row-left">🌐 {words.language}</div>
                      <div className="row-right">
                        <button className={`toggle-segment ${language === "en" ? "active" : ""}`} onClick={() => setLanguage("en")}>EN</button>
                        <button className={`toggle-segment ${language === "id" ? "active" : ""}`} onClick={() => setLanguage("id")}>ID</button>
                      </div>
                    </div>

                    <div className="setting-row">
                      <div className="row-left">💵 {words.currency}</div>
                      <div className="row-right">
                        <button className={`toggle-segment ${currency === "USD" ? "active" : ""}`} onClick={() => setCurrency("USD")}>USD ($)</button>
                        <button className={`toggle-segment ${currency === "IDR" ? "active" : ""}`} onClick={() => setCurrency("IDR")}>IDR (Rp)</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ios-settings-group">
                  <div className="card ios-card grouped-list-card action-card section">
                    <button className="ios-list-action-btn" onClick={() => setShowExportModal(true)}>
                      <span className="action-icon"><FileDownloadIcon /></span>
                      {words.exportReport}
                    </button>
                  </div>
                </div>

                <div className="ios-settings-group" style={{ marginTop: '10px' }}>
                  <div className="card ios-card grouped-list-card action-card section">
                    <button 
                      className="ios-list-action-btn" 
                      onClick={() => setShowPasswordModal(true)} 
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {words.changePassword}
                    </button>
                  </div>
                </div>

                <div className="ios-settings-group" style={{ marginTop: '20px' }}>
                  <div className="card ios-card grouped-list-card action-card section">
                    <button 
                      className="ios-list-action-btn" 
                      onClick={() => logOut()} 
                      style={{ color: '#ff3b30', width: '100%', justifyContent: 'center' }}
                    >
                      {words.logout}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <nav 
        className="bottom-nav ios-bottom-nav smart-bottom-nav non-printable" 
        style={{ 
          position: "fixed", bottom: 0, left: 0, right: 0,
          justifyContent: "space-between", padding: "0 10px", alignItems: "center",
          backgroundColor: theme === "dark" ? "#1C1C1E" : "#FFFFFF", 
          backdropFilter: "none", WebkitBackdropFilter: "none", 
          borderTop: "1px solid var(--ios-border-light)", zIndex: 1000
        }}
      >
        <div style={{ display: "flex", flex: 1, justifyContent: "space-around" }}>
          {NAV.slice(0, 2).map((item) => (
            <button
              key={item.id}
              className={`bottom-nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="bottom-nav-item-icon">{item.icon}</span>
              <span className="bottom-nav-item-label">{words[item.labelKey as keyof typeof words]}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 70 }}>
          {!showAdd && !editTx && !showBudget && (
            <button 
              className="fab ios-fab non-printable" 
              onClick={() => setShowAdd(true)}
              style={{
                position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                width: 56, height: 56, boxShadow: "0 6px 16px rgba(0, 122, 255, 0.3)", zIndex: 1001,
                border: `4px solid ${theme === "dark" ? "#1C1C1E" : "#FFFFFF"}`, 
                backgroundColor: "var(--ios-primary, #007AFF)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%"
              }}
            >
              <AddIcon fontSize="large" />
            </button>
          )}
        </div>

        <div style={{ display: "flex", flex: 1, justifyContent: "space-around" }}>
          {NAV.slice(2, 4).map((item) => (
            <button
              key={item.id}
              className={`bottom-nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="bottom-nav-item-icon">{item.icon}</span>
              <span className="bottom-nav-item-label">{words[item.labelKey as keyof typeof words]}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {showAdd && <TransactionModal onClose={() => setShowAdd(false)} onSave={addTransaction} currentLang={language} />}
      {editTx && <TransactionModal onClose={() => setEditTx(null)} onSave={(data) => updateTransaction(editTx.id, data)} onDelete={deleteTransaction} initial={editTx} currentLang={language} />}
      {showBudget && <BudgetModal onClose={() => setShowBudget(false)} onSave={setBudget} onDelete={deleteBudget} budgets={budgets} spentByCategory={expenseByCategory} currentLang={language} />}

      {/* Modal Pengaturan Cetak PDF */}
      {showExportModal && (
        <div 
          className="modal-overlay non-printable" 
          onClick={(e) => e.target === e.currentTarget && setShowExportModal(false)}
          style={{ zIndex: 2000 }}
        >
          <div 
            className="modal"
            style={{ width: "90%", maxWidth: "400px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "16px", margin: "auto", padding: 0 }}
          >
            <div className="modal-header" style={{ flexShrink: 0, padding: "24px 24px 16px 24px", marginBottom: 0, borderBottom: "1px solid var(--ios-border-light, #eaeaea)" }}>
              <h2 className="modal-title">{words.reportSettings}</h2>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            <div style={{ overflowY: "auto", overflowX: "hidden", flex: 1, padding: "16px 24px 24px 24px" }}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">{words.reportPeriod}</label>
                <div className="ios-segment-container" style={{ width: "100%", margin: 0 }}>
                  <button className={`ios-segment-btn ${exportPeriod === "monthly" ? "active" : ""}`} onClick={() => setExportPeriod("monthly")}>{words.monthly}</button>
                  <button className={`ios-segment-btn ${exportPeriod === "custom" ? "active" : ""}`} onClick={() => setExportPeriod("custom")}>{words.dateRange}</button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24, padding: "16px", background: "var(--ios-card-bg)", borderRadius: 12, border: "1px solid var(--ios-border-light)" }}>
                <label className="form-label" style={{ marginBottom: 12 }}>
                  {exportPeriod === "monthly" ? words.selectReportMonth : words.selectStartEndDate}
                </label>
                
                {exportPeriod === "monthly" ? (
                  <input 
                    type="month" 
                    className="form-input" 
                    value={currentMonth} 
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    style={{ 
                      WebkitAppearance: "none",
                      appearance: "none",
                      display: "block",
                      width: "100%", 
                      maxWidth: "100%",
                      minWidth: 0,
                      boxSizing: "border-box", 
                      margin: 0, 
                      minHeight: "44px",
                      padding: "10px 12px",
                      backgroundColor: "var(--ios-input)", 
                      border: "none", 
                      borderRadius: "10px", 
                      color: "inherit",
                      fontFamily: "inherit",
                      overflow: "hidden"
                    }} 
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginBottom: 6, fontWeight: 600 }}>{words.start}</div>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={exportStartDate} 
                        onChange={(e) => setExportStartDate(e.target.value)}
                        style={{ 
                          WebkitAppearance: "none",
                          appearance: "none",
                          display: "block",
                          width: "100%", 
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box", 
                          margin: 0, 
                          minHeight: "44px",
                          padding: "10px 12px",
                          backgroundColor: "var(--ios-input)", 
                          border: "none", 
                          borderRadius: "10px", 
                          fontSize: "13px",
                          color: "inherit",
                          fontFamily: "inherit",
                          overflow: "hidden"
                        }}  
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ios-text-muted)", marginBottom: 6, fontWeight: 600 }}>{words.end}</div>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={exportEndDate} 
                        onChange={(e) => setExportEndDate(e.target.value)}
                        style={{ 
                          WebkitAppearance: "none",
                          appearance: "none",
                          display: "block",
                          width: "100%", 
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box", 
                          margin: 0, 
                          minHeight: "44px",
                          padding: "10px 12px",
                          backgroundColor: "var(--ios-input)", 
                          border: "none", 
                          borderRadius: "10px", 
                          fontSize: "13px",
                          color: "inherit",
                          fontFamily: "inherit",
                          overflow: "hidden"
                        }}  
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label" style={{ marginBottom: 12 }}>{words.reportContent}</label>
                <div style={{ background: "var(--ios-card-bg)", borderRadius: 12, border: "1px solid var(--ios-border-light)", overflow: "hidden" }}>
                  <label className="setting-row" style={{ cursor: "pointer", borderBottom: "1px solid var(--ios-border-light)", padding: "16px" }}>
                    <div className="row-left" style={{ fontSize: 14 }}>📊 {words.analyticsSummary}</div>
                    <div className="row-right"><input type="checkbox" className="ios-checkbox" checked={exportIncludeAnalytics} onChange={(e) => setExportIncludeAnalytics(e.target.checked)} /></div>
                  </label>
                  <label className="setting-row" style={{ cursor: "pointer", padding: "16px" }}>
                    <div className="row-left" style={{ fontSize: 14 }}>🧾 {words.detailedTxList}</div>
                    <div className="row-right"><input type="checkbox" className="ios-checkbox" checked={exportIncludeTx} onChange={(e) => setExportIncludeTx(e.target.checked)} /></div>
                  </label>
                </div>
              </div>

              <button 
                className="btn btn-primary ios-btn-primary" 
                onClick={() => {
                  // Panggil print secara langsung tanpa delay
                  window.print();
                  // Setelah dialog print ditutup oleh user, modal ini baru di-unmount
                  setShowExportModal(false); 
                }} 
                disabled={!exportIncludeAnalytics && !exportIncludeTx}
              >
                {words.printPdfNow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Profil */}
      {showProfileModal && (
        <div 
          className="modal-overlay" 
          onClick={(e) => e.target === e.currentTarget && setShowProfileModal(false)}
          style={{ zIndex: 2000 }} /* 👇 TAMBAHKAN INI AGAR MENUTUPI HEADER 👇 */
        >
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{words.editProfile}</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{words.fullName}</label>
              <input className="form-input" type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">{words.bioJob}</label>
              <input className="form-input" type="text" value={tempBio} onChange={(e) => setTempBio(e.target.value)} />
            </div>
            <button className="btn btn-primary ios-btn-primary" onClick={() => { setUserName(tempName); setUserBio(tempBio); setShowProfileModal(false); }}>
              {words.saveProfile}
            </button>
          </div>
        </div>
      )}

      {/* Modal Password */}
      {showPasswordModal && (
        <div 
          className="modal-overlay" 
          onClick={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}
          style={{ zIndex: 2000 }} /* 👇 TAMBAHKAN INI AGAR MENUTUPI HEADER 👇 */
        >
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{words.changePassword}</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">{words.newPassword}</label>
              <input className="form-input" type="password" placeholder={words.enterNewPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary ios-btn-primary" onClick={handleChangePassword}>
              {words.savePassword}
            </button>
          </div>
        </div>
      )}

      {/* KANVAS RAHASIA UNTUK CETAK PDF */}
      <div className="print-only-canvas">
        
        {/* CSS INJEKSI KHUSUS PRINT A4 */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 20mm; /* Memaksa margin sama rata di semua sisi kertas */
            }
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
            }
            /* Mereset padding/margin dari layout utama aplikasi agar tidak menggeser PDF */
            .app-layout, .smart-main, .main-content {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            .print-only-canvas {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              display: block !important;
            }
          }
        `}} />

        {/* ── 1. KOP SURAT (HEADER Laporan) ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, borderBottom: "2px solid #000", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: "#007AFF" }}>
               <SavingsRoundedIcon style={{ fontSize: 42 }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#000", letterSpacing: "-0.5px" }}>MoFlow</h2>
              <div style={{ fontSize: 13, color: "#666", fontWeight: 500, letterSpacing: "0.5px" }}>MONEY TRACKER APP</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: 18, textTransform: "uppercase", letterSpacing: "1px", color: "#000" }}>
              {words.financialReport}
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: 13 }}>
              {words.period}: {exportPeriod === "monthly" ? monthLabel : `${format(new Date(exportStartDate), "dd MMM yyyy")} - ${format(new Date(exportEndDate), "dd MMM yyyy")}`}
            </p>
          </div>
        </div>

        {/* ── 2. INFORMASI KEPEMILIKAN AKUN (Legal Statement) ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #eee" }}>
          <div>
            <div style={{ color: "#666", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              {language === "id" ? "Diterbitkan Untuk :" : "Issued To :"}
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#000", textTransform: "uppercase" }}>{userName}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{userBio}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#666", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
               {language === "id" ? "Tanggal Cetak Dokumen :" : "Document Printed On :"}
            </div>
            <div style={{ fontWeight: 600, color: "#000", fontSize: 14 }}>
              {format(new Date(), "dd MMMM yyyy", { locale: language === "id" ? localeID : localeEN })}
            </div>
          </div>
        </div>

        {/* ── 3. RINGKASAN ARUS KAS ── */}
        {exportIncludeAnalytics && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>{words.cashflowSummary}</h2>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="card ios-card" style={{ flex: 1, border: "1px solid #eee", boxShadow: "none" }}>
                <div style={{ fontSize: 14, color: "#666" }}>{words.totalIncome}</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#34C759" }}>{formatCurrency(exportSummary.income)}</div>
              </div>
              <div className="card ios-card" style={{ flex: 1, border: "1px solid #eee", boxShadow: "none" }}>
                <div style={{ fontSize: 14, color: "#666" }}>{words.totalExpense}</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#FF3B30" }}>{formatCurrency(exportSummary.expense)}</div>
              </div>
              <div className="card ios-card" style={{ flex: 1, border: "1px solid #eee", boxShadow: "none" }}>
                <div style={{ fontSize: 14, color: "#666" }}>{words.surplusDeficit}</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: exportSummary.balance >= 0 ? "#007AFF" : "#FF3B30" }}>
                  {formatCurrency(exportSummary.balance)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. DAFTAR TRANSAKSI (E-Statement Detail) ── */}
        {exportIncludeTx && (
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>{words.detailedTxList}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000", textAlign: "left", fontSize: 13 }}>
                  <th style={{ padding: "10px 4px", width: "12%" }}>{words.colDate}</th>
                  <th style={{ padding: "10px 4px", width: "18%" }}>{words.colCategory}</th>
                  <th style={{ padding: "10px 4px", width: "25%" }}>{words.colNote}</th>
                  <th style={{ padding: "10px 4px", width: "15%", textAlign: "right" }}>Debit (DB)</th>
                  <th style={{ padding: "10px 4px", width: "15%", textAlign: "right" }}>Kredit (CR)</th>
                  <th style={{ padding: "10px 4px", width: "15%", textAlign: "right" }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let runningBalance = 0; 
                  
                  return [...exportData]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(t => {
                      const meta = getCategoryMeta(t.category);
                      
                      if (t.type === "income") {
                        runningBalance += t.amount;
                      } else {
                        runningBalance -= t.amount;
                      }

                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px 4px", whiteSpace: "nowrap" }}>{t.date}</td>
                          {/* MENGHILANGKAN ICON (EMOJI), HANYA NAMA KATEGORI SAJA */}
                          <td style={{ padding: "10px 4px", whiteSpace: "nowrap" }}>{meta.label}</td>
                          <td style={{ padding: "10px 4px", color: "#666" }}>{t.note || "-"}</td>
                          
                          <td style={{ padding: "10px 4px", textAlign: "right", color: t.type === "expense" ? "#FF3B30" : "#bbb" }}>
                            {t.type === "expense" ? formatCurrency(t.amount) : "-"}
                          </td>
                          <td style={{ padding: "10px 4px", textAlign: "right", color: t.type === "income" ? "#34C759" : "#bbb" }}>
                            {t.type === "income" ? formatCurrency(t.amount) : "-"}
                          </td>
                          <td style={{ padding: "10px 4px", textAlign: "right", fontWeight: "bold", color: runningBalance < 0 ? "#FF3B30" : "#000" }}>
                            {formatCurrency(runningBalance)}
                          </td>
                        </tr>
                      )
                    });
                })()}
              </tbody>
            </table>
          </div>
        )}
        
        <div style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "#999" }}>
          {words.printedAutomatically} {format(new Date(), "dd MMMM yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}