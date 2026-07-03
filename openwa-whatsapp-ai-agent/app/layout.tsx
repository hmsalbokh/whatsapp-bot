import './globals.css';

export const metadata = {
  title: 'OpenWA WhatsApp AI Agent',
  description: 'AI-powered WhatsApp customer service agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}