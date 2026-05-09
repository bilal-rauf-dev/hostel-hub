import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hostel-Hub | Integrated Community Platform',
  description: 'Manage your hostel life, maintenance tickets, and community events in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
