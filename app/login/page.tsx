'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LegacyLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return <p>Redirecting to login page...</p>;
}