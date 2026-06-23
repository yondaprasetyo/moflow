"use client";
import { useState } from "react";
import { Budget, Category, EXPENSE_CATEGORIES } from "@/types";
import CloseIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

interface Props {
  onClose: () => void;
  onSave: (category: Category, limit: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  budgets: Budget[];
  spentByCategory: Record<string, number>;
  currentLang?: "id" | "en";
}

// ── KAMUS TERJEMAHAN MODAL ──
const translations = {
  id: {
    title: "Anggaran",
    category: "Kategori",
    monthlyLimit: "Batas Bulanan",
    saving: "Menyimpan...",
    setBudget: "Simpan Anggaran",
    currentBudgets: "Anggaran Saat Ini",
    used: "Terpakai:",
    limit: "Batas:"
  },
  en: {
    title: "Budgets",
    category: "Category",
    monthlyLimit: "Monthly Limit",
    saving: "Saving...",
    setBudget: "Set Budget",
    currentBudgets: "Current Budgets",
    used: "Used:",
    limit: "Limit:"
  }
};

// ── KAMUS TERJEMAHAN KHUSUS KATEGORI ──
const CATEGORY_TRANSLATIONS: Record<string, { id: string; en: string }> = {
  food: { id: "Makanan", en: "Food" },
  transport: { id: "Transportasi", en: "Transport" },
  housing: { id: "Tempat Tinggal", en: "Housing" },
  utilities: { id: "Tagihan", en: "Utilities" },
  bills: { id: "Tagihan", en: "Bills" }, // Jaga-jaga jika menggunakan 'bills'
  fun: { id: "Hiburan", en: "Fun" },
  entertainment: { id: "Hiburan", en: "Entertainment" }, // Ini yang memperbaiki masalah Anda
  health: { id: "Kesehatan", en: "Health" },
  shopping: { id: "Belanja", en: "Shopping" },
  education: { id: "Pendidikan", en: "Education" },
  travel: { id: "Liburan", en: "Travel" },
  salary: { id: "Gaji", en: "Salary" },
  freelance: { id: "Pekerjaan Lepas", en: "Freelance" },
  investment: { id: "Investasi", en: "Investment" },
  other: { id: "Lainnya", en: "Other" },
};

// Format Rupiah / Angka dengan titik
const formatCurrencyInput = (value: string) => {
  const numeric = value.replace(/[^0-9]/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function BudgetModal({ onClose, onSave, onDelete, budgets, spentByCategory, currentLang = "id" }: Props) {
  const t = translations[currentLang];

  const [category, setCategory] = useState<Category>("food");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, ""); 
    if (rawValue === "" || /^[0-9]+$/.test(rawValue)) {
      setLimit(formatCurrencyInput(rawValue));
    }
  };

  async function handleSave() {
    const lim = parseFloat(limit.replace(/\./g, ""));
    if (!lim || lim <= 0) return;
    setSaving(true);
    await onSave(category, lim);
    setLimit("");
    setSaving(false);
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 2000 }} /* Memastikan berada di atas segalanya */
    >
      <div 
        className="modal"
        style={{
          maxHeight: "90vh",     
          display: "flex",       
          flexDirection: "column",
          overflow: "hidden",    
          borderRadius: "16px",
          margin: "auto",
          padding: 0             /* Reset padding */
        }}
      >
        {/* ── HEADER (FIXED) ── */}
        <div 
          className="modal-header"
          style={{ 
            flexShrink: 0, 
            padding: "24px 24px 16px 24px",
            marginBottom: 0,
            borderBottom: "1px solid var(--ios-border-light, #eaeaea)"
          }}
        >
          <h2 className="modal-title">{t.title}</h2>
          <button className="modal-close" onClick={onClose}>
             <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* ── AREA KONTEN (BISA SCROLL) ── */}
        <div style={{ 
          overflowY: "auto", 
          flex: 1, 
          padding: "16px 24px 24px 24px" 
        }}>

          {/* Pemilihan Kategori Bergaya Grid (Sama seperti TransactionModal) */}
          <div className="form-group">
            <label className="form-label">{t.category}</label>
            <div className="category-grid">
              {EXPENSE_CATEGORIES.map((c) => {
                const translatedLabel = CATEGORY_TRANSLATIONS[c.value]?.[currentLang] || c.label;
                return (
                  <button
                    key={c.value}
                    type="button" 
                    className={`category-btn ${category === c.value ? "active" : ""}`}
                    onClick={() => setCategory(c.value as Category)}
                  >
                    {c.icon}
                    <span className="category-label">{translatedLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Batas Anggaran dengan format otomatis */}
          <div className="form-group">
            <label className="form-label">{t.monthlyLimit}</label>
            <input
              className="form-input amount-input"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={limit}
              onChange={handleLimitChange}
            />
          </div>

          <button className="btn-submit" onClick={handleSave} disabled={saving}>
            {saving ? t.saving : t.setBudget}
          </button>

          {/* Daftar Anggaran Saat Ini */}
          {budgets.length > 0 && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--ios-border-light)" }}>
              <p className="section-title" style={{ marginBottom: 16 }}>{t.currentBudgets}</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {budgets.map((b) => {
                  const catMeta = EXPENSE_CATEGORIES.find(c => c.value === b.category) || { icon: "💬" };
                  const translatedLabel = CATEGORY_TRANSLATIONS[b.category]?.[currentLang] || b.category;
                  
                  const spent = spentByCategory[b.category] ?? 0;
                  const pct = Math.min((spent / b.limit) * 100, 100);
                  const over = spent > b.limit;
                  
                  return (
                    <div key={b.id} className="card ios-card budget-card-compact" style={{ padding: "12px 16px", margin: 0 }}>
                      <div className="budget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", marginBottom: '12px' }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="tx-icon circle-icon expense" style={{ width: 32, height: 32, fontSize: 16 }}>
                            {catMeta.icon}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{translatedLabel}</span>
                        </div>
                        
                        <button
                          onClick={() => onDelete(b.id)}
                          style={{ 
                            background: "var(--ios-input)", 
                            border: "none", 
                            color: "var(--ios-danger)", 
                            cursor: "pointer", 
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s"
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </button>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: "var(--ios-text-muted)" }}>{t.used} <strong style={{ color: "var(--ios-text-main)" }}>{spent.toLocaleString()}</strong></span>
                        <span style={{ color: "var(--ios-text-muted)" }}>{t.limit} <strong>{b.limit.toLocaleString()}</strong></span>
                      </div>

                      <div className="budget-bar-track ios-track" style={{ background: 'var(--ios-border-light)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          className="budget-bar-fill"
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: over ? "#FF3B30" : pct > 75 ? "#FF9500" : "#34C759",
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}