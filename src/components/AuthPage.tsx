"use client";
import { useState } from "react";
import { registerUser, loginUser, resetPassword } from "@/lib/firebase";
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';

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
    const inputEmail = window.prompt("Masukkan email untuk reset password:", email);
    if (!inputEmail) return;
    try {
        await resetPassword(inputEmail);
        alert("Link reset telah dikirim ke email Anda.");
    } catch (error: any) {
        alert(error.message);
    }
  };

  return (
    <div className="auth-container" style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', padding: '20px', background: 'var(--ios-bg)',
      transition: 'background 0.3s ease'
    }}>
      {/* Container dengan animasi fade-in */}
      <div className="card ios-card" style={{ 
        width: '100%', maxWidth: '360px', padding: '40px 32px',
        animation: 'fadeIn 0.6s ease-out',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* Logo Section */}
        <div style={{ 
          width: 72, height: 72, borderRadius: 20, background: 'var(--ios-card-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
        }}>
          <SavingsRoundedIcon style={{ fontSize: 48, color: '#007AFF' }} />
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '28px', color: 'var(--ios-text-main)' }}>
          {isLogin ? "MoFlow" : "Daftar MoFlow"}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--ios-text-muted)', marginBottom: '32px', fontSize: '15px' }}>
          {isLogin ? "Track your money flow." : "Buat akun untuk mulai melacak keuanganmu."}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <input 
            className="form-input" type="email" placeholder="Email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            className="form-input" type="password" placeholder="Password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit" className="btn btn-primary ios-btn-primary" disabled={loading}
            style={{ marginTop: '16px', padding: '14px', borderRadius: '12px' }}
          >
            {loading ? "..." : (isLogin ? "Masuk" : "Daftar")}
          </button>

          {isLogin && (
            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--ios-primary)', cursor: 'pointer' }} onClick={handleReset}>
              Lupa password?
            </p>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--ios-text-secondary)' }}>
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <span style={{ color: 'var(--ios-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Daftar" : "Masuk"}
          </span>
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}