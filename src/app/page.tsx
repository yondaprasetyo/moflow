"use client";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/components/Dashboard";
import AuthPage from "@/components/AuthPage";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Dashboard /> : <AuthPage />;
}