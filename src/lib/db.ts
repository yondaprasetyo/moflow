import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Transaction, Budget } from "@/types";

// ─── Transactions ────────────────────────────────────────────────────────────

const TRANSACTIONS = "transactions";

export async function addTransaction(data: Omit<Transaction, "id" | "createdAt">) {
  const ref = await addDoc(collection(db, TRANSACTIONS), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, "id">>) {
  await updateDoc(doc(db, TRANSACTIONS, id), data as DocumentData);
}

export async function deleteTransaction(id: string) {
  await deleteDoc(doc(db, TRANSACTIONS, id));
}

export function subscribeToTransactions(
  month: string, // "YYYY-MM"
  callback: (txs: Transaction[]) => void
) {
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const q = query(
    collection(db, TRANSACTIONS),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const txs: Transaction[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Transaction, "id">),
    }));
    callback(txs);
  });
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const q = query(
    collection(db, TRANSACTIONS),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }));
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

const BUDGETS = "budgets";

export async function setBudget(data: Omit<Budget, "id">) {
  const q = query(
    collection(db, BUDGETS),
    where("category", "==", data.category),
    where("month", "==", data.month)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    await updateDoc(doc(db, BUDGETS, snap.docs[0].id), { limit: data.limit });
    return snap.docs[0].id;
  }
  const ref = await addDoc(collection(db, BUDGETS), data);
  return ref.id;
}

export async function deleteBudget(id: string) {
  await deleteDoc(doc(db, BUDGETS, id));
}

export function subscribeToBudgets(
  month: string,
  callback: (budgets: Budget[]) => void
) {
  const q = query(collection(db, BUDGETS), where("month", "==", month));
  return onSnapshot(q, (snap) => {
    const budgets: Budget[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Budget, "id">),
    }));
    callback(budgets);
  });
}