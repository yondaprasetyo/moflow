"use client";
import { useState, useEffect } from "react";
import { Transaction, TransactionType, Category, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/types";
import { format } from "date-fns";
import CloseIcon from '@mui/icons-material/CloseRounded';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownwardRounded';

interface Props {
  onClose: () => void;
  onSave: (data: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initial?: Transaction;
  currentLang?: "id" | "en";
}

// ── KAMUS TERJEMAHAN MODAL ──
const translations = {
  id: {
    add: "Tambah", edit: "Edit", title: "Transaksi", income: "Pemasukan", expense: "Pengeluaran",
    amount: "Jumlah", category: "Kategori", note: "Catatan (opsional)", notePlaceholder: "Untuk apa ini?",
    date: "Tanggal", saving: "Menyimpan...", saveChanges: "Simpan Perubahan", addIncome: "Tambah Pemasukan",
    addExpense: "Tambah Pengeluaran", delete: "Hapus Transaksi", confirmDelete: "Yakin ingin menghapus transaksi ini?"
  },
  en: {
    add: "Add", edit: "Edit", title: "Transaction", income: "Income", expense: "Expense",
    amount: "Amount", category: "Category", note: "Note (optional)", notePlaceholder: "What was this for?",
    date: "Date", saving: "Saving...", saveChanges: "Save Changes", addIncome: "Add Income",
    addExpense: "Add Expense", delete: "Delete Transaction", confirmDelete: "Delete this transaction?"
  }
};

// ── KAMUS TERJEMAHAN KHUSUS KATEGORI ──
const CATEGORY_TRANSLATIONS: Record<string, { id: string; en: string }> = {
  food: { id: "Makanan", en: "Food" },
  transport: { id: "Transportasi", en: "Transport" },
  housing: { id: "Tempat Tinggal", en: "Housing" },
  utilities: { id: "Tagihan", en: "Utilities" },
  fun: { id: "Hiburan", en: "Fun" },
  health: { id: "Kesehatan", en: "Health" },
  shopping: { id: "Belanja", en: "Shopping" },
  education: { id: "Pendidikan", en: "Education" },
  travel: { id: "Liburan", en: "Travel" },
  salary: { id: "Gaji", en: "Salary" },
  freelance: { id: "Pekerjaan Lepas", en: "Freelance" },
  investment: { id: "Investasi", en: "Investment" },
  other: { id: "Lainnya", en: "Other" },
};

const formatCurrencyInput = (value: string) => {
  const numeric = value.replace(/[^0-9]/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function TransactionModal({ onClose, onSave, onDelete, initial, currentLang = "id" }: Props) {
  const t = translations[currentLang];
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "food");
  const [note, setNote] = useState(initial?.note ?? "");
  const [date, setDate] = useState(initial?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset kategori jika berganti tipe transaksi
  useEffect(() => {
    const inCurrent = categories.find((c) => c.value === category);
    if (!inCurrent) setCategory(categories[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, ""); // Hapus titik untuk validasi
    if (rawValue === "" || /^[0-9]+$/.test(rawValue)) {
      setAmount(formatCurrencyInput(rawValue));
    }
  };

  async function handleSubmit() {
    // Hilangkan titik sebelum dikirim ke database
    const amt = parseFloat(amount.replace(/\./g, ""));
    if (!amt || amt <= 0) return;
    setSaving(true);
    
    const defaultNote = CATEGORY_TRANSLATIONS[category]?.[currentLang] || category;
    await onSave({ type, amount: amt, category, note: note.trim() || defaultNote, date });
    onClose();
  }

  async function handleDelete() {
    if (!initial || !onDelete) return;
    if (!confirm(t.confirmDelete)) return;
    await onDelete(initial.id);
    onClose();
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 2000 }} /* Memastikan overlay modal berada di atas dock (yang z-index nya 1000) */
    >
      <div 
        className="modal"
        style={{
          width: "90%",
          maxWidth: "400px",
          maxHeight: "90vh",     
          display: "flex",       
          flexDirection: "column",
          overflow: "hidden",    
          borderRadius: "16px",
          margin: "auto",
          padding: 0             
        }}
      >
        {/* ── 1. HEADER (FIXED DI ATAS) ── */}
        <div 
          className="modal-header" 
          style={{ 
            flexShrink: 0, 
            padding: "24px 24px 16px 24px",
            marginBottom: 0,
            borderBottom: "1px solid var(--ios-border-light, #eaeaea)"
          }}
        >
          <h2 className="modal-title">{initial ? t.edit : t.add} {t.title}</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* ── 2. AREA KONTEN FORM (BISA DI-SCROLL) ── */}
        <div style={{ 
          overflowY: "auto", 
          overflowX: "hidden",
          flex: 1, 
          padding: "16px 24px 24px 24px"
        }}>
          
          <div className="type-toggle">
            <button className={`type-toggle-btn income ${type === "income" ? "active" : ""}`} onClick={() => setType("income")}>
              <ArrowUpwardIcon fontSize="small" style={{ marginRight: 4 }} /> {t.income}
            </button>
            <button className={`type-toggle-btn expense ${type === "expense" ? "active" : ""}`} onClick={() => setType("expense")}>
              <ArrowDownwardIcon fontSize="small" style={{ marginRight: 4 }} /> {t.expense}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">{t.amount}</label>
            <input
              type="text" 
              inputMode="numeric"
              className="form-input amount-input"
              placeholder="0"
              value={amount}
              onChange={handleAmountChange} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">{t.category}</label>
            <div className="category-grid">
              {categories.map((cat) => {
                const translatedLabel = CATEGORY_TRANSLATIONS[cat.value]?.[currentLang] || cat.label;
                return (
                  <button
                    key={cat.value}
                    type="button" 
                    className={`category-btn ${category === cat.value ? "active" : ""}`}
                    onClick={() => setCategory(cat.value)}
                  >
                    {cat.icon}
                    <span className="category-label">{translatedLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.note}</label>
            <input
              className="form-input"
              type="text"
              placeholder={t.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.date}</label>
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button className="btn-submit" onClick={handleSubmit} disabled={saving}>
            {saving ? t.saving : initial ? t.saveChanges : type === "income" ? t.addIncome : t.addExpense}
          </button>

          {initial && onDelete && (
            <button className="btn-submit btn-danger" style={{ marginTop: 8 }} onClick={handleDelete}>
              {t.delete}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}