import { Suspense } from 'react';
import LoginForm from './login-form';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}