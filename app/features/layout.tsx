import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features - FlexyBot',
  description: 'Discover the powerful features that make FlexyBot the best choice for building AI chatbots.',
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}