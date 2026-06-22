"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
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

export function useMoneyData(month: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let txLoaded = false;
    let bdLoaded = false;

    const checkDone = () => {
      if (txLoaded && bdLoaded) setLoading(false);
    };

    const unsubTx = subscribeToTransactions(month, (txs) => {
      setTransactions(txs);
      txLoaded = true;
      checkDone();
    });

    const unsubBd = subscribeToBudgets(month, (bds) => {
      setBudgets(bds);
      bdLoaded = true;
      checkDone();
    });

    return () => {
      unsubTx();
      unsubBd();
    };
  }, [month]);

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

  const handleAddTransaction = useCallback(
    async (data: Omit<Transaction, "id" | "createdAt">) => {
      await addTransaction(data);
    },
    []
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

  const handleSetBudget = useCallback(async (category: Category, limit: number) => {
    await setBudget({ category, limit, month });
  }, [month]);

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