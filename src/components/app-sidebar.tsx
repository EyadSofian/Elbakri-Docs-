import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Ticket,
  BookOpen,
  FolderOpen,
  Users,
  Building2,
  Settings,
  Sparkles,
  Wallet,
  PackageOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const logoUrl = "/elbakri-logo.png";
const logoMarkUrl = "/elbakri-logo-mark.png";

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
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-3">
          <div className="flex h-14 items-center rounded-lg bg-white px-3 shadow-sm ring-1 ring-white/15 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1">
            <img
              src={logoUrl}
              alt="Elbakri Overseas"
              className="h-10 w-full max-w-[170px] object-contain object-left group-data-[collapsible=icon]:hidden"
            />
            <img
              src={logoMarkUrl}
              alt="Elbakri Overseas"
              className="hidden size-8 object-contain group-data-[collapsible=icon]:block"
            />
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-sidebar-primary group-data-[collapsible=icon]:hidden">
            Internal Document Studio
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
                      <Link to={item.url} onClick={closeMobileSidebar}>
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
