import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PageType } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useMarkNotificationRead,
  useMyNotifications,
} from "../hooks/useQueries";

const NAV_ITEMS: {
  page: PageType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "income", label: "Income", icon: TrendingUp },
  { page: "expenses", label: "Expenses", icon: CreditCard },
  { page: "budget", label: "Budget", icon: Target },
  { page: "savings", label: "Savings Goals", icon: PiggyBank },
  { page: "reports", label: "Reports", icon: BarChart3 },
  { page: "settings", label: "Settings", icon: Settings },
];

interface LayoutProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  children: React.ReactNode;
}

export default function Layout({
  currentPage,
  onNavigate,
  children,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear } = useInternetIdentity();
  const profileQuery = useCallerProfile();
  const notificationsQuery = useMyNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userName = profileQuery.data?.name ?? "User";

  const handleNav = (page: PageType) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Wallet className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-semibold text-sidebar-foreground text-sm">
            FamilyBudget
          </p>
          <p className="text-xs text-sidebar-foreground/50">Family Finance</p>
        </div>
      </div>
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
            <button
              type="button"
              key={page}
              onClick={() => handleNav(page)}
              data-ocid={`nav.${page}.link`}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                currentPage === page
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {currentPage === page && (
                <ChevronRight className="ml-auto h-3 w-3" />
              )}
            </button>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={() => clear()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          data-ocid="nav.logout.button"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar z-50 lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-card border-b border-border shadow-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="font-display font-semibold text-base capitalize">
              {NAV_ITEMS.find((n) => n.page === currentPage)?.label ??
                "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  data-ocid="notifications.bell.button"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80"
                data-ocid="notifications.panel"
              >
                <div className="px-3 py-2 flex items-center justify-between">
                  <p className="font-display font-semibold text-sm">
                    Notifications
                  </p>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <Separator />
                <ScrollArea className="max-h-72">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((notif) => (
                      <DropdownMenuItem
                        key={String(notif.id)}
                        className={cn(
                          "flex items-start gap-2 px-3 py-2.5 cursor-pointer",
                          !notif.isRead && "bg-accent/10",
                        )}
                        onClick={() => {
                          if (!notif.isRead) markRead.mutate(notif.id);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-xs leading-relaxed",
                              !notif.isRead && "font-medium",
                            )}
                          >
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {notif.createdAt}
                          </p>
                        </div>
                        {notif.isRead && (
                          <Check className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-9 px-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm max-w-[100px] truncate">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNav("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => clear()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
