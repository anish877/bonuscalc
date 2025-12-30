import { Sidebar } from "@/components/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <div className="container py-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
