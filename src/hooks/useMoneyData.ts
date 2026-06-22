"use client";
import { useEffect, useState, useCallback } from "react";
import {
  subscribeToTransactions,
  subscribeToBudgets,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setBudget,
  deleteBudget,
} from "@/lib/db";
import { Transaction, Budget, MonthSummary, Category } from "@/types";
import { useAuth } from "@/context/AuthContext"; // Import context auth

export function useMoneyData(month: string) {
  const { user } = useAuth(); // Ambil data user
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Gunakan listener tanpa menunggu status "loaded" yang kaku
    const unsubTx = subscribeToTransactions(month, user.uid, (txs) => {
      setTransactions(txs);
      setLoading(false); // Langsung stop loading saat data diterima (meski kosong [])
    });

    const unsubBd = subscribeToBudgets(month, user.uid, (bds) => {
      setBudgets(bds);
      setLoading(false);
    });

    return () => {
      unsubTx();
      unsubBd();
    };
  }, [month, user]);

  const summary: MonthSummary = {
    totalIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0),
    totalExpense: transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0),
    balance: 0,
    byCategory: {},
  };
  summary.balance = summary.totalIncome - summary.totalExpense;

  for (const t of transactions) {
    summary.byCategory[t.category] = (summary.byCategory[t.category] ?? 0) + t.amount;
  }

  // Fungsi-fungsi handler disesuaikan dengan user.uid
  const handleAddTransaction = useCallback(
    async (data: Omit<Transaction, "id" | "createdAt">) => {
      if (user) await addTransaction(data, user.uid);
    },
    [user]
  );

  const handleUpdateTransaction = useCallback(
    async (id: string, data: Partial<Omit<Transaction, "id">>) => {
      await updateTransaction(id, data);
    },
    []
  );

  const handleDeleteTransaction = useCallback(async (id: string) => {
    await deleteTransaction(id);
  }, []);

  const handleSetBudget = useCallback(
    async (category: Category, limit: number) => {
      if (user) {
        // TypeScript sekarang mengenali userId di dalam object yang dikirim
        await setBudget({ category, limit, month, userId: user.uid }, user.uid);
      }
    },
    [month, user]
  );

  const handleDeleteBudget = useCallback(async (id: string) => {
    await deleteBudget(id);
  }, []);

  return {
    transactions,
    budgets,
    summary,
    loading,
    addTransaction: handleAddTransaction,
    updateTransaction: handleUpdateTransaction,
    deleteTransaction: handleDeleteTransaction,
    setBudget: handleSetBudget,
    deleteBudget: handleDeleteBudget,
  };
}