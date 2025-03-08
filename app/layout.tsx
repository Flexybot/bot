import './globals.css';
import type { Metadata } from 'next';
import { inter } from '@/lib/fonts';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'FlexyBot | Build Custom AI Chatbots for Your Website',
  description: 'Create custom AI chatbots trained on your data. No coding required. Add to your website, share via link, or embed anywhere.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}