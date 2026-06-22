"use client";
import { useState } from "react";
import { registerUser, loginUser, resetPassword } from "@/lib/firebase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) return alert("Masukkan email terlebih dahulu!");
    try {
        await resetPassword(email);
        alert("Link reset password telah dikirim ke email kamu.");
    } catch (error: any) {
        alert(error.message);
    }
    };

  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', background: 'var(--ios-bg)' }}>
      <div className="card ios-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--ios-text-main)' }}>
          {isLogin ? "Masuk MoFlow" : "Daftar MoFlow"}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--ios-text-muted)', marginBottom: '32px' }}>
          {isLogin ? "Selamat datang kembali!" : "Buat akun untuk mulai melacak keuanganmu."}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            className="form-input"
            type="email" 
            placeholder="Email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            className="form-input"
            type="password" 
            placeholder="Password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary ios-btn-primary" 
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? "..." : (isLogin ? "Masuk" : "Daftar")}
          </button>

          {isLogin && (
            <p 
              style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--ios-text-secondary)', cursor: 'pointer' }}
              onClick={handleReset}
            >
              Lupa password?
            </p>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--ios-text-secondary)', cursor: 'pointer' }} 
           onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <span style={{ color: 'var(--ios-primary)', fontWeight: 600 }}>
            {isLogin ? "Daftar" : "Masuk"}
          </span>
        </p>
      </div>
    </div>
  );
}