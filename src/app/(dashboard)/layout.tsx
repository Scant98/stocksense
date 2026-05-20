import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/providers/query-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="ml-64 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
