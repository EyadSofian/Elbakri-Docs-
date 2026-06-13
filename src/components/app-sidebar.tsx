import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Ticket, BookOpen, FolderOpen,
  Users, Building2, Settings, Sparkles, Wallet, PackageOpen,
} from "lucide-react";
import logoAsset from "@/assets/elbakri-logo.png.asset.json";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Create",
    items: [
      { title: "New Invoice", url: "/invoices/new", icon: FileText },
      { title: "New Voucher", url: "/vouchers/new", icon: Ticket },
      { title: "New Statement", url: "/statements/new", icon: BookOpen },
    ],
  },
  {
    label: "Accounts",
    items: [
      { title: "Client Accounts", url: "/accounts", icon: Wallet },
      { title: "Bulk Invoice Export", url: "/bulk-export", icon: PackageOpen },
    ],
  },
  {
    label: "Library",
    items: [
      { title: "Saved Documents", url: "/documents", icon: FolderOpen },
      { title: "Clients & Agencies", url: "/clients", icon: Users },
      { title: "Suppliers", url: "/suppliers", icon: Building2 },
      { title: "Service Templates", url: "/templates", icon: Sparkles },
    ],
  },
  {
    label: "System",
    items: [{ title: "Company Settings", url: "/settings", icon: Settings }],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="size-10 rounded-md bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <img src={logoAsset.url} alt="Elbakri Overseas" className="w-9 h-9 object-contain" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-sidebar-foreground font-semibold leading-tight truncate">Elbakri Overseas</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-primary">Est. 1982</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-[10px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Internal document tool
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
