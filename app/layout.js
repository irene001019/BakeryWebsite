import "./globals.css";

export const metadata = {
  title: "JiaPan Bakery",
  description: "Fresh-baked cheesecakes and buns, handmade every weekend.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-brand-cream text-brand-ink font-body">
        {children}
      </body>
    </html>
  );
}
