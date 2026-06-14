import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

/**
 * App shell: left sidebar + top bar + routed content. A single Suspense
 * boundary wraps the Outlet so lazy pages show a lightweight fallback.
 */
export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 backdrop-blur px-3 print:hidden">
            <SidebarTrigger className="h-10 w-10 shrink-0 md:h-8 md:w-8" />
            <div className="min-w-0 truncate text-sm font-medium text-muted-foreground">
              Elbakri Overseas - Internal Document Studio
            </div>
          </header>
          <main className="app-main flex-1 min-w-0">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}

function PageLoading() {
  return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
}
