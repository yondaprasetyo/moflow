"use client";
import { useState } from "react";
// Perhatikan: getCategoryMeta sudah saya hapus dari sini
import { Budget, Category, EXPENSE_CATEGORIES } from "@/types";

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
    currentBudgets: "Anggaran Saat Ini"
  },
  en: {
    title: "Budgets",
    category: "Category",
    monthlyLimit: "Monthly Limit",
    saving: "Saving...",
    setBudget: "Set Budget",
    currentBudgets: "Current Budgets"
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

export default function BudgetModal({ onClose, onSave, onDelete, budgets, spentByCategory, currentLang = "id" }: Props) {
  const t = translations[currentLang];

  const [category, setCategory] = useState<Category>("food");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const lim = parseFloat(limit);
    if (!lim || lim <= 0) return;
    setSaving(true);
    await onSave(category, lim);
    setLimit("");
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{t.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Dropdown Kategori */}
        <div className="form-group">
          <label className="form-label">{t.category}</label>
          <select
            className="form-input form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {EXPENSE_CATEGORIES.map((c) => {
              // Terjemahkan nama kategori di dropdown
              const translatedLabel = CATEGORY_TRANSLATIONS[c.value]?.[currentLang] || c.label;
              return (
                <option key={c.value} value={c.value}>{c.icon} {translatedLabel}</option>
              );
            })}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t.monthlyLimit}</label>
          <input
            className="form-input amount-input"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>

        <button className="btn-submit" onClick={handleSave} disabled={saving}>
          {saving ? t.saving : t.setBudget}
        </button>

        {/* Daftar Anggaran Saat Ini */}
        {budgets.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p className="section-title" style={{ marginBottom: 12 }}>{t.currentBudgets}</p>
            {budgets.map((b) => {
              // Cari ikon dari EXPENSE_CATEGORIES, dan terjemahan label dari CATEGORY_TRANSLATIONS
              const catMeta = EXPENSE_CATEGORIES.find(c => c.value === b.category) || { icon: "💬" };
              const translatedLabel = CATEGORY_TRANSLATIONS[b.category]?.[currentLang] || b.category;
              
              const spent = spentByCategory[b.category] ?? 0;
              const pct = Math.min((spent / b.limit) * 100, 100);
              const over = spent > b.limit;
              
              return (
                <div key={b.id} style={{ marginBottom: 16 }}>
                  <div className="budget-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="budget-label" style={{ fontWeight: 600 }}>
                      {catMeta.icon} {translatedLabel}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="budget-amounts" style={{ fontSize: '13px', color: 'var(--ios-text-muted)' }}>
                        {spent.toLocaleString()} / {b.limit.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onDelete(b.id)}
                        style={{ background: "none", border: "none", color: "var(--ios-danger)", cursor: "pointer", fontSize: 18, padding: '0 4px' }}
                      >×</button>
                    </div>
                  </div>
                  <div className="budget-bar-track" style={{ background: 'var(--ios-input)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      className="budget-bar-fill"
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: over ? "var(--ios-danger)" : pct > 75 ? "var(--ios-warning)" : "var(--ios-success)",
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}