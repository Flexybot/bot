"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from 'next-themes';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="Logo" width={32} height={32} />
                <span className="text-lg font-semibold">FlexyBot</span>
              </Link>
              <nav className="hidden md:flex gap-6 ml-8">
                <Link href="/features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Features
                </Link>
                <Link href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Pricing
                </Link>
                <Link href="/docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Documentation
                </Link>
                <Link href="/blog" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Blog
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </ThemeProvider>
  );
}