import { Suspense } from 'react';
import EmbedPageClient from './client-page';

// Static params generation for static export
export async function generateStaticParams() {
  return [
    { chatbotId: '1' },
    { chatbotId: '2' },
    { chatbotId: '3' }
  ];
}

export default function EmbedPage({ params }: { params: { chatbotId: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <EmbedPageClient chatbotId={params.chatbotId} />
    </Suspense>
  );
}