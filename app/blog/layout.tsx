import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - FlexyBot',
  description: 'Latest insights and updates about AI chatbots, machine learning, and customer service automation',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}