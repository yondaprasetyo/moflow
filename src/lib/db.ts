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
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Transaction, Budget } from "@/types";

// ─── Transactions ────────────────────────────────────────────────────────────

const TRANSACTIONS = "transactions";

export async function addTransaction(data: Omit<Transaction, "id" | "createdAt">, uid: string) {
  await addDoc(collection(db, TRANSACTIONS), {
    ...data,
    userId: uid, // Menambahkan ID pengguna
    createdAt: new Date().toISOString(),
  });
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, "id">>) {
  await updateDoc(doc(db, TRANSACTIONS, id), data as DocumentData);
}

export async function deleteTransaction(id: string) {
  await deleteDoc(doc(db, TRANSACTIONS, id));
}

export function subscribeToTransactions(
  month: string,
  uid: string, // Tambahkan uid
  callback: (txs: Transaction[]) => void
) {
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const q = query(
    collection(db, TRANSACTIONS),
    where("userId", "==", uid), // Filter data user
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

// ─── Budgets ─────────────────────────────────────────────────────────────────

const BUDGETS = "budgets";

export async function setBudget(data: Omit<Budget, "id">, uid: string) {
  const q = query(
    collection(db, BUDGETS),
    where("userId", "==", uid), // Filter berdasarkan user
    where("category", "==", data.category),
    where("month", "==", data.month)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    await updateDoc(doc(db, BUDGETS, snap.docs[0].id), { limit: data.limit });
    return snap.docs[0].id;
  }
  
  // Sekarang data sudah memiliki userId dari interface Budget yang baru
  const ref = await addDoc(collection(db, BUDGETS), data);
  return ref.id;
}

export async function deleteBudget(id: string) {
  await deleteDoc(doc(db, BUDGETS, id));
}

export function subscribeToBudgets(
  month: string,
  uid: string, // Tambahkan uid
  callback: (budgets: Budget[]) => void
) {
  const q = query(
    collection(db, BUDGETS), 
    where("userId", "==", uid), // Filter data user
    where("month", "==", month)
  );
  return onSnapshot(q, (snap) => {
    const budgets: Budget[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Budget, "id">),
    }));
    callback(budgets);
  });
}