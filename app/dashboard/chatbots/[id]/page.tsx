import { Suspense } from 'react';
import ChatbotPageClient from './client-page';

// Static params generation for static export
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ];
}

export default function ChatbotPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ChatbotPageClient id={params.id} />
    </Suspense>
  );
}