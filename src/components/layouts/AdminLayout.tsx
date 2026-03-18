import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Wallet, LineChart, Copy, FileText,
  Settings, LogOut, TrendingUp, Menu, X, Bell, ChevronDown, Shield,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import PageTransition from "@/components/PageTransition";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Wallet, label: "Finances", path: "/admin/finances" },
  { icon: LineChart, label: "Trading", path: "/admin/trading" },
  { icon: Copy, label: "Copy Trading", path: "/admin/copy-trading" },
  { icon: FileText, label: "Content", path: "/admin/content" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="p-5 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold font-display">TradeX</span>
            <span className="text-xs text-primary ml-2 font-semibold">Admin</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-0.5">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent">
          <TrendingUp className="w-5 h-5" /> User Dashboard
        </Link>
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent">
          <LogOut className="w-5 h-5" /> Back to Site
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 bg-card h-full border-r border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground p-1"><X className="w-5 h-5" /></button>
            </div>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
          <button className="lg:hidden text-foreground p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <button className="relative text-muted-foreground hover:text-foreground p-1">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            </button>
            <div className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1.5 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary font-display">A</div>
              <span className="hidden sm:block text-sm font-medium">Admin</span>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
