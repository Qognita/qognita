import type { Metadata } from 'next';
import { Raleway, Lato } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletContextProvider } from '@/contexts/WalletProvider';
import { Toaster } from 'sonner';
import './globals.css';

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  weight: ['400', '600', '700', '800'],
});

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ['300', '400', '700'],
});

export const metadata: Metadata = {
  title: 'Qognita - AI-Powered Solana Security',
  description:
    'AI-powered security analysis for Solana programs, tokens, and transactions. Detect scams and rug pulls before they happen.',
  keywords: 'qognita, solana, security, AI, crypto, blockchain, scam detection, rug pull',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${lato.variable} ${raleway.variable} ${lato.className}`}>
        <WalletContextProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-navy-900 via-blue-900 to-slate-900">
              {children}
            </div>
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#f1f5f9',
                },
              }}
            />
          </AuthProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
