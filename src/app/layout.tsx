import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-bengali",
  display: "swap",
});

export const viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "গরু ব্যবসা",
  description: "গরুর গোশত ব্যবসার লাভ-ক্ষতি হিসাব। প্রতিটি ব্যাচের খরচ, বিক্রি ও মুনাফা ট্র্যাক করুন।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "গরু ব্যবসা",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${inter.variable} ${notoSansBengali.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a2332',
              color: '#f1f5f9',
              border: '1px solid #1e3a5f',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
        <BottomNav />
        <ServiceWorkerRegistrar />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
