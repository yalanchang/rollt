import Navigation from '@/app/components/Navigation';
import Footer from '@/app/components/Footer';
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <title>Rollt</title>
        <meta name="description" content="Rollt is a modern social media platform for sharing photos and videos" />
      </head>
      <body className="bg-white  ">
        <Navigation />
        <div className="pb-16 md:pb-0 ">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}