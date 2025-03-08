import { Suspense } from 'react';
import SetupForm from '@/components/auth/SetupForm';

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-900">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      }>
        <SetupForm />
      </Suspense>
    </div>
  );
}