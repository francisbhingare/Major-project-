import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Footer } from '@/components/ui/Footer';
import { SafetyDisclaimerBanner } from '@/components/ui/SafetyDisclaimerBanner';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Emergency Response System | Major Project Platform',
  description: 'AI-assisted emergency reporting, severity assessment, GPS location detection and rapid hospital coordination platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-100 flex flex-col min-h-screen`}>
        <AuthProvider>
          <SafetyDisclaimerBanner />
          <SidebarNav />
          <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
