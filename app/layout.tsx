import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'LifeLine Connect - Blood Bank Management',
  description: 'Dual-database Blood Bank Management System (Oracle 3NF + MongoDB NoSQL)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}