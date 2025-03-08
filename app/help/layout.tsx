import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help with your ChatBuilder account and chatbots',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}