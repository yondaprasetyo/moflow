import type { Metadata, Viewport } from "next"; // Tambahkan Viewport di sini
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "MoFlow — Money Tracker",
  description: "Personal finance tracker with Firebase",
  // Hapus baris viewport dari sini
};

// Tambahkan export baru untuk viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}