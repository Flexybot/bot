import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - FlexyBot',
  description: 'Learn how to use and integrate your AI chatbots',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}