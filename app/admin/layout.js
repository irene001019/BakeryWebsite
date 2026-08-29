export const metadata = {
  title: "Admin — [Bakery Name]",
};

export default function AdminLayout({ children }) {
  return <div className="min-h-screen bg-brand-cream">{children}</div>;
}
